import type { CuentaBancaria, CuotaPopular, EstadoFinanzas, GastoFijo, Prestamo, TarjetaCredito } from "@/types/finanzas";
import { CONFIGURACION_DEFAULT } from "@/types/finanzas";
import { quincenaNumeroDeDia, tipoPresupuestoPorDefecto } from "@/lib/gastos-fijos";
import { claveDatosUsuario } from "@/lib/auth";

const TARJETA_DEFAULT: Omit<TarjetaCredito, "id" | "banco" | "nombreTarjeta" | "limite" | "diaCorte" | "diaPago" | "deudaActual"> = {
  titular: "",
  ultimosCuatro: "0000",
  numeroEnmascarado: "•••• •••• •••• 0000",
  marca: "desconocida",
  fechaExpiracion: "01/30",
  cvv: "",
  moneda: CONFIGURACION_DEFAULT.moneda,
};

function normalizarTarjetas(tarjetas: TarjetaCredito[] = []): TarjetaCredito[] {
  return tarjetas.map((t) => ({
    ...TARJETA_DEFAULT,
    ...t,
  }));
}

const PRESTAMO_DEFAULT: Omit<
  Prestamo,
  | "id"
  | "entidad"
  | "montoPrestado"
  | "montoTotal"
  | "montoCuota"
  | "diaPago"
  | "cuotasTotales"
  | "cuotasPagadas"
> = {
  descripcion: "",
  moneda: CONFIGURACION_DEFAULT.moneda,
  fechaInicio: new Date().toISOString().slice(0, 10),
  tasaInteres: 0,
  tipoTasa: "anual",
};

function normalizarPrestamos(prestamos: Prestamo[] = []): Prestamo[] {
  return prestamos.map((p) => {
    const legacy = p as Prestamo & { montoPrestado?: number; tasaInteres?: number; tipoTasa?: Prestamo["tipoTasa"] };
    const montoPrestado = legacy.montoPrestado ?? legacy.montoTotal ?? 0;
    const montoCuota = legacy.montoCuota ?? 0;
    const cuotasTotales = legacy.cuotasTotales ?? 1;
    const montoTotal =
      legacy.montoTotal && legacy.montoPrestado !== undefined
        ? legacy.montoTotal
        : Math.round(montoCuota * cuotasTotales * 100) / 100;

    return {
      ...PRESTAMO_DEFAULT,
      ...legacy,
      montoPrestado,
      montoTotal,
      tasaInteres: legacy.tasaInteres ?? 0,
      tipoTasa: legacy.tipoTasa ?? "anual",
    };
  });
}

function normalizarCuotasPopular(cuotas: CuotaPopular[] = []): CuotaPopular[] {
  return cuotas.map((c) => {
    const montoCuota = c.montoCuota ?? 0;
    const cuotasTotales = c.cuotasTotales ?? 1;
    const montoTotal =
      c.montoTotal ?? Math.round(montoCuota * cuotasTotales * 100) / 100;

    return {
      ...c,
      descripcion: c.descripcion ?? "",
      moneda: c.moneda ?? CONFIGURACION_DEFAULT.moneda,
      fechaInicio: c.fechaInicio ?? new Date().toISOString().slice(0, 10),
      montoCompra: c.montoCompra ?? montoTotal,
      montoTotal,
      montoCuota,
      cuotasTotales,
      tasaInteres: c.tasaInteres ?? 0,
      tipoTasa: c.tipoTasa ?? "anual",
      cuotasPagadas: c.cuotasPagadas ?? 0,
    };
  });
}

function normalizarCuentas(cuentas: CuentaBancaria[] = []): CuentaBancaria[] {
  return cuentas.map((c) => ({
    ...c,
    banco: c.banco ?? "",
    nombre: c.nombre ?? "",
    tipo: c.tipo ?? "ahorro",
    saldoActual: c.saldoActual ?? 0,
    moneda: c.moneda ?? CONFIGURACION_DEFAULT.moneda,
    ultimosCuatro: c.ultimosCuatro ?? "",
  }));
}

function normalizarGastosFijos(
  gastos: GastoFijo[] = [],
  diasPago: [number, number] = CONFIGURACION_DEFAULT.diasPago
): GastoFijo[] {
  return gastos.map((g) => {
    const legacy = g as GastoFijo & { quincena?: 1 | 2; tipoPresupuesto?: GastoFijo["tipoPresupuesto"] };
    const diaPago = legacy.diaPago ?? 1;
    const quincena =
      legacy.quincena ??
      quincenaNumeroDeDia(diaPago, {
        diasPago,
        moneda: legacy.moneda ?? CONFIGURACION_DEFAULT.moneda,
        tema: "claro",
      });

    return {
      ...g,
      nombre: g.nombre ?? "",
      monto: g.monto ?? 0,
      categoria: g.categoria ?? "Otros",
      diaPago,
      quincena,
      moneda: g.moneda ?? CONFIGURACION_DEFAULT.moneda,
      activo: g.activo ?? true,
      notas: g.notas ?? "",
      tipoPresupuesto:
        legacy.tipoPresupuesto ??
        tipoPresupuestoPorDefecto(g.categoria ?? "Otros"),
    };
  });
}

export function normalizarEstado(parsed: Partial<EstadoFinanzas>): EstadoFinanzas {
  return {
    ...estadoInicial(),
    ...parsed,
    tarjetas: normalizarTarjetas(parsed.tarjetas),
    prestamos: normalizarPrestamos(parsed.prestamos),
    cuotasPopular: normalizarCuotasPopular(parsed.cuotasPopular),
    gastosFijos: normalizarGastosFijos(
      parsed.gastosFijos,
      parsed.configuracion?.diasPago ?? CONFIGURACION_DEFAULT.diasPago
    ),
    cuentas: normalizarCuentas(parsed.cuentas),
    efectivo: parsed.efectivo ?? 0,
    configuracion: {
      ...CONFIGURACION_DEFAULT,
      ...parsed.configuracion,
    },
  };
}

export function estadoInicial(): EstadoFinanzas {
  return {
    transacciones: [],
    tarjetas: [],
    prestamos: [],
    cuotasPopular: [],
    gastosFijos: [],
    cuentas: [],
    efectivo: 0,
    configuracion: CONFIGURACION_DEFAULT,
  };
}

export function cargarEstado(usuarioId: string): EstadoFinanzas {
  if (typeof window === "undefined") return estadoInicial();
  if (!usuarioId) return estadoInicial();

  try {
    const clave = claveDatosUsuario(usuarioId);
    const raw = localStorage.getItem(clave);

    if (!raw) return estadoInicial();
    const parsed = JSON.parse(raw) as EstadoFinanzas;
    return normalizarEstado(parsed);
  } catch {
    return estadoInicial();
  }
}

export function guardarEstado(estado: EstadoFinanzas, usuarioId: string): void {
  if (typeof window === "undefined" || !usuarioId) return;
  localStorage.setItem(claveDatosUsuario(usuarioId), JSON.stringify(estado));
}

/** Crea almacenamiento vacío para un usuario nuevo si aún no tiene datos */
export function inicializarDatosUsuario(usuarioId: string): void {
  if (typeof window === "undefined" || !usuarioId) return;

  const clave = claveDatosUsuario(usuarioId);
  if (localStorage.getItem(clave)) return;

  localStorage.setItem(clave, JSON.stringify(estadoInicial()));
}

export function generarId(): string {
  return crypto.randomUUID();
}
