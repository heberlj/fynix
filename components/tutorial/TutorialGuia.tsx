"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const PASOS = [
  {
    titulo: "Configura tu perfil",
    descripcion:
      "Define tus días de pago quincenales y la moneda principal (DOP por defecto). Esto alinea quincenas, resúmenes y sugerencias de presupuesto.",
    enlace: { href: "/configuracion", label: "Ir a Configuración" },
  },
  {
    titulo: "Registra cuentas y tarjetas",
    descripcion:
      "Agrega tus cuentas bancarias, efectivo y tarjetas de crédito. Si usas Cuotas Popular, activa la extensión en la tarjeta correspondiente.",
    enlace: { href: "/cuentas", label: "Ir a Cuentas" },
  },
  {
    titulo: "Registra transacciones",
    descripcion:
      "Anota cada ingreso y gasto con categoría, fecha, moneda y origen del dinero (efectivo, cuenta o tarjeta). La quincena se asigna sola.",
    enlace: { href: "/transacciones", label: "Ir a Transacciones" },
  },
  {
    titulo: "Define gastos fijos",
    descripcion:
      "Lista alquiler, servicios, suscripciones y otros pagos mensuales. Márcalos como esenciales o flexibles para el presupuesto.",
    enlace: { href: "/gastos-fijos", label: "Ir a Gastos fijos" },
  },
  {
    titulo: "Revisa tus quincenas",
    descripcion:
      "Compara ingresos, gastos, compromisos y disponible por quincena. Usa las flechas de tendencia para ver si mejoras respecto al periodo anterior.",
    enlace: { href: "/quincenas", label: "Ir a Quincenas" },
  },
  {
    titulo: "Planifica con presupuesto",
    descripcion:
      "Proyecta tu próximo ingreso y usa «Sugerir qué pagar» para priorizar tarjetas, préstamos, cuotas y gastos fijos según tu liquidez.",
    enlace: { href: "/presupuesto", label: "Ir a Presupuesto" },
  },
] as const;

interface TutorialGuiaProps {
  abierto: boolean;
  onCerrar: () => void;
}

export function TutorialGuia({ abierto, onCerrar }: TutorialGuiaProps) {
  const [paso, setPaso] = useState(0);

  useEffect(() => {
    if (!abierto) return;
    setPaso(0);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const actual = PASOS[paso];
  const esUltimo = paso === PASOS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onCerrar}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-titulo"
      >
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-accent">
                Guía de inicio · Paso {paso + 1} de {PASOS.length}
              </p>
              <h2 id="tutorial-titulo" className="mt-1 text-lg font-semibold text-foreground">
                {actual.titulo}
              </h2>
            </div>
            <button
              type="button"
              onClick={onCerrar}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-hover hover:text-foreground"
              aria-label="Cerrar guía"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <p className="text-sm leading-relaxed text-muted">{actual.descripcion}</p>
          <Link
            href={actual.enlace.href}
            onClick={onCerrar}
            className="mt-4 inline-flex text-sm font-medium text-accent hover:underline"
          >
            {actual.enlace.label} →
          </Link>

          <div className="mt-5 flex gap-1">
            {PASOS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i <= paso ? "bg-accent" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => setPaso((p) => Math.max(0, p - 1))}
            disabled={paso === 0}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-40"
          >
            Anterior
          </button>
          {esUltimo ? (
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              ¡Listo, empezar!
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPaso((p) => p + 1)}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Siguiente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
