"use client";

import { useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { confirmarAccion } from "@/lib/confirmar";
import {
  colorCategoriaGasto,
  obtenerCategoriasGasto,
} from "@/lib/categorias-transacciones";
import { PALETA_COLORES_CATEGORIA } from "@/lib/graficos";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

export function EdicionCategoriasGastoHome() {
  const {
    configuracion,
    transacciones,
    agregarCategoriaGasto,
    renombrarCategoriaGasto,
    eliminarCategoriaGasto,
    actualizarColorCategoriaGasto,
  } = useFinanzas();

  const categorias = obtenerCategoriasGasto(configuracion);
  const [nueva, setNueva] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState("");
  const [error, setError] = useState("");

  function contarUso(nombre: string) {
    return transacciones.filter(
      (t) => t.tipo === "gasto" && t.categoria === nombre
    ).length;
  }

  function handleAgregar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const limpio = nueva.trim();
    if (!limpio) {
      setError("Escribe un nombre para la categoría");
      return;
    }
    if (categorias.some((c) => c.toLowerCase() === limpio.toLowerCase())) {
      setError("Ya existe una categoría con ese nombre");
      return;
    }
    agregarCategoriaGasto(limpio);
    setNueva("");
  }

  function guardarEdicion(anterior: string) {
    setError("");
    const limpio = nombreEditado.trim();
    if (!limpio) {
      setError("El nombre no puede estar vacío");
      return;
    }
    if (
      limpio.toLowerCase() !== anterior.toLowerCase() &&
      categorias.some((c) => c.toLowerCase() === limpio.toLowerCase())
    ) {
      setError("Ya existe una categoría con ese nombre");
      return;
    }
    renombrarCategoriaGasto(anterior, limpio);
    setEditando(null);
    setNombreEditado("");
  }

  function eliminar(nombre: string) {
    if (categorias.length <= 1) {
      setError("Debe quedar al menos una categoría");
      return;
    }
    const uso = contarUso(nombre);
    const msg =
      uso > 0
        ? `¿Eliminar "${nombre}"? ${uso} gasto(s) se moverán a otra categoría.`
        : `¿Eliminar la categoría "${nombre}"?`;
    if (!confirmarAccion(msg)) return;
    eliminarCategoriaGasto(nombre);
    if (editando === nombre) setEditando(null);
  }

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-xs text-muted">
        Cambia el nombre y el color de cada categoría. Los colores se reflejan en
        el gráfico.
      </p>

      <form onSubmit={handleAgregar} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          placeholder="Nueva categoría..."
          className={`${inputClass} flex-1`}
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Añadir
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-gasto">{error}</p>}

      <ul className="mt-4 divide-y divide-border">
        {categorias.map((cat, indice) => {
          const enEdicion = editando === cat;
          const uso = contarUso(cat);
          const color = colorCategoriaGasto(configuracion, cat, indice);

          return (
            <li
              key={cat}
              className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <label className="relative shrink-0 cursor-pointer">
                  <span
                    className="block h-9 w-9 rounded-full border-2 border-border shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                  <input
                    type="color"
                    value={color}
                    onChange={(e) =>
                      actualizarColorCategoriaGasto(cat, e.target.value)
                    }
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    aria-label={`Color de ${cat}`}
                  />
                </label>

                <div className="flex flex-wrap gap-1.5">
                  {PALETA_COLORES_CATEGORIA.map((tono) => (
                    <button
                      key={tono}
                      type="button"
                      onClick={() => actualizarColorCategoriaGasto(cat, tono)}
                      className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                        color === tono ? "border-foreground" : "border-transparent"
                      }`}
                      style={{ backgroundColor: tono }}
                      aria-label={`Usar color ${tono}`}
                    />
                  ))}
                </div>
              </div>

              {enEdicion ? (
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={nombreEditado}
                    onChange={(e) => setNombreEditado(e.target.value)}
                    className={`${inputClass} flex-1`}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => guardarEdicion(cat)}
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditando(null);
                        setNombreEditado("");
                        setError("");
                      }}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface-hover"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{cat}</p>
                    {uso > 0 && (
                      <p className="text-xs text-muted">
                        {uso} transacción{uso !== 1 ? "es" : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditando(cat);
                        setNombreEditado(cat);
                        setError("");
                      }}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10"
                    >
                      Renombrar
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminar(cat)}
                      className="rounded-lg px-2 py-1 text-xs text-muted hover:bg-gasto/10 hover:text-gasto"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
