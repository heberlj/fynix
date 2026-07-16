import type { EstadoFinanzas } from "@/types/finanzas";
import { CATEGORIAS_GASTO_DEFAULT } from "@/types/finanzas";
import { normalizarIconosCategoriaGasto } from "@/lib/categorias-transacciones";
import { iconoDefectoParaCategoria } from "@/lib/iconos-categoria";
import { colorCategoria } from "@/lib/graficos";

/** Nombres de la lista anterior de categorías de gasto. */
export const CATEGORIAS_GASTO_LEGACY = [
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
  "Donaciones",
  "Otros",
] as const;

/** Equivalencias de la lista antigua hacia la nueva. */
export const MAPEO_CATEGORIA_GASTO_LEGACY: Record<string, string> = {
  Vivienda: "Servicios del Hogar",
  Servicios: "Servicios Básicos",
  Suscripciones: "Suscripciones y Streaming",
  Seguros: "Salud",
  Comida: "Bares y Restaurantes",
  Entretenimiento: "Suscripciones y Streaming",
  Compras: "Compras Online",
  Educacion: "Educación",
};

export function esListaCategoriasGastoLegacy(categorias: string[]): boolean {
  if (categorias.length !== CATEGORIAS_GASTO_LEGACY.length) return false;
  const normalizadas = new Set(categorias.map((c) => c.toLowerCase()));
  return CATEGORIAS_GASTO_LEGACY.every((c) => normalizadas.has(c.toLowerCase()));
}

function resolverCategoriaGasto(nombre: string): string {
  if (MAPEO_CATEGORIA_GASTO_LEGACY[nombre]) {
    return MAPEO_CATEGORIA_GASTO_LEGACY[nombre];
  }

  const normalizado = nombre.trim().toLowerCase();
  const coincidencia = Object.entries(MAPEO_CATEGORIA_GASTO_LEGACY).find(
    ([clave]) => clave.toLowerCase() === normalizado
  );
  return coincidencia?.[1] ?? nombre;
}

function moverMetadatosCategoria(
  origen: string,
  destino: string,
  colores: Record<string, string>,
  iconos: Record<string, string>
) {
  if (origen === destino) return;

  if (colores[origen] && !colores[destino]) {
    colores[destino] = colores[origen];
  }
  delete colores[origen];

  if (iconos[origen] && !iconos[destino]) {
    iconos[destino] = iconos[origen];
  }
  delete iconos[origen];
}

function categoriasGastoUsadas(estado: EstadoFinanzas): string[] {
  const usadas = new Set<string>();

  for (const transaccion of estado.transacciones) {
    if (transaccion.tipo === "gasto") {
      usadas.add(transaccion.categoria);
    }
  }

  for (const gasto of estado.gastosFijos) {
    usadas.add(gasto.categoria);
  }

  const aporte = estado.configuracion.aporteIngreso;
  if (aporte?.categoria) {
    usadas.add(aporte.categoria);
  }

  return Array.from(usadas);
}

function incluirCategoriasUsadas(
  categorias: string[],
  usadas: string[]
): string[] {
  const resultado = [...categorias];
  for (const categoria of usadas) {
    if (!resultado.includes(categoria)) {
      resultado.push(categoria);
    }
  }
  return resultado;
}

/**
 * Reasigna categorías antiguas en transacciones y gastos fijos,
 * y garantiza que toda categoría en uso siga existiendo en configuración.
 */
export function sincronizarCategoriasGastoEnEstado(
  estado: EstadoFinanzas
): EstadoFinanzas {
  let categoriasGasto = [...(estado.configuracion.categoriasGasto ?? [])];

  if (esListaCategoriasGastoLegacy(categoriasGasto)) {
    categoriasGasto = [...CATEGORIAS_GASTO_DEFAULT];
  }

  const colores = { ...(estado.configuracion.coloresCategoriaGasto ?? {}) };
  const iconos = { ...(estado.configuracion.iconosCategoriaGasto ?? {}) };

  const transacciones = estado.transacciones.map((transaccion) => {
    if (transaccion.tipo !== "gasto") return transaccion;

    const nuevaCategoria = resolverCategoriaGasto(transaccion.categoria);
    if (nuevaCategoria === transaccion.categoria) return transaccion;

    moverMetadatosCategoria(
      transaccion.categoria,
      nuevaCategoria,
      colores,
      iconos
    );

    return { ...transaccion, categoria: nuevaCategoria };
  });

  const gastosFijos = estado.gastosFijos.map((gasto) => {
    const nuevaCategoria = resolverCategoriaGasto(gasto.categoria);
    if (nuevaCategoria === gasto.categoria) return gasto;

    moverMetadatosCategoria(gasto.categoria, nuevaCategoria, colores, iconos);
    return { ...gasto, categoria: nuevaCategoria };
  });

  let aporteIngreso = estado.configuracion.aporteIngreso;
  if (aporteIngreso?.categoria) {
    const nuevaCategoria = resolverCategoriaGasto(aporteIngreso.categoria);
    if (nuevaCategoria !== aporteIngreso.categoria) {
      moverMetadatosCategoria(
        aporteIngreso.categoria,
        nuevaCategoria,
        colores,
        iconos
      );
      aporteIngreso = { ...aporteIngreso, categoria: nuevaCategoria };
    }
  }

  const estadoIntermedio: EstadoFinanzas = {
    ...estado,
    transacciones,
    gastosFijos,
    configuracion: {
      ...estado.configuracion,
      aporteIngreso,
      categoriasGasto,
      coloresCategoriaGasto: colores,
      iconosCategoriaGasto: iconos,
    },
  };

  const usadas = categoriasGastoUsadas(estadoIntermedio);
  categoriasGasto = incluirCategoriasUsadas(categoriasGasto, usadas);

  for (let i = 0; i < categoriasGasto.length; i++) {
    const categoria = categoriasGasto[i];
    if (!colores[categoria]) {
      colores[categoria] = colorCategoria(i);
    }
  }

  const iconosFinales = normalizarIconosCategoriaGasto(categoriasGasto, {
    ...iconos,
    ...Object.fromEntries(
      categoriasGasto
        .filter((categoria) => !iconos[categoria])
        .map((categoria) => [categoria, iconoDefectoParaCategoria(categoria)])
    ),
  });

  return {
    ...estadoIntermedio,
    configuracion: {
      ...estadoIntermedio.configuracion,
      categoriasGasto,
      coloresCategoriaGasto: colores,
      iconosCategoriaGasto: iconosFinales,
    },
  };
}
