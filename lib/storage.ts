import type { ColorHome, CuentaBancaria, CuotaPopular, EstadoFinanzas, GastoFijo, IconoHomeCuenta, Prestamo, TarjetaCredito, Transaccion } from "@/types/finanzas";
import { CONFIGURACION_DEFAULT } from "@/types/finanzas";
import { quincenaNumeroDeDia, tipoPresupuestoPorDefecto } from "@/lib/gastos-fijos";
import { crearClienteSupabase } from "@/lib/supabase/client";
import {
  ICONO_HOME_CUENTA_DEFAULT,
  colorHomePorIndice,
  esColorHome,
  esIconoHomeCuenta,
} from "@/lib/personalizacion-home";

const TARJETA_DEFAULT: Omit<TarjetaCredito, "id" | "banco" | "nombreTarjeta" | "limite" | "diaCorte" | "diaPago" | "deudaActual"> = {
  titular: "",
  primerosCuatro: "••••",
  ultimosCuatro: "0000",
  numeroEnmascarado: "•••• •••• •••• 0000",
  marca: "desconocida",
  fechaExpiracion: "01/30",
  cvv: "",
  moneda: CONFIGURACION_DEFAULT.moneda,
};

function inferirPrimerosCuatro(tarjeta: TarjetaCredito): string {
  if (tarjeta.primerosCuatro && /^\d{4}$/.test(tarjeta.primerosCuatro)) {
    return tarjeta.primerosCuatro;
  }
  const match = tarjeta.numeroEnmascarado.match(/^(\d{4})/);
  return match?.[1] ?? tarjeta.primerosCuatro ?? "••••";
}

function normalizarTarjetas(tarjetas: TarjetaCredito[] = []): TarjetaCredito[] {
  return tarjetas.map((t, indice) => {
    const base = {
      ...TARJETA_DEFAULT,
      ...t,
      primerosCuatro: inferirPrimerosCuatro({ ...TARJETA_DEFAULT, ...t }),
      colorHome: esColorHome(t.colorHome) ? t.colorHome : colorHomePorIndice(indice + 3),
    };
    if (!base.extensionCuotasPopular) return base;

    const ext = base.extensionCuotasPopular;
    return {
      ...base,
      extensionCuotasPopular: {
        limiteAprobado: ext.limiteAprobado ?? 0,
        numeroEnmascarado:
          ext.numeroEnmascarado ?? "•••• •••• •••• 0000",
        primerosCuatro: ext.primerosCuatro ?? "••••",
        ultimosCuatro: ext.ultimosCuatro ?? "0000",
        sobregiro: ext.sobregiro ?? 0,
      },
    };
  });
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
      numeroEnmascarado: c.numeroEnmascarado ?? "•••• •••• •••• 0000",
      ultimosCuatro: c.ultimosCuatro ?? "0000",
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
  return cuentas.map((c, indice) => ({
    ...c,
    banco: c.banco ?? "",
    nombre: c.nombre ?? "",
    tipo: c.tipo ?? "ahorro",
    saldoActual: c.saldoActual ?? 0,
    moneda: c.moneda ?? CONFIGURACION_DEFAULT.moneda,
    ultimosCuatro: c.ultimosCuatro ?? "",
    colorHome: esColorHome(c.colorHome) ? c.colorHome : colorHomePorIndice(indice),
    iconoHome: esIconoHomeCuenta(c.iconoHome) ? c.iconoHome : ICONO_HOME_CUENTA_DEFAULT,
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
      quincenaNumeroDeDia(diaPago);

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

function normalizarTransacciones(
  transacciones: Transaccion[] = [],
  monedaDefecto = CONFIGURACION_DEFAULT.moneda
): Transaccion[] {
  return transacciones.map((t) => ({
    ...t,
    moneda: t.moneda ?? monedaDefecto,
    montoOrigen: t.montoOrigen,
    monedaOrigen: t.monedaOrigen,
    tasaCambio: t.tasaCambio,
  }));
}

export function normalizarEstado(parsed: Partial<EstadoFinanzas>): EstadoFinanzas {
  const configuracion = {
    ...CONFIGURACION_DEFAULT,
    ...parsed.configuracion,
    categoriasGastosFijos:
      parsed.configuracion?.categoriasGastosFijos?.length
        ? parsed.configuracion.categoriasGastosFijos
        : CONFIGURACION_DEFAULT.categoriasGastosFijos,
    categoriasGasto:
      parsed.configuracion?.categoriasGasto?.length
        ? parsed.configuracion.categoriasGasto
        : CONFIGURACION_DEFAULT.categoriasGasto,
    categoriasIngreso:
      parsed.configuracion?.categoriasIngreso?.length
        ? parsed.configuracion.categoriasIngreso
        : CONFIGURACION_DEFAULT.categoriasIngreso,
  };

  return {
    ...estadoInicial(),
    ...parsed,
    transacciones: normalizarTransacciones(parsed.transacciones, configuracion.moneda),
    tarjetas: normalizarTarjetas(parsed.tarjetas),
    prestamos: normalizarPrestamos(parsed.prestamos),
    cuotasPopular: normalizarCuotasPopular(parsed.cuotasPopular),
    gastosFijos: normalizarGastosFijos(
      parsed.gastosFijos,
      parsed.configuracion?.diasPago ?? CONFIGURACION_DEFAULT.diasPago
    ),
    cuentas: normalizarCuentas(parsed.cuentas),
    efectivo: parsed.efectivo ?? 0,
    configuracion,
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

export async function cargarEstado(usuarioId: string): Promise<EstadoFinanzas> {
  if (typeof window === "undefined" || !usuarioId) return estadoInicial();

  try {
    const supabase = crearClienteSupabase();
    const { data, error } = await supabase
      .from("estado_finanzas")
      .select("datos")
      .eq("usuario_id", usuarioId)
      .maybeSingle();

    if (error || !data?.datos || typeof data.datos !== "object") {
      return estadoInicial();
    }

    const datos = data.datos as EstadoFinanzas;
    const vacio =
      !datos.transacciones?.length &&
      !datos.tarjetas?.length &&
      !datos.prestamos?.length &&
      !datos.cuotasPopular?.length &&
      !datos.gastosFijos?.length &&
      !datos.cuentas?.length &&
      (datos.efectivo ?? 0) === 0;

    if (vacio && Object.keys(datos).length <= 1) {
      return estadoInicial();
    }

    return normalizarEstado(datos);
  } catch {
    return estadoInicial();
  }
}

export async function guardarEstado(
  estado: EstadoFinanzas,
  usuarioId: string
): Promise<void> {
  if (typeof window === "undefined" || !usuarioId) return;

  const supabase = crearClienteSupabase();
  const { error } = await supabase.from("estado_finanzas").upsert({
    usuario_id: usuarioId,
    datos: estado,
    actualizado_en: new Date().toISOString(),
  });

  if (error) {
    console.error("Error al guardar en Supabase:", error.message);
  }
}

/** Asegura fila vacía en la nube para usuarios nuevos */
export async function inicializarDatosUsuario(usuarioId: string): Promise<void> {
  if (typeof window === "undefined" || !usuarioId) return;

  const supabase = crearClienteSupabase();
  const { data } = await supabase
    .from("estado_finanzas")
    .select("usuario_id")
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  if (data) return;

  await supabase.from("estado_finanzas").insert({
    usuario_id: usuarioId,
    datos: estadoInicial(),
  });
}

export function generarId(): string {
  return crypto.randomUUID();
}
