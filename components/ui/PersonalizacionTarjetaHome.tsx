"use client";

import type { ColorHome } from "@/types/finanzas";
import { ESTILOS_COLOR_HOME } from "@/lib/personalizacion-home";
import { IconoHome } from "@/components/ui/IconoHome";
import { SelectorColorHome } from "@/components/ui/SelectorColorHome";

interface PersonalizacionTarjetaHomeProps {
  color: ColorHome;
  onChange: (color: ColorHome) => void;
}

export function PersonalizacionTarjetaHome({
  color,
  onChange,
}: PersonalizacionTarjetaHomeProps) {
  const estilo = ESTILOS_COLOR_HOME[color];

  return (
    <div className="rounded-lg border border-border bg-background p-4 sm:col-span-2">
      <p className="text-sm font-medium text-foreground">Apariencia en Home</p>
      <p className="mt-0.5 text-xs text-muted">
        Color de fondo en la pantalla principal. El icono será siempre el de tarjeta.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-[auto_1fr]">
        <div
          className={`flex h-24 w-28 flex-col justify-between rounded-lg border p-3 ${estilo.fondo} ${estilo.borde}`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${estilo.iconoFondo} ${estilo.icono}`}
          >
            <IconoHome nombre="tarjeta" className="h-4 w-4" />
          </div>
          <div>
            <p className="truncate text-xs font-medium text-foreground">Vista previa</p>
            <p className="text-[10px] text-muted">RD$ •••</p>
          </div>
        </div>

        <SelectorColorHome valor={color} onChange={onChange} />
      </div>
    </div>
  );
}
