import type { ConfiguracionUsuario } from "@/types/finanzas";
import {
  CATEGORIAS_GASTO_DEFAULT,
  CATEGORIAS_INGRESO_DEFAULT,
} from "@/types/finanzas";

export function obtenerCategoriasGasto(
  configuracion: ConfiguracionUsuario
): string[] {
  const cats = configuracion.categoriasGasto;
  return cats?.length ? cats : [...CATEGORIAS_GASTO_DEFAULT];
}

export function obtenerCategoriasIngreso(
  configuracion: ConfiguracionUsuario
): string[] {
  const cats = configuracion.categoriasIngreso;
  return cats?.length ? cats : [...CATEGORIAS_INGRESO_DEFAULT];
}
