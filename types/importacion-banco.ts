/** Plantilla de CSV según banco y tipo de producto. */
export type PlantillaImportacionBanco =
  | "popular-cuenta"
  | "popular-tarjeta"
  | "bhd-cuenta"
  | "bhd-tarjeta"
  | "generica";

export type TipoOrigenImportacion = "cuenta" | "tarjeta";

/** Movimiento leído del CSV, pendiente de confirmación en la app. */
export interface MovimientoBancoPendiente {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
  tipo: "ingreso" | "gasto";
  moneda: string;
  categoria: string;
  seleccionado: boolean;
  /** Ya existe una transacción similar en Fynix */
  duplicado: boolean;
  filaCsv: number;
}

export interface ResultadoParseoBanco {
  movimientos: MovimientoBancoPendiente[];
  errores: string[];
  advertencias: string[];
}
