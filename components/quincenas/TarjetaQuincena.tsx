"use client";

import { useState } from "react";
import type { PeriodoQuincena, ResumenQuincena } from "@/types/finanzas";
import {
  obtenerGastosFijosDetalle,
  obtenerCuotasPopularDetalle,
  obtenerCuotasPrestamosDetalle,
  obtenerPagosTarjetasDetalle,
  obtenerTransaccionesEnPeriodo,
} from "@/lib/calculos";
import { formatearFecha } from "@/lib/fechas";
import { formatearMoneda } from "@/lib/quincenas";

interface TarjetaQuincenaProps {
  periodo: PeriodoQuincena;
  resumen: ResumenQuincena;
  moneda: string;
  esActual: boolean;
  transacciones: ReturnType<typeof obtenerTransaccionesEnPeriodo>;
  pagosTarjetas: ReturnType<typeof obtenerPagosTarjetasDetalle>;
  cuotasPrestamos: ReturnType<typeof obtenerCuotasPrestamosDetalle>;
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

export function TarjetaQuincena({
  periodo,
  resumen,
  moneda,
  esActual,
  transacciones,
  pagosTarjetas,
  cuotasPrestamos,
  cuotasPopular,
  gastosFijos,
}: TarjetaQuincenaProps) {
  const [expandida, setExpandida] = useState(esActual);

  const ingresos = transacciones.filter((t) => t.tipo === "ingreso");
  const gastos = transacciones.filter((t) => t.tipo === "gasto");

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
              resumen.disponible >= 0 ? "text-ingreso" : "text-gasto"
            }`}
          >
            {formatearMoneda(resumen.disponible, moneda)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {expandida ? "▲ Ocultar" : "▼ Ver detalle"}
          </p>
        </div>
      </button>

      <div className="border-t border-border px-6 py-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <p className="text-xs text-muted">Ingresos</p>
            <p className="text-sm font-semibold text-ingreso">
              {formatearMoneda(resumen.ingresosTotales, moneda)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Gastos</p>
            <p className="text-sm font-semibold text-gasto">
              {formatearMoneda(resumen.gastosTotales, moneda)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Tarjetas</p>
            <p className="text-sm font-semibold text-foreground">
              {formatearMoneda(resumen.pagosTarjetas, moneda)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Préstamos</p>
            <p className="text-sm font-semibold text-foreground">
              {formatearMoneda(resumen.cuotasPrestamos, moneda)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Cuotas Popular</p>
            <p className="text-sm font-semibold text-foreground">
              {formatearMoneda(resumen.cuotasPopular, moneda)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Gastos fijos</p>
            <p className="text-sm font-semibold text-foreground">
              {formatearMoneda(resumen.gastosFijos, moneda)}
            </p>
          </div>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
          {resumen.ingresosTotales > 0 && (
            <div className="flex h-full">
              <div
                className="bg-gasto"
                style={{
                  width: `${Math.min(100, (resumen.gastosTotales / resumen.ingresosTotales) * 100)}%`,
                }}
              />
              <div
                className="bg-yellow-500"
                style={{
                  width: `${Math.min(100, ((resumen.pagosTarjetas + resumen.cuotasPrestamos + resumen.cuotasPopular + resumen.gastosFijos) / resumen.ingresosTotales) * 100)}%`,
                }}
              />
              <div
                className="bg-ingreso"
                style={{
                  width: `${Math.max(0, Math.min(100, (resumen.disponible / resumen.ingresosTotales) * 100))}%`,
                }}
              />
            </div>
          )}
        </div>
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
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-foreground">{t.descripcion}</p>
                      <p className="text-xs text-muted">
                        {formatearFecha(t.fecha)} · {t.categoria}
                      </p>
                    </div>
                    <span className="font-medium text-ingreso">
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
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-foreground">{t.descripcion}</p>
                      <p className="text-xs text-muted">
                        {formatearFecha(t.fecha)} · {t.categoria}
                      </p>
                    </div>
                    <span className="font-medium text-gasto">
                      −{formatearMoneda(t.monto, moneda)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(pagosTarjetas.length > 0 ||
            cuotasPrestamos.length > 0 ||
            cuotasPopular.length > 0 ||
            gastosFijos.length > 0) && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Compromisos del periodo
              </p>
              <div className="rounded-lg border border-border bg-background px-3 py-2">
                {pagosTarjetas.map((p) => (
                  <FilaDetalle
                    key={`t-${p.nombre}`}
                    etiqueta={`${p.nombre} (día ${p.dia})`}
                    monto={p.monto}
                    moneda={p.moneda}
                    variante="gasto"
                  />
                ))}
                {cuotasPrestamos.map((p) => (
                  <FilaDetalle
                    key={`p-${p.nombre}`}
                    etiqueta={`${p.nombre} (día ${p.dia})`}
                    monto={p.monto}
                    moneda={p.moneda}
                    variante="gasto"
                  />
                ))}
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
                  <FilaDetalle
                    key={`gf-${p.nombre}`}
                    etiqueta={`${p.nombre} · ${p.categoria} · Q${p.quincena} (día ${p.dia})`}
                    monto={p.monto}
                    moneda={p.moneda}
                    variante="gasto"
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                Los compromisos en otra moneda se muestran en su moneda original.
                Los totales del resumen usan tu moneda principal ({moneda}).
              </p>
            </div>
          )}

          {transacciones.length === 0 &&
            pagosTarjetas.length === 0 &&
            cuotasPrestamos.length === 0 &&
            cuotasPopular.length === 0 &&
            gastosFijos.length === 0 && (
              <p className="py-4 text-center text-sm text-muted">
                Sin movimientos en este periodo
              </p>
            )}

          <div className="rounded-lg bg-background px-4 py-3">
            <FilaDetalle
              etiqueta="Balance (ingresos − gastos)"
              monto={resumen.balanceNeto}
              moneda={moneda}
            />
            <FilaDetalle
              etiqueta="Menos compromisos del periodo"
              monto={-(resumen.pagosTarjetas + resumen.cuotasPrestamos + resumen.cuotasPopular + resumen.gastosFijos)}
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
          </div>
        </div>
      )}
    </div>
  );
}
