import type { OrigenFondo, Transaccion } from "@/types/finanzas";
import { montoGastoIngresoEnMoneda, montoSalidaMovimiento } from "@/lib/cambio";

export type SeleccionFuenteHome =
  | { tipo: "efectivo" }
  | { tipo: "cuenta"; id: string }
  | { tipo: "tarjeta"; id: string };

export interface ResumenMensualHome {
  ingresos: number;
  gastos: number;
  movimientos: number;
}

function fuenteCoincide(
  origen: OrigenFondo,
  fuente: SeleccionFuenteHome
): boolean {
  if (fuente.tipo === "efectivo") return origen.tipo === "efectivo";
  return origen.tipo === fuente.tipo && origen.id === fuente.id;
}

function transaccionEnMes(fecha: string, mes: string): boolean {
  return fecha.startsWith(mes);
}

function montoMovimientoEnFuente(
  transaccion: Transaccion,
  fuente: SeleccionFuenteHome,
  moneda: string
): number | null {
  if (
    transaccion.tipo !== "transferencia" ||
    !transaccion.origen ||
    !transaccion.destino
  ) {
    return null;
  }

  const saleDeFuente = fuenteCoincide(transaccion.origen, fuente);
  const entraAFuente = fuenteCoincide(transaccion.destino, fuente);

  if (!saleDeFuente && !entraAFuente) return null;

  if (saleDeFuente) {
    const salida = montoSalidaMovimiento(transaccion, moneda);
    if (salida != null) return salida;
  }

  if (entraAFuente && transaccion.moneda === moneda) {
    return transaccion.monto;
  }

  return null;
}

function montoMovimientoGlobal(
  transaccion: Transaccion,
  moneda: string
): number | null {
  if (transaccion.tipo !== "transferencia") return null;

  const salida = montoSalidaMovimiento(transaccion, moneda);
  if (salida != null) return salida;

  if (transaccion.moneda === moneda) return transaccion.monto;

  return null;
}

export type FiltroDetalleHome = "ingresos" | "gastos" | "movimientos";

export function transaccionIncluidaEnResumenHome(
  transaccion: Transaccion,
  mes: string,
  moneda: string,
  fuente: SeleccionFuenteHome | null | undefined,
  filtro: FiltroDetalleHome
): boolean {
  if (!transaccionEnMes(transaccion.fecha, mes)) return false;

  if (filtro === "ingresos") {
    if (transaccion.tipo !== "ingreso") return false;
    if (fuente) {
      return !!(
        transaccion.origen &&
        fuenteCoincide(transaccion.origen, fuente) &&
        montoGastoIngresoEnMoneda(transaccion, moneda) != null
      );
    }
    return montoGastoIngresoEnMoneda(transaccion, moneda) != null;
  }

  if (filtro === "gastos") {
    if (transaccion.tipo !== "gasto") return false;
    if (fuente) {
      return !!(
        transaccion.origen &&
        fuenteCoincide(transaccion.origen, fuente) &&
        montoGastoIngresoEnMoneda(transaccion, moneda) != null
      );
    }
    return montoGastoIngresoEnMoneda(transaccion, moneda) != null;
  }

  if (transaccion.tipo !== "transferencia") return false;
  if (fuente) return montoMovimientoEnFuente(transaccion, fuente, moneda) != null;
  return montoMovimientoGlobal(transaccion, moneda) != null;
}

export function filtrarTransaccionesMensualHome(
  transacciones: Transaccion[],
  mes: string,
  moneda: string,
  fuente: SeleccionFuenteHome | null | undefined,
  filtro: FiltroDetalleHome
): Transaccion[] {
  return transacciones
    .filter((t) =>
      transaccionIncluidaEnResumenHome(t, mes, moneda, fuente, filtro)
    )
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function montoMostradoTransaccionHome(
  transaccion: Transaccion,
  moneda: string,
  fuente?: SeleccionFuenteHome | null
): { monto: number; moneda: string } {
  if (transaccion.tipo === "transferencia") {
    if (fuente) {
      const montoFuente = montoMovimientoEnFuente(transaccion, fuente, moneda);
      if (montoFuente != null) return { monto: montoFuente, moneda };
    }
    const salida = montoSalidaMovimiento(transaccion, moneda);
    if (salida != null) {
      return {
        monto: salida,
        moneda: transaccion.monedaOrigen ?? moneda,
      };
    }
    return { monto: transaccion.monto, moneda: transaccion.moneda };
  }

  const montoEnReferencia = montoGastoIngresoEnMoneda(transaccion, moneda);
  if (montoEnReferencia != null && transaccion.moneda !== moneda) {
    return { monto: montoEnReferencia, moneda };
  }

  return { monto: transaccion.monto, moneda: transaccion.moneda };
}

export function calcularResumenMensualHome(
  transacciones: Transaccion[],
  mes: string,
  moneda: string,
  fuente?: SeleccionFuenteHome | null
): ResumenMensualHome {
  let ingresos = 0;
  let gastos = 0;
  let movimientos = 0;

  transacciones
    .filter((t) => transaccionEnMes(t.fecha, mes))
    .forEach((t) => {
      if (fuente) {
        if (t.tipo === "ingreso" || t.tipo === "gasto") {
          if (!t.origen || !fuenteCoincide(t.origen, fuente)) return;
          const monto = montoGastoIngresoEnMoneda(t, moneda);
          if (monto == null) return;
          if (t.tipo === "ingreso") ingresos += monto;
          else gastos += monto;
        } else if (t.tipo === "transferencia") {
          const monto = montoMovimientoEnFuente(t, fuente, moneda);
          if (monto != null) movimientos += monto;
        }
        return;
      }

      if (t.tipo === "ingreso" || t.tipo === "gasto") {
        const monto = montoGastoIngresoEnMoneda(t, moneda);
        if (monto == null) return;
        if (t.tipo === "ingreso") ingresos += monto;
        else gastos += monto;
      } else if (t.tipo === "transferencia") {
        const monto = montoMovimientoGlobal(t, moneda);
        if (monto != null) movimientos += monto;
      }
    });

  return { ingresos, gastos, movimientos };
}

export function idSeleccionFuente(fuente: SeleccionFuenteHome): string {
  if (fuente.tipo === "efectivo") return "efectivo";
  return `${fuente.tipo}:${fuente.id}`;
}

export function seleccionDesdeId(
  id: string,
  cuentas: { id: string }[],
  tarjetas: { id: string }[]
): SeleccionFuenteHome | null {
  if (id === "efectivo") return { tipo: "efectivo" };
  if (id.startsWith("cuenta:")) {
    const cuentaId = id.slice(7);
    if (cuentas.some((c) => c.id === cuentaId)) return { tipo: "cuenta", id: cuentaId };
  }
  if (id.startsWith("tarjeta:")) {
    const tarjetaId = id.slice(8);
    if (tarjetas.some((t) => t.id === tarjetaId)) return { tipo: "tarjeta", id: tarjetaId };
  }
  return null;
}
