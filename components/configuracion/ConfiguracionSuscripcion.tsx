"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PanelConfiguracion } from "@/components/configuracion/PanelConfiguracion";
import { BotonPayPalPago } from "@/components/configuracion/BotonPayPalPago";
import { useSuscripcion } from "@/hooks/useSuscripcion";
import {
  etiquetaEstadoSuscripcion,
  etiquetaPlan,
  PRECIO_PRO_MENSUAL_USD,
  tienePlanPro,
} from "@/lib/suscripcion";
import { formatearFecha } from "@/lib/fechas";
import {
  paypalEnlacePago,
  paypalPublicoConfigurado,
  usaEnlacePagoPaypal,
} from "@/lib/paypal-client";

const BENEFICIOS_GRATIS = [
  "Hasta 2 cuentas y 1 tarjeta",
  "Transacciones, gastos fijos y metas de ahorro",
  "Quincenas y sincronización en la nube",
  "Respaldo manual en JSON",
  "20 mensajes de IA por semana",
];

const BENEFICIOS_PRO = [
  "Cuentas y tarjetas ilimitadas",
  "Cuotas Popular, BHD y Credimás",
  "Exportación CSV y reportes mensuales",
  "Importación de movimientos desde el banco (CSV)",
  "100 mensajes de IA por semana",
  "Soporte prioritario",
];

const PENDING_SUBSCRIPTION_KEY = "fynix_paypal_subscription_id";

