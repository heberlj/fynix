import type { Transaccion } from "@/types/finanzas";
import { esPagoATarjeta } from "@/lib/transacciones";

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

export function movimientoConCambio(
  monedaOrigen: string,
  monedaDestino: string
): boolean {
  return monedaOrigen !== monedaDestino;
}

/** Unidades de monedaOrigen por 1 unidad de monedaDestino */
export function calcularMontoOrigen(
  montoDestino: number,
  tasaCambio: number
): number {
  return redondear(montoDestino * tasaCambio);
}

export function etiquetaTasaCambio(
  monedaOrigen: string,
  monedaDestino: string
): string {
  return `${monedaOrigen} por 1 ${monedaDestino}`;
}

/** Monto de gasto/ingreso contabilizado en monedaReferencia */
export function montoGastoIngresoEnMoneda(
  transaccion: Pick<
    Transaccion,
    "tipo" | "monto" | "moneda" | "montoOrigen" | "monedaOrigen"
  >,
  monedaReferencia: string
): number | null {
  if (transaccion.tipo !== "gasto" && transaccion.tipo !== "ingreso") {
    return null;
  }
  if (transaccion.moneda === monedaReferencia) {
    return transaccion.monto;
  }
  if (
    transaccion.monedaOrigen === monedaReferencia &&
    transaccion.montoOrigen != null
  ) {
    return transaccion.montoOrigen;
  }
  return null;
}

/** Monto que sale del origen, expresado en monedaReferencia (para totales) */
export function montoSalidaMovimiento(
  transaccion: Pick<
    Transaccion,
    "tipo" | "monto" | "moneda" | "montoOrigen" | "monedaOrigen"
  >,
  monedaReferencia: string
): number | null {
  if (transaccion.tipo !== "transferencia") return null;

  if (
    transaccion.monedaOrigen === monedaReferencia &&
    transaccion.montoOrigen != null
  ) {
    return transaccion.montoOrigen;
  }

  if (
    transaccion.moneda === monedaReferencia &&
    (transaccion.montoOrigen == null ||
      transaccion.monedaOrigen === monedaReferencia)
  ) {
    return transaccion.montoOrigen ?? transaccion.monto;
  }

  return null;
}

export function totalesTransaccionesEnMoneda(
  transacciones: Transaccion[],
  monedaReferencia: string
): { ingresos: number; gastos: number; movimientos: number; balance: number } {
  let ingresos = 0;
  let gastos = 0;
  let movimientos = 0;

  transacciones.forEach((t) => {
    if (t.tipo === "ingreso") {
      const monto = montoGastoIngresoEnMoneda(t, monedaReferencia);
      if (monto != null) ingresos += monto;
    } else if (t.tipo === "gasto") {
      const monto = montoGastoIngresoEnMoneda(t, monedaReferencia);
      if (monto != null) gastos += monto;
    } else if (t.tipo === "transferencia" && esPagoATarjeta(t)) {
      const salida = montoSalidaMovimiento(t, monedaReferencia);
      if (salida != null) movimientos += salida;
    }
  });

  return {
    ingresos,
    gastos,
    movimientos,
    balance: ingresos - gastos - movimientos,
  };
}
