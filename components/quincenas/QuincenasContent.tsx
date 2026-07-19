"use client";

import { useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import {
  calcularResumenQuincena,
  obtenerGastosFijosDetalle,
  obtenerCuotasPopularDetalle,
  obtenerTransaccionesEnPeriodo,
} from "@/lib/calculos";
import { obtenerCuotasPrestamosDetalle } from "@/lib/prestamos";
import { mesActual, opcionesMeses } from "@/lib/fechas";
import {
  formatearMoneda,
  obtenerQuincenaActual,
  obtenerQuincenasDelMes,
  periodosSonIguales,
} from "@/lib/quincenas";
import { TarjetaQuincena } from "@/components/quincenas/TarjetaQuincena";
import { ResumenQuincenaCards } from "@/components/quincenas/ResumenQuincenaCards";
import { PageContainer } from "@/components/layout/PageContainer";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { AyudaPagina } from "@/components/ayuda/AyudaPagina";

const selectClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

export function QuincenasContent() {
  const { transacciones, tarjetas, prestamos, cuotasPopular, gastosFijos, configuracion, cargado } =
    useFinanzas();
  const [mesSeleccionado, setMesSeleccionado] = useState(mesActual());

  const quincenaActual = useMemo(
    () => (cargado ? obtenerQuincenaActual(configuracion) : null),
    [cargado, configuracion]
  );

  const periodos = useMemo(
    () => obtenerQuincenasDelMes(mesSeleccionado, configuracion.diasPago),
    [mesSeleccionado, configuracion.diasPago]
  );

  const datosQuincenas = useMemo(
    () =>
      periodos.map((periodo) => ({
        periodo,
        resumen: calcularResumenQuincena(
          transacciones,
          tarjetas,
          prestamos,
          cuotasPopular,
          gastosFijos,
          periodo,
          configuracion.moneda,
          configuracion
        ),
        transacciones: obtenerTransaccionesEnPeriodo(
          transacciones,
          periodo,
          configuracion.moneda
        ),
        cuotasPopular: obtenerCuotasPopularDetalle(cuotasPopular, tarjetas, periodo, transacciones),
        prestamos: obtenerCuotasPrestamosDetalle(prestamos, periodo, transacciones),
        gastosFijos: obtenerGastosFijosDetalle(gastosFijos, periodo, transacciones),
        esActual: quincenaActual
          ? periodosSonIguales(periodo, quincenaActual)
          : false,
      })),
    [
      periodos,
      transacciones,
      tarjetas,
      prestamos,
      cuotasPopular,
      gastosFijos,
      configuracion,
      quincenaActual,
      configuracion.moneda,
    ]
  );

  if (!cargado) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted">Cargando...</p>
      </div>
    );
  }

  const etiquetaMes =
    opcionesMeses(12).find((m) => m.valor === mesSeleccionado)?.etiqueta ??
    mesSeleccionado;

  return (
    <AyudaPagina pagina="quincenas">
      <PageContainer>
        <EncabezadoPagina
          titulo="Quincenas"
          descripcion={`Q1: del 1 al 15 · Q2: del 16 al fin de mes. Tus pagos: días ${configuracion.diasPago.join(" y ")}`}
        />

      <div data-ayuda="selector" className="space-y-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Mes</span>
          <select
            value={mesSeleccionado}
            onChange={(e) => setMesSeleccionado(e.target.value)}
            className={`${selectClass} max-w-xs`}
          >
            {opcionesMeses(12).map((op) => (
              <option key={op.valor} value={op.valor}>
                {op.etiqueta}
              </option>
            ))}
          </select>
        </label>

        <div data-ayuda="resumen">
          <p className="mb-1 text-sm font-medium text-foreground">
            Resumen por quincena · {etiquetaMes}
          </p>
          <p className="mb-4 text-xs text-muted">
            Cada bloque muestra una quincena. El disponible aparece en cero hasta que
            registres un ingreso en ese periodo.
          </p>
          {datosQuincenas.length === 0 ? (
            <p className="text-sm text-muted">No hay quincenas para este mes</p>
          ) : (
            <div className="grid items-stretch gap-6 lg:grid-cols-2">
              {datosQuincenas.map(({ periodo, resumen, esActual }) => (
                <ResumenQuincenaCards
                  key={`${periodo.inicio}-${periodo.fin}-resumen`}
                  titulo={periodo.etiqueta}
                  esActual={esActual}
                  ingresos={resumen.ingresosTotales}
                  gastos={resumen.gastosTotales}
                  disponible={resumen.disponible}
                  moneda={configuracion.moneda}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {datosQuincenas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
          <p className="text-sm text-muted">No hay quincenas para este mes</p>
        </div>
      ) : (
        <div data-ayuda="detalle" className="space-y-6">
          {datosQuincenas.map(({ periodo, resumen, transacciones: txs, cuotasPopular: cuotasPopularDetalle, prestamos: prestamosDetalle, gastosFijos: gastosFijosDetalle, esActual }) => (
            <TarjetaQuincena
              key={`${periodo.inicio}-${periodo.fin}`}
              periodo={periodo}
              resumen={resumen}
              moneda={configuracion.moneda}
              esActual={esActual}
              transacciones={txs}
              cuotasPopular={cuotasPopularDetalle}
              prestamos={prestamosDetalle}
              gastosFijos={gastosFijosDetalle}
            />
          ))}
        </div>
      )}

      {datosQuincenas.length === 2 && (
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">
            Comparación del mes
          </h2>
          <p className="mt-1 text-xs text-muted">
            Diferencia entre ambas quincenas
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {(() => {
              const [q1, q2] = datosQuincenas;
              const diffIngresos = q2.resumen.ingresosTotales - q1.resumen.ingresosTotales;
              const diffGastos = q2.resumen.gastosTotales - q1.resumen.gastosTotales;
              const diffDisponible = q2.resumen.disponible - q1.resumen.disponible;

              return (
                <>
                  <div className="rounded-lg border border-border bg-background p-4">
                    <p className="text-xs text-muted">Δ Ingresos (Q2 vs Q1)</p>
                    <p className={`mt-1 text-sm font-bold ${diffIngresos >= 0 ? "text-ingreso" : "text-gasto"}`}>
                      {diffIngresos >= 0 ? "+" : ""}
                      {formatearMoneda(diffIngresos, configuracion.moneda)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-4">
                    <p className="text-xs text-muted">Δ Gastos (Q2 vs Q1)</p>
                    <p className={`mt-1 text-sm font-bold ${diffGastos <= 0 ? "text-ingreso" : "text-gasto"}`}>
                      {diffGastos >= 0 ? "+" : ""}
                      {formatearMoneda(diffGastos, configuracion.moneda)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-4">
                    <p className="text-xs text-muted">Δ Disponible (Q2 vs Q1)</p>
                    <p className={`mt-1 text-sm font-bold ${diffDisponible >= 0 ? "text-ingreso" : "text-gasto"}`}>
                      {diffDisponible >= 0 ? "+" : ""}
                      {formatearMoneda(diffDisponible, configuracion.moneda)}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </PageContainer>
    </AyudaPagina>
  );
}
