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
  diaPagoCuota,
  nombreCuotaPopular,
  obtenerCuotasPopularDetalle,
} from "@/lib/cuotas-popular";
import { calcularGastosFijosEnPeriodo, obtenerGastosFijosDetalle } from "@/lib/gastos-fijos";
import { calcularCuotasPrestamosEnPeriodo } from "@/lib/prestamos";
import { montoGastoIngresoEnMoneda, montoSalidaMovimiento } from "@/lib/cambio";
import { esPagoATarjeta } from "@/lib/transacciones";
import { fechaEnPeriodo } from "@/lib/quincenas";

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
  moneda?: string
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
  const gastosFijosTotal = calcularGastosFijosEnPeriodo(
    gastosFijos,
    periodo,
    moneda,
    transacciones
  );
  const balanceNeto = ingresosTotales - gastosTotales;
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

export function obtenerProximosPagos(
  tarjetas: TarjetaCredito[],
  prestamos: Prestamo[],
  cuotasPopular: CuotaPopular[],
  gastosFijos: GastoFijo[],
  desde: Date = new Date()
): {
  tipo: "tarjeta" | "prestamo" | "cuota-popular" | "gasto-fijo";
  nombre: string;
  monto: number;
  dia: number;
}[] {
  const pagos: {
    tipo: "tarjeta" | "prestamo" | "cuota-popular" | "gasto-fijo";
    nombre: string;
    monto: number;
    dia: number;
  }[] = [];

  tarjetas.forEach((t) => {
    if (t.deudaActual > 0) {
      pagos.push({
        tipo: "tarjeta",
        nombre: `${t.banco} · ${t.nombreTarjeta}`,
        monto: t.deudaActual,
        dia: t.diaPago,
      });
    }
  });

  prestamos.forEach((p) => {
    if (p.cuotasPagadas < p.cuotasTotales) {
      pagos.push({
        tipo: "prestamo",
        nombre: p.entidad,
        monto: p.montoCuota,
        dia: p.diaPago,
      });
    }
  });

  cuotasPopular.forEach((c) => {
    if (c.cuotasPagadas < c.cuotasTotales) {
      pagos.push({
        tipo: "cuota-popular",
        nombre: nombreCuotaPopular(c, tarjetas),
        monto: c.montoCuota,
        dia: diaPagoCuota(c, tarjetas),
      });
    }
  });

  gastosFijos.forEach((g) => {
    if (g.activo) {
      pagos.push({
        tipo: "gasto-fijo",
        nombre: g.nombre,
        monto: g.monto,
        dia: g.diaPago,
      });
    }
  });

  const diaHoy = desde.getDate();
  return pagos.sort((a, b) => {
    const distA = a.dia >= diaHoy ? a.dia - diaHoy : a.dia + 30 - diaHoy;
    const distB = b.dia >= diaHoy ? b.dia - diaHoy : b.dia + 30 - diaHoy;
    return distA - distB;
  });
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

