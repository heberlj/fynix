import type {
  AporteSegunIngreso,
  ConfiguracionUsuario,
  PeriodoQuincena,
  Transaccion,
} from "@/types/finanzas";
import { CATEGORIAS_INGRESO_DEFAULT } from "@/types/finanzas";
import { montoGastoIngresoEnMoneda } from "@/lib/cambio";

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

function ultimoDiaDelMes(anio: number, mes: number): number {
  return new Date(anio, mes, 0).getDate();
}

function acotarDia(dia: number): number {
  return Math.min(31, Math.max(1, dia));
}

export function aporteIngresoPorDefecto(
  moneda: string,
  diasPagoReferencia: [number, number] = [15, 30]
): AporteSegunIngreso {
  return {
    activo: false,
    nombre: "Diezmo",
    porcentaje: 10,
    categoriasIngreso: ["Salario"],
    periodo: "quincena",
    diasPago: [acotarDia(diasPagoReferencia[0]), acotarDia(diasPagoReferencia[1])],
    quincenas: [1, 2],
    categoria: "Donaciones",
    moneda,
    tipoPresupuesto: "esencial",
  };
}

export type AporteIngresoRaw = Partial<AporteSegunIngreso> & {
  quincena?: 1 | 2;
  /** @deprecated usar diasPago */
  diaPago?: number;
};

export function quincenasDeAporteRaw(
  raw: AporteIngresoRaw | undefined,
  defecto: (1 | 2)[] = [1, 2]
): (1 | 2)[] {
  if (raw?.quincenas?.length) {
    const quincenas = [
      ...new Set(raw.quincenas.filter((q) => q === 1 || q === 2)),
    ] as (1 | 2)[];
    if (quincenas.length > 0) return quincenas.sort();
  }
  if (raw?.quincena === 1 || raw?.quincena === 2) {
    return [raw.quincena];
  }
  return [...defecto];
}

export function diasPagoDeAporteRaw(
  raw: AporteIngresoRaw | undefined,
  configuracion: ConfiguracionUsuario
): [number, number] {
  const referencia = configuracion.diasPago;

  if (raw?.diasPago?.length === 2) {
    return [acotarDia(raw.diasPago[0]), acotarDia(raw.diasPago[1])];
  }

  if (raw?.diaPago != null) {
    const dia = acotarDia(raw.diaPago);
    if (raw.quincena === 2) {
      return [acotarDia(referencia[0]), dia];
    }
    if (raw.quincena === 1) {
      return [dia, acotarDia(referencia[1])];
    }
    return [dia, acotarDia(referencia[1])];
  }

  return [acotarDia(referencia[0]), acotarDia(referencia[1])];
}

export function diaPagoAporteEnQuincena(
  aporte: AporteSegunIngreso,
  quincena: 1 | 2
): number {
  return quincena === 1 ? aporte.diasPago[0] : aporte.diasPago[1];
}

export function etiquetaDiasPagoAporte(aporte: AporteSegunIngreso): string {
  const [d1, d2] = aporte.diasPago;
  if (d1 === d2) return `día ${d1}`;
  return `días ${d1} y ${d2}`;
}

/** Valores del formulario con migración desde config antigua */
export function aporteIngresoParaUi(
  configuracion: ConfiguracionUsuario
): AporteSegunIngreso {
  const defecto = aporteIngresoPorDefecto(
    configuracion.moneda,
    configuracion.diasPago
  );
  const raw = configuracion.aporteIngreso;
  if (!raw) return defecto;

  const categoriasValidas = configuracion.categoriasIngreso?.length
    ? configuracion.categoriasIngreso
    : [...CATEGORIAS_INGRESO_DEFAULT];
  const categoriasIngreso =
    raw.categoriasIngreso?.filter((c) => categoriasValidas.includes(c)) ?? [];
  const categorias =
    categoriasIngreso.length > 0 ? categoriasIngreso : defecto.categoriasIngreso;

  return {
    ...defecto,
    ...raw,
    activo: Boolean(raw.activo),
    nombre: (raw.nombre ?? defecto.nombre).trim() || defecto.nombre,
    porcentaje: raw.porcentaje ?? defecto.porcentaje,
    categoriasIngreso: categorias,
    periodo: raw.periodo === "mes" ? "mes" : "quincena",
    diasPago: diasPagoDeAporteRaw(raw, configuracion),
    quincenas: quincenasDeAporteRaw(raw, defecto.quincenas),
    categoria: (raw.categoria ?? defecto.categoria).trim() || defecto.categoria,
    moneda: raw.moneda ?? configuracion.moneda,
    tipoPresupuesto:
      raw.tipoPresupuesto === "flexible" ? "flexible" : "esencial",
  };
}

