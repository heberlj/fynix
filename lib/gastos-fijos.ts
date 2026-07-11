import type {
  ConfiguracionUsuario,
  GastoFijo,
  PeriodoQuincena,
  TipoPresupuestoGasto,
} from "@/types/finanzas";
import { CATEGORIAS_GASTO } from "@/types/finanzas";
import { periodoDeFecha } from "@/lib/quincenas";

const CATEGORIAS_FLEXIBLES_POR_DEFECTO = new Set<string>([
  "Suscripciones",
  "Entretenimiento",
  "Compras",
  "Otros",
]);

/** Sugiere esencial/flexible según categoría (solo para valores por defecto) */
export function tipoPresupuestoPorDefecto(categoria: string): TipoPresupuestoGasto {
  return CATEGORIAS_FLEXIBLES_POR_DEFECTO.has(categoria) ? "flexible" : "esencial";
}

export function etiquetaTipoPresupuesto(tipo: TipoPresupuestoGasto): string {
  return tipo === "esencial" ? "Esencial" : "Flexible";
}

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

export function gastoFijoActivo(gasto: GastoFijo): boolean {
  return gasto.activo;
}

export function quincenaNumeroDeDia(
  diaPago: number,
  configuracion: ConfiguracionUsuario,
  referencia: Date = new Date()
): 1 | 2 {
  const anio = referencia.getFullYear();
  const mes = referencia.getMonth() + 1;
  const ultimoDia = new Date(anio, mes, 0).getDate();
  const dia = Math.min(diaPago, ultimoDia);
  const fecha = `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  const periodo = periodoDeFecha(fecha, configuracion.diasPago);
  return periodo.quincena;
}

export function quincenaDeGastoFijo(
  gasto: Pick<GastoFijo, "quincena">,
  _configuracion?: ConfiguracionUsuario
): string {
  return `Q${gasto.quincena}`;
}

export function gastoAplicaEnPeriodo(
  gasto: GastoFijo,
  periodo: PeriodoQuincena
): boolean {
  return gastoFijoActivo(gasto) && gasto.quincena === periodo.quincena;
}

export function totalMensualGastosFijos(gastos: GastoFijo[]): number {
  return gastos
    .filter(gastoFijoActivo)
    .reduce((total, g) => total + g.monto, 0);
}

export function totalMensualPorMoneda(
  gastos: GastoFijo[]
): Map<string, number> {
  const mapa = new Map<string, number>();
  gastos.filter(gastoFijoActivo).forEach((g) => {
    mapa.set(g.moneda, (mapa.get(g.moneda) ?? 0) + g.monto);
  });
  return mapa;
}

export function totalPorQuincena(
  gastos: GastoFijo[],
  quincena: 1 | 2
): Map<string, number> {
  const mapa = new Map<string, number>();
  gastos
    .filter((g) => gastoFijoActivo(g) && g.quincena === quincena)
    .forEach((g) => {
      mapa.set(g.moneda, (mapa.get(g.moneda) ?? 0) + g.monto);
    });
  return mapa;
}

export function gastosPorCategoriaFija(
  gastos: GastoFijo[],
  quincena?: 1 | 2
): { categoria: string; monto: number; cantidad: number }[] {
  const mapa = new Map<string, { monto: number; cantidad: number }>();
  gastos
    .filter((g) => gastoFijoActivo(g) && (quincena === undefined || g.quincena === quincena))
    .forEach((g) => {
      const actual = mapa.get(g.categoria) ?? { monto: 0, cantidad: 0 };
      actual.monto += g.monto;
      actual.cantidad += 1;
      mapa.set(g.categoria, actual);
    });
  return Array.from(mapa.entries())
    .map(([categoria, datos]) => ({ categoria, ...datos }))
    .sort((a, b) => b.monto - a.monto);
}

export function calcularGastosFijosEnPeriodo(
  gastos: GastoFijo[],
  periodo: PeriodoQuincena,
  moneda?: string
): number {
  const gastosFiltrados = moneda
    ? gastos.filter((g) => g.moneda === moneda)
    : gastos;
  return redondear(
    gastosFiltrados.reduce((total, gasto) => {
      return gastoAplicaEnPeriodo(gasto, periodo) ? total + gasto.monto : total;
    }, 0)
  );
}

export function obtenerGastosFijosDetalle(
  gastos: GastoFijo[],
  periodo: PeriodoQuincena
): {
  nombre: string;
  monto: number;
  moneda: string;
  dia: number;
  categoria: string;
  quincena: 1 | 2;
}[] {
  return gastos
    .filter((g) => gastoAplicaEnPeriodo(g, periodo))
    .map((g) => ({
      nombre: g.nombre,
      monto: g.monto,
      moneda: g.moneda,
      dia: g.diaPago,
      categoria: g.categoria,
      quincena: g.quincena,
    }))
    .sort((a, b) => a.dia - b.dia);
}

export function agruparGastosPorQuincena(
  gastos: GastoFijo[]
): { quincena: 1 | 2; gastos: GastoFijo[] }[] {
  return ([1, 2] as const).map((quincena) => ({
    quincena,
    gastos: gastos
      .filter((g) => g.quincena === quincena)
      .sort((a, b) => a.diaPago - b.diaPago),
  }));
}
