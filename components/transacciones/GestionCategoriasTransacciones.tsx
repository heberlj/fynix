"use client";

import { useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { confirmarAccion } from "@/lib/confirmar";
import {
  colorCategoriaGasto,
  iconoCategoriaGasto,
  obtenerCategoriasGasto,
  obtenerCategoriasIngreso,
} from "@/lib/categorias-transacciones";
import type { IconoCategoriaId } from "@/lib/iconos-categoria";
import { IconoCategoria } from "@/components/ui/IconoCategoria";
import { SelectorIconoCategoria } from "@/components/ui/SelectorIconoCategoria";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

interface GestionCategoriasTransaccionesProps {
  onCerrar: () => void;
}

export function GestionCategoriasTransacciones({
  onCerrar,
}: GestionCategoriasTransaccionesProps) {
  const {
    configuracion,
    transacciones,
    agregarCategoriaGasto,
    renombrarCategoriaGasto,
    eliminarCategoriaGasto,
    agregarCategoriaIngreso,
    renombrarCategoriaIngreso,
    eliminarCategoriaIngreso,
    actualizarIconoCategoriaGasto,
  } = useFinanzas();

  const [tipo, setTipo] = useState<"gasto" | "ingreso">("gasto");
  const [nueva, setNueva] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState("");
  const [iconoEditado, setIconoEditado] = useState<IconoCategoriaId>("otros");
  const [error, setError] = useState("");

  const categorias =
    tipo === "gasto"
      ? obtenerCategoriasGasto(configuracion)
      : obtenerCategoriasIngreso(configuracion);

  function contarUso(nombre: string) {
    return transacciones.filter(
      (t) => t.tipo === tipo && t.categoria === nombre
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
    if (tipo === "gasto") {
      agregarCategoriaGasto(limpio);
    } else {
      agregarCategoriaIngreso(limpio);
    }
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
    if (tipo === "gasto") {
      if (limpio !== anterior) {
        renombrarCategoriaGasto(anterior, limpio);
      }
      actualizarIconoCategoriaGasto(limpio, iconoEditado);
    } else {
      renombrarCategoriaIngreso(anterior, limpio);
    }
    setEditando(null);
    setNombreEditado("");
    setIconoEditado("otros");
  }

  function eliminar(nombre: string) {
    if (categorias.length <= 1) {
      setError("Debe quedar al menos una categoría");
      return;
    }
    const uso = contarUso(nombre);
    const etiquetaTipo = tipo === "gasto" ? "gasto" : "ingreso";
    const msg =
      uso > 0
        ? `¿Eliminar "${nombre}"? ${uso} ${etiquetaTipo}(s) se moverán a otra categoría.`
        : `¿Eliminar la categoría "${nombre}"?`;
    if (!confirmarAccion(msg)) return;
    if (tipo === "gasto") {
      eliminarCategoriaGasto(nombre);
    } else {
      eliminarCategoriaIngreso(nombre);
    }
    if (editando === nombre) setEditando(null);
  }

  function cambiarTipo(nuevoTipo: "gasto" | "ingreso") {
    setTipo(nuevoTipo);
    setEditando(null);
    setNombreEditado("");
    setIconoEditado("otros");
    setNueva("");
    setError("");
  }

  function cerrar() {
    setEditando(null);
    setNombreEditado("");
    setIconoEditado("otros");
    setNueva("");
    setError("");
    onCerrar();
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Categorías</h2>
          <p className="mt-1 text-xs text-muted">
            Personaliza las categorías para clasificar tus gastos e ingresos
          </p>
        </div>
        <button
          type="button"
          onClick={cerrar}
          className="shrink-0 text-sm text-muted transition-colors hover:text-foreground"
        >
          Cerrar
        </button>
      </div>

      <div className="mt-4 flex rounded-lg border border-border p-1">
        <button
          type="button"
          onClick={() => cambiarTipo("gasto")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            tipo === "gasto"
              ? "bg-gasto text-white"
              : "text-muted hover:text-foreground"
          }`}
        >
          Gastos
        </button>
        <button
          type="button"
          onClick={() => cambiarTipo("ingreso")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            tipo === "ingreso"
              ? "bg-ingreso text-white"
              : "text-muted hover:text-foreground"
          }`}
        >
          Ingresos
        </button>
      </div>

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
          const icono =
            tipo === "gasto"
              ? iconoCategoriaGasto(configuracion, cat)
              : null;
          const color =
            tipo === "gasto"
              ? colorCategoriaGasto(configuracion, cat, indice)
              : null;

          return (
            <li
              key={cat}
              className={`rounded-lg border border-border bg-background ${
                enEdicion ? "col-span-full p-3" : "p-2.5"
              }`}
            >
              {enEdicion ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      value={nombreEditado}
                      onChange={(e) => setNombreEditado(e.target.value)}
                      className={inputClass}
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
                          setIconoEditado("otros");
                          setError("");
                        }}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface-hover"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                  {tipo === "gasto" && (
                    <SelectorIconoCategoria
                      valor={iconoEditado}
                      onChange={setIconoEditado}
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  {tipo === "gasto" && icono && color ? (
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border"
                      style={{ backgroundColor: `${color}22`, color }}
                    >
                      <IconoCategoria icono={icono} className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ingreso/10 text-ingreso">
                      <span className="text-xs font-semibold">+</span>
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {cat}
                    </p>
                    {uso > 0 && (
                      <p className="text-[10px] text-muted">
                        {uso} mov.
                      </p>
                    )}
                    <div className="mt-1.5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditando(cat);
                          setNombreEditado(cat);
                          setIconoEditado(
                            tipo === "gasto"
                              ? iconoCategoriaGasto(configuracion, cat)
                              : "otros"
                          );
                          setError("");
                        }}
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
