"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  fechaHoy,
  mesActual,
  opcionesAnios,
  opcionesMeses,
} from "@/lib/fechas";
import { formatearMoneda } from "@/lib/quincenas";
import type { CuentaBancaria, TarjetaCredito, Transaccion } from "@/types/finanzas";
import {
  calcularResumenPeriodoHome,
  filtrarTransaccionesPeriodoHome,
  type FiltroDetalleHome,
  type SeleccionFuenteHome,
} from "@/lib/resumen-home";
import {
  etiquetaTipoPeriodo,
  rangoPeriodoHome,
  type TipoPeriodoHome,
} from "@/lib/periodos-home";
import { gastosPorCategoriaEnPeriodo } from "@/lib/graficos";
import {
  GraficoCircular,
  type SegmentoCircular,
} from "@/components/ui/GraficoCircular";
import { GraficoCategoriasHome } from "@/components/home/GraficoCategoriasHome";
import { DetalleTransaccionesHome } from "@/components/home/DetalleTransaccionesHome";
import { ModalDetalleTransaccionesHome } from "@/components/home/ModalDetalleTransaccionesHome";
import { useEsMovil } from "@/lib/use-media-query";

function esFiltroDetalle(id: string): id is FiltroDetalleHome {
  return id === "ingresos" || id === "gastos" || id === "movimientos";
}

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

const PERIODOS: { id: TipoPeriodoHome; etiqueta: string }[] = [
  { id: "dia", etiqueta: "Día" },
  { id: "semana", etiqueta: "Semana" },
  { id: "mes", etiqueta: "Mes" },
  { id: "anio", etiqueta: "Año" },
];

const ETIQUETAS_DETALLE: Record<FiltroDetalleHome, string> = {
  ingresos: "Ingresos",
  gastos: "Gastos",
  movimientos: "Movimientos",
};

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
        descripcion: "Transferencias entre cuentas, efectivo y tarjetas.",
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
      descripcion: "Entradas de dinero en el periodo.",
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

