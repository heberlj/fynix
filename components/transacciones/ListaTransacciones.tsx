"use client";

import { useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import {
  type Transaccion,
} from "@/types/finanzas";
import { formatearFecha, mesActual, opcionesMeses } from "@/lib/fechas";
import { formatearMoneda } from "@/lib/quincenas";
import { etiquetaOrigen } from "@/lib/transacciones";

const selectClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

interface ListaTransaccionesProps {
  transacciones: Transaccion[];
}

export function ListaTransacciones({ transacciones }: ListaTransaccionesProps) {
  const { eliminarTransaccion, configuracion, cuentas, tarjetas } = useFinanzas();
  const [mesFiltro, setMesFiltro] = useState(mesActual());
  const [quincenaFiltro, setQuincenaFiltro] = useState<"todas" | "1" | "2">(
    "todas"
  );
  const [tipoFiltro, setTipoFiltro] = useState<"todos" | "ingreso" | "gasto">(
    "todos"
  );
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

  const totales = useMemo(() => {
    let ingresos = 0;
    let gastos = 0;
    filtradas.forEach((t) => {
      if (t.tipo === "ingreso") ingresos += t.monto;
      else gastos += t.monto;
    });
    return { ingresos, gastos, balance: ingresos - gastos };
  }, [filtradas]);

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
                setTipoFiltro(e.target.value as "todos" | "ingreso" | "gasto")
              }
              className={selectClass}
            >
              <option value="todos">Todos</option>
              <option value="ingreso">Ingresos</option>
              <option value="gasto">Gastos</option>
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
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-sm text-muted">No hay transacciones con estos filtros</p>
          <p className="mt-1 text-xs text-muted">
            Registra un gasto o ingreso usando el formulario
          </p>
        </div>
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
                    : "bg-gasto/10 text-gasto"
                }`}
              >
                {t.tipo === "ingreso" ? "+" : "−"}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {t.descripcion}
                  </p>
                  <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-xs text-muted">
                    {t.categoria}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {formatearFecha(t.fecha)} · Q{t.quincena}
                  {t.origen && (
                    <>
                      {" · "}
                      {etiquetaOrigen(t.origen, cuentas, tarjetas, t.modoPagoTarjeta)}
                    </>
                  )}
                </p>
              </div>

              <p
                className={`shrink-0 text-sm font-semibold ${
                  t.tipo === "ingreso" ? "text-ingreso" : "text-gasto"
                }`}
              >
                {t.tipo === "ingreso" ? "+" : "−"}
                {formatearMoneda(t.monto, configuracion.moneda)}
              </p>

              <button
                type="button"
                onClick={() => eliminarTransaccion(t.id)}
                className="shrink-0 rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-gasto/10 hover:text-gasto"
                title="Eliminar"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
