"use client";

import { useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import type { PeriodoQuincena, ResumenQuincena } from "@/types/finanzas";
import {
  obtenerGastosFijosDetalle,
  obtenerCuotasPopularDetalle,
  obtenerTransaccionesEnPeriodo,
} from "@/lib/calculos";
import { formatearFecha } from "@/lib/fechas";
import { formatearMoneda } from "@/lib/quincenas";
import { esPagoATarjeta, etiquetaTransferencia } from "@/lib/transacciones";

interface TarjetaQuincenaProps {
  periodo: PeriodoQuincena;
  resumen: ResumenQuincena;
  moneda: string;
  esActual: boolean;
  transacciones: ReturnType<typeof obtenerTransaccionesEnPeriodo>;
  cuotasPopular: ReturnType<typeof obtenerCuotasPopularDetalle>;
  gastosFijos: ReturnType<typeof obtenerGastosFijosDetalle>;
}

function FilaDetalle({
  etiqueta,
  monto,
  moneda,
  variante = "default",
}: {
  etiqueta: string;
  monto: number;
  moneda: string;
  variante?: "ingreso" | "gasto" | "default";
}) {
  const color =
    variante === "ingreso"
      ? "text-ingreso"
      : variante === "gasto"
        ? "text-gasto"
        : "text-foreground";

  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted">{etiqueta}</span>
      <span className={`font-medium ${color}`}>
        {formatearMoneda(monto, moneda)}
      </span>
    </div>
  );
}

