import type {
  ConfiguracionUsuario,
  GastoFijo,
  PeriodoQuincena,
  TipoPresupuestoGasto,
  Transaccion,
} from "@/types/finanzas";
import { CATEGORIAS_GASTOS_FIJOS_DEFAULT } from "@/types/finanzas";
import { fechaEnPeriodo } from "@/lib/quincenas";

export function obtenerCategoriasGastosFijos(
  configuracion: ConfiguracionUsuario
): string[] {
  const cats = configuracion.categoriasGastosFijos;
  return cats?.length ? cats : [...CATEGORIAS_GASTOS_FIJOS_DEFAULT];
}

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

export function quincenaNumeroDeDia(diaPago: number): 1 | 2 {
  return diaPago <= 15 ? 1 : 2;
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

export function montoPagadoGastoFijoEnPeriodo(
  transacciones: Transaccion[],
  gastoFijoId: string,
  periodo: PeriodoQuincena,
  moneda?: string
): number {
  return redondear(
    transacciones
      .filter(
        (t) =>
          t.tipo === "gasto" &&
          t.gastoFijoId === gastoFijoId &&
          fechaEnPeriodo(t.fecha, periodo) &&
          (!moneda || t.moneda === moneda)
      )
      .reduce((total, t) => total + t.monto, 0)
  );
}

export function montoPendienteGastoFijoEnPeriodo(
  gasto: GastoFijo,
  transacciones: Transaccion[],
  periodo: PeriodoQuincena,
  moneda?: string
): number {
  if (!gastoAplicaEnPeriodo(gasto, periodo)) return 0;
  if (moneda && gasto.moneda !== moneda) return 0;
  const pagado = montoPagadoGastoFijoEnPeriodo(
    transacciones,
    gasto.id,
    periodo,
    moneda
  );
  return redondear(Math.max(0, gasto.monto - pagado));
}

export function gastoFijoCubiertoEnPeriodo(
  gasto: GastoFijo,
  transacciones: Transaccion[],
  periodo: PeriodoQuincena,
  moneda?: string
): boolean {
  return montoPendienteGastoFijoEnPeriodo(gasto, transacciones, periodo, moneda) <= 0;
}

export function calcularGastosFijosEnPeriodo(
  gastos: GastoFijo[],
  periodo: PeriodoQuincena,
  moneda?: string,
  transacciones: Transaccion[] = []
): number {
  const gastosFiltrados = moneda
    ? gastos.filter((g) => g.moneda === moneda)
    : gastos;
  return redondear(
    gastosFiltrados.reduce((total, gasto) => {
      return (
        total +
        montoPendienteGastoFijoEnPeriodo(gasto, transacciones, periodo, moneda)
      );
    }, 0)
  );
}

export interface DetalleGastoFijoPeriodo {
  id: string;
  nombre: string;
  monto: number;
  montoPagado: number;
  montoPendiente: number;
  pagado: boolean;
  moneda: string;
  dia: number;
  categoria: string;
  quincena: 1 | 2;
}

export function obtenerGastosFijosDetalle(
  gastos: GastoFijo[],
  periodo: PeriodoQuincena,
  transacciones: Transaccion[] = []
): DetalleGastoFijoPeriodo[] {
  return gastos
    .filter((g) => gastoAplicaEnPeriodo(g, periodo))
    .map((g) => {
      const montoPagado = montoPagadoGastoFijoEnPeriodo(
        transacciones,
        g.id,
        periodo,
        g.moneda
      );
      const montoPendiente = redondear(Math.max(0, g.monto - montoPagado));
      return {
        id: g.id,
        nombre: g.nombre,
        monto: g.monto,
        montoPagado,
        montoPendiente,
        pagado: montoPendiente <= 0,
        moneda: g.moneda,
        dia: g.diaPago,
        categoria: g.categoria,
        quincena: g.quincena,
      };
    })
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
