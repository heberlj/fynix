"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PanelConfiguracion } from "@/components/configuracion/PanelConfiguracion";
import { BotonPayPalSuscripcion } from "@/components/configuracion/BotonPayPalSuscripcion";
import { useSuscripcion } from "@/hooks/useSuscripcion";
import {
  etiquetaEstadoSuscripcion,
  etiquetaPlan,
  PRECIO_PRO_MENSUAL_USD,
  tienePlanPro,
} from "@/lib/suscripcion";
import { formatearFecha } from "@/lib/fechas";
import { paypalPublicoConfigurado } from "@/lib/paypal-client";

const BENEFICIOS_GRATIS = [
  "Cuentas, tarjetas y transacciones ilimitadas",
  "Gastos fijos y presupuesto por quincena",
  "Respaldo manual en JSON",
  "Sincronización en la nube con tu cuenta",
];

const BENEFICIOS_PRO = [
  "Todo lo del plan Gratis",
  "Exportación avanzada y reportes",
  "Soporte prioritario",
  "Funciones nuevas antes que nadie",
];

interface ConfigPayPal {
  planId: string;
  usuarioId: string;
}

export function ConfiguracionSuscripcion() {
  const { suscripcion, cargado, recargar } = useSuscripcion();
  const searchParams = useSearchParams();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [configPaypal, setConfigPaypal] = useState<ConfigPayPal | null>(null);
  const [configError, setConfigError] = useState("");

  const esPro = tienePlanPro(suscripcion);
  const exito = searchParams.get("exito") === "1";

  const cargarConfigPaypal = useCallback(async () => {
    if (esPro) return;
    setConfigError("");
    try {
      const res = await fetch("/api/paypal/config");
      const data = await res.json();
      if (!res.ok || data.error) {
        setConfigError(data.error ?? "No se pudo cargar PayPal");
        return;
      }
      if (data.planId && data.usuarioId) {
        setConfigPaypal({ planId: data.planId, usuarioId: data.usuarioId });
      }
    } catch {
      setConfigError("Error de conexión al cargar PayPal");
    }
  }, [esPro]);

  useEffect(() => {
    if (cargado && !esPro && paypalPublicoConfigurado()) {
      void cargarConfigPaypal();
    }
  }, [cargado, esPro, cargarConfigPaypal]);

  async function activarSuscripcion(subscriptionId: string) {
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
            ) : configPaypal ? (
              <BotonPayPalSuscripcion
                planId={configPaypal.planId}
                usuarioId={configPaypal.usuarioId}
                deshabilitado={cargando || !cargado}
                onExito={activarSuscripcion}
                onError={setError}
              />
            ) : configError ? (
              <p className="mt-4 text-sm text-gasto">{configError}</p>
            ) : (
              <p className="mt-4 text-sm text-muted">
                {cargado ? "Cargando PayPal..." : "Cargando..."}
              </p>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-gasto">{error}</p>}

        {!paypalPublicoConfigurado() && (
          <p className="text-xs text-muted">
            PayPal no está configurado. Añade NEXT_PUBLIC_PAYPAL_CLIENT_ID y las
            claves del servidor en .env.local, luego reinicia la app.
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
