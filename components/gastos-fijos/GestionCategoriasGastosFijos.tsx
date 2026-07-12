"use client";

import { useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { obtenerCategoriasGastosFijos } from "@/lib/gastos-fijos";
import { confirmarAccion } from "@/lib/confirmar";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

interface GestionCategoriasGastosFijosProps {
  onCerrar: () => void;
}

export function GestionCategoriasGastosFijos({
  onCerrar,
}: GestionCategoriasGastosFijosProps) {
  const {
    configuracion,
    gastosFijos,
    agregarCategoriaGastoFijo,
    renombrarCategoriaGastoFijo,
    eliminarCategoriaGastoFijo,
  } = useFinanzas();

  const categorias = obtenerCategoriasGastosFijos(configuracion);
  const [nueva, setNueva] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState("");
  const [error, setError] = useState("");

  function contarUso(nombre: string) {
    return gastosFijos.filter((g) => g.categoria === nombre).length;
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
    agregarCategoriaGastoFijo(limpio);
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
    renombrarCategoriaGastoFijo(anterior, limpio);
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
    eliminarCategoriaGastoFijo(nombre);
    if (editando === nombre) setEditando(null);
  }

  function cerrar() {
    setEditando(null);
    setNombreEditado("");
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
            Personaliza las categorías para clasificar tus gastos fijos
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

      <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-background">
        {categorias.map((cat) => {
          const enEdicion = editando === cat;
          const uso = contarUso(cat);

          return (
            <li
              key={cat}
              className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              {enEdicion ? (
                <div className="flex flex-1 flex-col gap-2 sm:flex-row">
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
                        setError("");
                      }}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface-hover"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium text-foreground">{cat}</p>
                    {uso > 0 && (
                      <p className="text-xs text-muted">
                        {uso} gasto{uso !== 1 ? "s" : ""} fijo{uso !== 1 ? "s" : ""}
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
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminar(cat)}
                      className="rounded-lg px-2 py-1 text-xs text-muted hover:bg-gasto/10 hover:text-gasto"
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
