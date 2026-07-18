import type {
  MovimientoBancoPendiente,
  PlantillaImportacionBanco,
  ResultadoParseoBanco,
} from "@/types/importacion-banco";
import type { Transaccion } from "@/types/finanzas";
import { generarId } from "@/lib/storage";
import { indiceColumna, parsearCsv } from "@/lib/importacion-banco/csv";
import {
  marcarDuplicadosImportacion,
  sugerirCategoriaImportacion,
} from "@/lib/importacion-banco/categorias";

export const PLANTILLAS_IMPORTACION: {
  id: PlantillaImportacionBanco;
  etiqueta: string;
  tipo: "cuenta" | "tarjeta";
  banco: string;
}[] = [
  { id: "popular-cuenta", etiqueta: "Banco Popular — cuenta", tipo: "cuenta", banco: "Banco Popular" },
  { id: "popular-tarjeta", etiqueta: "Banco Popular — tarjeta", tipo: "tarjeta", banco: "Banco Popular" },
  { id: "bhd-cuenta", etiqueta: "Banco BHD — cuenta", tipo: "cuenta", banco: "Banco BHD" },
  { id: "bhd-tarjeta", etiqueta: "Banco BHD — tarjeta", tipo: "tarjeta", banco: "Banco BHD" },
  { id: "generica", etiqueta: "Otro banco (genérica)", tipo: "cuenta", banco: "" },
];

interface ColumnasPlantilla {
  fecha: string[];
  descripcion: string[];
  debito?: string[];
  credito?: string[];
  monto?: string[];
  tipo?: string[];
}

const COLUMNAS: Record<PlantillaImportacionBanco, ColumnasPlantilla> = {
  "popular-cuenta": {
    fecha: ["fecha", "fecha transaccion", "fecha movimiento"],
    descripcion: ["descripcion", "detalle", "concepto", "referencia"],
    debito: ["debito", "debitos", "cargo", "retiro"],
    credito: ["credito", "creditos", "abono", "deposito"],
  },
  "popular-tarjeta": {
    fecha: ["fecha", "fecha transaccion", "fecha de transaccion"],
    descripcion: ["descripcion", "comercio", "establecimiento", "detalle"],
    monto: ["monto", "importe", "monto en pesos", "monto rd", "monto dop"],
  },
  "bhd-cuenta": {
    fecha: ["fecha", "fecha valor", "fecha transaccion"],
    descripcion: ["descripcion", "detalle", "concepto"],
    debito: ["debito", "debitos", "cargo"],
    credito: ["credito", "creditos", "abono"],
  },
  "bhd-tarjeta": {
    fecha: ["fecha", "fecha transaccion", "fecha de compra"],
    descripcion: ["descripcion", "comercio", "establecimiento"],
    monto: ["monto", "importe", "monto en pesos", "monto usd"],
  },
  generica: {
    fecha: ["fecha", "date", "fecha transaccion"],
    descripcion: ["descripcion", "detalle", "concepto", "description", "comercio"],
    debito: ["debito", "debitos", "cargo", "withdrawal"],
    credito: ["credito", "creditos", "abono", "deposit"],
    monto: ["monto", "importe", "amount", "valor"],
  },
};

function parsearFecha(texto: string): string | null {
  const limpio = texto.trim();
  if (!limpio) return null;

  const iso = limpio.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dmy = limpio.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dmy) {
    const dia = dmy[1].padStart(2, "0");
    const mes = dmy[2].padStart(2, "0");
    let anio = dmy[3];
    if (anio.length === 2) anio = `20${anio}`;
    return `${anio}-${mes}-${dia}`;
  }

  return null;
}

function parsearMonto(texto: string): number {
  let s = texto.trim();
  if (!s || s === "-" || s === "—") return 0;

  s = s.replace(/[RD$\s]/gi, "").replace(/[A-Z]{3}/gi, "");

  const tieneComa = s.includes(",");
  const tienePunto = s.includes(".");

  if (tieneComa && tienePunto) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (tieneComa) {
    const partes = s.split(",");
    if (partes.length === 2 && partes[1].length <= 2) {
      s = `${partes[0].replace(/\./g, "")}.${partes[1]}`;
    } else {
      s = s.replace(/,/g, "");
    }
  }

  const valor = parseFloat(s.replace(/[^\d.-]/g, ""));
  return Number.isFinite(valor) ? Math.abs(valor) : 0;
}

