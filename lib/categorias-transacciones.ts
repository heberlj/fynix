import type { ConfiguracionUsuario } from "@/types/finanzas";
import {
  CATEGORIAS_GASTO_DEFAULT,
  CATEGORIAS_INGRESO_DEFAULT,
} from "@/types/finanzas";
import { colorCategoria } from "@/lib/graficos";

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

export function colorCategoriaGasto(
  configuracion: ConfiguracionUsuario,
  categoria: string,
  indiceFallback = 0
): string {
  const guardado = configuracion.coloresCategoriaGasto?.[categoria];
  if (guardado) return guardado;
  return colorCategoria(indiceFallback);
}
