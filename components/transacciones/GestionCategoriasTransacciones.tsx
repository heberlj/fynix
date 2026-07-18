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
import { SelectorPaletaColor } from "@/components/ui/SelectorPaletaColor";

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
    actualizarColorCategoriaGasto,
    actualizarIconoCategoriaGasto,
  } = useFinanzas();

  const [tipo, setTipo] = useState<"gasto" | "ingreso">("gasto");
  const [nueva, setNueva] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState("");
  const [iconoEditado, setIconoEditado] = useState<IconoCategoriaId>("otros");
  const [colorEditado, setColorEditado] = useState("#2563eb");
  const [error, setError] = useState("");

  const categorias =
    tipo === "gasto"
      ? obtenerCategoriasGasto(configuracion)
      : obtenerCategoriasIngreso(configuracion);

  const categoriasVisibles = editando
    ? categorias.filter((c) => c === editando)
    : categorias;

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

  function iniciarEdicion(categoria: string, indice: number) {
    setEditando(categoria);
    setNombreEditado(categoria);
    setIconoEditado(
      tipo === "gasto"
        ? iconoCategoriaGasto(configuracion, categoria)
        : "otros"
    );
    setColorEditado(
      tipo === "gasto"
        ? colorCategoriaGasto(configuracion, categoria, indice)
        : "#16a34a"
    );
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
    if (tipo === "gasto") {
      if (limpio !== anterior) {
        renombrarCategoriaGasto(anterior, limpio);
      }
      actualizarIconoCategoriaGasto(limpio, iconoEditado);
      actualizarColorCategoriaGasto(limpio, colorEditado);
    } else {
      renombrarCategoriaIngreso(anterior, limpio);
    }
    cancelarEdicion();
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
    if (editando === nombre) cancelarEdicion();
  }

  function cambiarTipo(nuevoTipo: "gasto" | "ingreso") {
    setTipo(nuevoTipo);
    cancelarEdicion();
    setNueva("");
    setError("");
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Personaliza las categorías para clasificar tus gastos e ingresos. En gastos
        puedes elegir icono y color.
      </p>

      <div className="flex rounded-lg border border-border p-1">
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

      {editando ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={cancelarEdicion}
            className="text-sm font-medium text-accent hover:underline"
          >
            ← Volver a todas las categorías
          </button>

          {categoriasVisibles.map((cat) => {
            const uso = contarUso(cat);
            return (
              <div
                key={cat}
                className="rounded-xl border border-border bg-background p-4 sm:p-5"
              >
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  {tipo === "gasto" ? (
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border"
                      style={{
                        backgroundColor: `${colorEditado}22`,
                        color: colorEditado,
                      }}
                    >
                      <IconoCategoria icono={iconoEditado} className="h-5 w-5" />
                    </span>
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ingreso/10 text-lg font-bold text-ingreso">
                      +
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      Editando categoría
                    </p>
                    {uso > 0 && (
                      <p className="text-xs text-muted">
                        {uso} transacción{uso !== 1 ? "es" : ""} usan esta categoría
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-muted">Nombre</span>
                    <input
                      type="text"
                      value={nombreEditado}
                      onChange={(e) => setNombreEditado(e.target.value)}
                      className={inputClass}
                      autoFocus
                    />
                  </label>

                  {tipo === "gasto" && (
                    <>
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
                    </>
                  )}

                  {error && <p className="text-sm text-gasto">{error}</p>}

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={() => guardarEdicion(cat)}
                      className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
                    >
                      Guardar cambios
                    </button>
                    <button
                      type="button"
                      onClick={cancelarEdicion}
                      className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface-hover"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminar(cat)}
                      className="rounded-lg border border-gasto/30 px-4 py-2.5 text-sm font-medium text-gasto hover:bg-gasto/10 sm:ml-auto"
                    >
                      Eliminar categoría
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <form
            onSubmit={handleAgregar}
            className="flex flex-col gap-2 sm:flex-row"
          >
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

          {error && <p className="text-sm text-gasto">{error}</p>}

          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {categoriasVisibles.map((cat, indice) => {
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
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-start gap-3">
                    {tipo === "gasto" && icono && color ? (
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border"
                        style={{ backgroundColor: `${color}22`, color }}
                      >
                        <IconoCategoria icono={icono} className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ingreso/10 text-ingreso">
                        <span className="text-sm font-semibold">+</span>
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{cat}</p>
                      {uso > 0 && (
                        <p className="text-xs text-muted">
                          {uso} transacción{uso !== 1 ? "es" : ""}
                        </p>
                      )}
                      <div className="mt-2 flex gap-3">
                        <button
                          type="button"
                          onClick={() => iniciarEdicion(cat, indice)}
                          className="text-xs font-medium text-accent hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminar(cat)}
                          className="text-xs text-muted hover:text-gasto hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex justify-end border-t border-border pt-4">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
            >
              Cerrar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
