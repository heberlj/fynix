import type {
  ConfiguracionUsuario,
  GastoFijo,
  PeriodoQuincena,
  TipoPresupuestoGasto,
  TipoRecurrenciaGasto,
  Transaccion,
} from "@/types/finanzas";
import { CATEGORIAS_GASTOS_FIJOS_DEFAULT } from "@/types/finanzas";
import { fechaHoy, mesActual } from "@/lib/fechas";
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

export function etiquetaTipoRecurrencia(tipo: TipoRecurrenciaGasto): string {
  return tipo === "recurrente" ? "Recurrente" : "Una vez";
}

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

export function esGastoRecurrente(gasto: GastoFijo): boolean {
  return (gasto.tipoRecurrencia ?? "recurrente") === "recurrente";
}

export function esGastoUnico(gasto: GastoFijo): boolean {
  return gasto.tipoRecurrencia === "unico";
}

export function gastoFijoActivo(gasto: GastoFijo): boolean {
  return gasto.activo;
}

export function gastoUnicoPagado(
  gasto: GastoFijo,
  transacciones: Transaccion[] = []
): boolean {
  if (!esGastoUnico(gasto)) return false;
  if (gasto.pagado) return true;
  return transacciones.some(
    (t) => t.tipo === "gasto" && t.gastoFijoId === gasto.id
  );
}

export function esGastoUnicoPendiente(
  gasto: GastoFijo,
  transacciones: Transaccion[] = []
): boolean {
  if (!esGastoUnico(gasto) || gastoUnicoPagado(gasto, transacciones)) {
    return false;
  }
  const fecha = gasto.fechaVencimiento;
  if (!fecha) return false;
  return fecha < fechaHoy();
}

export function gastoVisibleEnPresupuesto(
  gasto: GastoFijo,
  transacciones: Transaccion[] = [],
  mes: string = mesActual()
): boolean {
  if (esGastoUnico(gasto)) {
    if (gastoUnicoPagado(gasto, transacciones)) return false;
    if (!gasto.fechaVencimiento) return true;
    return gasto.fechaVencimiento.startsWith(mes);
  }
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
  periodo: PeriodoQuincena,
  transacciones: Transaccion[] = []
): boolean {
  if (esGastoUnico(gasto)) {
    if (gastoUnicoPagado(gasto, transacciones)) return false;
    if (!gasto.fechaVencimiento) return false;
    return fechaEnPeriodo(gasto.fechaVencimiento, periodo);
  }
  return gastoFijoActivo(gasto) && gasto.quincena === periodo.quincena;
}

export function totalMensualGastosFijos(
  gastos: GastoFijo[],
  transacciones: Transaccion[] = [],
  mes: string = mesActual()
): number {
  return gastos
    .filter((g) => gastoVisibleEnPresupuesto(g, transacciones, mes))
    .reduce((total, g) => total + g.monto, 0);
}

export function totalMensualPorMoneda(
  gastos: GastoFijo[],
  transacciones: Transaccion[] = [],
  mes: string = mesActual()
): Map<string, number> {
  const mapa = new Map<string, number>();
  gastos
    .filter((g) => gastoVisibleEnPresupuesto(g, transacciones, mes))
    .forEach((g) => {
      mapa.set(g.moneda, (mapa.get(g.moneda) ?? 0) + g.monto);
    });
  return mapa;
}

export function totalPorQuincena(
  gastos: GastoFijo[],
  quincena: 1 | 2,
  transacciones: Transaccion[] = [],
  mes: string = mesActual()
): Map<string, number> {
  const mapa = new Map<string, number>();
  gastos
    .filter(
      (g) =>
        gastoVisibleEnPresupuesto(g, transacciones, mes) && g.quincena === quincena
    )
    .forEach((g) => {
      mapa.set(g.moneda, (mapa.get(g.moneda) ?? 0) + g.monto);
    });
  return mapa;
}

export function gastosPorCategoriaFija(
  gastos: GastoFijo[],
  quincena?: 1 | 2,
  transacciones: Transaccion[] = [],
  mes: string = mesActual()
): { categoria: string; monto: number; cantidad: number }[] {
  const mapa = new Map<string, { monto: number; cantidad: number }>();
  gastos
    .filter(
      (g) =>
        gastoVisibleEnPresupuesto(g, transacciones, mes) &&
        (quincena === undefined || g.quincena === quincena)
    )
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
  moneda?: string,
  gasto?: GastoFijo
): number {
  if (gasto && esGastoUnico(gasto)) {
    return redondear(
      transacciones
        .filter(
          (t) =>
            t.tipo === "gasto" &&
            t.gastoFijoId === gastoFijoId &&
            (!moneda || t.moneda === moneda)
        )
        .reduce((total, t) => total + t.monto, 0)
    );
  }

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
  if (!gastoAplicaEnPeriodo(gasto, periodo, transacciones)) return 0;
  if (moneda && gasto.moneda !== moneda) return 0;
  const pagado = montoPagadoGastoFijoEnPeriodo(
    transacciones,
    gasto.id,
    periodo,
    moneda,
    gasto
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
  tipoRecurrencia: TipoRecurrenciaGasto;
  pendiente: boolean;
}

export function obtenerGastosFijosDetalle(
  gastos: GastoFijo[],
  periodo: PeriodoQuincena,
  transacciones: Transaccion[] = []
): DetalleGastoFijoPeriodo[] {
  return gastos
    .filter((g) => gastoAplicaEnPeriodo(g, periodo, transacciones))
    .map((g) => {
      const montoPagado = montoPagadoGastoFijoEnPeriodo(
        transacciones,
        g.id,
        periodo,
        g.moneda,
        g
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
        tipoRecurrencia: g.tipoRecurrencia ?? "recurrente",
        pendiente: esGastoUnicoPendiente(g, transacciones),
      };
    })
    .sort((a, b) => a.dia - b.dia);
}

export function agruparGastosPorQuincena(
  gastos: GastoFijo[],
  transacciones: Transaccion[] = [],
  mes: string = mesActual()
): { quincena: 1 | 2; gastos: GastoFijo[] }[] {
  const visibles = gastos.filter((g) =>
    gastoVisibleEnPresupuesto(g, transacciones, mes)
  );

  return ([1, 2] as const).map((quincena) => ({
    quincena,
    gastos: visibles
      .filter((g) => g.quincena === quincena)
      .sort((a, b) => {
        const fechaA = a.fechaVencimiento ?? `0000-00-${String(a.diaPago).padStart(2, "0")}`;
        const fechaB = b.fechaVencimiento ?? `0000-00-${String(b.diaPago).padStart(2, "0")}`;
        return fechaA.localeCompare(fechaB);
      }),
  }));
}

export function marcarGastoUnicoPagado(
  gastos: GastoFijo[],
  gastoFijoId: string,
  pagado: boolean
): GastoFijo[] {
  return gastos.map((g) => {
    if (g.id !== gastoFijoId || !esGastoUnico(g)) return g;
    return { ...g, pagado, activo: !pagado };
  });
}

export function diasHastaFechaGasto(
  gasto: GastoFijo,
  desde: Date = new Date()
): number | null {
  if (esGastoUnico(gasto) && gasto.fechaVencimiento) {
    const [y, m, d] = gasto.fechaVencimiento.split("-").map(Number);
    const objetivo = new Date(y, m - 1, d);
    const hoy = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
    return Math.round((objetivo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }
  return null;
}
