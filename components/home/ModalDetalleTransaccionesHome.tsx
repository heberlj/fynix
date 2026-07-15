"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CuentaBancaria,
  TarjetaCredito,
  Transaccion,
} from "@/types/finanzas";
import { opcionesAnios, opcionesMeses } from "@/lib/fechas";
import {
  filtrarGastosCategoriaPeriodoHome,
  filtrarTransaccionesPeriodoHome,
  type FiltroDetalleHome,
  type SeleccionFuenteHome,
} from "@/lib/resumen-home";
import {
  rangoPeriodoHome,
  type TipoPeriodoHome,
} from "@/lib/periodos-home";
import { Modal } from "@/components/ui/Modal";
import { ListaTransaccionesHome } from "@/components/home/ListaTransaccionesHome";

const ETIQUETAS_FILTRO: Record<FiltroDetalleHome, string> = {
  ingresos: "Ingresos",
  gastos: "Gastos",
  movimientos: "Movimientos",
};

const PERIODOS_MODAL: { id: TipoPeriodoHome; etiqueta: string }[] = [
  { id: "dia", etiqueta: "Día" },
  { id: "mes", etiqueta: "Mes" },
  { id: "anio", etiqueta: "Año" },
];

interface ModalDetalleTransaccionesHomeProps {
  abierto: boolean;
  onCerrar: () => void;
  filtro: FiltroDetalleHome;
  transacciones: Transaccion[];
  moneda: string;
  fuente?: SeleccionFuenteHome | null;
  cuentas: CuentaBancaria[];
  tarjetas: TarjetaCredito[];
  rangoInicial: ReturnType<typeof rangoPeriodoHome>;
  tipoPeriodoInicial: TipoPeriodoHome;
  categoria?: string;
  titulo?: string;
}

export function ModalDetalleTransaccionesHome({
  abierto,
  onCerrar,
  filtro,
  transacciones,
  moneda,
  fuente,
  cuentas,
  tarjetas,
  rangoInicial,
  tipoPeriodoInicial,
  categoria,
  titulo,
}: ModalDetalleTransaccionesHomeProps) {
  const periodoModalInicial =
    tipoPeriodoInicial === "semana" ? "mes" : tipoPeriodoInicial;

  const [tipoPeriodo, setTipoPeriodo] = useState<TipoPeriodoHome>(
    periodoModalInicial === "dia" || periodoModalInicial === "mes" || periodoModalInicial === "anio"
      ? periodoModalInicial
      : "mes"
  );
  const [fecha, setFecha] = useState(rangoInicial.inicio);
  const [mes, setMes] = useState(rangoInicial.inicio.slice(0, 7));
  const [anio, setAnio] = useState(rangoInicial.inicio.slice(0, 4));

  useEffect(() => {
    if (!abierto) return;
    const periodo =
      tipoPeriodoInicial === "semana" ? "mes" : tipoPeriodoInicial;
    setTipoPeriodo(
      periodo === "dia" || periodo === "mes" || periodo === "anio"
        ? periodo
        : "mes"
    );
    setFecha(rangoInicial.inicio);
    setMes(rangoInicial.inicio.slice(0, 7));
    setAnio(rangoInicial.inicio.slice(0, 4));
  }, [abierto, rangoInicial, tipoPeriodoInicial]);

  const referencia =
    tipoPeriodo === "mes" ? mes : tipoPeriodo === "anio" ? anio : fecha;

  const rango = useMemo(
    () => rangoPeriodoHome(tipoPeriodo, referencia),
    [tipoPeriodo, referencia]
  );

  const lista = useMemo(() => {
    if (categoria) {
      return filtrarGastosCategoriaPeriodoHome(
        transacciones,
        rango,
        moneda,
        fuente,
        categoria
      );
    }
    return filtrarTransaccionesPeriodoHome(
      transacciones,
      rango,
      moneda,
      fuente,
      filtro
    );
  }, [transacciones, rango, moneda, fuente, filtro, categoria]);

  const inputClass =
    "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={titulo ?? ETIQUETAS_FILTRO[filtro]}
      variant="centro"
      tamano="amplio"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {PERIODOS_MODAL.map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              onClick={() => setTipoPeriodo(opcion.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                tipoPeriodo === opcion.id
                  ? "bg-accent text-white"
                  : "border border-border bg-background text-muted hover:text-foreground"
              }`}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted">
            {tipoPeriodo === "dia" && "Fecha"}
            {tipoPeriodo === "mes" && "Mes"}
            {tipoPeriodo === "anio" && "Año"}
          </span>
          {tipoPeriodo === "mes" ? (
            <select
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              className={inputClass}
            >
              {opcionesMeses(24).map((opcion) => (
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
              {opcionesAnios(8).map((opcion) => (
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

        <p className="text-xs text-muted">
          {lista.length} transacción{lista.length !== 1 ? "es" : ""} ·{" "}
          {rango.etiqueta}
        </p>

        <ListaTransaccionesHome
          transacciones={lista}
          filtro={filtro}
          moneda={moneda}
          fuente={fuente}
          cuentas={cuentas}
          tarjetas={tarjetas}
          detallado
        />
      </div>
    </Modal>
  );
}
