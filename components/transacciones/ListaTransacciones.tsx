"use client";

import { useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import {
  type Transaccion,
} from "@/types/finanzas";
import { formatearFecha, mesActual, opcionesMeses } from "@/lib/fechas";
import { formatearMoneda } from "@/lib/quincenas";
import { totalesTransaccionesEnMoneda } from "@/lib/cambio";
import { confirmarEliminacion } from "@/lib/confirmar";
import { etiquetaOrigen, etiquetaTransferencia } from "@/lib/transacciones";
import { EstadoVacio } from "@/components/ui/EstadoVacio";

const selectClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

interface ListaTransaccionesProps {
  transacciones: Transaccion[];
  onEditar?: (transaccion: Transaccion) => void;
  onNueva?: () => void;
}

export function ListaTransacciones({
  transacciones,
  onEditar,
  onNueva,
}: ListaTransaccionesProps) {
  const { eliminarTransaccion, configuracion, cuentas, tarjetas, gastosFijos } =
    useFinanzas();
  const [mesFiltro, setMesFiltro] = useState(mesActual());
  const [quincenaFiltro, setQuincenaFiltro] = useState<"todas" | "1" | "2">(
    "todas"
  );
  const [tipoFiltro, setTipoFiltro] = useState<
    "todos" | "ingreso" | "gasto" | "transferencia"
  >("todos");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");

  const categoriasDisponibles = useMemo(() => {
    const cats = new Set(transacciones.map((t) => t.categoria));
    return Array.from(cats).sort();
  }, [transacciones]);

  const filtradas = useMemo(() => {
    return transacciones
      .filter((t) => t.fecha.startsWith(mesFiltro))
      .filter((t) =>
        quincenaFiltro === "todas" ? true : t.quincena === Number(quincenaFiltro)
      )
      .filter((t) => (tipoFiltro === "todos" ? true : t.tipo === tipoFiltro))
      .filter((t) =>
        categoriaFiltro === "todas" ? true : t.categoria === categoriaFiltro
      )
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [transacciones, mesFiltro, quincenaFiltro, tipoFiltro, categoriaFiltro]);

  const totales = useMemo(
    () => totalesTransaccionesEnMoneda(filtradas, configuracion.moneda),
    [filtradas, configuracion.moneda]
  );

  return (
    <div className="rounded-xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border p-4 sm:p-6">
        <h2 className="text-base font-semibold text-foreground">
          Historial
        </h2>
        <p className="mt-1 text-xs text-muted">
          {filtradas.length} transacción{filtradas.length !== 1 ? "es" : ""}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Mes</span>
            <select
              value={mesFiltro}
              onChange={(e) => setMesFiltro(e.target.value)}
              className={selectClass}
            >
              {opcionesMeses().map((op) => (
                <option key={op.valor} value={op.valor}>
                  {op.etiqueta}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Quincena</span>
            <select
              value={quincenaFiltro}
              onChange={(e) =>
                setQuincenaFiltro(e.target.value as "todas" | "1" | "2")
              }
              className={selectClass}
            >
              <option value="todas">Todas</option>
              <option value="1">Q1</option>
              <option value="2">Q2</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Tipo</span>
            <select
              value={tipoFiltro}
              onChange={(e) =>
                setTipoFiltro(
                  e.target.value as "todos" | "ingreso" | "gasto" | "transferencia"
                )
              }
              className={selectClass}
            >
              <option value="todos">Todos</option>
              <option value="ingreso">Ingresos</option>
              <option value="gasto">Gastos</option>
              <option value="transferencia">Movimientos</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Categoría</span>
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className={selectClass}
            >
              <option value="todas">Todas</option>
              {categoriasDisponibles.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filtradas.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <span className="text-muted">
              Ingresos:{" "}
              <span className="font-semibold text-ingreso">
                {formatearMoneda(totales.ingresos, configuracion.moneda)}
              </span>
            </span>
            <span className="text-muted">
              Gastos:{" "}
              <span className="font-semibold text-gasto">
                {formatearMoneda(totales.gastos, configuracion.moneda)}
              </span>
            </span>
            <span className="text-muted">
              Movimientos:{" "}
              <span className="font-semibold text-accent">
                {formatearMoneda(totales.movimientos, configuracion.moneda)}
              </span>
            </span>
            <span className="text-muted">
              Balance:{" "}
              <span
                className={`font-semibold ${
                  totales.balance >= 0 ? "text-ingreso" : "text-gasto"
                }`}
              >
                {formatearMoneda(totales.balance, configuracion.moneda)}
              </span>
            </span>
          </div>
        )}
      </div>

      {filtradas.length === 0 ? (
        <EstadoVacio
          titulo={
            transacciones.length === 0
              ? "Aún no hay transacciones"
              : "No hay transacciones con estos filtros"
          }
          descripcion={
            transacciones.length === 0
              ? "Registra tu primer ingreso, gasto o movimiento entre cuentas."
              : "Prueba otro mes o quita algún filtro."
          }
          accionEtiqueta={
            transacciones.length === 0 ? "+ Nueva transacción" : undefined
          }
          onAccion={transacciones.length === 0 ? onNueva : undefined}
          className="m-4 border-0 bg-transparent"
        />
      ) : (
        <ul className="divide-y divide-border">
          {filtradas.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-surface-hover"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  t.tipo === "ingreso"
                    ? "bg-ingreso/10 text-ingreso"
                    : t.tipo === "gasto"
                      ? "bg-gasto/10 text-gasto"
                      : "bg-accent/10 text-accent"
                }`}
              >
                {t.tipo === "ingreso" ? "+" : t.tipo === "gasto" ? "−" : "⇄"}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {t.descripcion}
                  </p>
                  <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-xs text-muted">
                    {t.categoria}
                  </span>
                  {t.gastoFijoId && (
                    <span className="shrink-0 rounded-full bg-ingreso/10 px-2 py-0.5 text-xs font-medium text-ingreso">
                      Gasto fijo
                    </span>
                  )}
                  {t.moneda !== configuracion.moneda && (
                    <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      {t.moneda}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {formatearFecha(t.fecha)} · Q{t.quincena}
                  {t.gastoFijoId && (
                    <>
                      {" · "}
                      {gastosFijos.find((g) => g.id === t.gastoFijoId)?.nombre ??
                        "Gasto fijo"}
                    </>
                  )}
                  {t.tipo === "transferencia" && t.origen && t.destino ? (
                    <>
                      {" · "}
                      {etiquetaTransferencia(t.origen, t.destino, cuentas, tarjetas)}
                      {t.tasaCambio && t.monedaOrigen && t.montoOrigen && (
                        <>
                          {" · "}
                          {formatearMoneda(t.montoOrigen, t.monedaOrigen)} @{" "}
                          {t.tasaCambio} {t.monedaOrigen}/{t.moneda}
                        </>
                      )}
                    </>
                  ) : (
                    t.origen && (
                      <>
                        {" · "}
                        {etiquetaOrigen(t.origen, cuentas, tarjetas, t.modoPagoTarjeta)}
                      </>
                    )
                  )}
                </p>
              </div>

              <p
                className={`shrink-0 text-sm font-semibold ${
                  t.tipo === "ingreso"
                    ? "text-ingreso"
                    : t.tipo === "gasto"
                      ? "text-gasto"
                      : "text-accent"
                }`}
              >
                {t.tipo === "transferencia"
                  ? `−${formatearMoneda(
                      t.montoOrigen != null && t.monedaOrigen
                        ? t.montoOrigen
                        : t.monto,
                      t.monedaOrigen ?? t.moneda
                    )}`
                  : `${t.tipo === "ingreso" ? "+" : "−"}${formatearMoneda(t.monto, t.moneda)}`}
              </p>

              <div className="flex shrink-0 items-center gap-1">
                {onEditar && !t.cuotaPopularId && (
                  <button
                    type="button"
                    onClick={() => onEditar(t)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
                    title="Editar"
                  >
                    Editar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!confirmarEliminacion(t.descripcion, "la transacción")) {
                      return;
                    }
                    eliminarTransaccion(t.id);
                  }}
                  className="rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-gasto/10 hover:text-gasto"
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