export function normalizarAporteIngreso(
  raw: AporteIngresoRaw | undefined,
  configuracion: ConfiguracionUsuario
): AporteSegunIngreso | undefined {
  if (!raw?.activo) return undefined;

  const defecto = aporteIngresoPorDefecto(
    configuracion.moneda,
    configuracion.diasPago
  );
  const categoriasValidas = configuracion.categoriasIngreso?.length
    ? configuracion.categoriasIngreso
    : [...CATEGORIAS_INGRESO_DEFAULT];

  const categoriasIngreso =
    raw.categoriasIngreso?.filter((c) => categoriasValidas.includes(c)) ?? [];
  const categorias =
    categoriasIngreso.length > 0 ? categoriasIngreso : defecto.categoriasIngreso;

  return {
    activo: true,
    nombre: (raw.nombre ?? defecto.nombre).trim() || defecto.nombre,
    porcentaje: Math.min(100, Math.max(0.01, raw.porcentaje ?? defecto.porcentaje)),
    categoriasIngreso: categorias,
    periodo: raw.periodo === "mes" ? "mes" : "quincena",
    diasPago: diasPagoDeAporteRaw(raw, configuracion),
    quincenas: quincenasDeAporteRaw(raw, defecto.quincenas),
    categoria: (raw.categoria ?? defecto.categoria).trim() || defecto.categoria,
    moneda: raw.moneda ?? configuracion.moneda,
    tipoPresupuesto:
      raw.tipoPresupuesto === "flexible" ? "flexible" : "esencial",
  };
}

export function obtenerAporteIngreso(
  configuracion: ConfiguracionUsuario
): AporteSegunIngreso | undefined {
  return normalizarAporteIngreso(configuracion.aporteIngreso, configuracion);
}

export interface RangoCalculoAporte {
  inicio: string;
  fin: string;
  mes: string;
  etiqueta: string;
}

export function rangoCalculoAporte(
  aporte: AporteSegunIngreso,
  periodoVista: PeriodoQuincena
): RangoCalculoAporte {
  if (aporte.periodo === "mes") {
    const [anio, mesNum] = periodoVista.mes.split("-").map(Number);
    const ultimo = ultimoDiaDelMes(anio, mesNum);
    const mesStr = String(mesNum).padStart(2, "0");
    return {
      inicio: `${anio}-${mesStr}-01`,
      fin: `${anio}-${mesStr}-${String(ultimo).padStart(2, "0")}`,
      mes: periodoVista.mes,
      etiqueta: `mes ${periodoVista.mes}`,
    };
  }

  return {
    inicio: periodoVista.inicio,
    fin: periodoVista.fin,
    mes: periodoVista.mes,
    etiqueta: periodoVista.etiqueta,
  };
}

export function fechaEnRangoAporte(fecha: string, rango: RangoCalculoAporte): boolean {
  return fecha >= rango.inicio && fecha <= rango.fin;
}

export function ingresosBaseParaAporte(
  transacciones: Transaccion[],
  aporte: AporteSegunIngreso,
  rango: RangoCalculoAporte
): number {
  return redondear(
    transacciones
      .filter(
        (t) =>
          t.tipo === "ingreso" &&
          t.moneda === aporte.moneda &&
          aporte.categoriasIngreso.includes(t.categoria) &&
          fechaEnRangoAporte(t.fecha, rango)
      )
      .reduce((total, t) => total + t.monto, 0)
  );
}

export function calcularMontoAporteSugerido(
  transacciones: Transaccion[],
  aporte: AporteSegunIngreso,
  periodoVista: PeriodoQuincena
): { monto: number; baseIngresos: number; rango: RangoCalculoAporte } {
  const rango = rangoCalculoAporte(aporte, periodoVista);
  const baseIngresos = ingresosBaseParaAporte(transacciones, aporte, rango);
  const monto = redondear((baseIngresos * aporte.porcentaje) / 100);
  return { monto, baseIngresos, rango };
}

export function montoPagadoAporteEnPeriodo(
  transacciones: Transaccion[],
  rango: RangoCalculoAporte,
  moneda: string
): number {
  return redondear(
    transacciones
      .filter(
        (t) =>
          t.tipo === "gasto" &&
          t.aporteIngreso &&
          fechaEnRangoAporte(t.fecha, rango) &&
          (montoGastoIngresoEnMoneda(t, moneda) != null || t.moneda === moneda)
      )
      .reduce((total, t) => {
        const monto = montoGastoIngresoEnMoneda(t, moneda) ?? t.monto;
        return total + monto;
      }, 0)
  );
}

export function montoPendienteAporteEnPeriodo(
  transacciones: Transaccion[],
  aporte: AporteSegunIngreso,
  periodoVista: PeriodoQuincena
): number {
  if (!aporteAplicaEnQuincenaVista(aporte, periodoVista.quincena)) return 0;

  const { monto, rango } = calcularMontoAporteSugerido(
    transacciones,
    aporte,
    periodoVista
  );
  const pagado = montoPagadoAporteEnPeriodo(
    transacciones,
    rango,
    aporte.moneda
  );
  return redondear(Math.max(0, monto - pagado));
}

export function aporteCubiertoEnPeriodo(
  transacciones: Transaccion[],
  aporte: AporteSegunIngreso,
  periodoVista: PeriodoQuincena
): boolean {
  return montoPendienteAporteEnPeriodo(transacciones, aporte, periodoVista) <= 0;
}

export function aporteAplicaEnQuincenaVista(
  aporte: AporteSegunIngreso,
  quincena: 1 | 2
): boolean {
  return aporte.quincenas?.includes(quincena) ?? false;
}

export function etiquetaPeriodoAporte(periodo: AporteSegunIngreso["periodo"]): string {
  return periodo === "mes" ? "mes calendario" : "quincena";
}
