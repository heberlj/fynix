import type { Transaccion } from "@/types/finanzas";
import { CATEGORIAS_GASTO_DEFAULT } from "@/types/finanzas";
import type { ReglaCategoriaImportacion } from "@/types/finanzas";
import {
  sugerirCategoriaAprendida,
} from "@/lib/importacion-banco/aprendizaje";

const REGLAS_GASTO: { patrones: RegExp[]; categoria: string }[] = [
  {
    patrones: [/uber/i, /indriver/i, /taxi/i, /metro/i, /transporte/i],
    categoria: "Transporte",
  },
  {
    patrones: [/shell/i, /texaco/i, /esso/i, /combustible/i, /gasolina/i, /estacion/i],
    categoria: "Combustible",
  },
  {
    patrones: [/restaurant/i, /restaurante/i, /bar\b/i, /pizza/i, /burger/i, /cafe/i, /cafeteria/i],
    categoria: "Comida",
  },
  {
    patrones: [/uber\s*eats/i, /pedidos\s*ya/i, /rappi/i, /delivery/i],
    categoria: "Delivery",
  },
  {
    patrones: [/supermercado/i, /bravo/i, /jumbo/i, /nacional/i, /sirena/i, /carrefour/i, /walmart/i, /price\s*smart/i],
    categoria: "Supermercado",
  },
  {
    patrones: [/netflix/i, /spotify/i, /disney/i, /hbo/i, /amazon\s*prime/i, /youtube/i, /suscrip/i],
    categoria: "Suscripciones y Streaming",
  },
  {
    patrones: [/farmacia/i, /carol/i, /clinica/i, /hospital/i, /salud/i, /medico/i],
    categoria: "Salud",
  },
  {
    patrones: [/amazon/i, /\.com\b/i, /shein/i, /aliexpress/i, /online/i],
    categoria: "Compras Online",
  },
  {
    patrones: [/atm/i, /cajero/i, /retiro/i, /efectivo/i],
    categoria: "Retiro de Efectivo",
  },
  {
    patrones: [/edenorte/i, /edeeste/i, /edesur/i, /claro/i, /altice/i, /viva/i, /agua/i, /luz\b/i, /internet/i],
    categoria: "Servicios Básicos",
  },
  {
    patrones: [/gym/i, /gimnasio/i, /fitness/i],
    categoria: "Gimnasio",
  },
];

const REGLAS_INGRESO: { patrones: RegExp[]; categoria: string }[] = [
  { patrones: [/nomina/i, /salario/i, /sueldo/i, /payroll/i], categoria: "Salario" },
  { patrones: [/freelance/i, /honorario/i, /consultoria/i], categoria: "Freelance" },
  { patrones: [/interes/i, /dividendo/i, /inversion/i], categoria: "Inversiones" },
];

export function sugerirCategoriaImportacion(
  descripcion: string,
  tipo: "ingreso" | "gasto",
  categoriasDisponibles: string[],
  reglasAprendidas: ReglaCategoriaImportacion[] = []
): { categoria: string; aprendida: boolean } {
  const aprendida = sugerirCategoriaAprendida(
    descripcion,
    tipo,
    reglasAprendidas,
    categoriasDisponibles
  );
  if (aprendida) {
    return { categoria: aprendida.categoria, aprendida: true };
  }

  const reglas = tipo === "gasto" ? REGLAS_GASTO : REGLAS_INGRESO;
  const defectoGasto =
    categoriasDisponibles.find((c) => c.toLowerCase() === "otros") ??
    CATEGORIAS_GASTO_DEFAULT[CATEGORIAS_GASTO_DEFAULT.length - 1];
  const defecto = tipo === "gasto" ? defectoGasto : "Otros";

  for (const regla of reglas) {
    if (regla.patrones.some((p) => p.test(descripcion))) {
      const coincide = categoriasDisponibles.find(
        (c) => c.toLowerCase() === regla.categoria.toLowerCase()
      );
      if (coincide) return { categoria: coincide, aprendida: false };
      if (categoriasDisponibles.includes(regla.categoria)) {
        return { categoria: regla.categoria, aprendida: false };
      }
    }
  }

  return {
    categoria: categoriasDisponibles[0] ?? defecto,
    aprendida: false,
  };
}

export function claveDuplicadoTransaccion(
  fecha: string,
  monto: number,
  descripcion: string
): string {
  const texto = descripcion.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 50);
  return `${fecha}|${monto.toFixed(2)}|${texto}`;
}

export function marcarDuplicadosImportacion<
  T extends { fecha: string; monto: number; descripcion: string; duplicado: boolean },
>(movimientos: T[], transacciones: Transaccion[]): void {
  const existentes = new Set(
    transacciones.map((t) =>
      claveDuplicadoTransaccion(t.fecha, t.monto, t.descripcion)
    )
  );
  const vistos = new Set<string>();

  for (const mov of movimientos) {
    const clave = claveDuplicadoTransaccion(
      mov.fecha,
      mov.monto,
      mov.descripcion
    );
    mov.duplicado = existentes.has(clave) || vistos.has(clave);
    vistos.add(clave);
  }
}
