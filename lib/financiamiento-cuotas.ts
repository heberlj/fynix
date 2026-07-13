import type {
  ConfiguracionUsuario,
  EstadoFinanzas,
  FinanciamientoCuotas,
  GastoFijo,
  ProductoFinanciamientoActivo,
  ProductoFinanciamientoCuotas,
  TarjetaCredito,
} from "@/types/finanzas";
import { tipoPresupuestoPorDefecto } from "@/lib/gastos-fijos";
import { generarId } from "@/lib/storage";

export const PRODUCTOS_FINANCIAMIENTO: {
  valor: ProductoFinanciamientoCuotas;
  etiqueta: string;
}[] = [
  { valor: "ninguna", etiqueta: "Ninguna (compra normal)" },
  { valor: "cuotas-popular", etiqueta: "Cuotas Popular" },
  { valor: "cuotas-bhd", etiqueta: "Cuotas BHD" },
  { valor: "credimas", etiqueta: "Credimás" },
];

function acotarDia(dia: number): number {
  return Math.min(31, Math.max(1, Math.round(dia)));
}

export function etiquetaProductoFinanciamiento(
  producto: ProductoFinanciamientoCuotas
): string {
  return (
    PRODUCTOS_FINANCIAMIENTO.find((p) => p.valor === producto)?.etiqueta ??
    producto
  );
}

export function productoFinanciamientoActivo(
  producto: ProductoFinanciamientoCuotas
): producto is ProductoFinanciamientoActivo {
  return producto !== "ninguna";
}

/**
 * Asigna la quincena según el día de vencimiento y los cobros del 15 y 30.
 * Día 1–24 → Q1 (se paga con ingresos del 15).
 * Día 25–fin de mes → Q2 (se paga con ingresos del 30).
 */
export function quincenaDeVencimientoFinanciamiento(diaPago: number): 1 | 2 {
  const dia = acotarDia(diaPago);
  return dia <= 24 ? 1 : 2;
}

export function etiquetaQuincenaVencimiento(diaPago: number): string {
  const q = quincenaDeVencimientoFinanciamiento(diaPago);
  return q === 1
    ? "Quincena 1 (cobro del día 15)"
    : "Quincena 2 (cobro del día 30)";
}

export function financiamientoPorDefecto(
  diaCorte = 15,
  diaPago = 30
): FinanciamientoCuotas {
  return {
    producto: "ninguna",
    limiteAprobado: 0,
    balancePendiente: 0,
    montoCuotaMensual: 0,
    diaCorte: acotarDia(diaCorte),
    diaPago: acotarDia(diaPago),
  };
}

/** Lee financiamiento guardado o migra desde extensionCuotasPopular */
export function obtenerFinanciamientoTarjeta(
  tarjeta: TarjetaCredito
): FinanciamientoCuotas {
  if (tarjeta.financiamientoCuotas) {
    const f = tarjeta.financiamientoCuotas;
    return {
      ...f,
      diaCorte: acotarDia(f.diaCorte),
      diaPago: acotarDia(f.diaPago),
    };
  }

  const ext = tarjeta.extensionCuotasPopular;
  if (ext && ext.limiteAprobado > 0) {
    return {
      producto: "cuotas-popular",
      limiteAprobado: ext.limiteAprobado,
      balancePendiente: 0,
      montoCuotaMensual: 0,
      diaCorte: tarjeta.diaCorte,
      diaPago: tarjeta.diaPago,
    };
  }

  return financiamientoPorDefecto(tarjeta.diaCorte, tarjeta.diaPago);
}

export function tarjetaTieneFinanciamientoActivo(tarjeta: TarjetaCredito): boolean {
  const f = obtenerFinanciamientoTarjeta(tarjeta);
  return productoFinanciamientoActivo(f.producto) && f.montoCuotaMensual > 0;
}

export function nombreGastoFijoFinanciamiento(
  producto: ProductoFinanciamientoActivo,
  tarjeta: Pick<TarjetaCredito, "nombreTarjeta" | "banco">
): string {
  return `${etiquetaProductoFinanciamiento(producto)} · ${tarjeta.nombreTarjeta}`;
}

export function notasGastoFijoFinanciamiento(
  financiamiento: FinanciamientoCuotas,
  tarjeta: Pick<TarjetaCredito, "banco" | "moneda">
): string {
  return [
    `Auto desde ${tarjeta.banco}`,
    `Límite: ${financiamiento.limiteAprobado.toFixed(2)} ${tarjeta.moneda}`,
    `Balance: ${financiamiento.balancePendiente.toFixed(2)} ${tarjeta.moneda}`,
    `Corte día ${financiamiento.diaCorte}`,
  ].join(" · ");
}

