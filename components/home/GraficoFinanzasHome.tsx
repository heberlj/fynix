"use client";

import { useMemo, useState } from "react";
import { mesActual, opcionesMeses } from "@/lib/fechas";
import { formatearMoneda } from "@/lib/quincenas";
import type { CuentaBancaria, TarjetaCredito, Transaccion } from "@/types/finanzas";
import {
  calcularResumenMensualHome,
  filtrarTransaccionesMensualHome,
  type FiltroDetalleHome,
  type SeleccionFuenteHome,
} from "@/lib/resumen-home";
import {
  GraficoCircular,
  type SegmentoCircular,
} from "@/components/ui/GraficoCircular";
import { DetalleTransaccionesHome } from "@/components/home/DetalleTransaccionesHome";

export type FiltroGraficoHome = "todos" | "gastos" | "movimientos" | "ingresos";

interface GraficoFinanzasHomeProps {
  transacciones: Transaccion[];
  cuentas: CuentaBancaria[];
  tarjetas: TarjetaCredito[];
  moneda: string;
  fuenteSeleccionada?: SeleccionFuenteHome | null;
  etiquetaFuente?: string;
  className?: string;
}

const COLOR_INGRESOS = "var(--ingreso)";
const COLOR_GASTOS = "var(--gasto)";
const COLOR_MOVIMIENTOS = "var(--accent)";

const FILTROS: { id: FiltroGraficoHome; etiqueta: string }[] = [
  { id: "todos", etiqueta: "Todos" },
  { id: "gastos", etiqueta: "Gastos" },
  { id: "movimientos", etiqueta: "Movimientos" },
  { id: "ingresos", etiqueta: "Ingresos" },
];

function segmentosParaFiltro(
  filtro: FiltroGraficoHome,
  datos: { ingresos: number; gastos: number; movimientos: number }
): SegmentoCircular[] {
  const { ingresos, gastos, movimientos } = datos;

  if (filtro === "ingresos") {
    return [
      {
        id: "ingresos",
        etiqueta: "Ingresos",
        valor: ingresos,
        color: COLOR_INGRESOS,
        descripcion: "Entradas de dinero registradas en transacciones.",
      },
    ];
  }

  if (filtro === "movimientos") {
    return [
      {
        id: "movimientos",
        etiqueta: "Movimientos",
        valor: movimientos,
        color: COLOR_MOVIMIENTOS,
        descripcion:
          "Transferencias entre cuentas, efectivo y tarjetas.",
      },
    ];
  }

  if (filtro === "gastos") {
    return [
      {
        id: "gastos",
        etiqueta: "Gastos",
        valor: gastos,
        color: COLOR_GASTOS,
        descripcion: "Gastos registrados en transacciones.",
      },
    ];
  }

  return [
    {
      id: "ingresos",
      etiqueta: "Ingresos",
      valor: ingresos,
      color: COLOR_INGRESOS,
      descripcion: "Entradas de dinero en el mes.",
    },
    {
      id: "gastos",
      etiqueta: "Gastos",
      valor: gastos,
      color: COLOR_GASTOS,
      descripcion: "Gastos registrados en transacciones.",
    },
    {
      id: "movimientos",
      etiqueta: "Movimientos",
      valor: movimientos,
      color: COLOR_MOVIMIENTOS,
      descripcion: "Transferencias entre cuentas, efectivo y tarjetas.",
    },
  ];
}

function totalFiltro(
  filtro: FiltroGraficoHome,
  datos: { ingresos: number; gastos: number; movimientos: number }
): number {
  const { ingresos, gastos, movimientos } = datos;

  switch (filtro) {
    case "ingresos":
      return ingresos;
    case "movimientos":
      return movimientos;
    case "gastos":
      return gastos;
    default:
      return ingresos + gastos + movimientos;
  }
}

function etiquetaCentro(filtro: FiltroGraficoHome): string {
  switch (filtro) {
    case "ingresos":
      return "Ingresos";
    case "movimientos":
      return "Movimientos";
    case "gastos":
      return "Gastos";
    default:
      return "Total";
  }
}

export function GraficoFinanzasHome({
  transacciones,
  cuentas,
  tarjetas,
  moneda,
  fuenteSeleccionada = null,
  etiquetaFuente,
  className = "",
}: GraficoFinanzasHomeProps) {
  const [filtro, setFiltro] = useState<FiltroGraficoHome>("todos");
  const [mes, setMes] = useState(mesActual);

  const opcionesMes = useMemo(() => opcionesMeses(12), []);
  const etiquetaMes =
    opcionesMes.find((o) => o.valor === mes)?.etiqueta ?? mes;

  const resumen = useMemo(
    () =>
      calcularResumenMensualHome(
        transacciones,
        mes,
        moneda,
        fuenteSeleccionada
      ),
    [transacciones, mes, moneda, fuenteSeleccionada]
  );

  const segmentos = segmentosParaFiltro(filtro, resumen);
  const total = totalFiltro(filtro, resumen);

  const filtroDetalle: FiltroDetalleHome | null =
    filtro === "ingresos" || filtro === "gastos" || filtro === "movimientos"
      ? filtro
      : null;

  const transaccionesDetalle = useMemo(() => {
    if (!filtroDetalle) return [];
    return filtrarTransaccionesMensualHome(
      transacciones,
      mes,
      moneda,
      fuenteSeleccionada,
      filtroDetalle
    );
  }, [transacciones, mes, moneda, fuenteSeleccionada, filtroDetalle]);

  const subtitulo = fuenteSeleccionada
    ? `Transacciones de ${etiquetaFuente ?? "la fuente seleccionada"} en ${etiquetaMes}.`
    : `Todas tus transacciones en ${etiquetaMes}. Selecciona una cuenta o tarjeta arriba para filtrar.`;

  return (
    <div className={className}>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted">Mes</span>
          <select
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
          >
            {opcionesMes.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-2">
          {FILTROS.map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              onClick={() => setFiltro(opcion.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filtro === opcion.id
                  ? "bg-accent text-white"
                  : "border border-border bg-background text-muted hover:text-foreground"
              }`}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <GraficoCircular
        segmentos={segmentos}
        moneda={moneda}
        titulo="Resumen del mes"
        subtitulo={subtitulo}
        centroEtiqueta={etiquetaCentro(filtro)}
        centroValor={formatearMoneda(total, moneda)}
        centroNota={
          filtro === "todos"
            ? `Ingresos: ${formatearMoneda(resumen.ingresos, moneda)}`
            : undefined
        }
        mensajeVacio="No hay transacciones en este mes para mostrar."
      />

      {filtroDetalle && (
        <DetalleTransaccionesHome
          transacciones={transaccionesDetalle}
          filtro={filtroDetalle}
          moneda={moneda}
          fuente={fuenteSeleccionada}
          cuentas={cuentas}
          tarjetas={tarjetas}
        />
      )}
    </div>
  );
}
