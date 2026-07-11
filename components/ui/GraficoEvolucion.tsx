"use client";

import type { DatoMes } from "@/lib/graficos";
import { maximoEvolucion } from "@/lib/graficos";
import { formatearMoneda } from "@/lib/quincenas";

interface GraficoEvolucionProps {
  datos: DatoMes[];
  moneda: string;
}

export function GraficoEvolucion({ datos, moneda }: GraficoEvolucionProps) {
  const maximo = maximoEvolucion(datos);

  if (datos.every((d) => d.ingresos === 0 && d.gastos === 0)) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-surface p-6">
        <p className="text-sm text-muted">Sin datos de evolución</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h3 className="text-base font-semibold text-foreground">Evolución mensual</h3>
      <p className="mt-1 text-xs text-muted">Ingresos vs gastos — últimos 6 meses</p>

      <div className="mt-4 flex items-end justify-between gap-2 sm:gap-4" style={{ height: "180px" }}>
        {datos.map((dato) => {
          const alturaIngreso = (dato.ingresos / maximo) * 100;
          const alturaGasto = (dato.gastos / maximo) * 100;

          return (
            <div
              key={dato.mes}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div className="flex w-full items-end justify-center gap-1" style={{ height: "140px" }}>
                <div
                  className="w-full max-w-5 rounded-t-sm bg-ingreso transition-all duration-500"
                  style={{ height: `${alturaIngreso}%`, minHeight: dato.ingresos > 0 ? "4px" : "0" }}
                  title={`Ingresos: ${formatearMoneda(dato.ingresos, moneda)}`}
                />
                <div
                  className="w-full max-w-5 rounded-t-sm bg-gasto transition-all duration-500"
                  style={{ height: `${alturaGasto}%`, minHeight: dato.gastos > 0 ? "4px" : "0" }}
                  title={`Gastos: ${formatearMoneda(dato.gastos, moneda)}`}
                />
              </div>
              <span className="text-[10px] font-medium text-muted sm:text-xs">
                {dato.etiqueta.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex justify-center gap-6 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-ingreso" />
          Ingresos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-gasto" />
          Gastos
        </span>
      </div>
    </div>
  );
}