function LeyendaBarraDistribucion({
  resumen,
  moneda,
}: {
  resumen: ResumenQuincena;
  moneda: string;
}) {
  const compromisosTotal =
    resumen.cuotasPopular +
    resumen.gastosFijos;

  if (resumen.ingresosTotales <= 0) {
    if (
      compromisosTotal <= 0 &&
      resumen.gastosTotales <= 0 &&
      resumen.movimientosTotales <= 0 &&
      resumen.pagosTarjetas <= 0
    ) {
      return null;
    }
    return (
      <div className="mt-3 rounded-lg border border-border bg-background px-3 py-2.5">
        <p className="text-xs font-medium text-foreground">Sin ingresos registrados</p>
        <p className="mt-1 text-xs text-muted">
          Registra tu nómina o salario para calcular el disponible y ver la barra de
          distribución.
        </p>
        {compromisosTotal > 0 && (
          <p className="mt-2 text-xs text-muted">
            Compromisos previstos en esta quincena:{" "}
            <span className="font-medium text-foreground">
              {formatearMoneda(compromisosTotal, moneda)}
            </span>
          </p>
        )}
      </div>
    );
  }

  const items = [
    {
      color: "bg-gasto",
      label: "Gastos",
      monto: resumen.gastosTotales,
      desc: "compras y pagos registrados como gasto",
    },
    {
      color: "bg-accent",
      label: "Movimientos",
      monto: resumen.movimientosTotales,
      desc: "pagos a tarjetas desde cuenta o efectivo",
    },
    {
      color: "bg-orange-500",
      label: "Tarjetas pendientes",
      monto: resumen.pagosTarjetas,
      desc: "deuda de tarjetas con fecha de pago en esta quincena",
    },
    {
      color: "bg-yellow-500",
      label: "Compromisos",
      monto: compromisosTotal,
      desc: "cuotas popular y gastos del periodo",
    },
    {
      color: "bg-ingreso",
      label: "Disponible",
      monto: Math.max(0, resumen.disponible),
      desc: "lo que queda de tus ingresos",
    },
  ].filter((item) => item.monto > 0);

  if (resumen.disponible < 0 && resumen.ingresosTotales > 0) {
    items.push({
      color: "bg-gasto ring-1 ring-gasto/50",
      label: "Déficit",
      monto: Math.abs(resumen.disponible),
      desc: "tus salidas superan los ingresos del periodo",
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-border bg-background px-3 py-2.5">
      <p className="text-xs font-medium text-foreground">Leyenda de la barra</p>
      <p className="mt-0.5 text-xs text-muted">
        Cada color representa una parte de tus ingresos ({moneda}) en esta quincena.
      </p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item.label} className="flex items-start gap-2 text-xs">
            <span
              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-sm ${item.color}`}
              aria-hidden
            />
            <span>
              <span className="font-medium text-foreground">{item.label}</span>
              {item.monto > 0 && (
                <span className="text-muted">
                  {" "}
                  · {formatearMoneda(item.monto, moneda)}
                </span>
              )}
              <span className="block text-muted">{item.desc}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BarraDistribucionIngresos({ resumen }: { resumen: ResumenQuincena }) {
  const ingresos = resumen.ingresosTotales;
  if (ingresos <= 0) return null;

  const compromisosTotal =
    resumen.cuotasPopular +
    resumen.gastosFijos;

  const segmentos = [
    { monto: resumen.gastosTotales, className: "bg-gasto" },
    { monto: resumen.movimientosTotales, className: "bg-accent" },
    { monto: resumen.pagosTarjetas, className: "bg-orange-500" },
    { monto: compromisosTotal, className: "bg-yellow-500" },
    { monto: Math.max(0, resumen.disponible), className: "bg-ingreso" },
  ].filter((s) => s.monto > 0);

  const totalSegmentos = segmentos.reduce((s, x) => s + x.monto, 0);
  const divisor = Math.max(ingresos, totalSegmentos);

  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
      <div className="flex h-full min-w-0">
        {segmentos.map((seg, i) => (
          <div
            key={i}
            className={`h-full ${seg.className}`}
            style={{ width: `${(seg.monto / divisor) * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function TarjetaQuincena({
  periodo,
  resumen,
  moneda,
  esActual,
  transacciones,
  cuotasPopular,
  gastosFijos,
}: TarjetaQuincenaProps) {
  const [expandida, setExpandida] = useState(esActual);
  const { cuentas, tarjetas, metasAhorro } = useFinanzas();

  const ingresos = transacciones.filter((t) => t.tipo === "ingreso");
  const gastos = transacciones.filter((t) => t.tipo === "gasto");
  const movimientos = transacciones.filter((t) => esPagoATarjeta(t));
  const transferenciasInternas = transacciones.filter(
    (t) => t.tipo === "transferencia" && !esPagoATarjeta(t)
  );
  const sinIngresos = resumen.ingresosTotales <= 0;

  return (
    <div
      className={`rounded-xl border bg-surface shadow-sm ${
        esActual ? "border-accent ring-1 ring-accent/20" : "border-border"
      }`}
    >
      <button
        type="button"
        onClick={() => setExpandida((v) => !v)}
        className="flex w-full items-start justify-between gap-4 p-6 text-left"
      >
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">
              {periodo.etiqueta}
            </h3>
            {esActual && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                Actual
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted">
            {formatearFecha(periodo.inicio)} — {formatearFecha(periodo.fin)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-muted">Disponible</p>
          <p
            className={`text-lg font-bold ${
              sinIngresos
                ? "text-muted"
                : resumen.disponible >= 0
                  ? "text-ingreso"
                  : "text-gasto"
            }`}
          >
            {formatearMoneda(sinIngresos ? 0 : resumen.disponible, moneda)}
          </p>
          {sinIngresos && (
            <p className="mt-0.5 text-xs text-muted">Pendiente de ingreso</p>
          )}
          <p className="mt-1 text-xs text-muted">
            {expandida ? "▲ Ocultar" : "▼ Ver detalle"}
          </p>
        </div>
      </button>

      <div className="border-t border-border px-6 py-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="min-w-0">
            <p className="text-xs text-muted">Ingresos</p>
            <p className="text-sm font-semibold text-ingreso break-words">
              {formatearMoneda(resumen.ingresosTotales, moneda)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted">Gastos</p>
            <p className="text-sm font-semibold text-gasto break-words">
              {formatearMoneda(resumen.gastosTotales, moneda)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted">Movimientos</p>
            <p className="text-sm font-semibold text-accent break-words">
              {formatearMoneda(resumen.movimientosTotales, moneda)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted">Cuotas Popular</p>
            <p className="text-sm font-semibold text-foreground break-words">
              {formatearMoneda(resumen.cuotasPopular, moneda)}
            </p>
          </div>
          <div className="min-w-0 col-span-2 sm:col-span-1">
            <p className="text-xs text-muted">Compromisos</p>
            <p className="text-sm font-semibold text-foreground break-words">
              {formatearMoneda(resumen.gastosFijos, moneda)}
            </p>
          </div>
        </div>

        <BarraDistribucionIngresos resumen={resumen} />
        <LeyendaBarraDistribucion resumen={resumen} moneda={moneda} />
      </div>

      {expandida && (
        <div className="space-y-4 border-t border-border px-6 py-4">
          {ingresos.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Ingresos ({ingresos.length})
              </p>
              <div className="divide-y divide-border rounded-lg border border-border bg-background">
                {ingresos.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col gap-2 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground break-words">{t.descripcion}</p>
                      <p className="text-xs text-muted">
                        {formatearFecha(t.fecha)} · {t.categoria}
                      </p>
                    </div>
                    <span className="shrink-0 font-medium text-ingreso">
                      +{formatearMoneda(t.monto, moneda)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gastos.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Gastos ({gastos.length})
              </p>
              <div className="divide-y divide-border rounded-lg border border-border bg-background">
                {gastos.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col gap-2 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground break-words">{t.descripcion}</p>
                      <p className="text-xs text-muted">
                        {formatearFecha(t.fecha)} · {t.categoria}
                      </p>
                    </div>
                    <span className="shrink-0 font-medium text-gasto">
                      −{formatearMoneda(t.monto, moneda)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {movimientos.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Movimientos ({movimientos.length})
              </p>
              <div className="divide-y divide-border rounded-lg border border-border bg-background">
                {movimientos.map((t) => {
                  const monedaSalida = t.monedaOrigen ?? moneda;
                  const montoSalida = t.montoOrigen ?? t.monto;
                  const conCambio =
                    t.monedaOrigen &&
                    t.moneda !== t.monedaOrigen &&
                    t.tasaCambio;

                  return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-foreground">{t.descripcion}</p>
                      <p className="text-xs text-muted">
                        {formatearFecha(t.fecha)} · {t.categoria}
                        {conCambio && (
                          <>
                            {" · "}
                            {formatearMoneda(t.monto, t.moneda)} a la tarjeta · tasa{" "}
                            {t.tasaCambio} {t.monedaOrigen}/{t.moneda}
                          </>
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 text-right font-medium text-accent">
                      −{formatearMoneda(montoSalida, monedaSalida)}
                    </span>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {transferenciasInternas.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Transferencias entre cuentas ({transferenciasInternas.length})
              </p>
              <div className="divide-y divide-border rounded-lg border border-border bg-background">
                {transferenciasInternas.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-foreground">{t.descripcion}</p>
                      <p className="text-xs text-muted">
                        {formatearFecha(t.fecha)}
                        {t.origen && t.destino && (
                          <>
                            {" · "}
                            {etiquetaTransferencia(t.origen, t.destino, cuentas, tarjetas, metasAhorro)}
                          </>
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 text-right font-medium text-foreground">
                      {formatearMoneda(t.monto, t.moneda)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(cuotasPopular.length > 0 || gastosFijos.length > 0) && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Compromisos del periodo
              </p>
              <div className="rounded-lg border border-border bg-background px-3 py-2">
                {cuotasPopular.map((p) => (
                  <FilaDetalle
                    key={`cp-${p.nombre}`}
                    etiqueta={`${p.nombre} (día ${p.dia})`}
                    monto={p.monto}
                    moneda={p.moneda}
                    variante="gasto"
                  />
                ))}
                {gastosFijos.map((p) => (
                  <div key={`gf-${p.id}`} className="py-1.5">
                    <FilaDetalle
                      etiqueta={`${p.nombre} · ${p.categoria} · Q${p.quincena} (día ${p.dia})${
                        p.pagado ? " · Pagado" : ""
                      }`}
                      monto={p.pagado ? p.montoPagado : p.montoPendiente}
                      moneda={p.moneda}
                      variante={p.pagado ? "ingreso" : "gasto"}
                    />
                    {p.pagado && p.montoPagado < p.monto && (
                      <p className="text-xs text-muted">
                        Previsto {formatearMoneda(p.monto, p.moneda)} · cubierto parcialmente
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                Los compromisos en otra moneda se muestran en su moneda original.
                Los totales del resumen usan tu moneda principal ({moneda}).
              </p>
            </div>
          )}

          {transacciones.length === 0 &&
            cuotasPopular.length === 0 &&
            gastosFijos.length === 0 && (
              <p className="py-4 text-center text-sm text-muted">
                Sin movimientos en este periodo
              </p>
            )}

          <div className="rounded-lg bg-background px-4 py-3">
            {sinIngresos ? (
              <p className="text-sm text-muted">
                Registra un ingreso en esta quincena para calcular cuánto te quedará
                disponible después de gastos, movimientos y compromisos.
              </p>
            ) : (
              <>
            <FilaDetalle
              etiqueta="Balance (ingresos − gastos)"
              monto={resumen.balanceNeto}
              moneda={moneda}
            />
            {resumen.movimientosTotales > 0 && (
              <FilaDetalle
                etiqueta="Menos movimientos"
                monto={-resumen.movimientosTotales}
                moneda={moneda}
                variante="gasto"
              />
            )}
            {resumen.pagosTarjetas > 0 && (
              <FilaDetalle
                etiqueta="Menos pagos pendientes de tarjetas"
                monto={-resumen.pagosTarjetas}
                moneda={moneda}
                variante="gasto"
              />
            )}
            <FilaDetalle
              etiqueta="Menos compromisos del periodo"
              monto={-(resumen.cuotasPopular + resumen.gastosFijos)}
              moneda={moneda}
              variante="gasto"
            />
            <div className="mt-2 border-t border-border pt-2">
              <FilaDetalle
                etiqueta="Disponible"
                monto={resumen.disponible}
                moneda={moneda}
                variante={resumen.disponible >= 0 ? "ingreso" : "gasto"}
              />
            </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
