import type {
  CuentaBancaria,
  EstadoFinanzas,
  OrigenFondo,
  TarjetaCredito,
  Transaccion,
} from "@/types/finanzas";

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Delta para cuentas y efectivo: positivo suma, negativo resta */
function deltaLiquido(
  transaccion: Pick<Transaccion, "tipo" | "monto">,
  direccion: 1 | -1
): number {
  const signo = transaccion.tipo === "ingreso" ? 1 : -1;
  return redondear(signo * transaccion.monto * direccion);
}

/** Delta para deuda de tarjeta: gasto aumenta deuda, ingreso la reduce */
function deltaDeuda(
  transaccion: Pick<Transaccion, "tipo" | "monto">,
  direccion: 1 | -1
): number {
  const signo = transaccion.tipo === "gasto" ? 1 : -1;
  return redondear(signo * transaccion.monto * direccion);
}

export function aplicarEfectoTransaccion(
  estado: EstadoFinanzas,
  transaccion: Pick<
    Transaccion,
    | "tipo"
    | "monto"
    | "montoOrigen"
    | "origen"
    | "destino"
    | "modoPagoTarjeta"
  >,
  direccion: 1 | -1
): EstadoFinanzas {
  if (!transaccion.origen) return estado;

  if (transaccion.tipo === "transferencia") {
    if (!transaccion.destino) return estado;

    const montoDestino = redondear(transaccion.monto * direccion);
    const montoDebitoOrigen = redondear(
      (transaccion.montoOrigen ?? transaccion.monto) * direccion
    );
    let result = estado;

    if (transaccion.origen.tipo === "efectivo") {
      result = {
        ...result,
        efectivo: redondear(result.efectivo - montoDebitoOrigen),
      };
    } else if (transaccion.origen.tipo === "cuenta") {
      const cuentaId = transaccion.origen.id;
      result = {
        ...result,
        cuentas: result.cuentas.map((c) =>
          c.id === cuentaId
            ? { ...c, saldoActual: redondear(c.saldoActual - montoDebitoOrigen) }
            : c
        ),
      };
    }

    if (transaccion.destino.tipo === "tarjeta") {
      const tarjetaId = transaccion.destino.id;
      result = {
        ...result,
        tarjetas: result.tarjetas.map((t) =>
          t.id === tarjetaId
            ? {
                ...t,
                deudaActual: Math.max(0, redondear(t.deudaActual - montoDestino)),
              }
            : t
        ),
      };
    } else if (transaccion.destino.tipo === "efectivo") {
      result = {
        ...result,
        efectivo: redondear(result.efectivo + montoDestino),
      };
    } else if (transaccion.destino.tipo === "cuenta") {
      const cuentaId = transaccion.destino.id;
      result = {
        ...result,
        cuentas: result.cuentas.map((c) =>
          c.id === cuentaId
            ? { ...c, saldoActual: redondear(c.saldoActual + montoDestino) }
            : c
        ),
      };
    }

    return result;
  }

  const { origen } = transaccion;

  if (
    origen.tipo === "tarjeta" &&
    transaccion.tipo === "gasto" &&
    transaccion.modoPagoTarjeta === "cuotas-popular"
  ) {
    return estado;
  }

  if (origen.tipo === "efectivo") {
    return {
      ...estado,
      efectivo: redondear(estado.efectivo + deltaLiquido(transaccion, direccion)),
    };
  }

  if (origen.tipo === "cuenta") {
    const delta = deltaLiquido(transaccion, direccion);
    return {
      ...estado,
      cuentas: estado.cuentas.map((c) =>
        c.id === origen.id
          ? { ...c, saldoActual: redondear(c.saldoActual + delta) }
          : c
      ),
    };
  }

  const delta = deltaDeuda(transaccion, direccion);
  return {
    ...estado,
    tarjetas: estado.tarjetas.map((t) =>
      t.id === origen.id
        ? { ...t, deudaActual: Math.max(0, redondear(t.deudaActual + delta)) }
        : t
    ),
  };
}

export function esPagoATarjeta(
  transaccion: Pick<Transaccion, "tipo" | "destino">
): boolean {
  return (
    transaccion.tipo === "transferencia" &&
    transaccion.destino?.tipo === "tarjeta"
  );
}

export function origenPorDefectoPago(
  cuentas: CuentaBancaria[],
  moneda: string
): OrigenFondo {
  const cuenta = cuentas.find((c) => c.moneda === moneda) ?? cuentas[0];
  if (cuenta) return { tipo: "cuenta", id: cuenta.id };
  return { tipo: "efectivo" };
}

export function monedaDeOrigen(
  origen: OrigenFondo,
  cuentas: CuentaBancaria[],
  tarjetas: TarjetaCredito[],
  monedaDefecto: string
): string {
  if (origen.tipo === "cuenta") {
    return cuentas.find((c) => c.id === origen.id)?.moneda ?? monedaDefecto;
  }
  if (origen.tipo === "tarjeta") {
    return tarjetas.find((t) => t.id === origen.id)?.moneda ?? monedaDefecto;
  }
  return monedaDefecto;
}

export function codificarOrigen(origen: OrigenFondo): string {
  if (origen.tipo === "efectivo") return "efectivo";
  return `${origen.tipo}:${origen.id}`;
}

export function decodificarOrigen(valor: string): OrigenFondo | null {
  if (valor === "efectivo") return { tipo: "efectivo" };
  const [tipo, id] = valor.split(":");
  if ((tipo === "cuenta" || tipo === "tarjeta") && id) {
    return { tipo, id };
  }
  return null;
}

export function etiquetaOrigen(
  origen: OrigenFondo | undefined,
  cuentas: CuentaBancaria[],
  tarjetas: TarjetaCredito[],
  modoPagoTarjeta?: Transaccion["modoPagoTarjeta"]
): string {
  if (!origen) return "Sin origen";
  if (origen.tipo === "efectivo") return "Efectivo";

  if (origen.tipo === "cuenta") {
    const cuenta = cuentas.find((c) => c.id === origen.id);
    if (!cuenta) return "Cuenta eliminada";
    const ultimos = cuenta.ultimosCuatro ? ` ·••• ${cuenta.ultimosCuatro}` : "";
    return `${cuenta.banco} · ${cuenta.nombre}${ultimos}`;
  }

  const tarjeta = tarjetas.find((t) => t.id === origen.id);
  if (!tarjeta) return "Tarjeta eliminada";
  const sufijo =
    modoPagoTarjeta === "cuotas-popular" ? " · Cuotas Popular" : "";
  return `${tarjeta.banco} · ${tarjeta.nombreTarjeta} ·••• ${tarjeta.ultimosCuatro}${sufijo}`;
}

export function etiquetaTransferencia(
  origen: OrigenFondo,
  destino: OrigenFondo,
  cuentas: CuentaBancaria[],
  tarjetas: TarjetaCredito[]
): string {
  return `${etiquetaOrigen(origen, cuentas, tarjetas)} → ${etiquetaOrigen(destino, cuentas, tarjetas)}`;
}
