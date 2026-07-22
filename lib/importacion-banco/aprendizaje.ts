import type {
  ConfiguracionUsuario,
  ReglaCategoriaImportacion,
} from "@/types/finanzas";
import type { MovimientoBancoPendiente } from "@/types/importacion-banco";

const MAX_REGLAS = 200;

/** Normaliza una descripción bancaria para usarla como clave de aprendizaje. */
export function normalizarDescripcionImportacion(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\d{4,}/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

export function obtenerReglasCategoriaImportacion(
  configuracion: ConfiguracionUsuario
): ReglaCategoriaImportacion[] {
  return configuracion.reglasCategoriaImportacion ?? [];
}

export function sugerirCategoriaAprendida(
  descripcion: string,
  tipo: "gasto" | "ingreso",
  reglas: ReglaCategoriaImportacion[],
  categoriasDisponibles: string[]
): { categoria: string; clave: string } | null {
  const normalizada = normalizarDescripcionImportacion(descripcion);
  if (!normalizada) return null;

  const delTipo = reglas.filter((r) => r.tipo === tipo);
  const ordenadas = [...delTipo].sort((a, b) => b.usos - a.usos);

  for (const regla of ordenadas) {
    if (
      normalizada === regla.clave ||
      normalizada.includes(regla.clave) ||
      regla.clave.includes(normalizada)
    ) {
      const coincide = categoriasDisponibles.find(
        (c) => c.toLowerCase() === regla.categoria.toLowerCase()
      );
      if (coincide) {
        return { categoria: coincide, clave: regla.clave };
      }
    }
  }

  return null;
}

export function registrarAprendizajesImportacion(
  configuracion: ConfiguracionUsuario,
  movimientos: MovimientoBancoPendiente[]
): ReglaCategoriaImportacion[] {
  const reglas = [...obtenerReglasCategoriaImportacion(configuracion)];

  for (const mov of movimientos) {
    if (mov.tipo === "transferencia") continue;
    if (!mov.seleccionado || mov.duplicado) continue;
    if (mov.categoria === mov.categoriaInicial) continue;

    const clave = normalizarDescripcionImportacion(mov.descripcion);
    if (!clave) continue;

    const tipo = mov.tipo === "ingreso" ? "ingreso" : "gasto";
    const idx = reglas.findIndex((r) => r.clave === clave && r.tipo === tipo);

    if (idx >= 0) {
      reglas[idx] = {
        ...reglas[idx],
        categoria: mov.categoria,
        usos: reglas[idx].usos + 1,
      };
    } else {
      reglas.push({ clave, categoria: mov.categoria, tipo, usos: 1 });
    }
  }

  return reglas
    .sort((a, b) => b.usos - a.usos)
    .slice(0, MAX_REGLAS);
}
