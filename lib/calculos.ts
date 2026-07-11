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
import { fechaEnPeriodo } from "@/lib/quincenas";

export { obtenerCuotasPopularDetalle, obtenerGastosFijosDetalle };

export function calcularPagosTarjetasEnPeriodo(
  tarjetas: TarjetaCredito[],
  periodo: PeriodoQuincena
): number {
  const inicio = new Date(periodo.inicio);
  const fin = new Date(periodo.fin);

  return tarjetas.reduce((total, tarjeta) => {
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

export function calcularCuotasPrestamosEnPeriodo(
  prestamos: Prestamo[],
  periodo: PeriodoQuincena
): number {
  const inicio = new Date(periodo.inicio);
  const fin = new Date(periodo.fin);

  return prestamos.reduce((total, prestamo) => {
    if (prestamo.cuotasPagadas >= prestamo.cuotasTotales) return total;

    let cuotaEnPeriodo = false;
    const cursor = new Date(inicio);

    while (cursor <= fin) {
      const diaEfectivo = Math.min(
        prestamo.diaPago,
        new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
      );
      if (cursor.getDate() === diaEfectivo) {
        cuotaEnPeriodo = true;
        break;
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return cuotaEnPeriodo ? total + prestamo.montoCuota : total;
  }, 0);
}

export function calcularResumenQuincena(
  transacciones: Transaccion[],
  tarjetas: TarjetaCredito[],
  prestamos: Prestamo[],
  cuotasPopular: CuotaPopular[],
  gastosFijos: GastoFijo[],
  periodo: PeriodoQuincena
): ResumenQuincena {
  const transaccionesFiltradas = transacciones.filter((t) =>
    fechaEnPeriodo(t.fecha, periodo)
  );

  let ingresosTotales = 0;
  let gastosTotales = 0;

  transaccionesFiltradas.forEach((t) => {
    if (t.tipo === "ingreso") {
      ingresosTotales += t.monto;
    } else {
      gastosTotales += t.monto;
    }
  });

  const pagosTarjetas = calcularPagosTarjetasEnPeriodo(tarjetas, periodo);
  const cuotasPrestamos = calcularCuotasPrestamosEnPeriodo(prestamos, periodo);
  const cuotasPopularTotal = calcularCuotasPopularEnPeriodo(
    cuotasPopular,
    tarjetas,
    periodo,
    transacciones
  );
  const gastosFijosTotal = calcularGastosFijosEnPeriodo(gastosFijos, periodo);
  const balanceNeto = ingresosTotales - gastosTotales;
  const disponible =
    balanceNeto -
    pagosTarjetas -
    cuotasPrestamos -
    cuotasPopularTotal -
    gastosFijosTotal;

  return {
    ingresosTotales,
    gastosTotales,
    pagosTarjetas,
    cuotasPrestamos,
    cuotasPopular: cuotasPopularTotal,
    gastosFijos: gastosFijosTotal,
    balanceNeto,
    disponible,
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
  periodo: PeriodoQuincena
): Transaccion[] {
  return transacciones
    .filter((t) => fechaEnPeriodo(t.fecha, periodo))
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

export function obtenerCuotasPrestamosDetalle(
  prestamos: Prestamo[],
  periodo: PeriodoQuincena
): { nombre: string; monto: number; moneda: string; dia: number }[] {
  return prestamos
    .filter(
      (p) =>
        p.cuotasPagadas < p.cuotasTotales &&
        pagoCaeEnPeriodo(p.diaPago, periodo)
    )
    .map((p) => ({
      nombre: p.entidad,
      monto: p.montoCuota,
      moneda: p.moneda,
      dia: p.diaPago,
    }));
}
