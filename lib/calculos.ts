import type {
  ConfiguracionUsuario,
  CuotaPopular,
  GastoFijo,
  PeriodoQuincena,
  Prestamo,
  ResumenQuincena,
  TarjetaCredito,
  Transaccion,
} from "@/types/finanzas";
import {
  calcularCuotasPopularEnPeriodo,
  obtenerCuotasPopularDetalle,
} from "@/lib/cuotas-popular";
import { calcularGastosFijosEnPeriodo, obtenerGastosFijosDetalle } from "@/lib/gastos-fijos";
import { montoPendienteAporteEnPeriodo, obtenerAporteIngreso } from "@/lib/aporte-ingreso";
import { calcularCuotasPrestamosEnPeriodo } from "@/lib/prestamos";
import { montoGastoIngresoEnMoneda, montoSalidaMovimiento } from "@/lib/cambio";
import { esPagoATarjeta } from "@/lib/transacciones";
import { fechaEnPeriodo } from "@/lib/quincenas";

export { obtenerProximosPagos } from "@/lib/proximos-pagos";

export { obtenerCuotasPopularDetalle, obtenerGastosFijosDetalle };

export function calcularPagosTarjetasEnPeriodo(
  tarjetas: TarjetaCredito[],
  periodo: PeriodoQuincena,
  moneda?: string
): number {
  const tarjetasFiltradas = moneda
    ? tarjetas.filter((t) => t.moneda === moneda)
    : tarjetas;
  const inicio = new Date(periodo.inicio);
  const fin = new Date(periodo.fin);

  return tarjetasFiltradas.reduce((total, tarjeta) => {
    if (tarjeta.deudaActual <= 0) return total;

    let pagoEnPeriodo = false;
    const cursor = new Date(inicio);

    while (cursor <= fin) {
      const diaEfectivo = Math.min(
        tarjeta.diaPago,
        new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
      );
      if (cursor.getDate() === diaEfectivo) {
        pagoEnPeriodo = true;
        break;
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return pagoEnPeriodo ? total + tarjeta.deudaActual : total;
  }, 0);
}

export { calcularCuotasPrestamosEnPeriodo };

export function transaccionEnPeriodoParaMoneda(
  transaccion: Transaccion,
  periodo: PeriodoQuincena,
  moneda?: string
): boolean {
  if (!fechaEnPeriodo(transaccion.fecha, periodo)) return false;
  if (!moneda) return true;
  if (transaccion.moneda === moneda) return true;
  if (
    transaccion.tipo === "transferencia" &&
    montoSalidaMovimiento(transaccion, moneda) != null
  ) {
    return true;
  }
  return false;
}

export function calcularMovimientosEnPeriodo(
  transacciones: Transaccion[],
  periodo: PeriodoQuincena,
  moneda?: string
): number {
  return transacciones
    .filter(
      (t) =>
        esPagoATarjeta(t) && fechaEnPeriodo(t.fecha, periodo)
    )
    .reduce((total, t) => {
      if (!moneda) return total + (t.montoOrigen ?? t.monto);
      const salida = montoSalidaMovimiento(t, moneda);
      return salida != null ? total + salida : total;
    }, 0);
}

export function calcularResumenQuincena(
  transacciones: Transaccion[],
  tarjetas: TarjetaCredito[],
  prestamos: Prestamo[],
  cuotasPopular: CuotaPopular[],
  gastosFijos: GastoFijo[],
  periodo: PeriodoQuincena,
  moneda?: string,
  configuracion?: ConfiguracionUsuario
): ResumenQuincena {
  const transaccionesFiltradas = transacciones.filter((t) =>
    transaccionEnPeriodoParaMoneda(t, periodo, moneda)
  );

  let ingresosTotales = 0;
  let gastosTotales = 0;

  transaccionesFiltradas.forEach((t) => {
    if (t.tipo === "ingreso" || t.tipo === "gasto") {
      const montoEnMoneda = moneda
        ? montoGastoIngresoEnMoneda(t, moneda)
        : t.monto;
      if (montoEnMoneda == null) return;
      if (t.tipo === "ingreso") ingresosTotales += montoEnMoneda;
      else gastosTotales += montoEnMoneda;
    }
  });

  const movimientosTotales = calcularMovimientosEnPeriodo(
    transacciones,
    periodo,
    moneda
  );

  const pagosTarjetas = calcularPagosTarjetasEnPeriodo(tarjetas, periodo, moneda);
  const cuotasPrestamos = calcularCuotasPrestamosEnPeriodo(
    prestamos,
    periodo,
    moneda,
    transacciones
  );
  const cuotasPopularTotal = calcularCuotasPopularEnPeriodo(
    cuotasPopular,
    tarjetas,
    periodo,
    transacciones,
    moneda
  );
  const gastosFijosRegulares = calcularGastosFijosEnPeriodo(
    gastosFijos,
    periodo,
    moneda,
    transacciones
  );
  const aporte = configuracion ? obtenerAporteIngreso(configuracion) : undefined;
  const aportePendiente =
    aporte && (!moneda || aporte.moneda === moneda)
      ? montoPendienteAporteEnPeriodo(transacciones, aporte, periodo)
      : 0;
  const gastosFijosTotal = gastosFijosRegulares + aportePendiente;
  const balanceNeto = ingresosTotales - gastosTotales;
  // movimientosTotales: pagos ya transferidos a tarjetas en el periodo.
  // pagosTarjetas: deuda actual aún pendiente con fecha de pago en el periodo.
  // Ambos se restan: no duplican porque pagosTarjetas usa deudaActual (0 si ya pagaste).
  const disponibleProyectado =
    balanceNeto -
    movimientosTotales -
    pagosTarjetas -
    cuotasPrestamos -
    cuotasPopularTotal -
    gastosFijosTotal;
  const disponible = ingresosTotales > 0 ? disponibleProyectado : 0;

  return {
    ingresosTotales,
    gastosTotales,
    movimientosTotales,
    pagosTarjetas,
    cuotasPrestamos,
    cuotasPopular: cuotasPopularTotal,
    gastosFijos: gastosFijosTotal,
    balanceNeto,
    disponible,
    disponibleProyectado,
  };
}

export function pagoCaeEnPeriodo(diaPago: number, periodo: PeriodoQuincena): boolean {
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

export function obtenerTransaccionesEnPeriodo(
  transacciones: Transaccion[],
  periodo: PeriodoQuincena,
  moneda?: string
): Transaccion[] {
  return transacciones
    .filter((t) => transaccionEnPeriodoParaMoneda(t, periodo, moneda))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function obtenerPagosTarjetasDetalle(
  tarjetas: TarjetaCredito[],
  periodo: PeriodoQuincena
): { nombre: string; monto: number; moneda: string; dia: number }[] {
  return tarjetas
    .filter((t) => t.deudaActual > 0 && pagoCaeEnPeriodo(t.diaPago, periodo))
    .map((t) => ({
      nombre: `${t.banco} · ${t.nombreTarjeta}`,
      monto: t.deudaActual,
      moneda: t.moneda,
      dia: t.diaPago,
    }));
}

