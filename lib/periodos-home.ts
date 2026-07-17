import { formatearFecha } from "@/lib/fechas";

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

export type TipoPeriodoHome = "dia" | "semana" | "mes" | "anio";

export interface RangoPeriodoHome {
  inicio: string;
  fin: string;
  etiqueta: string;
}

function formatoFechaLocal(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

function parseFechaLocal(fecha: string): Date {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

export function fechaEnRango(fecha: string, rango: RangoPeriodoHome): boolean {
  const dia = fecha.slice(0, 10);
  return dia >= rango.inicio && dia <= rango.fin;
}

function inicioSemana(fecha: Date): Date {
  const inicio = new Date(fecha);
  const diaSemana = inicio.getDay();
  const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
  inicio.setDate(inicio.getDate() + diff);
  return inicio;
}

function finSemana(inicio: Date): Date {
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);
  return fin;
}

function etiquetaSemana(inicio: Date, fin: Date): string {
  const mismoMes = inicio.getMonth() === fin.getMonth();
  if (mismoMes) {
    return `${inicio.getDate()}–${fin.getDate()} ${MESES[inicio.getMonth()]} ${inicio.getFullYear()}`;
  }
  return `${inicio.getDate()} ${MESES[inicio.getMonth()]} – ${fin.getDate()} ${MESES[fin.getMonth()]} ${fin.getFullYear()}`;
}

export function rangoPeriodoHome(
  tipo: TipoPeriodoHome,
  referencia: string
): RangoPeriodoHome {
  if (tipo === "mes") {
    const [anio, mes] = referencia.split("-").map(Number);
    const inicio = new Date(anio, mes - 1, 1);
    const fin = new Date(anio, mes, 0);
    return {
      inicio: formatoFechaLocal(inicio),
      fin: formatoFechaLocal(fin),
      etiqueta: `${MESES[mes - 1]} ${anio}`,
    };
  }

  if (tipo === "anio") {
    const anio = Number(referencia);
    return {
      inicio: `${anio}-01-01`,
      fin: `${anio}-12-31`,
      etiqueta: String(anio),
    };
  }

  const fecha = parseFechaLocal(referencia);

  if (tipo === "dia") {
    const dia = formatoFechaLocal(fecha);
    return {
      inicio: dia,
      fin: dia,
      etiqueta: formatearFecha(dia),
    };
  }

  const inicio = inicioSemana(fecha);
  const fin = finSemana(inicio);
  return {
    inicio: formatoFechaLocal(inicio),
    fin: formatoFechaLocal(fin),
    etiqueta: etiquetaSemana(inicio, fin),
  };
}

export function etiquetaTipoPeriodo(tipo: TipoPeriodoHome): string {
  switch (tipo) {
    case "dia":
      return "día";
    case "semana":
      return "semana";
    case "mes":
      return "mes";
    case "anio":
      return "año";
  }
}
