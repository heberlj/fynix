import type {
  ConfiguracionUsuario,
  PeriodoQuincena,
  Prestamo,
  TipoTasaInteres,
  Transaccion,
} from "@/types/finanzas";
import { fechaEnPeriodo, periodoDeFecha } from "@/lib/quincenas";

function pagoCaeEnPeriodo(diaPago: number, periodo: PeriodoQuincena): boolean {
  const inicio = new Date(periodo.inicio);
  const fin = new Date(periodo.fin);
  const cursor = new Date(inicio);

  while (cursor <= fin) {
    const diaEfectivo = Math.min(
      diaPago,
      new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    );
    if (cursor.getDate() === diaEfectivo) return true;
    cursor.setDate(cursor.getDate() + 1);
  }
  return false;
}

export function montoPagadoPrestamoEnPeriodo(
  transacciones: Transaccion[],
  prestamoId: string,
  periodo: PeriodoQuincena,
  moneda?: string
): number {
  return (
    Math.round(
      transacciones
        .filter(
          (t) =>
            t.tipo === "gasto" &&
            t.prestamoId === prestamoId &&
            fechaEnPeriodo(t.fecha, periodo) &&
            (!moneda || t.moneda === moneda)
        )
        .reduce((total, t) => total + t.monto, 0) * 100
    ) / 100
  );
}

export function quincenaDePrestamo(diaPago: number): 1 | 2 {
  return diaPago <= 15 ? 1 : 2;
}

export interface PrestamoVistaGastosFijos {
  id: string;
  entidad: string;
  descripcion: string;
  montoCuota: number;
  moneda: string;
  diaPago: number;
  quincena: 1 | 2;
  cuotasPagadas: number;
  cuotasTotales: number;
}

/** Solo para la vista de Gastos fijos: ver cuotas junto a gastos mensuales */
export function prestamosParaVistaGastosFijos(
  prestamos: Prestamo[]
): PrestamoVistaGastosFijos[] {
  return prestamos
    .filter((p) => p.cuotasPagadas < p.cuotasTotales)
    .map((p) => ({
      id: p.id,
      entidad: p.entidad,
      descripcion: p.descripcion,
      montoCuota: p.montoCuota,
      moneda: p.moneda,
      diaPago: p.diaPago,
      quincena: quincenaDePrestamo(p.diaPago),
      cuotasPagadas: p.cuotasPagadas,
      cuotasTotales: p.cuotasTotales,
    }))
    .sort((a, b) => a.diaPago - b.diaPago);
}

export function totalPrestamosPorQuincena(
  prestamos: Prestamo[],
  quincena: 1 | 2,
  moneda?: string
): number {
  return (
    Math.round(
      prestamosParaVistaGastosFijos(prestamos)
        .filter((p) => p.quincena === quincena && (!moneda || p.moneda === moneda))
        .reduce((sum, p) => sum + p.montoCuota, 0) * 100
    ) / 100
  );
}

export function agruparPrestamosPorQuincena(prestamos: Prestamo[]) {
  const vista = prestamosParaVistaGastosFijos(prestamos);
  return ([1, 2] as const).map((quincena) => ({
    quincena,
    prestamos: vista.filter((p) => p.quincena === quincena),
  }));
}

/** Préstamo activo que cae en esta quincena (solo planificación) */
export function prestamoAplicaEnQuincena(
  prestamo: Prestamo,
  periodo: PeriodoQuincena
): boolean {
  if (prestamo.cuotasPagadas >= prestamo.cuotasTotales) return false;
  return quincenaDePrestamo(prestamo.diaPago) === periodo.quincena;
}

export function montoPendientePrestamoEnQuincena(
  prestamo: Prestamo,
  transacciones: Transaccion[],
  periodo: PeriodoQuincena,
  moneda?: string
): number {
  if (!prestamoAplicaEnQuincena(prestamo, periodo)) return 0;
  if (moneda && prestamo.moneda !== moneda) return 0;
  const pagado = montoPagadoPrestamoEnPeriodo(
    transacciones,
    prestamo.id,
    periodo,
    moneda
  );
  return Math.round(Math.max(0, prestamo.montoCuota - pagado) * 100) / 100;
}

export function prestamoTienePagoEnPeriodo(
  transacciones: Transaccion[],
  prestamoId: string,
  periodo: PeriodoQuincena,
  moneda?: string
): boolean {
  return transacciones.some(
    (t) =>
      t.tipo === "gasto" &&
      t.prestamoId === prestamoId &&
      fechaEnPeriodo(t.fecha, periodo) &&
      (!moneda || t.moneda === moneda)
  );
}

export function montoCuotaPrestamoPendienteEnPeriodo(
  prestamo: Prestamo,
  transacciones: Transaccion[],
  periodo: PeriodoQuincena,
  moneda?: string
): number {
  if (prestamo.cuotasPagadas >= prestamo.cuotasTotales) return 0;
  if (moneda && prestamo.moneda !== moneda) return 0;
  if (!pagoCaeEnPeriodo(prestamo.diaPago, periodo)) return 0;
  if (prestamoTienePagoEnPeriodo(transacciones, prestamo.id, periodo, moneda)) {
    return 0;
  }
  return prestamo.montoCuota;
}