export function datosGastoFijoDesdeFinanciamiento(
  tarjeta: TarjetaCredito,
  financiamiento: FinanciamientoCuotas,
  _configuracion: ConfiguracionUsuario
): Omit<GastoFijo, "id"> {
  const producto = financiamiento.producto as ProductoFinanciamientoActivo;
  const categoria = "Compras";

  return {
    nombre: nombreGastoFijoFinanciamiento(producto, tarjeta),
    monto: financiamiento.montoCuotaMensual,
    categoria,
    diaPago: financiamiento.diaPago,
    quincena: quincenaDeVencimientoFinanciamiento(financiamiento.diaPago),
    moneda: tarjeta.moneda,
    activo: financiamiento.balancePendiente > 0 || financiamiento.montoCuotaMensual > 0,
    notas: notasGastoFijoFinanciamiento(financiamiento, tarjeta),
    tipoPresupuesto: tipoPresupuestoPorDefecto(categoria),
    tarjetaFinanciamientoId: tarjeta.id,
    productoFinanciamiento: producto,
  };
}

function gastoVinculadoFinanciamiento(
  gastos: GastoFijo[],
  tarjetaId: string,
  gastoFijoId?: string
): GastoFijo | undefined {
  if (gastoFijoId) {
    return gastos.find((g) => g.id === gastoFijoId);
  }
  return gastos.find((g) => g.tarjetaFinanciamientoId === tarjetaId);
}

/** Sincroniza gastos fijos tras crear o actualizar una tarjeta con financiamiento */
export function sincronizarGastoFijoFinanciamiento(
  estado: EstadoFinanzas,
  tarjeta: TarjetaCredito,
  financiamiento: FinanciamientoCuotas
): { gastosFijos: GastoFijo[]; financiamiento: FinanciamientoCuotas } {
  const producto = financiamiento.producto;
  let gastosFijos = [...estado.gastosFijos];
  const existente = gastoVinculadoFinanciamiento(
    gastosFijos,
    tarjeta.id,
    financiamiento.gastoFijoId
  );

  if (!productoFinanciamientoActivo(producto)) {
    if (existente) {
      gastosFijos = gastosFijos.filter((g) => g.id !== existente.id);
    }
    return {
      gastosFijos,
      financiamiento: { ...financiamiento, gastoFijoId: undefined },
    };
  }

  if (financiamiento.montoCuotaMensual <= 0) {
    return { gastosFijos, financiamiento };
  }

  const datos = datosGastoFijoDesdeFinanciamiento(
    tarjeta,
    financiamiento,
    estado.configuracion
  );

  if (existente) {
    gastosFijos = gastosFijos.map((g) =>
      g.id === existente.id
        ? {
            ...g,
            ...datos,
            id: g.id,
          }
        : g
    );
    return {
      gastosFijos,
      financiamiento: { ...financiamiento, gastoFijoId: existente.id },
    };
  }

  const nuevoId = generarId();
  gastosFijos = [...gastosFijos, { ...datos, id: nuevoId }];
  return {
    gastosFijos,
    financiamiento: { ...financiamiento, gastoFijoId: nuevoId },
  };
}

export function eliminarGastosFijosDeTarjeta(
  gastosFijos: GastoFijo[],
  tarjetaId: string
): GastoFijo[] {
  return gastosFijos.filter((g) => g.tarjetaFinanciamientoId !== tarjetaId);
}

export function validarFinanciamientoCuotas(
  financiamiento: FinanciamientoCuotas
): string | null {
  if (!productoFinanciamientoActivo(financiamiento.producto)) {
    return null;
  }

  if (financiamiento.limiteAprobado <= 0) {
    return "Ingresa un límite aprobado válido para el plan de cuotas";
  }
  if (financiamiento.balancePendiente < 0) {
    return "El balance no puede ser negativo";
  }
  if (financiamiento.balancePendiente > financiamiento.limiteAprobado) {
    return "El balance no puede superar el límite aprobado";
  }
  if (financiamiento.montoCuotaMensual <= 0) {
    return "Ingresa el monto de la cuota mensual fija";
  }
  if (financiamiento.diaCorte < 1 || financiamiento.diaCorte > 31) {
    return "El día de corte debe estar entre 1 y 31";
  }
  if (financiamiento.diaPago < 1 || financiamiento.diaPago > 31) {
    return "El día de pago debe estar entre 1 y 31";
  }

  return null;
}

/** Mantiene extensionCuotasPopular alineada cuando el producto es Cuotas Popular */
export function extensionCuotasPopularDesdeFinanciamiento(
  tarjeta: TarjetaCredito,
  financiamiento: FinanciamientoCuotas,
  numeroCuotasPopular?: {
    numeroEnmascarado: string;
    primerosCuatro: string;
    ultimosCuatro: string;
    numeroCifrado?: string;
  }
): TarjetaCredito["extensionCuotasPopular"] {
  if (financiamiento.producto !== "cuotas-popular") {
    return undefined;
  }

  const extActual = tarjeta.extensionCuotasPopular;
  const numero = numeroCuotasPopular ?? {
    numeroEnmascarado: extActual?.numeroEnmascarado ?? "•••• •••• •••• 0000",
    primerosCuatro: extActual?.primerosCuatro ?? "••••",
    ultimosCuatro: extActual?.ultimosCuatro ?? "0000",
    numeroCifrado: extActual?.numeroCifrado,
  };

  return {
    limiteAprobado: financiamiento.limiteAprobado,
    ...numero,
    sobregiro: extActual?.sobregiro ?? 0,
  };
}
