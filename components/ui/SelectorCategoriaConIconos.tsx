"use client";

import type { ConfiguracionUsuario } from "@/types/finanzas";
import { iconoCategoriaGasto } from "@/lib/categorias-transacciones";
import type { IconoCategoriaId } from "@/lib/iconos-categoria";
import { IconoCategoria } from "@/components/ui/IconoCategoria";

interface SelectorCategoriaConIconosProps {
  categorias: string[];
  valor: string;
  onChange: (categoria: string) => void;
  configuracion: ConfiguracionUsuario;
  className?: string;
}

export function SelectorCategoriaConIconos({
  categorias,
  valor,
  onChange,
  configuracion,
  className = "",
}: SelectorCategoriaConIconosProps) {
  return (
    <div
      className={`grid max-h-56 grid-cols-1 gap-2 overflow-y-auto rounded-lg border border-border bg-background p-2 sm:grid-cols-2 ${className}`}
      role="listbox"
      aria-label="Seleccionar categoría"
    >
      {categorias.map((categoria) => {
        const activa = valor === categoria;
        const icono = iconoCategoriaGasto(configuracion, categoria);

        return (
          <button
            key={categoria}
            type="button"
            role="option"
            aria-selected={activa}
            onClick={() => onChange(categoria)}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
              activa
                ? "border-accent bg-accent/10 text-foreground"
                : "border-transparent hover:border-border hover:bg-surface-hover"
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                activa ? "bg-accent/15 text-accent" : "bg-surface text-muted"
              }`}
            >
              <IconoCategoria icono={icono} className="h-4 w-4" />
            </span>
            <span className="min-w-0 text-sm font-medium">{categoria}</span>
          </button>
        );
      })}
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

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-background px-2 py-0.5 text-xs text-muted ${className}`}
    >
      <IconoCategoria icono={icono} className="h-3.5 w-3.5" />
      {categoria}
    </span>
  );
}
