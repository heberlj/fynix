/** Plantilla de CSV según banco y tipo de producto. */
export type PlantillaImportacionBanco =
  | "popular-cuenta"
  | "popular-tarjeta"
  | "bhd-cuenta"
  | "bhd-tarjeta"
  | "generica";

export type TipoOrigenImportacion = "cuenta" | "tarjeta";

export type TipoMovimientoImportacion = "ingreso" | "gasto" | "transferencia";

/** Movimiento leído del CSV, pendiente de confirmación en la app. */
export interface MovimientoBancoPendiente {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
  tipo: TipoMovimientoImportacion;
  moneda: string;
  categoria: string;
  /** Categoría sugerida al parsear (para aprender correcciones) */
  categoriaInicial: string;
  seleccionado: boolean;
  /** Ya existe una transacción similar en Fynix */
  duplicado: boolean;
  filaCsv: number;
  /** Destino codificado (cuenta:… | tarjeta:…) si es transferencia */
  destinoValor?: string;
  /** Vincular pago a un gasto fijo existente */
  gastoFijoId?: string;
  /** Sugerencia de gasto fijo (para reactivar el vínculo) */
  gastoFijoSugeridoId?: string;
  /** Texto breve de la sugerencia automática */
  sugerencia?: string;
  /** Otra pata de la transferencia ya registrada en Fynix */
  parejaExistenteId?: string;
  /** Si hay pareja, reemplazar el movimiento huérfano al importar */
  reemplazarPareja?: boolean;
  /** La categoría vino de reglas aprendidas del usuario */
  aprendida?: boolean;
}

export interface ResumenEnriquecimientoImportacion {
  transferencias: number;
  gastosFijos: number;
  parejasExistentes: number;
  categoriasAprendidas: number;
}

export interface ResultadoParseoBanco {
  movimientos: MovimientoBancoPendiente[];
  errores: string[];
  advertencias: string[];
}
