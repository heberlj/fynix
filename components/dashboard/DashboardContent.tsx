"use client";

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
import { StatCard } from "@/components/ui/StatCard";
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
    quincenaActual
  );
  const resumenAnterior = calcularResumenQuincena(
    transacciones,
    tarjetas,
    prestamos,
    cuotasPopular,
    gastosFijos,
    quincenaAnterior
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
    <PageContainer>
      <header>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Quincena actual:{" "}
          <span className="font-medium text-foreground">
            {quincenaActual.etiqueta}
          </span>
          {" · "}
          Pagos los días{" "}
          <span className="font-medium text-foreground">
            {configuracion.diasPago.join(" y ")}
          </span>
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          titulo="Patrimonio líquido"
          valor={patrimonioLiquido}
          moneda={configuracion.moneda}
          variante="balance"
          subtitulo="Cuentas + efectivo − deuda tarjetas"
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
          subtitulo="Quincena actual"
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
          titulo="Disponible"
          valor={resumenActual.disponible}
          moneda={configuracion.moneda}
          variante="disponible"
          subtitulo="Lo que te queda"
          variacion={{
            diferencia: resumenActual.disponible - resumenAnterior.disponible,
            moneda: configuracion.moneda,
            etiqueta: etiquetaVariacion,
          }}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
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
                q
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

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">
            Próximos pagos
          </h2>
          <p className="mt-1 text-xs text-muted">
            Compromisos mensuales y recurrentes
          </p>

          {proximosPagos.length === 0 ? (
            <div className="mt-8 flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted">
                No hay pagos registrados aún
              </p>
              <p className="mt-1 text-xs text-muted">
                Agrega tarjetas o préstamos en las próximas partes
              </p>
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

      <section className="grid gap-6 lg:grid-cols-2">
        <GraficoCategorias
          datos={categoriasMes}
          moneda={configuracion.moneda}
          titulo="Gastos por categoría (mes actual)"
        />
        <GraficoEvolucion datos={evolucion} moneda={configuracion.moneda} />
      </section>
    </PageContainer>
  );
}
