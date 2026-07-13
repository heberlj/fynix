import type {
  ConfiguracionUsuario,
  CuotaPopular,
  PeriodoQuincena,
  TarjetaCredito,
  Transaccion,
} from "@/types/finanzas";
import { enmascararNumero } from "@/lib/tarjetas";
import { fechaEnPeriodo, periodoDeFecha } from "@/lib/quincenas";
import { calcularCuotaConInteres } from "@/lib/prestamos";

export { calcularCuotaConInteres };

export interface ResumenEstadoCuotasPopular {
  limiteAprobado: number;
  balanceFecha: number;
  disponibleConSobregiro: number;
  fechaCorte: string;
  balanceCorte: number;
  pagoMinimo: number;
  fechaVencimiento: string;
  cuotasVencidas: number;
  numeroEnmascarado: string;
  ultimosCuatro: string;
}

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

function proximoDiaDelMes(dia: number, desde: Date = new Date()): string {
  const anio = desde.getFullYear();
  const mes = desde.getMonth();
  const ultimo = new Date(anio, mes + 1, 0).getDate();
  const diaEfectivo = Math.min(dia, ultimo);
  const fecha = new Date(anio, mes, diaEfectivo);

  if (fecha < new Date(desde.getFullYear(), desde.getMonth(), desde.getDate())) {
    const sigMes = mes + 1;
    const sigAnio = sigMes > 11 ? anio + 1 : anio;
    const sigMesNorm = sigMes % 12;
    const ultimoSig = new Date(sigAnio, sigMesNorm + 1, 0).getDate();
    const diaSig = Math.min(dia, ultimoSig);
    return `${sigAnio}-${String(sigMesNorm + 1).padStart(2, "0")}-${String(diaSig).padStart(2, "0")}`;
  }

  return `${anio}-${String(mes + 1).padStart(2, "0")}-${String(diaEfectivo).padStart(2, "0")}`;
}

export function tarjetaTieneCuotasPopular(tarjeta: TarjetaCredito): boolean {
  const fin = tarjeta.financiamientoCuotas;
  if (fin?.producto === "cuotas-popular" && fin.limiteAprobado > 0) {
    return true;
  }
  return (tarjeta.extensionCuotasPopular?.limiteAprobado ?? 0) > 0;
}

export function usoCuotasPopularTarjeta(
  cuotas: CuotaPopular[],
  tarjetaId: string
): number {
  return cuotas
    .filter((c) => c.tarjetaId === tarjetaId && !cuotaPopularCompletada(c))
    .reduce((sum, c) => sum + saldoPendienteCuota(c), 0);
}

export function disponibleLimiteCuotasPopular(
  tarjeta: TarjetaCredito,
  cuotas: CuotaPopular[]
): number {
  const limite = tarjeta.extensionCuotasPopular?.limiteAprobado ?? 0;
  if (limite <= 0) return 0;
  const uso = usoCuotasPopularTarjeta(cuotas, tarjeta.id);
  return Math.max(0, redondear(limite - uso));
}

export function disponibleConSobregiroCuotasPopular(
  tarjeta: TarjetaCredito,
  cuotas: CuotaPopular[]
): number {
  const ext = tarjeta.extensionCuotasPopular;
  if (!ext) return 0;
  const limiteTotal = ext.limiteAprobado + (ext.sobregiro ?? 0);
  const uso = usoCuotasPopularTarjeta(cuotas, tarjeta.id);
  return Math.max(0, redondear(limiteTotal - uso));
}

