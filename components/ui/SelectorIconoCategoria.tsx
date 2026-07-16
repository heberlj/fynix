"use client";

import {
  ICONOS_CATEGORIA_DISPONIBLES,
  type IconoCategoriaId,
} from "@/lib/iconos-categoria";
import { IconoCategoria } from "@/components/ui/IconoCategoria";

interface SelectorIconoCategoriaProps {
  valor: IconoCategoriaId;
  onChange: (icono: IconoCategoriaId) => void;
  className?: string;
}

export function SelectorIconoCategoria({
  valor,
  onChange,
  className = "",
}: SelectorIconoCategoriaProps) {
  return (
    <div
      className={`grid grid-cols-6 gap-2 sm:grid-cols-9 ${className}`}
      role="listbox"
      aria-label="Seleccionar icono de categoría"
    >
      {ICONOS_CATEGORIA_DISPONIBLES.map((icono) => {
        const activo = valor === icono.id;
        return (
          <button
            key={icono.id}
            type="button"
            role="option"
            aria-selected={activo}
            title={icono.etiqueta}
            onClick={() => onChange(icono.id)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
              activo
                ? "border-accent bg-accent/10 text-accent"
                : "border-border bg-background text-muted hover:border-accent/40 hover:text-foreground"
            }`}
          >
            <IconoCategoria icono={icono.id} className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
