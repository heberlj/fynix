"use client";

import { formatearMoneda } from "@/lib/quincenas";
import {
  GraficoCircular,
  type SegmentoCircular,
} from "@/components/ui/GraficoCircular";

interface GraficoResumenQuincenaProps {
  ingresos: number;
  gastos: number;
  compromisos: number;
  disponible: number;
  moneda: string;
  etiquetaQuincena: string;
  className?: string;
}

const COLOR_GASTOS = "var(--gasto)";
const COLOR_COMPROMISOS = "#d97706";
const COLOR_DISPONIBLE = "var(--ingreso)";
const COLOR_RESTO = "#64748b";

export function GraficoResumenQuincena({
  ingresos,
  gastos,
  compromisos,
  disponible,
  moneda,
  etiquetaQuincena,
  className = "",
}: GraficoResumenQuincenaProps) {
  const disponiblePositivo = Math.max(disponible, 0);
  const usado = gastos + compromisos + disponiblePositivo;
  const restoIngreso = ingresos > 0 ? Math.max(0, ingresos - usado) : 0;

  const segmentos: SegmentoCircular[] = [
    {
      id: "gastos",
      etiqueta: "Gastos",
      valor: gastos,
      color: COLOR_GASTOS,
      descripcion: "Compras y pagos variables que registraste en transacciones.",
    },
    {
      id: "compromisos",
      etiqueta: "Compromisos",
      valor: compromisos,
      color: COLOR_COMPROMISOS,
      descripcion:
        "Pagos de tarjetas, préstamos, cuotas Popular y gastos fijos de la quincena.",
    },
    {
      id: "disponible",
      etiqueta: "Disponible",
      valor: disponiblePositivo,
      color: COLOR_DISPONIBLE,
      descripcion: "Dinero que te queda después de gastos y compromisos.",
    },
  ];

  if (restoIngreso > 0) {
    segmentos.push({
      id: "sin-asignar",
      etiqueta: "Por cubrir",
      valor: restoIngreso,
      color: COLOR_RESTO,
      descripcion:
        "Parte del ingreso aún no reflejada en gastos, compromisos o disponible.",
    });
  }

  const totalGrafico = ingresos > 0 ? ingresos : usado;
  const deficit = disponible < 0;

  return (
    <GraficoCircular
      className={className}
      segmentos={segmentos}
      moneda={moneda}
      titulo="Distribución de la quincena"
      subtitulo={`Cómo se reparte tu ingreso en ${etiquetaQuincena}. Cada color muestra cuánto va a gastos, compromisos y lo que te queda.`}
      centroEtiqueta="Disponible"
      centroValor={formatearMoneda(disponible, moneda)}
      centroNota={
        deficit
          ? "Estás por encima de tu ingreso en esta quincena"
          : ingresos > 0
            ? `Ingresos: ${formatearMoneda(ingresos, moneda)}`
            : "Sin ingresos registrados"
      }
      totalReferencia={totalGrafico}
      mensajeVacio="Registra ingresos y gastos en esta quincena para ver el gráfico."
    />
  );
}
