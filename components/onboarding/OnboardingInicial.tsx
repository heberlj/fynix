"use client";

import { useEffect, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { usePlanLimites } from "@/hooks/usePlanLimites";
import { SelectorBanco } from "@/components/ui/SelectorBanco";
import { SelectorMoneda } from "@/components/ui/SelectorMoneda";
import { Logo } from "@/components/ui/Logo";
import { TutorialGuia } from "@/components/tutorial/TutorialGuia";
import { esBancoCertificado } from "@/lib/bancos";
import {
  colorHomePorIndice,
  ICONO_HOME_CUENTA_DEFAULT,
} from "@/lib/personalizacion-home";
import { validarDiasPago } from "@/lib/validar-configuracion";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent";

const TOTAL_PASOS = 4;

interface OnboardingInicialProps {
  abierto: boolean;
  onCerrar: () => void;
}

export function OnboardingInicial({ abierto, onCerrar }: OnboardingInicialProps) {
  const { configuracion, actualizarConfiguracion, agregarCuenta, cuentas } =
    useFinanzas();
  const { puedeAgregarCuenta } = usePlanLimites();

  const [paso, setPaso] = useState(0);
  const [moneda, setMoneda] = useState(configuracion.moneda);
  const [dia1, setDia1] = useState(String(configuracion.diasPago[0]));
  const [dia2, setDia2] = useState(String(configuracion.diasPago[1]));
  const [banco, setBanco] = useState("");
  const [nombreCuenta, setNombreCuenta] = useState("Cuenta principal");
  const [saldo, setSaldo] = useState("");
  const [error, setError] = useState("");
  const [mostrarTutorial, setMostrarTutorial] = useState(false);
  const [cuentaAgregada, setCuentaAgregada] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setPaso(0);
    setMoneda(configuracion.moneda);
    setDia1(String(configuracion.diasPago[0]));
    setDia2(String(configuracion.diasPago[1]));
    setBanco("");
    setNombreCuenta("Cuenta principal");
    setSaldo("");
    setError("");
    setCuentaAgregada(false);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto, configuracion.diasPago, configuracion.moneda]);

  useEffect(() => {
    if (!abierto) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape" && paso === 0) omitirOnboarding();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [abierto, paso]);

  if (!abierto) return null;

  function guardarConfiguracionBasica() {
    const d1 = Number(dia1);
    const d2 = Number(dia2);
    actualizarConfiguracion({
      moneda,
      diasPago: [d1, d2],
    });
  }

  function finalizarOnboarding() {
    actualizarConfiguracion({ onboardingCompletado: true });
    onCerrar();
  }

  function omitirOnboarding() {
    actualizarConfiguracion({ onboardingCompletado: true });
    onCerrar();
  }

  function validarPasoFinanzas(): boolean {
    const d1 = Number(dia1);
    const d2 = Number(dia2);
    const errorDias = validarDiasPago(d1, d2);
    if (errorDias) {
      setError(errorDias);
      return false;
    }
    setError("");
    guardarConfiguracionBasica();
    return true;
  }

  function agregarCuentaOnboarding(): boolean {
    if (!puedeAgregarCuenta(cuentas.length)) {
      setError("Alcanzaste el límite de cuentas de tu plan.");
      return false;
    }
    if (!banco || !esBancoCertificado(banco)) {
      setError("Selecciona un banco de la lista.");
      return false;
    }
    if (!nombreCuenta.trim()) {
      setError("El nombre de la cuenta es obligatorio.");
      return false;
    }
    const saldoNum = parseFloat(saldo) || 0;
    if (saldoNum < 0) {
      setError("El saldo no puede ser negativo.");
      return false;
    }

    agregarCuenta({
      banco,
      nombre: nombreCuenta.trim(),
      tipo: "ahorro",
      saldoActual: saldoNum,
      moneda,
      ultimosCuatro: "",
      colorHome: colorHomePorIndice(cuentas.length),
      iconoHome: ICONO_HOME_CUENTA_DEFAULT,
    });
    setCuentaAgregada(true);
    setError("");
    return true;
  }

  function continuarSinCuenta() {
    guardarConfiguracionBasica();
    actualizarConfiguracion({ onboardingCompletado: true });
    setPaso(3);
  }

  function continuarConCuenta() {
    if (!agregarCuentaOnboarding()) return;
    guardarConfiguracionBasica();
    actualizarConfiguracion({ onboardingCompletado: true });
    setPaso(3);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 p-4 sm:items-center"
        role="presentation"
      >
        <div
          className="flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-titulo"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {paso > 0 && paso < 3 && (
                  <p className="text-xs font-medium uppercase tracking-wider text-accent">
                    Configuración inicial · Paso {paso} de {TOTAL_PASOS - 1}
                  </p>
                )}
                <h2
                  id="onboarding-titulo"
                  className="mt-1 text-lg font-semibold text-foreground"
                >
                  {paso === 0 && "Bienvenido a Fynix"}
                  {paso === 1 && "Tu moneda y quincenas"}
                  {paso === 2 && "Tu primera cuenta"}
                  {paso === 3 && "¡Todo listo!"}
                </h2>
              </div>
              {paso < 3 && (
                <button
                  type="button"
                  onClick={omitirOnboarding}
                  className="shrink-0 text-xs font-medium text-muted hover:text-foreground"
                >
                  Saltar
                </button>
              )}
            </div>
            {paso > 0 && paso < 3 && (
              <div className="mt-4 flex gap-1">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className={`h-1 flex-1 rounded-full ${
                      paso >= n ? "bg-accent" : "bg-border"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {paso === 0 && (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <Logo variante="compacto" className="h-16 w-16" />
                </div>
                <p className="text-sm leading-relaxed text-muted">
                  En menos de 2 minutos configuramos lo básico para que veas tus
                  quincenas, gastos y disponible con datos reales.
                </p>
                <ul className="space-y-2 text-left text-sm text-muted">
                  <li>· Moneda y días en que cobras</li>
                  <li>· Tu primera cuenta bancaria (opcional)</li>
                  <li>· Acceso inmediato a Home y transacciones</li>
                </ul>
              </div>
            )}

            {paso === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-muted">
                  Usamos estos datos para alinear quincenas, resúmenes y
                  recordatorios de pago.
                </p>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">
                    Moneda principal
                  </span>
                  <SelectorMoneda value={moneda} onChange={setMoneda} />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-foreground">
                      Primer pago (día)
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={dia1}
                      onChange={(e) => setDia1(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-foreground">
                      Segundo pago (día)
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={dia2}
                      onChange={(e) => setDia2(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                </div>
                <p className="text-xs text-muted">
                  Q1: del 1 al 15 · Q2: del 16 al fin de mes
                </p>
              </div>
            )}

            {paso === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-muted">
                  Puedes agregarla ahora o hacerlo después en Cuentas. El saldo se
                  actualiza al registrar movimientos.
                </p>
                <SelectorBanco value={banco} onChange={setBanco} />
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">
                    Nombre de la cuenta
                  </span>
                  <input
                    type="text"
                    value={nombreCuenta}
                    onChange={(e) => setNombreCuenta(e.target.value)}
                    placeholder="Ej. Nómina, Ahorro"
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">
                    Saldo actual ({moneda}) — opcional
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={saldo}
                    onChange={(e) => setSaldo(e.target.value)}
                    placeholder="0.00"
                    className={inputClass}
                  />
                </label>
              </div>
            )}

            {paso === 3 && (
              <div className="space-y-4 text-center">
                <p className="text-4xl" aria-hidden>
                  ✓
                </p>
                <p className="text-sm leading-relaxed text-muted">
                  {cuentaAgregada
                    ? "Tu cuenta quedó registrada. Ya puedes anotar transacciones y revisar tu Home."
                    : "Tu perfil financiero está listo. Agrega cuentas o transacciones cuando quieras."}
                </p>
                <button
                  type="button"
                  onClick={() => setMostrarTutorial(true)}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  Ver guía completa de funciones →
                </button>
              </div>
            )}

            {error && <p className="mt-4 text-sm text-gasto">{error}</p>}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">
            {paso === 0 && (
              <>
                <button
                  type="button"
                  onClick={omitirOnboarding}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface-hover"
                >
                  Ahora no
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setPaso(1);
                  }}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
                >
                  Empezar
                </button>
              </>
            )}

            {paso === 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setPaso(0)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface-hover"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validarPasoFinanzas()) setPaso(2);
                  }}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
                >
                  Siguiente
                </button>
              </>
            )}

            {paso === 2 && (
              <>
                <button
                  type="button"
                  onClick={continuarSinCuenta}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface-hover"
                >
                  Omitir cuenta
                </button>
                <button
                  type="button"
                  onClick={continuarConCuenta}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
                >
                  Agregar y continuar
                </button>
              </>
            )}

            {paso === 3 && (
              <button
                type="button"
                onClick={finalizarOnboarding}
                className="ml-auto rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
              >
                Entrar a Fynix
              </button>
            )}
          </div>
        </div>
      </div>

      <TutorialGuia
        abierto={mostrarTutorial}
        onCerrar={() => setMostrarTutorial(false)}
      />
    </>
  );
}
