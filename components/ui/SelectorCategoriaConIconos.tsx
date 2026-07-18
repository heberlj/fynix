"use client";

import { useMemo, useState } from "react";
import type { ConfiguracionUsuario } from "@/types/finanzas";
import {
  colorCategoriaGasto,
  iconoCategoriaGasto,
} from "@/lib/categorias-transacciones";
import type { IconoCategoriaId } from "@/lib/iconos-categoria";
import { IconoCategoria } from "@/components/ui/IconoCategoria";

interface SelectorCategoriaConIconosProps {
  categorias: string[];
  valor: string;
  onChange: (categoria: string) => void;
  configuracion?: ConfiguracionUsuario;
  conIconos?: boolean;
  className?: string;
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

export function SelectorCategoriaConIconos({
  categorias,
  valor,
  onChange,
  configuracion,
  conIconos = true,
  className = "",
}: SelectorCategoriaConIconosProps) {
  const [busqueda, setBusqueda] = useState("");

  const filtradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return categorias;
    return categorias.filter((categoria) =>
      categoria.toLowerCase().includes(termino)
    );
  }, [categorias, busqueda]);

  return (
    <div className={className}>
      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar categoría..."
        className={`${inputClass} mb-2`}
        aria-label="Buscar categoría"
      />
      <div
        className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-border bg-background p-2 sm:grid-cols-2"
        role="listbox"
        aria-label="Seleccionar categoría"
      >
        {filtradas.length === 0 ? (
          <p className="col-span-full px-2 py-3 text-center text-xs text-muted">
            No hay categorías que coincidan con &quot;{busqueda}&quot;
          </p>
        ) : (
          filtradas.map((categoria) => {
            const activa = valor === categoria;
            const icono: IconoCategoriaId | null =
              conIconos && configuracion
                ? iconoCategoriaGasto(configuracion, categoria)
                : null;

            return (
              <button
                key={categoria}
                type="button"
                role="option"
                aria-selected={activa}
                onClick={() => onChange(categoria)}
                className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors ${
                  activa
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-transparent hover:border-border hover:bg-surface-hover"
                }`}
              >
                {icono && (
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      activa ? "bg-accent/15 text-accent" : "bg-surface text-muted"
                    }`}
                  >
                    <IconoCategoria icono={icono} className="h-3.5 w-3.5" />
                  </span>
                )}
                <span className="min-w-0 text-sm font-medium">{categoria}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export function InsigniaCategoriaGasto({
  categoria,
  configuracion,
  className = "",
}: {
  categoria: string;
  configuracion: ConfiguracionUsuario;
  className?: string;
}) {
  const icono: IconoCategoriaId = iconoCategoriaGasto(configuracion, categoria);
  const color = colorCategoriaGasto(configuracion, categoria);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${className}`}
      style={{ backgroundColor: `${color}22`, color }}
    >
      <IconoCategoria icono={icono} className="h-3.5 w-3.5" />
      {categoria}
    </span>
  );
}
