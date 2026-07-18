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
import {
  colorCategoriaGasto,
  iconoCategoriaGasto,
} from "@/lib/categorias-transacciones";
import { useFinanzas } from "@/context/FinanzasContext";
import { IconoCategoria } from "@/components/ui/IconoCategoria";
import { InsigniaCategoriaGasto } from "@/components/ui/SelectorCategoriaConIconos";
import { EstadoVacio } from "@/components/ui/EstadoVacio";

const ETIQUETAS_FILTRO: Record<FiltroDetalleHome, string> = {
  ingresos: "Ingresos",
  gastos: "Gastos",
  movimientos: "Movimientos",
};

interface ListaTransaccionesHomeProps {
  transacciones: Transaccion[];
  filtro: FiltroDetalleHome;
  moneda: string;
  fuente?: SeleccionFuenteHome | null;
  cuentas: CuentaBancaria[];
  tarjetas: TarjetaCredito[];
  detallado?: boolean;
  className?: string;
}

export function ListaTransaccionesHome({
  transacciones,
  filtro,
  moneda,
  fuente,
  cuentas,
  tarjetas,
  detallado = false,
  className = "",
}: ListaTransaccionesHomeProps) {
  const { configuracion, metasAhorro } = useFinanzas();

  if (transacciones.length === 0) {
    return (
      <EstadoVacio
        titulo={`Sin ${ETIQUETAS_FILTRO[filtro].toLowerCase()} en este periodo`}
        descripcion="No hay transacciones que coincidan con el filtro seleccionado."
        className={className}
        compacto
      />
    );
  }

  const esIngreso = filtro === "ingresos";
  const esGasto = filtro === "gastos";

  return (
    <ul className={`divide-y divide-border ${className}`}>
      {transacciones.map((t) => {
        const { monto, moneda: monedaMonto } = montoMostradoTransaccionHome(
          t,
          moneda,
          fuente
        );

        const colorGasto = esGasto
          ? colorCategoriaGasto(configuracion, t.categoria)
          : null;

        return (
          <li
            key={t.id}
            className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
          >
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  esIngreso
                    ? "bg-ingreso/10 text-ingreso"
                    : esGasto
                      ? ""
                      : "bg-accent/10 text-accent"
                }`}
                style={
                  colorGasto
                    ? {
                        backgroundColor: `${colorGasto}22`,
                        color: colorGasto,
                      }
                    : undefined
                }
              >
                {esGasto ? (
                  <IconoCategoria
                    icono={iconoCategoriaGasto(configuracion, t.categoria)}
                    className="h-4 w-4"
                  />
                ) : esIngreso ? (
                  "+"
                ) : (
                  "⇄"
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground break-words">
                  {t.descripcion}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {esGasto ? (
                    <InsigniaCategoriaGasto
                      categoria={t.categoria}
                      configuracion={configuracion}
                    />
                  ) : (
                    <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted">
                      {t.categoria}
                    </span>
                  )}
                  {t.moneda !== moneda && (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      {t.moneda}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted break-words">
                  {formatearFecha(t.fecha)} · Q{t.quincena}
                </p>
                {detallado && (
                  <div className="mt-2 space-y-1 text-xs text-muted">
                    {t.tipo === "transferencia" && t.origen && t.destino ? (
                      <>
                        <p>
                          <span className="font-medium text-foreground">
                            Origen:{" "}
                          </span>
                          {etiquetaOrigen(
                            t.origen,
                            cuentas,
                            tarjetas,
                            t.modoPagoTarjeta,
                            metasAhorro
                          )}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">
                            Destino:{" "}
                          </span>
                          {etiquetaOrigen(t.destino, cuentas, tarjetas, undefined, metasAhorro)}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">
                            Movimiento:{" "}
                          </span>
                          {etiquetaTransferencia(
                            t.origen,
                            t.destino,
                            cuentas,
                            tarjetas,
                            metasAhorro
                          )}
                        </p>
                      </>
                    ) : (
                      t.origen && (
                        <p>
                          <span className="font-medium text-foreground">
                            Cuenta:{" "}
                          </span>
                          {etiquetaOrigen(
                            t.origen,
                            cuentas,
                            tarjetas,
                            t.modoPagoTarjeta,
                            metasAhorro
                          )}
                        </p>
                      )
                    )}
                    {t.montoOrigen != null && t.monedaOrigen && (
                      <p>
                        <span className="font-medium text-foreground">
                          Monto original:{" "}
                        </span>
                        {formatearMoneda(t.montoOrigen, t.monedaOrigen)}
                        {t.tasaCambio != null && (
                          <> · Tasa {t.tasaCambio}</>
                        )}
                      </p>
                    )}
                  </div>
                )}
                {!detallado &&
                  (t.tipo === "transferencia" && t.origen && t.destino ? (
                    <p className="mt-1 text-xs text-muted break-words">
                      {etiquetaTransferencia(
                        t.origen,
                        t.destino,
                        cuentas,
                        tarjetas,
                        metasAhorro
                      )}
                    </p>
                  ) : (
                    t.origen && (
                      <p className="mt-1 text-xs text-muted break-words">
                        {etiquetaOrigen(
                          t.origen,
                          cuentas,
                          tarjetas,
                          t.modoPagoTarjeta,
                          metasAhorro
                        )}
                      </p>
                    )
                  ))}
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
  );
}
