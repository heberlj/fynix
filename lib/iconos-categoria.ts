export type IconoCategoriaId =
  | "transporte"
  | "combustible"
  | "bares-restaurantes"
  | "delivery"
  | "supermercado"
  | "suscripciones"
  | "cuidado-personal"
  | "viajes"
  | "salud"
  | "ropa"
  | "compras-online"
  | "efectivo"
  | "servicios-basicos"
  | "prestamo"
  | "educacion"
  | "gimnasio"
  | "servicios-hogar"
  | "otros";

export interface IconoCategoriaOpcion {
  id: IconoCategoriaId;
  etiqueta: string;
}

export const ICONOS_CATEGORIA_DISPONIBLES: IconoCategoriaOpcion[] = [
  { id: "transporte", etiqueta: "Transporte" },
  { id: "combustible", etiqueta: "Combustible" },
  { id: "bares-restaurantes", etiqueta: "Restaurantes" },
  { id: "delivery", etiqueta: "Delivery" },
  { id: "supermercado", etiqueta: "Supermercado" },
  { id: "suscripciones", etiqueta: "Streaming" },
  { id: "cuidado-personal", etiqueta: "Cuidado personal" },
  { id: "viajes", etiqueta: "Viajes" },
  { id: "salud", etiqueta: "Salud" },
  { id: "ropa", etiqueta: "Ropa" },
  { id: "compras-online", etiqueta: "Compras online" },
  { id: "efectivo", etiqueta: "Efectivo" },
  { id: "servicios-basicos", etiqueta: "Servicios" },
  { id: "prestamo", etiqueta: "Préstamo" },
  { id: "educacion", etiqueta: "Educación" },
  { id: "gimnasio", etiqueta: "Gimnasio" },
  { id: "servicios-hogar", etiqueta: "Hogar" },
  { id: "otros", etiqueta: "Otros" },
];

const MAPEO_NOMBRE_ICONO: Record<string, IconoCategoriaId> = {
  Transporte: "transporte",
  Combustible: "combustible",
  "Bares y Restaurantes": "bares-restaurantes",
  Delivery: "delivery",
  Supermercado: "supermercado",
  "Suscripciones y Streaming": "suscripciones",
  Suscripciones: "suscripciones",
  "Cuidado personal": "cuidado-personal",
  "Viajes y Vacaciones": "viajes",
  Salud: "salud",
  "Ropa y Accesorios": "ropa",
  "Compras Online": "compras-online",
  Compras: "compras-online",
  "Retiro de Efectivo": "efectivo",
  "Servicios Básicos": "servicios-basicos",
  Servicios: "servicios-basicos",
  "Pago de Préstamo": "prestamo",
  Educación: "educacion",
  Educacion: "educacion",
  Gimnasio: "gimnasio",
  "Servicios del Hogar": "servicios-hogar",
  Vivienda: "servicios-hogar",
  Comida: "bares-restaurantes",
  Entretenimiento: "suscripciones",
  Seguros: "salud",
  Donaciones: "otros",
  Otros: "otros",
};

export function iconoDefectoParaCategoria(nombre: string): IconoCategoriaId {
  if (MAPEO_NOMBRE_ICONO[nombre]) return MAPEO_NOMBRE_ICONO[nombre];

  const normalizado = nombre.trim().toLowerCase();
  const coincidencia = Object.entries(MAPEO_NOMBRE_ICONO).find(
    ([clave]) => clave.toLowerCase() === normalizado
  );
  return coincidencia?.[1] ?? "otros";
}

export function iconosDefectoPorCategorias(
  categorias: string[]
): Record<string, IconoCategoriaId> {
  return Object.fromEntries(
    categorias.map((categoria) => [categoria, iconoDefectoParaCategoria(categoria)])
  );
}

export function esIconoCategoriaId(valor: string): valor is IconoCategoriaId {
  return ICONOS_CATEGORIA_DISPONIBLES.some((icono) => icono.id === valor);
}
