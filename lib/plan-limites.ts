import { productoFinanciamientoActivo } from "@/lib/financiamiento-cuotas";
import type { ProductoFinanciamientoCuotas } from "@/types/finanzas";

/** Máximo de cuentas bancarias en plan Gratis. */
export const MAX_CUENTAS_GRATIS = 2;

/** Máximo de tarjetas de crédito en plan Gratis. */
export const MAX_TARJETAS_GRATIS = 1;

export function puedeAgregarCuenta(
  esPro: boolean,
  cantidadActual: number
): boolean {
  return esPro || cantidadActual < MAX_CUENTAS_GRATIS;
}

export function puedeAgregarTarjeta(
  esPro: boolean,
  cantidadActual: number
): boolean {
  return esPro || cantidadActual < MAX_TARJETAS_GRATIS;
}

export function puedeUsarFinanciamientoCuotas(esPro: boolean): boolean {
  return esPro;
}

export function puedeExportarCsv(esPro: boolean): boolean {
  return esPro;
}

export function productoFinanciamientoRequierePro(
  producto: ProductoFinanciamientoCuotas
): boolean {
  return productoFinanciamientoActivo(producto);
}

export const MENSAJE_LIMITE_CUENTAS = `El plan Gratis incluye hasta ${MAX_CUENTAS_GRATIS} cuentas bancarias.`;

export const MENSAJE_LIMITE_TARJETAS = `El plan Gratis incluye ${MAX_TARJETAS_GRATIS} tarjeta de crédito.`;

export const MENSAJE_FINANCIAMIENTO_CUOTAS =
  "Cuotas Popular, Cuotas BHD y Credimás están disponibles en Fynix Pro.";

export const MENSAJE_EXPORTAR_CSV =
  "La exportación CSV y los reportes están disponibles en Fynix Pro.";