function referenciaPeriodo(
  tipo: TipoPeriodoHome,
  fecha: string,
  mes: string,
  anio: string
): string {
  if (tipo === "mes") return mes;
  if (tipo === "anio") return anio;
  return fecha;
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
  const [tipoPeriodo, setTipoPeriodo] = useState<TipoPeriodoHome>("mes");
  const [fecha, setFecha] = useState(fechaHoy);
  const [mes, setMes] = useState(mesActual);
  const [anio, setAnio] = useState(String(new Date().getFullYear()));
  const [segmentoExpandido, setSegmentoExpandido] =
    useState<FiltroDetalleHome | null>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const refDetalle = useRef<HTMLDivElement>(null);
  const esMovil = useEsMovil();

  const opcionesMes = useMemo(() => opcionesMeses(12), []);
  const opcionesAnio = useMemo(() => opcionesAnios(6), []);

  const referencia = referenciaPeriodo(tipoPeriodo, fecha, mes, anio);
  const rango = useMemo(
    () => rangoPeriodoHome(tipoPeriodo, referencia),
    [tipoPeriodo, referencia]
  );

  const resumen = useMemo(
    () =>
      calcularResumenPeriodoHome(
        transacciones,
        rango,
        moneda,
        fuenteSeleccionada
      ),
    [transacciones, rango, moneda, fuenteSeleccionada]
  );

  const datosCategoria = useMemo(
    () =>
      gastosPorCategoriaEnPeriodo(
        transacciones,
        rango,
        moneda,
        fuenteSeleccionada
      ),
    [transacciones, rango, moneda, fuenteSeleccionada]
  );

  const segmentos = segmentosParaFiltro(filtro, resumen);
  const total = totalFiltro(filtro, resumen);

  const transaccionesSegmento = useMemo(() => {
    if (!segmentoExpandido) return [];
    return filtrarTransaccionesPeriodoHome(
      transacciones,
      rango,
      moneda,
      fuenteSeleccionada,
      segmentoExpandido
    );
  }, [
    transacciones,
    rango,
    moneda,
    fuenteSeleccionada,
    segmentoExpandido,
  ]);

  useEffect(() => {
    setSegmentoExpandido(null);
    setModalDetalleAbierto(false);
  }, [tipoPeriodo, referencia]);

  useEffect(() => {
    if (!segmentoExpandido || esMovil || !refDetalle.current) return;
    refDetalle.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [segmentoExpandido, esMovil, transaccionesSegmento.length]);

  function manejarClicSegmento(id: string) {
    if (!esFiltroDetalle(id)) return;

    if (segmentoExpandido === id) {
      setSegmentoExpandido(null);
      setModalDetalleAbierto(false);
      return;
    }

    setSegmentoExpandido(id);
    if (esMovil) {
      setModalDetalleAbierto(true);
    }
  }

  function manejarCambioFiltro(nuevo: FiltroGraficoHome) {
    setFiltro(nuevo);
    if (nuevo === "todos") {
      setSegmentoExpandido(null);
      setModalDetalleAbierto(false);
      return;
    }
    setSegmentoExpandido(nuevo);
    if (esMovil) {
      setModalDetalleAbierto(true);
    }
  }

  function manejarCambioPeriodo(nuevo: TipoPeriodoHome) {
    setTipoPeriodo(nuevo);
    setSegmentoExpandido(null);
  }

  const etiquetaPeriodo = rango.etiqueta;
  const tipoEtiqueta = etiquetaTipoPeriodo(tipoPeriodo);

  const subtitulo = fuenteSeleccionada
    ? `Transacciones de ${etiquetaFuente ?? "la fuente seleccionada"} en ${etiquetaPeriodo}.`
    : `Todas tus transacciones en ${etiquetaPeriodo}. Selecciona una cuenta o tarjeta arriba para filtrar.`;

  const subtituloCategorias = fuenteSeleccionada
    ? `Gastos de ${etiquetaFuente ?? "la fuente seleccionada"} en ${etiquetaPeriodo}.`
    : `Dónde gastaste más en ${etiquetaPeriodo}.`;

  const inputClass =
    "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

  return (
    <div className={className}>
      <div className="mb-3 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {PERIODOS.map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              onClick={() => manejarCambioPeriodo(opcion.id)}
              className={`touch-manipulation rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:py-1.5 ${
                tipoPeriodo === opcion.id
                  ? "bg-accent text-white"
                  : "border border-border bg-background text-muted hover:text-foreground"
              }`}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">
              {tipoPeriodo === "dia" && "Fecha"}
              {tipoPeriodo === "semana" && "Semana (elige un día)"}
              {tipoPeriodo === "mes" && "Mes"}
              {tipoPeriodo === "anio" && "Año"}
            </span>
            {tipoPeriodo === "mes" ? (
              <select
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className={inputClass}
              >
                {opcionesMes.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.etiqueta}
                  </option>
                ))}
              </select>
            ) : tipoPeriodo === "anio" ? (
              <select
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                className={inputClass}
              >
                {opcionesAnio.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.etiqueta}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className={inputClass}
              />
            )}
          </label>

          <div className="flex flex-wrap gap-2">
            {FILTROS.map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                onClick={() => manejarCambioFiltro(opcion.id)}
                className={`touch-manipulation rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:py-1.5 ${
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="min-w-0">
          <GraficoCircular
            segmentos={segmentos}
            moneda={moneda}
            titulo={`Resumen del ${tipoEtiqueta}`}
            subtitulo={subtitulo}
            centroEtiqueta={etiquetaCentro(filtro)}
            centroValor={formatearMoneda(total, moneda)}
            centroNota={
              filtro === "todos"
                ? `Ingresos: ${formatearMoneda(resumen.ingresos, moneda)}`
                : undefined
            }
            mensajeVacio={`No hay transacciones en este ${tipoEtiqueta} para mostrar.`}
            segmentoSeleccionado={segmentoExpandido}
            onSegmentoClick={manejarClicSegmento}
          />

          {segmentoExpandido && (
            <div ref={refDetalle} className="scroll-mt-24">
              {esMovil ? (
                <div className="mt-3 rounded-xl border border-border bg-background px-4 py-3 text-center shadow-sm">
                  <p className="text-sm font-medium text-foreground">
                    {transaccionesSegmento.length} transacción
                    {transaccionesSegmento.length !== 1 ? "es" : ""} en{" "}
                    {ETIQUETAS_DETALLE[segmentoExpandido].toLowerCase()}
                  </p>
                  <button
                    type="button"
                    onClick={() => setModalDetalleAbierto(true)}
                    className="mt-2 w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
                  >
                    Ver listado completo
                  </button>
                </div>
              ) : (
                <DetalleTransaccionesHome
                  transacciones={transaccionesSegmento}
                  filtro={segmentoExpandido}
                  moneda={moneda}
                  fuente={fuenteSeleccionada}
                  cuentas={cuentas}
                  tarjetas={tarjetas}
                  onVerMas={() => setModalDetalleAbierto(true)}
                />
              )}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <GraficoCategoriasHome
            datos={datosCategoria}
            transacciones={transacciones}
            rango={rango}
            tipoPeriodo={tipoPeriodo}
            moneda={moneda}
            fuente={fuenteSeleccionada}
            cuentas={cuentas}
            tarjetas={tarjetas}
            subtitulo={subtituloCategorias}
          />
        </div>
      </div>

      {segmentoExpandido && (
        <ModalDetalleTransaccionesHome
          abierto={modalDetalleAbierto}
          onCerrar={() => setModalDetalleAbierto(false)}
          filtro={segmentoExpandido}
          transacciones={transacciones}
          moneda={moneda}
          fuente={fuenteSeleccionada}
          cuentas={cuentas}
          tarjetas={tarjetas}
          rangoInicial={rango}
          tipoPeriodoInicial={tipoPeriodo}
        />
      )}
    </div>
  );
}
