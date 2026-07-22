import type {
  CuentaBancaria,
  OrigenFondo,
  TarjetaCredito,
  Transaccion,
} from "@/types/finanzas";
import { CATEGORIA_TRANSFERENCIA_CUENTAS } from "@/types/finanzas";
import type { MovimientoBancoPendiente } from "@/types/importacion-banco";
import { codificarOrigen } from "@/lib/transacciones";

const PATRONES_TRANSFERENCIA = [
  /transfer/i,
  /\btransf\b/i,
  /entre\s*cuentas/i,
  /pago\s*(de\s*)?tarjeta/i,
  /\bpago\s*tc\b/i,
  /pago\s*tdc/i,
  /abono\s*(a\s*)?tarjeta/i,
  /movimiento\s*entre/i,
  /envio\s*a\s*cuenta/i,
  /recibido\s*de\s*cuenta/i,
];

const DIAS_TOLERANCIA_PAREJA = 3;

function fechasCercanas(fechaA: string, fechaB: string, dias: number): boolean {
  const a = new Date(fechaA + "T12:00:00").getTime();
  const b = new Date(fechaB + "T12:00:00").getTime();
  const diff = Math.abs(a - b) / (1000 * 60 * 60 * 24);
  return diff <= dias;
}

function mismoOrigen(a: OrigenFondo, b: OrigenFondo): boolean {
  if (a.tipo !== b.tipo) return false;
  if (a.tipo === "efectivo" || b.tipo === "efectivo") return a.tipo === b.tipo;
  return a.id === b.id;
}

export function pareceTransferencia(descripcion: string): boolean {
  return PATRONES_TRANSFERENCIA.some((p) => p.test(descripcion));
}

export function inferirDestinoTransferencia(
  descripcion: string,
  origen: OrigenFondo,
  cuentas: CuentaBancaria[],
  tarjetas: TarjetaCredito[]
): OrigenFondo | null {
  const texto = descripcion.toLowerCase();

  for (const tarjeta of tarjetas) {
    if (origen.tipo === "tarjeta" && origen.id === tarjeta.id) continue;
    if (tarjeta.ultimosCuatro && texto.includes(tarjeta.ultimosCuatro)) {
      return { tipo: "tarjeta", id: tarjeta.id };
    }
    const nombre = tarjeta.nombreTarjeta.toLowerCase();
    if (nombre.length > 3 && texto.includes(nombre)) {
      return { tipo: "tarjeta", id: tarjeta.id };
    }
    const banco = tarjeta.banco.toLowerCase();
    if (
      /tarjeta|tdc|tc\b|credito/i.test(texto) &&
      texto.includes(banco.split(" ")[0])
    ) {
      return { tipo: "tarjeta", id: tarjeta.id };
    }
  }

  for (const cuenta of cuentas) {
    if (origen.tipo === "cuenta" && origen.id === cuenta.id) continue;
    if (cuenta.ultimosCuatro && texto.includes(cuenta.ultimosCuatro)) {
      return { tipo: "cuenta", id: cuenta.id };
    }
    const nombre = cuenta.nombre.toLowerCase();
    if (nombre.length > 3 && texto.includes(nombre)) {
      return { tipo: "cuenta", id: cuenta.id };
    }
  }

  if (/tarjeta|tdc|tc\b/i.test(texto) && tarjetas.length === 1) {
    const t = tarjetas[0];
    if (!(origen.tipo === "tarjeta" && origen.id === t.id)) {
      return { tipo: "tarjeta", id: t.id };
    }
  }

  return null;
}

export interface ParejaTransferenciaExistente {
  transaccionId: string;
  origen: OrigenFondo;
  destino: OrigenFondo;
  etiquetaDestino: string;
}

export function buscarParejaTransferenciaExistente(
  mov: MovimientoBancoPendiente,
  origenImportacion: OrigenFondo,
  transacciones: Transaccion[],
  cuentas: CuentaBancaria[],
  tarjetas: TarjetaCredito[]
): ParejaTransferenciaExistente | null {
  if (mov.tipo !== "ingreso" && mov.tipo !== "gasto") return null;

  const tipoOpuesto = mov.tipo === "gasto" ? "ingreso" : "gasto";

  for (const t of transacciones) {
    if (t.tipo !== tipoOpuesto) continue;
    if (!t.origen) continue;
    if (t.moneda !== mov.moneda) continue;
    if (Math.abs(t.monto - mov.monto) > 0.01) continue;
    if (!fechasCercanas(t.fecha, mov.fecha, DIAS_TOLERANCIA_PAREJA)) continue;
    if (mismoOrigen(t.origen, origenImportacion)) continue;

    const origen =
      mov.tipo === "gasto" ? origenImportacion : t.origen;
    const destino =
      mov.tipo === "gasto" ? t.origen : origenImportacion;

    return {
      transaccionId: t.id,
      origen,
      destino,
      etiquetaDestino: etiquetaOrigen(destino, cuentas, tarjetas),
    };
  }

  return null;
}

function etiquetaOrigen(
  origen: OrigenFondo,
  cuentas: CuentaBancaria[],
  tarjetas: TarjetaCredito[]
): string {
  if (origen.tipo === "cuenta") {
    const c = cuentas.find((x) => x.id === origen.id);
    return c ? `${c.banco} · ${c.nombre}` : "otra cuenta";
  }
  if (origen.tipo === "tarjeta") {
    const t = tarjetas.find((x) => x.id === origen.id);
    return t ? `${t.banco} · ${t.nombreTarjeta}` : "otra tarjeta";
  }
  return "otro origen";
}

export function aplicarSugerenciaTransferencia(
  mov: MovimientoBancoPendiente,
  origenImportacion: OrigenFondo,
  cuentas: CuentaBancaria[],
  tarjetas: TarjetaCredito[],
  transacciones: Transaccion[]
): MovimientoBancoPendiente {
  const pareja = buscarParejaTransferenciaExistente(
    mov,
    origenImportacion,
    transacciones,
    cuentas,
    tarjetas
  );

  if (pareja) {
    return {
      ...mov,
      tipo: "transferencia",
      categoria: CATEGORIA_TRANSFERENCIA_CUENTAS,
      categoriaInicial: CATEGORIA_TRANSFERENCIA_CUENTAS,
      destinoValor: codificarOrigen(pareja.destino),
      parejaExistenteId: pareja.transaccionId,
      reemplazarPareja: true,
      seleccionado: false,
      sugerencia: `Transferencia con ${pareja.etiquetaDestino} (ya registrada)`,
    };
  }

  if (!pareceTransferencia(mov.descripcion)) {
    return mov;
  }

  const destino = inferirDestinoTransferencia(
    mov.descripcion,
    origenImportacion,
    cuentas,
    tarjetas
  );

  if (!destino) {
    return {
      ...mov,
      tipo: "transferencia",
      categoria: CATEGORIA_TRANSFERENCIA_CUENTAS,
      categoriaInicial: CATEGORIA_TRANSFERENCIA_CUENTAS,
      seleccionado: false,
      sugerencia: "Transferencia — elige destino",
    };
  }

  return {
    ...mov,
    tipo: "transferencia",
    categoria: CATEGORIA_TRANSFERENCIA_CUENTAS,
    categoriaInicial: CATEGORIA_TRANSFERENCIA_CUENTAS,
    destinoValor: codificarOrigen(destino),
    sugerencia: `Transferencia → ${etiquetaOrigen(destino, cuentas, tarjetas)}`,
  };
}
