"use client";

import type { ColorHome, IconoHomeCuenta } from "@/types/finanzas";
import {
  ETIQUETAS_ICONO_HOME,
  ESTILOS_COLOR_HOME,
  ICONOS_CUENTA_HOME,
} from "@/lib/personalizacion-home";
import { IconoHome } from "@/components/ui/IconoHome";
import { SelectorColorHome } from "@/components/ui/SelectorColorHome";

interface PersonalizacionCuentaHomeProps {
  color: ColorHome;
  icono: IconoHomeCuenta;
  onColorChange: (color: ColorHome) => void;
  onIconoChange: (icono: IconoHomeCuenta) => void;
}

export function PersonalizacionCuentaHome({
  color,
  icono,
  onColorChange,
  onIconoChange,
}: PersonalizacionCuentaHomeProps) {
  const estilo = ESTILOS_COLOR_HOME[color];

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-sm font-medium text-foreground">Apariencia en Home</p>
      <p className="mt-0.5 text-xs text-muted">
        Elige el color de fondo y el icono de esta cuenta en la pantalla principal
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr]">
        <div
          className={`flex h-24 w-28 flex-col justify-between rounded-lg border p-3 ${estilo.fondo} ${estilo.borde}`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${estilo.iconoFondo} ${estilo.icono}`}
          >
            <IconoHome nombre={icono} className="h-4 w-4" />
          </div>
          <div>
            <p className="truncate text-xs font-medium text-foreground">Vista previa</p>
            <p className="text-[10px] text-muted">RD$ •••</p>
          </div>
        </div>

        <div className="space-y-4">
          <SelectorColorHome valor={color} onChange={onColorChange} />

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">Icono</span>
            <div className="flex flex-wrap gap-2">
              {ICONOS_CUENTA_HOME.map((nombre) => {
                const activo = icono === nombre;
                return (
                  <button
                    key={nombre}
                    type="button"
                    title={ETIQUETAS_ICONO_HOME[nombre]}
                    onClick={() => onIconoChange(nombre)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                      activo
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-surface text-muted hover:text-foreground"
                    }`}
                    aria-label={ETIQUETAS_ICONO_HOME[nombre]}
                    aria-pressed={activo}
                  >
                    <IconoHome nombre={nombre} className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