function esFilaEncabezado(fila: string[]): boolean {
  const unida = fila.join(" ").toLowerCase();
  return (
    unida.includes("fecha") ||
    unida.includes("descripcion") ||
    unida.includes("detalle") ||
    unida.includes("debito") ||
    unida.includes("credito") ||
    unida.includes("monto")
  );
}

function encontrarFilaEncabezado(filas: string[][]): number {
  for (let i = 0; i < Math.min(filas.length, 15); i++) {
    if (esFilaEncabezado(filas[i])) return i;
  }
  return 0;
}

function leerCelda(fila: string[], indice: number): string {
  if (indice < 0 || indice >= fila.length) return "";
  return fila[indice].trim();
}

export function parsearMovimientosBanco(
  contenido: string,
  plantilla: PlantillaImportacionBanco,
  monedaDefecto: string,
  transacciones: Transaccion[],
  categoriasGasto: string[],
  categoriasIngreso: string[]
): ResultadoParseoBanco {
  const errores: string[] = [];
  const advertencias: string[] = [];
  const filas = parsearCsv(contenido);

  if (filas.length < 2) {
    return {
      movimientos: [],
      errores: ["El archivo está vacío o no tiene filas de datos."],
      advertencias: [],
    };
  }

  const idxEncabezado = encontrarFilaEncabezado(filas);
  const encabezados = filas[idxEncabezado];
  const cols = COLUMNAS[plantilla];

  const iFecha = indiceColumna(encabezados, cols.fecha);
  const iDesc = indiceColumna(encabezados, cols.descripcion);
  const iDebito = cols.debito ? indiceColumna(encabezados, cols.debito) : -1;
  const iCredito = cols.credito ? indiceColumna(encabezados, cols.credito) : -1;
  const iMonto = cols.monto ? indiceColumna(encabezados, cols.monto) : -1;

  if (iFecha < 0) errores.push("No se encontró la columna de fecha.");
  if (iDesc < 0) errores.push("No se encontró la columna de descripción.");

  if (errores.length > 0) {
    return { movimientos: [], errores, advertencias };
  }

  const esTarjeta =
    plantilla === "popular-tarjeta" || plantilla === "bhd-tarjeta";
  const movimientos: MovimientoBancoPendiente[] = [];

  for (let i = idxEncabezado + 1; i < filas.length; i++) {
    const fila = filas[i];
    if (fila.every((c) => !c.trim())) continue;

    const fechaRaw = leerCelda(fila, iFecha);
    const fecha = parsearFecha(fechaRaw);
    const descripcion = leerCelda(fila, iDesc) || "Movimiento importado";

    if (!fecha) {
      advertencias.push(`Fila ${i + 1}: fecha no válida (${fechaRaw || "vacía"}).`);
      continue;
    }

    let tipo: "ingreso" | "gasto" = "gasto";
    let monto = 0;

    if (iMonto >= 0) {
      monto = parsearMonto(leerCelda(fila, iMonto));
      if (monto <= 0) continue;
      tipo = esTarjeta ? "gasto" : "gasto";
    } else {
      const debito = parsearMonto(leerCelda(fila, iDebito));
      const credito = parsearMonto(leerCelda(fila, iCredito));
      if (debito > 0 && credito > 0) {
        advertencias.push(`Fila ${i + 1}: débito y crédito; se usa el mayor.`);
      }
      if (debito > 0) {
        monto = debito;
        tipo = "gasto";
      } else if (credito > 0) {
        monto = credito;
        tipo = "ingreso";
      } else {
        continue;
      }
    }

    const categorias =
      tipo === "gasto" ? categoriasGasto : categoriasIngreso;

    movimientos.push({
      id: generarId(),
      fecha,
      descripcion,
      monto,
      tipo,
      moneda: monedaDefecto,
      categoria: sugerirCategoriaImportacion(descripcion, tipo, categorias),
      seleccionado: true,
      duplicado: false,
      filaCsv: i + 1,
    });
  }

  if (movimientos.length === 0) {
    errores.push(
      "No se encontraron movimientos válidos. Revisa la plantilla o el formato del CSV."
    );
  }

  marcarDuplicadosImportacion(movimientos, transacciones);
  for (const mov of movimientos) {
    if (mov.duplicado) mov.seleccionado = false;
  }

  return { movimientos, errores, advertencias };
}
