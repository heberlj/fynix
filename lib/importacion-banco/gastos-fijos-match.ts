import type { GastoFijo, Transaccion } from "@/types/finanzas";
import type { MovimientoBancoPendiente } from "@/types/importacion-banco";
import {
  gastoFijoPagable,
  montoPendienteGastoFijoEnPeriodo,
} from "@/lib/gastos-fijos";
import { periodoDeFecha } from "@/lib/quincenas";

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function palabrasSignificativas(texto: string): string[] {
  const stop = new Set([
    "de",
    "la",
    "el",
    "los",
    "las",
    "en",
    "por",
    "pago",
    "cargo",
    "abono",
    "rd",
    "dop",
    "usd",
  ]);
  return normalizar(texto)
    .split(" ")
    .filter((p) => p.length > 2 && !stop.has(p));
}

function puntajeCoincidenciaGastoFijo(
  mov: MovimientoBancoPendiente,
  gasto: GastoFijo
): number {
  let puntaje = 0;
  const desc = normalizar(mov.descripcion);
  const nombre = normalizar(gasto.nombre);

  if (desc.includes(nombre) || nombre.includes(desc)) {
    puntaje += 50;
  }

  const palabrasNombre = palabrasSignificativas(gasto.nombre);
  const coincidencias = palabrasNombre.filter((p) => desc.includes(p));
  puntaje += coincidencias.length * 15;

  if (Math.abs(gasto.monto - mov.monto) < 0.01) {
    puntaje += 30;
  } else if (Math.abs(gasto.monto - mov.monto) / gasto.monto < 0.05) {
    puntaje += 10;
  } else {
    return 0;
  }

  if (gasto.moneda !== mov.moneda) return 0;

  return puntaje;
}

export function sugerirGastoFijoEnImportacion(
  mov: MovimientoBancoPendiente,
  gastosFijos: GastoFijo[],
  transacciones: Transaccion[],
  diasPago: [number, number]
): { gastoFijoId: string; nombre: string; puntaje: number } | null {
  if (mov.tipo !== "gasto") return null;

  const periodo = periodoDeFecha(mov.fecha, diasPago);
  let mejor: { gastoFijoId: string; nombre: string; puntaje: number } | null =
    null;

  for (const gasto of gastosFijos) {
    if (!gastoFijoPagable(gasto)) continue;
    const pendiente = montoPendienteGastoFijoEnPeriodo(
      gasto,
      transacciones,
      periodo
    );
    if (pendiente <= 0) continue;

    const puntaje = puntajeCoincidenciaGastoFijo(mov, gasto);
    if (puntaje < 40) continue;

    if (!mejor || puntaje > mejor.puntaje) {
      mejor = { gastoFijoId: gasto.id, nombre: gasto.nombre, puntaje };
    }
  }

  return mejor;
}

export function aplicarSugerenciaGastoFijo(
  mov: MovimientoBancoPendiente,
  gastosFijos: GastoFijo[],
  transacciones: Transaccion[],
  diasPago: [number, number]
): MovimientoBancoPendiente {
  if (mov.tipo === "transferencia") return mov;

  const sugerencia = sugerirGastoFijoEnImportacion(
    mov,
    gastosFijos,
    transacciones,
    diasPago
  );
  if (!sugerencia) return mov;

  const gasto = gastosFijos.find((g) => g.id === sugerencia.gastoFijoId);
  if (!gasto) return mov;

  return {
    ...mov,
    gastoFijoId: sugerencia.gastoFijoId,
    gastoFijoSugeridoId: sugerencia.gastoFijoId,
    categoria: gasto.categoria,
    categoriaInicial: gasto.categoria,
    sugerencia: `Gasto fijo: ${sugerencia.nombre}`,
  };
}
