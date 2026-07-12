export type OrigenFondo =
  | { tipo: "cuenta"; id: string }
  | { tipo: "tarjeta"; id: string }
  | { tipo: "efectivo" };

export type ModoPagoTarjeta = "rotativo" | "cuotas-popular";

export interface Transaccion {
  id: string;
  descripcion: string;
  monto: number;
  tipo: "ingreso" | "gasto" | "transferencia";
  categoria: string;
  fecha: string;
  quincena: 1 | 2;
  moneda: string;
  /** Moneda debitada del origen en movimientos con cambio */
  monedaOrigen?: string;
  /** Monto debitado del origen (cuenta/efectivo) */
  montoOrigen?: number;
  /** Tasa del día: unidades de monedaOrigen por 1 unidad de moneda */
  tasaCambio?: number;
  /** De dónde sale el gasto, entra el ingreso o sale el movimiento */
  origen?: OrigenFondo;
  /** Destino del movimiento (ej. tarjeta al pagar deuda) */
  destino?: OrigenFondo;
  /** Solo gastos con tarjeta: rotativo afecta deudaActual; cuotas crea un plan */
  modoPagoTarjeta?: ModoPagoTarjeta;
  /** Gasto que originó el plan (si se creó al registrar una transacción) */
  cuotaPopularId?: string;
  /** Gasto al marcar una cuota mensual como pagada */
  pagoCuotaPopularId?: string;
  /** Gasto fijo que cubre este pago (evita duplicar en quincenas) */
  gastoFijoId?: string;
  /** Préstamo al que aplica este pago de cuota */
  prestamoId?: string;
}

export interface ExtensionCuotasPopular {
  limiteAprobado: number;
  /** Número de convenio / cuenta Cuotas Popular (16 dígitos) */
  numeroEnmascarado: string;
  /** Primeros 4 dígitos visibles (BIN / tipo de tarjeta) */
  primerosCuatro: string;
  ultimosCuatro: string;
  /** Primeros dígitos cifrados localmente (AES-GCM) */
  numeroCifrado?: string;
  /** Sobregiro adicional sobre el límite aprobado */
  sobregiro?: number;
}

export type TipoCuentaBancaria = "ahorro" | "corriente";

/** Paleta para tarjetas compactas en Home */
export type ColorHome =
  | "azul"
  | "verde"
  | "morado"
  | "naranja"
  | "rosa"
  | "teal"
  | "pizarra"
  | "rojo"
  | "indigo"
  | "amarillo";

/** Iconos disponibles para cuentas en Home (tarjetas usan "tarjeta" por defecto) */
export type IconoHomeCuenta =
  | "cuenta"
  | "banco"
  | "ahorro"
  | "monedas"
  | "cartera"
  | "estrella";

export type IconoHome = IconoHomeCuenta | "tarjeta" | "efectivo";

export interface CuentaBancaria {
  id: string;
  banco: string;
  nombre: string;
  tipo: TipoCuentaBancaria;
  saldoActual: number;
  moneda: string;
  ultimosCuatro: string;
  colorHome?: ColorHome;
  iconoHome?: IconoHomeCuenta;
}

export type MarcaTarjeta = "visa" | "mastercard" | "desconocida";

export interface TarjetaCredito {
  id: string;
  banco: string;
  nombreTarjeta: string;
  limite: number;
  diaCorte: number;
  diaPago: number;
  deudaActual: number;
  titular: string;
  primerosCuatro: string;
  ultimosCuatro: string;
  numeroEnmascarado: string;
  /** Primeros 12 dígitos cifrados localmente (AES-GCM) */
  numeroCifrado?: string;
  marca: MarcaTarjeta;
  fechaExpiracion: string;
  cvv: string;
  moneda: string;
  /** Extensión opcional: plan Cuotas Popular con límite aprobado propio */
  extensionCuotasPopular?: ExtensionCuotasPopular;
  colorHome?: ColorHome;
}

export type TipoTasaInteres = "anual" | "mensual";

export interface Prestamo {
  id: string;
  entidad: string;
  descripcion: string;
  /** Monto original prestado (capital) */
  montoPrestado: number;
  /** Total a pagar al finalizar (cuota × cuotas) */
  montoTotal: number;
  montoCuota: number;
  /** Tasa en porcentaje, ej: 18 = 18% */
  tasaInteres: number;
  tipoTasa: TipoTasaInteres;
  diaPago: number;
  cuotasTotales: number;
  cuotasPagadas: number;
  moneda: string;
  fechaInicio: string;
}

export interface CuotaPopular {
  id: string;
  /** Tarjeta donde está el plan de cuotas */
  tarjetaId: string;
  descripcion: string;
  /** Número de referencia del plan (16 dígitos) */
  numeroEnmascarado: string;
  ultimosCuatro: string;
  /** Monto original de la compra */
  montoCompra: number;
  /** Total a pagar (cuota × cuotas) */
  montoTotal: number;
  montoCuota: number;
  tasaInteres: number;
  tipoTasa: TipoTasaInteres;
  cuotasTotales: number;
  cuotasPagadas: number;
  moneda: string;
  fechaInicio: string;
  /** Gasto que originó el plan (si se creó al registrar una transacción) */
  transaccionId?: string;
}

export interface PlanCuotasPopularNuevo {
  tasaInteres: number;
  tipoTasa: TipoTasaInteres;
  cuotasTotales: number;
  montoCuota: number;
  montoTotal: number;
  numeroEnmascarado: string;
  ultimosCuatro: string;
}