export function calcularCuotasPrestamosEnPeriodo(
  prestamos: Prestamo[],
  periodo: PeriodoQuincena,
  moneda?: string,
  transacciones: Transaccion[] = []
): number {
  const prestamosFiltrados = moneda
    ? prestamos.filter((p) => p.moneda === moneda)
    : prestamos;

  return prestamosFiltrados.reduce(
    (total, prestamo) =>
      total +
      montoCuotaPrestamoPendienteEnPeriodo(
        prestamo,
        transacciones,
        periodo,
        moneda
      ),
    0
  );
}

export function obtenerCuotasPrestamosDetalle(
  prestamos: Prestamo[],
  periodo: PeriodoQuincena,
  transacciones: Transaccion[] = []
): { nombre: string; monto: number; moneda: string; dia: number }[] {
  return prestamos
    .filter(
      (p) =>
        montoCuotaPrestamoPendienteEnPeriodo(p, transacciones, periodo) > 0
    )
    .map((p) => ({
      nombre: p.entidad,
      monto: p.montoCuota,
      moneda: p.moneda,
      dia: p.diaPago,
    }));
}

export function tasaMensual(tasa: number, tipo: TipoTasaInteres): number {
  if (tasa <= 0) return 0;
  if (tipo === "mensual") return tasa / 100;
  return tasa / 100 / 12;
}

export function calcularCuotaSugerida(
  montoPrestado: number,
  cuotasTotales: number
): number {
  if (cuotasTotales <= 0) return 0;
  return Math.round((montoPrestado / cuotasTotales) * 100) / 100;
}

export function calcularCuotaConInteres(
  montoPrestado: number,
  tasaInteres: number,
  cuotasTotales: number,
  tipoTasa: TipoTasaInteres
): number {
  if (cuotasTotales <= 0 || montoPrestado <= 0) return 0;
  if (tasaInteres <= 0) {
    return calcularCuotaSugerida(montoPrestado, cuotasTotales);
  }

  const r = tasaMensual(tasaInteres, tipoTasa);
  const n = cuotasTotales;
  const factor = Math.pow(1 + r, n);

  if (factor === 1) {
    return calcularCuotaSugerida(montoPrestado, cuotasTotales);
  }

  const cuota = (montoPrestado * r * factor) / (factor - 1);
  return Math.round(cuota * 100) / 100;
}

export function totalAPagar(prestamo: Prestamo): number {
  return Math.round(prestamo.montoCuota * prestamo.cuotasTotales * 100) / 100;
}

export function totalIntereses(prestamo: Prestamo): number {
  return Math.max(0, Math.round((totalAPagar(prestamo) - prestamo.montoPrestado) * 100) / 100);
}

export function cuotasRestantes(prestamo: Prestamo): number {
  return Math.max(0, prestamo.cuotasTotales - prestamo.cuotasPagadas);
}

export function saldoPendiente(prestamo: Prestamo): number {
  return Math.round(cuotasRestantes(prestamo) * prestamo.montoCuota * 100) / 100;
}

export function interesesPendientes(prestamo: Prestamo): number {
  if (prestamo.cuotasTotales <= 0) return 0;
  const pendientes = cuotasRestantes(prestamo);
  const interesPorCuota = totalIntereses(prestamo) / prestamo.cuotasTotales;
  return Math.round(pendientes * interesPorCuota * 100) / 100;
}

export function progresoPrestamo(prestamo: Prestamo): number {
  if (prestamo.cuotasTotales <= 0) return 0;
  return Math.min(100, (prestamo.cuotasPagadas / prestamo.cuotasTotales) * 100);
}

export function prestamoCompletado(prestamo: Prestamo): boolean {
  return prestamo.cuotasPagadas >= prestamo.cuotasTotales;
}

export function diasHastaCuota(diaPago: number, desde: Date = new Date()): number {
  const hoy = desde.getDate();
  const mes = desde.getMonth();
  const anio = desde.getFullYear();
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();
  const diaEfectivo = Math.min(diaPago, ultimoDia);

  if (hoy <= diaEfectivo) return diaEfectivo - hoy;

  const ultimoSiguiente = new Date(anio, mes + 2, 0).getDate();
  const diaSiguiente = Math.min(diaPago, ultimoSiguiente);
  return ultimoDia - hoy + diaSiguiente;
}

export function quincenaDePago(
  diaPago: number,
  configuracion: ConfiguracionUsuario,
  referencia: Date = new Date()
): string {
  const anio = referencia.getFullYear();
  const mes = referencia.getMonth() + 1;
  const ultimoDia = new Date(anio, mes, 0).getDate();
  const dia = Math.min(diaPago, ultimoDia);
  const fecha = `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  const periodo = periodoDeFecha(fecha, configuracion.diasPago);
  return `Q${periodo.quincena}`;
}

export function etiquetaTasa(prestamo: Prestamo): string {
  if (prestamo.tasaInteres <= 0) return "Sin interés";
  const tipo = prestamo.tipoTasa === "anual" ? "anual" : "mensual";
  return `${prestamo.tasaInteres}% ${tipo}`;
}
