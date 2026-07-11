export type OrigenFondo =
  | { tipo: "cuenta"; id: string }
  | { tipo: "tarjeta"; id: string }
  | { tipo: "efectivo" };

export type ModoPagoTarjeta = "rotativo" | "cuotas-popular";

export interface Transaccion {
  id: string;
  descripcion: string;
  monto: number;
  tipo: "ingreso" | "gasto";
  categoria: string;
  fecha: string;
  quincena: 1 | 2;
  moneda: string;
  /** De dónde sale el gasto o a dónde entra el ingreso */
  origen?: OrigenFondo;
  /** Solo gastos con tarjeta: rotativo afecta deudaActual; cuotas crea un plan */
  modoPagoTarjeta?: ModoPagoTarjeta;
  /** Gasto que originó el plan (si se creó al registrar una transacción) */
  cuotaPopularId?: string;
  /** Gasto al marcar una cuota mensual como pagada */
  pagoCuotaPopularId?: string;
}

export interface ExtensionCuotasPopular {
  limiteAprobado: number;
}

export type TipoCuentaBancaria = "ahorro" | "corriente";

export interface CuentaBancaria {
  id: string;
  banco: string;
  nombre: string;
  tipo: TipoCuentaBancaria;
  saldoActual: number;
  moneda: string;
  ultimosCuatro: string;
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
  ultimosCuatro: string;
  numeroEnmascarado: string;
  marca: MarcaTarjeta;
  fechaExpiracion: string;
  cvv: string;
  moneda: string;
  /** Extensión opcional: plan Cuotas Popular con límite aprobado propio */
  extensionCuotasPopular?: ExtensionCuotasPopular;
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
}

export interface ResumenQuincena {
  ingresosTotales: number;
  gastosTotales: number;
  pagosTarjetas: number;
  cuotasPrestamos: number;
  cuotasPopular: number;
  gastosFijos: number;
  balanceNeto: number;
  disponible: number;
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

export const CONFIGURACION_DEFAULT: ConfiguracionUsuario = {
  diasPago: [15, 30],
  moneda: "DOP",
  tema: "claro",
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

export const CATEGORIAS_GASTO = [
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

export const CATEGORIAS_INGRESO = [
  "Salario",
  "Freelance",
  "Inversiones",
  "Otros",
] as const;