export interface GastoFijo {
  id: string;
  nombre: string;
  monto: number;
  categoria: string;
  /** Día del mes en que se paga */
  diaPago: number;
  /** Quincena en la que se presupuesta y contabiliza el gasto */
  quincena: 1 | 2;
  moneda: string;
  activo: boolean;
  notas: string;
  /** Prioridad manual para sugerencias de presupuesto */
  tipoPresupuesto: TipoPresupuestoGasto;
}

export type TipoPresupuestoGasto = "esencial" | "flexible";

export type TemaApp = "claro" | "oscuro" | "sistema";

export interface ConfiguracionUsuario {
  /** Dos días del mes en que recibes tu salario, ej: [15, 30] */
  diasPago: [number, number];
  moneda: string;
  tema: TemaApp;
  /** Categorías personalizables para gastos fijos */
  categoriasGastosFijos: string[];
  /** Categorías personalizables para gastos en transacciones */
  categoriasGasto: string[];
  /** Categorías personalizables para ingresos en transacciones */
  categoriasIngreso: string[];
}

export interface ResumenQuincena {
  ingresosTotales: number;
  gastosTotales: number;
  movimientosTotales: number;
  pagosTarjetas: number;
  cuotasPrestamos: number;
  cuotasPopular: number;
  gastosFijos: number;
  balanceNeto: number;
  /** Proyección real; si no hay ingresos en la quincena, se muestra 0 */
  disponible: number;
  disponibleProyectado: number;
}

export type PrioridadSugerencia = "pagar" | "posponer" | "evitar";

export type TipoObligacionSugerencia =
  | "tarjeta"
  | "prestamo"
  | "cuota-popular"
  | "gasto-fijo";

export interface ItemSugerenciaPago {
  id: string;
  tipo: TipoObligacionSugerencia;
  nombre: string;
  monto: number;
  moneda: string;
  diaPago: number;
  diasRestantes: number;
  /** ID de la entidad para acciones (tarjeta, préstamo, cuota, gasto fijo) */
  entidadId?: string;
  prioridad: PrioridadSugerencia;
  puntuacion: number;
  razon: string;
  categoria?: string;
  tipoPresupuesto?: TipoPresupuestoGasto;
}

export interface ProyeccionProximoIngreso {
  periodo: PeriodoQuincena;
  ingresoEstimado: number;
  compromisos: number;
  gastosVariablesEstimados: number;
  liquidezActual: number;
  fondoTotal: number;
  reservaSugerida: number;
  disponibleProyectado: number;
  moneda: string;
}

export interface ResultadoSugerencias {
  items: ItemSugerenciaPago[];
  totalPagar: number;
  totalPosponer: number;
  totalEvitar: number;
  liquidez: number;
  ingresoEstimado: number;
  presupuestoAsignable: number;
  resumen: string;
  moneda: string;
}

export interface PeriodoQuincena {
  quincena: 1 | 2;
  mes: string;
  inicio: string;
  fin: string;
  etiqueta: string;
}

export interface EstadoFinanzas {
  transacciones: Transaccion[];
  tarjetas: TarjetaCredito[];
  prestamos: Prestamo[];
  cuotasPopular: CuotaPopular[];
  gastosFijos: GastoFijo[];
  cuentas: CuentaBancaria[];
  efectivo: number;
  configuracion: ConfiguracionUsuario;
}

export const CATEGORIAS_GASTOS_FIJOS_DEFAULT = [
  "Vivienda",
  "Servicios",
  "Suscripciones",
  "Seguros",
  "Comida",
  "Transporte",
  "Salud",
  "Entretenimiento",
  "Compras",
  "Educación",
  "Otros",
] as const;

export const CATEGORIAS_GASTO_DEFAULT = [
  "Vivienda",
  "Servicios",
  "Suscripciones",
  "Seguros",
  "Comida",
  "Transporte",
  "Salud",
  "Entretenimiento",
  "Compras",
  "Educación",
  "Otros",
] as const;

export const CATEGORIAS_INGRESO_DEFAULT = [
  "Salario",
  "Freelance",
  "Inversiones",
  "Otros",
] as const;

export const CONFIGURACION_DEFAULT: ConfiguracionUsuario = {
  diasPago: [15, 30],
  moneda: "DOP",
  tema: "claro",
  categoriasGastosFijos: [...CATEGORIAS_GASTOS_FIJOS_DEFAULT],
  categoriasGasto: [...CATEGORIAS_GASTO_DEFAULT],
  categoriasIngreso: [...CATEGORIAS_INGRESO_DEFAULT],
};

export const MONEDAS = [
  { codigo: "DOP", nombre: "Peso dominicano" },
  { codigo: "USD", nombre: "Dólar estadounidense" },
  { codigo: "EUR", nombre: "Euro" },
  { codigo: "MXN", nombre: "Peso mexicano" },
  { codigo: "COP", nombre: "Peso colombiano" },
  { codigo: "ARS", nombre: "Peso argentino" },
  { codigo: "PEN", nombre: "Sol peruano" },
  { codigo: "CLP", nombre: "Peso chileno" },
] as const;

/** @deprecated Usar categoriasGasto en configuración */
export const CATEGORIAS_GASTO = CATEGORIAS_GASTO_DEFAULT;

/** @deprecated Usar categoriasIngreso en configuración */
export const CATEGORIAS_INGRESO = CATEGORIAS_INGRESO_DEFAULT;

export const CATEGORIA_PAGO_TARJETA = "Pago tarjeta";
export const CATEGORIA_TRANSFERENCIA_CUENTAS = "Transferencia entre cuentas";
