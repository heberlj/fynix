"use client";

import type { ColorHome } from "@/types/finanzas";
import {
  COLORES_HOME,
  ETIQUETAS_COLOR_HOME,
  ESTILOS_COLOR_HOME,
} from "@/lib/personalizacion-home";

interface SelectorColorHomeProps {
  valor: ColorHome;
  onChange: (color: ColorHome) => void;
  etiqueta?: string;
}

export function SelectorColorHome({
  valor,
  onChange,
  etiqueta = "Color en Home",
}: SelectorColorHomeProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{etiqueta}</span>
      <div className="flex flex-wrap gap-2">
        {COLORES_HOME.map((color) => {
          const estilo = ESTILOS_COLOR_HOME[color];
          const activo = valor === color;
          return (
            <button
              key={color}
              type="button"
              title={ETIQUETAS_COLOR_HOME[color]}
              onClick={() => onChange(color)}
              className={`h-8 w-8 rounded-full border-2 transition-transform ${estilo.fondo} ${estilo.borde} ${
                activo
                  ? "scale-110 ring-2 ring-accent ring-offset-2 ring-offset-background"
                  : "hover:scale-105"
              }`}
              aria-label={ETIQUETAS_COLOR_HOME[color]}
              aria-pressed={activo}
            />
          );
        })}
      </div>
    </div>
  );
}
