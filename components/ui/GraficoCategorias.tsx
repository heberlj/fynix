"use client";

import type { DatoCategoria } from "@/lib/graficos";
import { colorCategoria } from "@/lib/graficos";
import { GraficoCircular } from "@/components/ui/GraficoCircular";

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
  const segmentos = datos.map((dato, i) => ({
    id: dato.categoria,
    etiqueta: dato.categoria,
    valor: dato.monto,
    color: colorCategoria(i),
    descripcion: `${dato.porcentaje.toFixed(1)}% del total de gastos del periodo.`,
  }));

  const total = datos.reduce((sum, d) => sum + d.monto, 0);
  const top = datos[0];

  return (
    <GraficoCircular
      segmentos={segmentos}
      moneda={moneda}
      titulo={titulo}
      subtitulo="Cada porción representa cuánto gastaste en esa categoría durante el mes."
      centroEtiqueta={top ? "Mayor gasto" : undefined}
      centroValor={top ? top.categoria : undefined}
      centroNota={
        top
          ? `${top.porcentaje.toFixed(0)}% del total`
          : undefined
      }
      totalReferencia={total}
      mensajeVacio="Sin gastos para mostrar en este periodo"
    />
  );
}
