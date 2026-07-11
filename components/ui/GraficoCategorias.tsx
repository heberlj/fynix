"use client";

import type { DatoCategoria } from "@/lib/graficos";
import { colorCategoria } from "@/lib/graficos";
import { formatearMoneda } from "@/lib/quincenas";

interface GraficoCategoriasProps {
  datos: DatoCategoria[];
  moneda: string;
  titulo?: string;
}

export function GraficoCategorias({
  datos,
  moneda,
  titulo = "Gastos por categoría",
}: GraficoCategoriasProps) {
  if (datos.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-surface p-6">
        <p className="text-sm text-muted">Sin gastos para mostrar</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h3 className="text-base font-semibold text-foreground">{titulo}</h3>
      <div className="mt-4 space-y-3">
        {datos.map((dato, i) => (
          <div key={dato.categoria}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium text-foreground">{dato.categoria}</span>
              <span className="text-muted">
                {formatearMoneda(dato.monto, moneda)}{" "}
                <span className="text-xs">({dato.porcentaje.toFixed(0)}%)</span>
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${dato.porcentaje}%`,
                  backgroundColor: colorCategoria(i),
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