export function cuotasVencidasPlan(
  cuota: CuotaPopular,
  tarjetas: TarjetaCredito[]
): number {
  if (cuotaPopularCompletada(cuota)) return 0;

  const diaPago = diaPagoCuota(cuota, tarjetas);
  const inicio = new Date(cuota.fechaInicio + "T12:00:00");
  const hoy = new Date();
  hoy.setHours(12, 0, 0, 0);

  let cuotasDebian = 0;
  let year = inicio.getFullYear();
  let month = inicio.getMonth();

  for (let i = 0; i < 600; i++) {
    const ultimoDia = new Date(year, month + 1, 0).getDate();
    const diaEfectivo = Math.min(diaPago, ultimoDia);
    const fechaPago = new Date(year, month, diaEfectivo);
    fechaPago.setHours(12, 0, 0, 0);

    if (fechaPago >= inicio && fechaPago <= hoy) {
      cuotasDebian++;
    }
    if (fechaPago > hoy) break;
    if (cuotasDebian >= cuota.cuotasTotales) break;

    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  return Math.max(0, cuotasDebian - cuota.cuotasPagadas);
}

export function cuotasVencidasTarjeta(
  cuotas: CuotaPopular[],
  tarjetaId: string,
  tarjetas: TarjetaCredito[]
): number {
  return cuotas
    .filter((c) => c.tarjetaId === tarjetaId && !cuotaPopularCompletada(c))
    .reduce((sum, c) => sum + cuotasVencidasPlan(c, tarjetas), 0);
}

export function pagoMinimoCuotasPopular(
  cuotas: CuotaPopular[],
  tarjetaId: string,
  transacciones: Transaccion[]
): number {
  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

  return redondear(
    cuotas
      .filter((c) => c.tarjetaId === tarjetaId && !cuotaPopularCompletada(c))
      .reduce((sum, c) => {
        const pagadoEsteMes = transacciones.some(
          (t) =>
            t.pagoCuotaPopularId === c.id && t.fecha.startsWith(mesActual)
        );
        return pagadoEsteMes ? sum : sum + c.montoCuota;
      }, 0)
  );
}

export function resumenEstadoCuotasPopular(
  tarjeta: TarjetaCredito,
  cuotas: CuotaPopular[],
  tarjetas: TarjetaCredito[],
  transacciones: Transaccion[]
): ResumenEstadoCuotasPopular | null {
  const ext = tarjeta.extensionCuotasPopular;
  if (!ext?.limiteAprobado) return null;

  const balanceFecha = usoCuotasPopularTarjeta(cuotas, tarjeta.id);
  const fechaCorte = proximoDiaDelMes(tarjeta.diaCorte);
  const fechaVencimiento = proximoDiaDelMes(tarjeta.diaPago);

  return {
    limiteAprobado: ext.limiteAprobado,
    balanceFecha,
    disponibleConSobregiro: disponibleConSobregiroCuotasPopular(tarjeta, cuotas),
    fechaCorte,
    balanceCorte: balanceFecha,
    pagoMinimo: pagoMinimoCuotasPopular(cuotas, tarjeta.id, transacciones),
    fechaVencimiento,
    cuotasVencidas: cuotasVencidasTarjeta(cuotas, tarjeta.id, tarjetas),
    numeroEnmascarado:
      ext.numeroEnmascarado ?? enmascararNumero("0000000000000000"),
    ultimosCuatro: ext.ultimosCuatro ?? "0000",
  };
}

export function obtenerTarjeta(
  cuota: CuotaPopular,
  tarjetas: TarjetaCredito[]
): TarjetaCredito | undefined {
  return tarjetas.find((t) => t.id === cuota.tarjetaId);
}

export function diaPagoCuota(
  cuota: CuotaPopular,
  tarjetas: TarjetaCredito[]
): number {
  return obtenerTarjeta(cuota, tarjetas)?.diaPago ?? 15;
}

export function nombreCuotaPopular(
  cuota: CuotaPopular,
  tarjetas: TarjetaCredito[]
): string {
  const tarjeta = obtenerTarjeta(cuota, tarjetas);
  const tarjetaLabel = tarjeta
    ? `${tarjeta.banco} ·••• ${tarjeta.ultimosCuatro}`
    : "Tarjeta";
  return `${cuota.descripcion} (${tarjetaLabel})`;
}

export function cuotaPopularCompletada(cuota: CuotaPopular): boolean {
  return cuota.cuotasPagadas >= cuota.cuotasTotales;
}

export function cuotasRestantesCuota(cuota: CuotaPopular): number {
  return Math.max(0, cuota.cuotasTotales - cuota.cuotasPagadas);
}

export function progresoCuotaPopular(cuota: CuotaPopular): number {
  if (cuota.cuotasTotales <= 0) return 0;
  return Math.min(100, (cuota.cuotasPagadas / cuota.cuotasTotales) * 100);
}

export function saldoPendienteCuota(cuota: CuotaPopular): number {
  return (
    Math.round(cuotasRestantesCuota(cuota) * cuota.montoCuota * 100) / 100
  );
}

export function totalAPagarCuota(cuota: CuotaPopular): number {
  return Math.round(cuota.montoCuota * cuota.cuotasTotales * 100) / 100;
}

export function totalInteresesCuota(cuota: CuotaPopular): number {
  return Math.max(
    0,
    Math.round((totalAPagarCuota(cuota) - cuota.montoCompra) * 100) / 100
  );
}

export function interesesPendientesCuota(cuota: CuotaPopular): number {
  if (cuota.cuotasTotales <= 0) return 0;
  const pendientes = cuotasRestantesCuota(cuota);
  const interesPorCuota = totalInteresesCuota(cuota) / cuota.cuotasTotales;
  return Math.round(pendientes * interesPorCuota * 100) / 100;
}

export function etiquetaTasaCuota(cuota: CuotaPopular): string {
  if (cuota.tasaInteres <= 0) return "Sin interés";
  const tipo = cuota.tipoTasa === "anual" ? "anual" : "mensual";
  return `${cuota.tasaInteres}% ${tipo}`;
}

export function quincenaDeCuotaPopular(
  cuota: CuotaPopular,
  tarjetas: TarjetaCredito[],
  configuracion: ConfiguracionUsuario,
  referencia: Date = new Date()
): string {
  const dia = diaPagoCuota(cuota, tarjetas);
  const anio = referencia.getFullYear();
  const mes = referencia.getMonth() + 1;
  const ultimoDia = new Date(anio, mes, 0).getDate();
  const fecha = `${anio}-${String(mes).padStart(2, "0")}-${String(Math.min(dia, ultimoDia)).padStart(2, "0")}`;
  const periodo = periodoDeFecha(fecha, configuracion.diasPago);
  return `Q${periodo.quincena}`;
}

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

export function cuotaPagadaEnPeriodo(
  cuotaId: string,
  transacciones: Transaccion[],
  periodo: PeriodoQuincena
): boolean {
  return transacciones.some(
    (t) =>
      t.pagoCuotaPopularId === cuotaId &&
      fechaEnPeriodo(t.fecha, periodo)
  );
}

export function calcularCuotasPopularEnPeriodo(
  cuotas: CuotaPopular[],
  tarjetas: TarjetaCredito[],
  periodo: PeriodoQuincena,
  transacciones: Transaccion[] = [],
  moneda?: string
): number {
  const cuotasFiltradas = moneda
    ? cuotas.filter((c) => c.moneda === moneda)
    : cuotas;
  return cuotasFiltradas.reduce((total, cuota) => {
    if (cuotaPopularCompletada(cuota)) return total;
    if (cuotaPagadaEnPeriodo(cuota.id, transacciones, periodo)) return total;
    const dia = diaPagoCuota(cuota, tarjetas);
    return pagoCaeEnPeriodo(dia, periodo) ? total + cuota.montoCuota : total;
  }, 0);
}

export function obtenerCuotasPopularDetalle(
  cuotas: CuotaPopular[],
  tarjetas: TarjetaCredito[],
  periodo: PeriodoQuincena,
  transacciones: Transaccion[] = []
): { nombre: string; monto: number; moneda: string; dia: number }[] {
  return cuotas
    .filter((c) => {
      if (cuotaPopularCompletada(c)) return false;
      if (cuotaPagadaEnPeriodo(c.id, transacciones, periodo)) return false;
      return pagoCaeEnPeriodo(diaPagoCuota(c, tarjetas), periodo);
    })
    .map((c) => ({
      nombre: nombreCuotaPopular(c, tarjetas),
      monto: c.montoCuota,
      moneda: c.moneda,
      dia: diaPagoCuota(c, tarjetas),
    }));
}
