"use client";

import { GRUPOS_COLORES_CATEGORIA } from "@/lib/paleta-categorias";

interface SelectorPaletaColorProps {
  valor: string;
  onChange: (color: string) => void;
  etiqueta?: string;
  className?: string;
}

export function SelectorPaletaColor({
  valor,
  onChange,
  etiqueta = "Color",
  className = "",
}: SelectorPaletaColorProps) {
  return (
    <div className={className}>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <p className="text-xs font-medium text-muted">{etiqueta}</p>
        <label className="relative shrink-0 cursor-pointer">
          <span
            className="block h-9 w-9 rounded-full border-2 border-border shadow-sm"
            style={{ backgroundColor: valor }}
          />
          <input
            type="color"
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Elegir color personalizado"
          />
        </label>
        <span className="text-xs text-muted">o elige un tono de la paleta</span>
      </div>

      <div className="space-y-3">
        {GRUPOS_COLORES_CATEGORIA.map((grupo) => (
          <div key={grupo.nombre}>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
              {grupo.nombre}
            </p>
            <div className="flex flex-wrap gap-2">
              {grupo.tonos.map((tono) => {
                const activo = valor.toLowerCase() === tono.toLowerCase();
                return (
                  <button
                    key={tono}
                    type="button"
                    onClick={() => onChange(tono)}
                    className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-105 ${
                      activo
                        ? "border-foreground ring-2 ring-accent/30"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: tono }}
                    aria-label={`${grupo.nombre} ${tono}`}
                    aria-pressed={activo}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