export function ConfiguracionSuscripcion() {
  const { suscripcion, cargado, recargar } = useSuscripcion();
  const searchParams = useSearchParams();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [paypalListo, setPaypalListo] = useState(usaEnlacePagoPaypal());
  const [configError, setConfigError] = useState("");
  const [verificandoPago, setVerificandoPago] = useState(false);

  const esPro = tienePlanPro(suscripcion);
  const exito = searchParams.get("exito") === "1";
  const paypalReturn = searchParams.get("paypal");
  const enlacePago = paypalEnlacePago();

  const activarSuscripcion = useCallback(
    async (subscriptionId: string) => {
      setError("");
      setCargando(true);
      try {
        const res = await fetch("/api/paypal/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscriptionId }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          setError(data.error ?? "No se pudo activar la suscripción");
          return;
        }
        await recargar();
      } catch {
        setError("Error de conexión al activar la suscripción");
      } finally {
        setCargando(false);
      }
    },
    [recargar]
  );

  const verificarPaypal = useCallback(async () => {
    if (esPro || usaEnlacePagoPaypal()) return;
    setConfigError("");
    try {
      const res = await fetch("/api/paypal/config");
      const data = await res.json();
      if (!res.ok || data.error) {
        setConfigError(data.error ?? "No se pudo conectar con PayPal");
        setPaypalListo(false);
        return;
      }
      setPaypalListo(true);
    } catch {
      setConfigError("Error de conexión al cargar PayPal");
      setPaypalListo(false);
    }
  }, [esPro]);

  useEffect(() => {
    if (cargado && !esPro && paypalPublicoConfigurado()) {
      void verificarPaypal();
    }
  }, [cargado, esPro, verificarPaypal]);

  useEffect(() => {
    if (paypalReturn !== "return") return;
    const pending = sessionStorage.getItem(PENDING_SUBSCRIPTION_KEY);
    if (!pending) return;
    sessionStorage.removeItem(PENDING_SUBSCRIPTION_KEY);
    void activarSuscripcion(pending);
  }, [paypalReturn, activarSuscripcion]);

  useEffect(() => {
    if (paypalReturn === "cancel") {
      setError("Cancelaste el pago en PayPal.");
    }
  }, [paypalReturn]);

  useEffect(() => {
    if (paypalReturn !== "paid" || esPro) return;

    let activo = true;
    let intentos = 0;
    const maxIntentos = 20;

    setVerificandoPago(true);

    const intervalo = setInterval(() => {
      intentos += 1;
      void (async () => {
        try {
          const res = await fetch("/api/paypal/estado-pago");
          const data = (await res.json()) as { pro?: boolean };
          if (!activo) return;
          if (data.pro) {
            clearInterval(intervalo);
            setVerificandoPago(false);
            await recargar();
            return;
          }
          if (intentos >= maxIntentos) {
            clearInterval(intervalo);
            setVerificandoPago(false);
          }
        } catch {
          if (intentos >= maxIntentos) {
            clearInterval(intervalo);
            setVerificandoPago(false);
          }
        }
      })();
    }, 3000);

    return () => {
      activo = false;
      clearInterval(intervalo);
      setVerificandoPago(false);
    };
  }, [paypalReturn, esPro, recargar]);

  async function iniciarPagoEnlace() {
    if (!enlacePago) return;

    setError("");
    setCargando(true);
    try {
      const res = await fetch("/api/paypal/iniciar-pago", { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "No se pudo preparar el pago");
        return;
      }
      window.location.href = enlacePago;
    } catch {
      setError("Error de conexión al preparar el pago");
    } finally {
      setCargando(false);
    }
  }

  async function iniciarSuscripcionApi() {
    setError("");
    setCargando(true);
    try {
      const res = await fetch("/api/paypal/subscribe", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.approvalUrl || !data.subscriptionId) {
        setError(data.error ?? "No se pudo iniciar el pago con PayPal");
        return;
      }
      sessionStorage.setItem(PENDING_SUBSCRIPTION_KEY, data.subscriptionId);
      window.location.href = data.approvalUrl;
    } catch {
      setError("Error de conexión con PayPal");
    } finally {
      setCargando(false);
    }
  }

  async function cancelarSuscripcion() {
    if (
      !confirm(
        "¿Cancelar Fynix Pro? Seguirás con acceso hasta el fin del período facturado."
      )
    ) {
      return;
    }

    setError("");
    setCargando(true);
    try {
      const res = await fetch("/api/paypal/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "No se pudo cancelar la suscripción");
        return;
      }
      await recargar();
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  }

  function renderBotonPago() {
    if (enlacePago) {
      return (
        <>
          <BotonPayPalPago
            onClick={() => void iniciarPagoEnlace()}
            deshabilitado={!cargado}
            cargando={cargando}
            precio={PRECIO_PRO_MENSUAL_USD}
          />
          <p className="text-center text-[11px] text-muted">
            Serás redirigido a PayPal para completar el pago.
          </p>
        </>
      );
    }

    if (configError) {
      return <p className="mt-4 text-sm text-gasto">{configError}</p>;
    }

    if (paypalListo) {
      return (
        <BotonPayPalPago
          onClick={() => void iniciarSuscripcionApi()}
          deshabilitado={cargando || !cargado}
          cargando={cargando}
          precio={PRECIO_PRO_MENSUAL_USD}
        />
      );
    }

    return (
      <p className="mt-4 text-sm text-muted">
        {cargado ? "Cargando PayPal..." : "Cargando..."}
      </p>
    );
  }

  return (
    <PanelConfiguracion
      titulo="Suscripción"
      descripcion="Tu plan actual y facturación con PayPal"
    >
      <div className="space-y-5">
        {exito && (
          <p className="rounded-lg border border-ingreso/30 bg-ingreso/10 px-4 py-3 text-sm text-ingreso">
            Suscripción activada. ¡Bienvenido a Fynix Pro!
          </p>
        )}

        {paypalReturn === "paid" && !esPro && verificandoPago && (
          <p className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground">
            Confirmando tu pago con PayPal…
          </p>
        )}

        {paypalReturn === "paid" && !esPro && !verificandoPago && (
          <p className="rounded-lg border border-border bg-background px-4 py-3 text-sm text-muted">
            Si ya pagaste, Fynix Pro se activará en unos minutos. Recarga la página
            o vuelve en breve.
          </p>
        )}

        {esPro && paypalReturn === "paid" && (
          <p className="rounded-lg border border-ingreso/30 bg-ingreso/10 px-4 py-3 text-sm text-ingreso">
            ¡Pago confirmado! Bienvenido a Fynix Pro.
          </p>
        )}

        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-accent">
                Plan actual
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {cargado ? etiquetaPlan(suscripcion.plan) : "..."}
              </p>
            </div>
            {cargado && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  esPro
                    ? "bg-accent text-white"
                    : "bg-muted/20 text-muted"
                }`}
              >
                {etiquetaEstadoSuscripcion(suscripcion.plan, suscripcion.estado)}
              </span>
            )}
          </div>
          {cargado && suscripcion.periodoFin && esPro && (
            <p className="mt-2 text-sm text-muted">
              Próximo cobro: {formatearFecha(suscripcion.periodoFin.slice(0, 10))}
            </p>
          )}
          {!esPro && (
            <p className="mt-2 text-sm text-muted">
              Tienes acceso a las funciones principales de Fynix sin costo.
            </p>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-background p-4">
            <h3 className="text-sm font-semibold text-foreground">Gratis</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {BENEFICIOS_GRATIS.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-ingreso">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <h3 className="text-sm font-semibold text-foreground">Fynix Pro</h3>
            <p className="mt-1 text-xs text-muted">
              US${PRECIO_PRO_MENSUAL_USD}/mes · pago seguro con PayPal
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {BENEFICIOS_PRO.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-accent">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {esPro ? (
              <button
                type="button"
                onClick={cancelarSuscripcion}
                disabled={cargando}
                className="mt-4 w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover disabled:opacity-60"
              >
                {cargando ? "Procesando..." : "Cancelar suscripción"}
              </button>
            ) : (
              renderBotonPago()
            )}
          </div>
        </div>

        {error && <p className="text-sm text-gasto">{error}</p>}

        {!paypalPublicoConfigurado() && (
          <p className="text-xs text-muted">
            PayPal no está configurado. Añade NEXT_PUBLIC_PAYPAL_PAYMENT_LINK o
            las credenciales en .env.local, luego reinicia la app.
          </p>
        )}

        {esPro && (
          <p className="text-xs text-muted">
            También puedes administrar tu suscripción desde tu cuenta de PayPal.
          </p>
        )}
      </div>
    </PanelConfiguracion>
  );
}
