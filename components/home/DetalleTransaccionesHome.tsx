"use client";

import type {
  CuentaBancaria,
  TarjetaCredito,
  Transaccion,
} from "@/types/finanzas";
import { formatearFecha } from "@/lib/fechas";
import { formatearMoneda } from "@/lib/quincenas";
import {
  montoMostradoTransaccionHome,
  type FiltroDetalleHome,
  type SeleccionFuenteHome,
} from "@/lib/resumen-home";
import { etiquetaOrigen, etiquetaTransferencia } from "@/lib/transacciones";
import { EstadoVacio } from "@/components/ui/EstadoVacio";

const ETIQUETAS_FILTRO: Record<FiltroDetalleHome, string> = {
  ingresos: "Ingresos",
  gastos: "Gastos",
  movimientos: "Movimientos",
};

interface DetalleTransaccionesHomeProps {
  transacciones: Transaccion[];
  filtro: FiltroDetalleHome;
  moneda: string;
  fuente?: SeleccionFuenteHome | null;
  cuentas: CuentaBancaria[];
  tarjetas: TarjetaCredito[];
}

export function DetalleTransaccionesHome({
  transacciones,
  filtro,
  moneda,
  fuente,
  cuentas,
  tarjetas,
}: DetalleTransaccionesHomeProps) {
  if (transacciones.length === 0) {
    return (
      <EstadoVacio
        titulo={`Sin ${ETIQUETAS_FILTRO[filtro].toLowerCase()} en este periodo`}
        descripcion="No hay transacciones que coincidan con el filtro seleccionado."
        className="mt-4 rounded-xl border border-border bg-surface"
      />
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-4 py-3 sm:px-6">
        <h3 className="text-sm font-semibold text-foreground">
          Detalle de {ETIQUETAS_FILTRO[filtro].toLowerCase()}
        </h3>
        <p className="mt-0.5 text-xs text-muted">
          {transacciones.length} transacción
          {transacciones.length !== 1 ? "es" : ""}
        </p>
      </div>

      <ul className="divide-y divide-border">
        {transacciones.map((t) => {
          const { monto, moneda: monedaMonto } = montoMostradoTransaccionHome(
            t,
            moneda,
            fuente
          );
          const esIngreso = filtro === "ingresos";
          const esGasto = filtro === "gastos";

          return (
            <li
              key={t.id}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    esIngreso
                      ? "bg-ingreso/10 text-ingreso"
                      : esGasto
                        ? "bg-gasto/10 text-gasto"
                        : "bg-accent/10 text-accent"
                  }`}
                >
                  {esIngreso ? "+" : esGasto ? "−" : "⇄"}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground break-words">
                    {t.descripcion}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted">
                      {t.categoria}
                    </span>
                    {t.moneda !== moneda && (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                        {t.moneda}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted break-words">
                    {formatearFecha(t.fecha)} · Q{t.quincena}
                    {t.tipo === "transferencia" && t.origen && t.destino ? (
                      <>
                        {" · "}
                        {etiquetaTransferencia(t.origen, t.destino, cuentas, tarjetas)}
                      </>
                    ) : (
                      t.origen && (
                        <>
                          {" · "}
                          {etiquetaOrigen(
                            t.origen,
                            cuentas,
                            tarjetas,
                            t.modoPagoTarjeta
                          )}
                        </>
                      )
                    )}
                  </p>
                </div>
              </div>

              <p
                className={`shrink-0 text-sm font-semibold sm:text-right ${
                  esIngreso
                    ? "text-ingreso"
                    : esGasto
                      ? "text-gasto"
                      : "text-accent"
                }`}
              >
                {esIngreso ? "+" : "−"}
                {formatearMoneda(monto, monedaMonto)}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
