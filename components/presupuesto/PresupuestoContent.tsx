"use client";

import { useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import {
  calcularProyeccionProximoIngreso,
  generarSugerencias,
} from "@/lib/presupuesto";
import { formatearFecha } from "@/lib/fechas";
import { formatearMoneda } from "@/lib/quincenas";
import { PageContainer } from "@/components/layout/PageContainer";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { AyudaPagina } from "@/components/ayuda/AyudaPagina";
import { StatCard } from "@/components/ui/StatCard";
import { ListaSugerencias } from "@/components/presupuesto/ListaSugerencias";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

export function PresupuestoContent() {
  const {
    transacciones,
    tarjetas,
    prestamos,
    cuotasPopular,
    gastosFijos,
    cuentas,
    efectivo,
    configuracion,
    cargado,
  } = useFinanzas();

  const [ingresoManual, setIngresoManual] = useState("");
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  const hayCambios = ingresoManual.trim() !== "" || mostrarSugerencias;

  function limpiarPresupuesto() {
    setIngresoManual("");
    setMostrarSugerencias(false);
  }

  const ingresoOverride = useMemo(() => {
    const n = parseFloat(ingresoManual);
    return ingresoManual.trim() && !isNaN(n) && n > 0 ? n : null;
  }, [ingresoManual]);

  const proyeccion = useMemo(() => {
    if (!cargado) return null;
    return calcularProyeccionProximoIngreso(
      transacciones,
      tarjetas,
      prestamos,
      cuotasPopular,
      gastosFijos,
      cuentas,
      efectivo,
      configuracion,
      ingresoOverride
    );
  }, [
    cargado,
    transacciones,
    tarjetas,
    prestamos,
    cuotasPopular,
    gastosFijos,
    cuentas,
    efectivo,
    configuracion,
    ingresoOverride,
  ]);

  const sugerencias = useMemo(() => {
    if (!cargado || !mostrarSugerencias) return null;
    return generarSugerencias(
      tarjetas,
      prestamos,
      cuotasPopular,
      gastosFijos,
      transacciones,
      cuentas,
      efectivo,
      configuracion,
      ingresoOverride
    );
  }, [
    cargado,
    mostrarSugerencias,
    tarjetas,
    prestamos,
    cuotasPopular,
    gastosFijos,
    transacciones,
    cuentas,
    efectivo,
    configuracion,
    ingresoOverride,
  ]);

  if (!cargado || !proyeccion) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted">Cargando...</p>
      </div>
    );
  }

  const { moneda, periodo } = proyeccion;

  return (
    <AyudaPagina pagina="presupuesto">
      <PageContainer>
        <EncabezadoPagina
          titulo="Presupuesto"
          descripcion={`Proyección para tu próximo ingreso · ${periodo.etiqueta} (${formatearFecha(periodo.inicio)} — ${formatearFecha(periodo.fin)})`}
          acciones={
            <>
              <button
                type="button"
                onClick={() => setMostrarSugerencias(true)}
                className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover sm:w-auto"
              >
                ✦ Sugerir qué pagar
              </button>
              {hayCambios && (
                <button
                  type="button"
                  onClick={limpiarPresupuesto}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground sm:w-auto"
                >
                  Limpiar
                </button>
              )}
            </>
          }
        />

      <section
        data-ayuda="proyeccion"
        className="rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6"
      >
        <h2 className="text-base font-semibold text-foreground">
          Próximo ingreso esperado
        </h2>
        <p className="mt-1 text-xs text-muted">
          Ajusta el monto si conoces tu próximo salario; si no, usamos el
          promedio de quincenas anteriores.
        </p>
        <label className="mt-4 flex max-w-xs flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            Ingreso estimado ({moneda})
          </span>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={ingresoManual}
              onChange={(e) => setIngresoManual(e.target.value)}
              placeholder={String(proyeccion.ingresoEstimado)}
              className={`${inputClass} min-w-0 flex-1`}
            />
            {ingresoManual.trim() !== "" && (
              <button
                type="button"
                onClick={() => setIngresoManual("")}
                className="shrink-0 rounded-lg border border-border px-3 text-xs font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                title="Usar promedio histórico"
              >
                ✕
              </button>
            )}
          </div>
          {!ingresoOverride && proyeccion.ingresoEstimado > 0 && (
            <span className="text-xs text-muted">
              Promedio histórico:{" "}
              {formatearMoneda(proyeccion.ingresoEstimado, moneda)}
            </span>
          )}
        </label>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titulo="Liquidez actual"
          valor={proyeccion.liquidezActual}
          moneda={moneda}
          subtitulo="Cuentas + efectivo"
        />
        <StatCard
          titulo="Ingreso proyectado"
          valor={ingresoOverride ?? proyeccion.ingresoEstimado}
          moneda={moneda}
          variante="ingreso"
          subtitulo="Próxima quincena"
        />
        <StatCard
          titulo="Compromisos"
          valor={proyeccion.compromisos}
          moneda={moneda}
          variante="gasto"
          subtitulo="Tarjetas, préstamos, cuotas y fijos"
        />
        <StatCard
          titulo="Disponible proyectado"
          valor={proyeccion.disponibleProyectado}
          moneda={moneda}
          variante="disponible"
          subtitulo="Tras reserva, compromisos y gastos variables"
        />
      </section>

      <section className="rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-foreground">
          Desglose de la proyección
        </h2>
        <div className="mt-4 space-y-3">
          {[
            {
              label: "Liquidez actual",
              valor: proyeccion.liquidezActual,
              signo: "+",
            },
            {
              label: "Ingreso proyectado",
              valor: ingresoOverride ?? proyeccion.ingresoEstimado,
              signo: "+",
            },
            {
              label: "Reserva sugerida (10%)",
              valor: -proyeccion.reservaSugerida,
              signo: "−",
            },
            {
              label: "Compromisos de la quincena",
              valor: -proyeccion.compromisos,
              signo: "−",
            },
            {
              label: "Gastos variables estimados",
              valor: -proyeccion.gastosVariablesEstimados,
              signo: "−",
            },
          ].map((fila) => (
            <div
              key={fila.label}
              className="flex items-center justify-between border-b border-border pb-3 text-sm last:border-0 last:pb-0"
            >
              <span className="text-muted">{fila.label}</span>
              <span
                className={`font-semibold ${
                  fila.valor < 0 ? "text-gasto" : "text-foreground"
                }`}
              >
                {fila.signo}
                {formatearMoneda(Math.abs(fila.valor), moneda)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-lg bg-background px-4 py-3">
            <span className="text-sm font-medium text-foreground">
              Te quedaría
            </span>
            <span
              className={`text-lg font-bold ${
                proyeccion.disponibleProyectado >= 0
                  ? "text-ingreso"
                  : "text-gasto"
              }`}
            >
              {formatearMoneda(proyeccion.disponibleProyectado, moneda)}
            </span>
          </div>
        </div>
      </section>

      {mostrarSugerencias && sugerencias && (
        <section
          data-ayuda="sugerencias"
          className="rounded-xl border border-accent/30 bg-surface p-4 shadow-sm ring-1 ring-accent/10 sm:p-6"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Sugerencias inteligentes
              </h2>
              <p className="mt-1 text-sm text-muted">{sugerencias.resumen}</p>
            </div>
            <div className="text-right text-xs text-muted">
              <p>
                Presupuesto asignable:{" "}
                <span className="font-semibold text-foreground">
                  {formatearMoneda(sugerencias.presupuestoAsignable, moneda)}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-ingreso/30 bg-ingreso/5 px-4 py-3 text-center">
              <p className="text-xs text-muted">Pagar</p>
              <p className="text-lg font-bold text-ingreso">
                {formatearMoneda(sugerencias.totalPagar, moneda)}
              </p>
            </div>
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-center">
              <p className="text-xs text-muted">Posponer</p>
              <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                {formatearMoneda(sugerencias.totalPosponer, moneda)}
              </p>
            </div>
            <div className="rounded-lg border border-gasto/30 bg-gasto/5 px-4 py-3 text-center">
              <p className="text-xs text-muted">Evitar</p>
              <p className="text-lg font-bold text-gasto">
                {formatearMoneda(sugerencias.totalEvitar, moneda)}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <ListaSugerencias items={sugerencias.items} moneda={moneda} />
          </div>

          <p className="mt-6 text-xs text-muted">
            Las sugerencias consideran tu liquidez, el ingreso proyectado, la
            urgencia de cada pago y la marca esencial/flexible de cada gasto fijo. La
            reserva sugerida protege un colchón mínimo antes de asignar pagos.
          </p>

          <div className="mt-6 flex justify-end border-t border-border pt-4">
            <button
              type="button"
              onClick={limpiarPresupuesto}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
            >
              Limpiar presupuesto
            </button>
          </div>
        </section>
      )}
    </PageContainer>
    </AyudaPagina>
  );
}
