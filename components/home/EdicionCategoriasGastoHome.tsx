"use client";

import { useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { confirmarAccion } from "@/lib/confirmar";
import {
  colorCategoriaGasto,
  iconoCategoriaGasto,
  obtenerCategoriasGasto,
} from "@/lib/categorias-transacciones";
import type { IconoCategoriaId } from "@/lib/iconos-categoria";
import { IconoCategoria } from "@/components/ui/IconoCategoria";
import { SelectorIconoCategoria } from "@/components/ui/SelectorIconoCategoria";
import { SelectorPaletaColor } from "@/components/ui/SelectorPaletaColor";

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
    actualizarIconoCategoriaGasto,
  } = useFinanzas();

  const categorias = obtenerCategoriasGasto(configuracion);
  const [nueva, setNueva] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState("");
  const [iconoEditado, setIconoEditado] = useState<IconoCategoriaId>("otros");
  const [colorEditado, setColorEditado] = useState("#2563eb");
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

  function iniciarEdicion(categoria: string, indice: number) {
    setEditando(categoria);
    setNombreEditado(categoria);
    setIconoEditado(iconoCategoriaGasto(configuracion, categoria));
    setColorEditado(colorCategoriaGasto(configuracion, categoria, indice));
    setError("");
  }

  function cancelarEdicion() {
    setEditando(null);
    setNombreEditado("");
    setIconoEditado("otros");
    setColorEditado("#2563eb");
    setError("");
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
    if (limpio !== anterior) {
      renombrarCategoriaGasto(anterior, limpio);
    }
    actualizarIconoCategoriaGasto(limpio, iconoEditado);
    actualizarColorCategoriaGasto(limpio, colorEditado);
    cancelarEdicion();
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
    if (editando === nombre) cancelarEdicion();
  }

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-xs text-muted">
        Cambia el nombre, el icono y el color de cada categoría. Los cambios se
        reflejan en transacciones y gráficos.
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

      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {categorias.map((cat, indice) => {
          const enEdicion = editando === cat;
          const uso = contarUso(cat);
          const color = colorCategoriaGasto(configuracion, cat, indice);
          const icono = iconoCategoriaGasto(configuracion, cat);

          return (
            <li
              key={cat}
              className={`rounded-lg border border-border bg-surface ${
                enEdicion ? "col-span-full p-3" : "p-2.5"
              }`}
            >
              {enEdicion ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
                        onClick={cancelarEdicion}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface-hover"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium text-muted">Icono</p>
                    <SelectorIconoCategoria
                      valor={iconoEditado}
                      onChange={setIconoEditado}
                    />
                  </div>

                  <SelectorPaletaColor
                    valor={colorEditado}
                    onChange={setColorEditado}
                  />
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border"
                    style={{ backgroundColor: `${color}22`, color }}
                  >
                    <IconoCategoria icono={icono} className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {cat}
                    </p>
                    {uso > 0 && (
                      <p className="text-[10px] text-muted">{uso} mov.</p>
                    )}
                    <div className="mt-1.5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => iniciarEdicion(cat, indice)}
                        className="text-[11px] font-medium text-accent hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminar(cat)}
                        className="text-[11px] text-muted hover:text-gasto hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
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
