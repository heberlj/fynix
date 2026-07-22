"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import {
  etiquetaDiasRestantes,
  listarProximosPagos,
  pagosUrgentes,
  type ProximoPago,
  type TipoProximoPago,
} from "@/lib/proximos-pagos";
import { obtenerRecordatoriosPagos } from "@/lib/recordatorios-pagos";
import { formatearMoneda } from "@/lib/quincenas";

const LIMITE_VISIBLE = 8;

function IconoTipoPago({ tipo }: { tipo: TipoProximoPago }) {
  const props = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-4 w-4",
    "aria-hidden": true,
  };

  switch (tipo) {
    case "tarjeta":
      return (
        <svg {...props}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        </svg>
      );
    case "prestamo":
      return (
        <svg {...props}>
          <path d="M12 3v18M7 8l5-5 5 5" />
        </svg>
      );
    case "cuota-popular":
      return (
        <svg {...props}>
          <path d="M4 7h16M4 12h10M4 17h6" />
          <circle cx="18" cy="15" r="3" />
        </svg>
      );
    case "gasto-fijo":
      return (
        <svg {...props}>
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case "aporte-ingreso":
      return (
        <svg {...props}>
          <path d="M20 12v8H4v-8M12 22V12M12 2l4 6H8l4-6z" />
        </svg>
      );
  }
}

function FilaProximoPago({ pago }: { pago: ProximoPago }) {
  return (
    <Link
      href={pago.href}
      className={`flex items-center gap-3 rounded-lg border px-3 py-3 transition-colors hover:bg-surface-hover ${
        pago.urgente
          ? pago.esHoy
            ? "border-gasto/40 bg-gasto/5"
            : "border-yellow-500/40 bg-yellow-500/5"
          : "border-border bg-background"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          pago.urgente
            ? pago.esHoy
              ? "bg-gasto/15 text-gasto"
              : "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400"
            : "bg-accent/10 text-accent"
        }`}
      >
        <IconoTipoPago tipo={pago.tipo} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {pago.nombre}
        </span>
        <span className="mt-0.5 block text-xs text-muted">
          {pago.etiquetaTipo} · día {pago.diaPago}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-sm font-semibold text-foreground">
          {formatearMoneda(pago.monto, pago.moneda)}
        </span>
        <span
          className={`mt-0.5 block text-xs font-medium ${
            pago.esHoy
              ? "text-gasto"
              : pago.urgente
                ? "text-yellow-700 dark:text-yellow-400"
                : "text-muted"
          }`}
        >
          {etiquetaDiasRestantes(pago)}
        </span>
      </span>
    </Link>
  );
}

export function ProximosPagosHome() {
  const finanzas = useFinanzas();
  const recordatorios = obtenerRecordatoriosPagos(finanzas.configuracion);

  const pagos = useMemo(
    () =>
      listarProximosPagos(
        {
          tarjetas: finanzas.tarjetas,
          prestamos: finanzas.prestamos,
          cuotasPopular: finanzas.cuotasPopular,
          gastosFijos: finanzas.gastosFijos,
          transacciones: finanzas.transacciones,
          configuracion: finanzas.configuracion,
        },
        new Date()
      ),
    [
      finanzas.tarjetas,
      finanzas.prestamos,
      finanzas.cuotasPopular,
      finanzas.gastosFijos,
      finanzas.transacciones,
      finanzas.configuracion,
    ]
  );

  const urgentes = useMemo(
    () => pagosUrgentes(pagos, recordatorios.diasAntes),
    [pagos, recordatorios.diasAntes]
  );

  const visibles = pagos.slice(0, LIMITE_VISIBLE);

  if (pagos.length === 0) {
    return (
      <section
        data-ayuda="proximos-pagos"
        className="rounded-xl border border-dashed border-border bg-surface px-4 py-8 text-center sm:px-6"
      >
        <p className="text-sm font-medium text-foreground">
          Sin pagos próximos
        </p>
        <p className="mt-1 text-xs text-muted">
          Cuando registres tarjetas, préstamos o gastos fijos verás aquí lo que
          vence pronto.
        </p>
      </section>
    );
  }

  return (
    <section data-ayuda="proximos-pagos" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Próximos pagos
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Compromisos ordenados por fecha de vencimiento
          </p>
        </div>
        <Link
          href="/quincenas"
          className="text-xs font-medium text-accent hover:underline"
        >
          Ver quincenas →
        </Link>
      </div>

      {recordatorios.activo && urgentes.length > 0 && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            urgentes.some((p) => p.esHoy)
              ? "border-gasto/30 bg-gasto/10 text-gasto"
              : "border-yellow-500/30 bg-yellow-500/10 text-yellow-800 dark:text-yellow-300"
          }`}
          role="status"
        >
          {urgentes.some((p) => p.esHoy) ? (
            <p>
              <span className="font-semibold">Pago hoy:</span>{" "}
              {urgentes
                .filter((p) => p.esHoy)
                .map((p) => p.nombre)
                .join(", ")}
            </p>
          ) : (
            <p>
              <span className="font-semibold">
                {urgentes.length} pago{urgentes.length !== 1 ? "s" : ""} próximo
                {urgentes.length !== 1 ? "s" : ""}
              </span>{" "}
              en los próximos {recordatorios.diasAntes} días
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        {visibles.map((pago) => (
          <FilaProximoPago key={pago.id} pago={pago} />
        ))}
      </div>

      {pagos.length > LIMITE_VISIBLE && (
        <p className="text-center text-xs text-muted">
          Y {pagos.length - LIMITE_VISIBLE} más en este mes
        </p>
      )}
    </section>
  );
}
