"use client";

import Link from "next/link";
import { useFinanzas } from "@/context/FinanzasContext";
import {
  calcularResumenQuincena,
  obtenerProximosPagos,
} from "@/lib/calculos";
import { totalCuentasPorMoneda } from "@/lib/cuentas";
import { mesActual } from "@/lib/fechas";
import { evolucionMensual, gastosPorCategoria } from "@/lib/graficos";
import {
  formatearMoneda,
  obtenerAmbasQuincenas,
  obtenerQuincenaActual,
  obtenerQuincenaAnterior,
} from "@/lib/quincenas";
import { PageContainer } from "@/components/layout/PageContainer";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { AyudaPagina } from "@/components/ayuda/AyudaPagina";
import { StatCard } from "@/components/ui/StatCard";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { GraficoResumenQuincena } from "@/components/dashboard/GraficoResumenQuincena";
import { GraficoCategorias } from "@/components/ui/GraficoCategorias";
import { GraficoEvolucion } from "@/components/ui/GraficoEvolucion";

export function DashboardContent() {
  const { transacciones, tarjetas, prestamos, cuotasPopular, gastosFijos, cuentas, efectivo, configuracion, cargado } =
    useFinanzas();

  if (!cargado) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted">Cargando...</p>
      </div>
    );
  }

  const quincenaActual = obtenerQuincenaActual(configuracion);
  const quincenaAnterior = obtenerQuincenaAnterior(
    quincenaActual,
    configuracion.diasPago
  );
  const [q1, q2] = obtenerAmbasQuincenas(configuracion);
  const resumenActual = calcularResumenQuincena(
    transacciones,
    tarjetas,
    prestamos,
    cuotasPopular,
    gastosFijos,
    quincenaActual,
    configuracion.moneda
  );
  const resumenAnterior = calcularResumenQuincena(
    transacciones,
    tarjetas,
    prestamos,
    cuotasPopular,
    gastosFijos,
    quincenaAnterior,
    configuracion.moneda
  );
  const compromisosActual =
    resumenActual.pagosTarjetas +
    resumenActual.cuotasPrestamos +
    resumenActual.cuotasPopular +
    resumenActual.gastosFijos;
  const compromisosAnterior =
    resumenAnterior.pagosTarjetas +
    resumenAnterior.cuotasPrestamos +
    resumenAnterior.cuotasPopular +
    resumenAnterior.gastosFijos;
  const etiquetaVariacion = `vs ${quincenaAnterior.etiqueta.split("·")[0]?.trim() ?? "anterior"}`;
  const proximosPagos = obtenerProximosPagos(
    tarjetas,
    prestamos,
    cuotasPopular,
    gastosFijos
  );
  const categoriasMes = gastosPorCategoria(transacciones, mesActual());
  const evolucion = evolucionMensual(transacciones, 6);

  const patrimonioLiquido = (() => {
    const mapa = totalCuentasPorMoneda(cuentas);
    const totalCuentas = mapa.get(configuracion.moneda) ?? 0;
    const deudaTarjetas = tarjetas
      .filter((t) => t.moneda === configuracion.moneda)
      .reduce((sum, t) => sum + t.deudaActual, 0);
    return totalCuentas + efectivo - deudaTarjetas;
  })();

  return (
    <AyudaPagina pagina="dashboard">
      <PageContainer>
        <EncabezadoPagina
          titulo="Dashboard"
          descripcion={`Quincena actual: ${quincenaActual.etiqueta} · Pagos los días ${configuracion.diasPago.join(" y ")} · Quincenas del 1–15 y 16–fin de mes`}
        />

      <section
        data-ayuda="resumen"
        className="grid gap-4 sm:gap-6 lg:grid-cols-2 lg:items-stretch xl:grid-cols-[1.05fr_1fr]"
      >
        <GraficoResumenQuincena
          ingresos={resumenActual.ingresosTotales}
          gastos={resumenActual.gastosTotales}
          compromisos={compromisosActual}
          disponible={resumenActual.disponible}
          moneda={configuracion.moneda}
          etiquetaQuincena={quincenaActual.etiqueta}
          className="min-w-0 h-full"
        />

        <div className="grid min-w-0 auto-rows-fr gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-2 lg:content-stretch">
          <StatCard
            titulo="Disponible"
            valor={resumenActual.disponible}
            moneda={configuracion.moneda}
            variante="disponible"
            subtitulo="Lo que te queda en la quincena actual"
            variacion={{
              diferencia: resumenActual.disponible - resumenAnterior.disponible,
              moneda: configuracion.moneda,
              etiqueta: etiquetaVariacion,
            }}
          />
          <StatCard
            titulo="Ingresos"
            valor={resumenActual.ingresosTotales}
            moneda={configuracion.moneda}
            variante="ingreso"
            subtitulo="Quincena actual"
            variacion={{
              diferencia: resumenActual.ingresosTotales - resumenAnterior.ingresosTotales,
              moneda: configuracion.moneda,
              etiqueta: etiquetaVariacion,
            }}
          />
          <StatCard
            titulo="Gastos"
            valor={resumenActual.gastosTotales}
            moneda={configuracion.moneda}
            variante="gasto"
            subtitulo="Gastos variables registrados"
            variacion={{
              diferencia: resumenActual.gastosTotales - resumenAnterior.gastosTotales,
              moneda: configuracion.moneda,
              invertirColor: true,
              etiqueta: etiquetaVariacion,
            }}
          />
          <StatCard
            titulo="Compromisos"
            valor={compromisosActual}
            moneda={configuracion.moneda}
            variante="gasto"
            subtitulo="Tarjetas, préstamos, cuotas y fijos"
            variacion={{
              diferencia: compromisosActual - compromisosAnterior,
              moneda: configuracion.moneda,
              invertirColor: true,
              etiqueta: etiquetaVariacion,
            }}
          />
          <StatCard
            titulo="Patrimonio líquido"
            valor={patrimonioLiquido}
            moneda={configuracion.moneda}
            variante="balance"
            subtitulo="Cuentas + efectivo − deuda tarjetas"
            className="sm:col-span-2"
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div
          data-ayuda="quincenas"
          className="rounded-xl border border-border bg-surface p-6 shadow-sm"
        >
          <h2 className="text-base font-semibold text-foreground">
            Resumen del mes
          </h2>
          <p className="mt-1 text-xs text-muted">
            Ambas quincenas según tus días de pago
          </p>

          <div className="mt-5 space-y-4">
            {[q1, q2].map((q) => {
              const resumen = calcularResumenQuincena(
                transacciones,
                tarjetas,
                prestamos,
                cuotasPopular,
                gastosFijos,
                q,
                configuracion.moneda
              );
              return (
                <div
                  key={q.etiqueta}
                  className="rounded-lg border border-border bg-background p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {q.etiqueta}
                    </p>
                    <p
                      className={`text-sm font-bold ${
                        resumen.disponible >= 0
                          ? "text-ingreso"
                          : "text-gasto"
                      }`}
                    >
                      {formatearMoneda(resumen.disponible, configuracion.moneda)}
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted">
                    <div>
                      <p>Ingresos</p>
                      <p className="font-medium text-ingreso">
                        {formatearMoneda(
                          resumen.ingresosTotales,
                          configuracion.moneda
                        )}
                      </p>
                    </div>
                    <div>
                      <p>Gastos</p>
                      <p className="font-medium text-gasto">
                        {formatearMoneda(
                          resumen.gastosTotales,
                          configuracion.moneda
                        )}
                      </p>
                    </div>
                    <div>
                      <p>Compromisos</p>
                      <p className="font-medium text-foreground">
                        {formatearMoneda(
                          resumen.pagosTarjetas +
                            resumen.cuotasPrestamos +
                            resumen.cuotasPopular +
                            resumen.gastosFijos,
                          configuracion.moneda
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          data-ayuda="proximos-pagos"
          className="rounded-xl border border-border bg-surface p-6 shadow-sm"
        >
          <h2 className="text-base font-semibold text-foreground">
            Próximos pagos
          </h2>
          <p className="mt-1 text-xs text-muted">
            Compromisos mensuales y recurrentes
          </p>

          {proximosPagos.length === 0 ? (
            <div className="mt-6">
              <EstadoVacio
                titulo="No hay pagos registrados aún"
                descripcion="Agrega tarjetas, préstamos o gastos fijos para ver tus próximos compromisos."
                className="border-0 bg-transparent py-8"
              />
              <div className="flex flex-wrap justify-center gap-3 text-sm">
                <Link
                  href="/tarjetas"
                  className="font-medium text-accent hover:underline"
                >
                  Ir a Tarjetas
                </Link>
                <Link
                  href="/prestamos"
                  className="font-medium text-accent hover:underline"
                >
                  Ir a Préstamos
                </Link>
                <Link
                  href="/gastos-fijos"
                  className="font-medium text-accent hover:underline"
                >
                  Ir a Gastos fijos
                </Link>
              </div>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {proximosPagos.slice(0, 5).map((pago) => (
                <li
                  key={`${pago.tipo}-${pago.nombre}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {pago.nombre}
                    </p>
                    <p className="text-xs text-muted">
                      {pago.tipo === "tarjeta"
                        ? "Tarjeta"
                        : pago.tipo === "prestamo"
                          ? "Préstamo"
                          : pago.tipo === "cuota-popular"
                            ? "Cuota Popular"
                            : "Gasto fijo"}{" "}
                      · día {pago.dia}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gasto">
                    {formatearMoneda(pago.monto, configuracion.moneda)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section data-ayuda="graficos" className="grid gap-6 lg:grid-cols-2">
        <GraficoCategorias
          datos={categoriasMes}
          moneda={configuracion.moneda}
          titulo="Gastos por categoría (mes actual)"
        />
        <GraficoEvolucion datos={evolucion} moneda={configuracion.moneda} />
      </section>
    </PageContainer>
    </AyudaPagina>
  );
}
