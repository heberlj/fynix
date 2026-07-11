"use client";

import { useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import {
  calcularResumenQuincena,
  obtenerGastosFijosDetalle,
  obtenerCuotasPopularDetalle,
  obtenerCuotasPrestamosDetalle,
  obtenerPagosTarjetasDetalle,
  obtenerTransaccionesEnPeriodo,
} from "@/lib/calculos";
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
          periodo
        ),
        transacciones: obtenerTransaccionesEnPeriodo(transacciones, periodo),
        pagosTarjetas: obtenerPagosTarjetasDetalle(tarjetas, periodo),
        cuotasPrestamos: obtenerCuotasPrestamosDetalle(prestamos, periodo),
        cuotasPopular: obtenerCuotasPopularDetalle(cuotasPopular, tarjetas, periodo, transacciones),
        gastosFijos: obtenerGastosFijosDetalle(gastosFijos, periodo),
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
      quincenaActual,
    ]
  );

  const resumenMes = useMemo(() => {
    return datosQuincenas.reduce(
      (acc, { resumen }) => ({
        ingresos: acc.ingresos + resumen.ingresosTotales,
        gastos: acc.gastos + resumen.gastosTotales,
        compromisos:
          acc.compromisos +
          resumen.pagosTarjetas +
          resumen.cuotasPrestamos +
          resumen.cuotasPopular +
          resumen.gastosFijos,
        disponible: acc.disponible + resumen.disponible,
      }),
      { ingresos: 0, gastos: 0, compromisos: 0, disponible: 0 }
    );
  }, [datosQuincenas]);

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
    <PageContainer>
      <header>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Quincenas</h1>
        <p className="mt-1 text-sm text-muted">
          Vista detallada por periodo según tus días de pago (
          {configuracion.diasPago.join(" y ")})
        </p>
      </header>

      <div className="space-y-4">
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

        <div>
          <p className="mb-3 text-sm font-medium text-foreground">
            Resumen de {etiquetaMes}
          </p>
          <ResumenQuincenaCards
            ingresos={resumenMes.ingresos}
            gastos={resumenMes.gastos}
            disponible={resumenMes.disponible}
            moneda={configuracion.moneda}
          />
        </div>
      </div>

      {datosQuincenas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
          <p className="text-sm text-muted">No hay quincenas para este mes</p>
        </div>
      ) : (
        <div className="space-y-6">
          {datosQuincenas.map(({ periodo, resumen, transacciones: txs, pagosTarjetas, cuotasPrestamos, cuotasPopular: cuotasPopularDetalle, gastosFijos: gastosFijosDetalle, esActual }) => (
            <TarjetaQuincena
              key={`${periodo.inicio}-${periodo.fin}`}
              periodo={periodo}
              resumen={resumen}
              moneda={configuracion.moneda}
              esActual={esActual}
              transacciones={txs}
              pagosTarjetas={pagosTarjetas}
              cuotasPrestamos={cuotasPrestamos}
              cuotasPopular={cuotasPopularDetalle}
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
  );
}
