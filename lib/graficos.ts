import type { Transaccion } from "@/types/finanzas";
import { opcionesMeses } from "@/lib/fechas";

export interface DatoCategoria {
  categoria: string;
  monto: number;
  porcentaje: number;
}

export interface DatoMes {
  mes: string;
  etiqueta: string;
  ingresos: number;
  gastos: number;
}

const COLORES_CATEGORIA = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#64748b",
];

export function colorCategoria(indice: number): string {
  return COLORES_CATEGORIA[indice % COLORES_CATEGORIA.length];
}

export function gastosPorCategoria(
  transacciones: Transaccion[],
  mes?: string
): DatoCategoria[] {
  const gastos = transacciones.filter((t) => {
    if (t.tipo !== "gasto") return false;
    if (mes) return t.fecha.startsWith(mes);
    return true;
  });

  const mapa = new Map<string, number>();
  gastos.forEach((t) => {
    mapa.set(t.categoria, (mapa.get(t.categoria) ?? 0) + t.monto);
  });

  const total = Array.from(mapa.values()).reduce((s, v) => s + v, 0);
  if (total === 0) return [];

  return Array.from(mapa.entries())
    .map(([categoria, monto]) => ({
      categoria,
      monto,
      porcentaje: (monto / total) * 100,
    }))
    .sort((a, b) => b.monto - a.monto);
}

export function evolucionMensual(
  transacciones: Transaccion[],
  cantidadMeses = 6
): DatoMes[] {
  const meses = opcionesMeses(cantidadMeses).reverse();

  return meses.map(({ valor, etiqueta }) => {
    const delMes = transacciones.filter((t) => t.fecha.startsWith(valor));
    let ingresos = 0;
    let gastos = 0;
    delMes.forEach((t) => {
      if (t.tipo === "ingreso") ingresos += t.monto;
      else if (t.tipo === "gasto") gastos += t.monto;
    });
    return { mes: valor, etiqueta, ingresos, gastos };
  });
}

export function maximoEvolucion(datos: DatoMes[]): number {
  if (datos.length === 0) return 1;
  return Math.max(
    1,
    ...datos.flatMap((d) => [d.ingresos, d.gastos])
  );
}
