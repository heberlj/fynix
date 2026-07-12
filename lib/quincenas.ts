import type { ConfiguracionUsuario, PeriodoQuincena } from "@/types/finanzas";

function ultimoDiaDelMes(anio: number, mes: number): number {
  return new Date(anio, mes, 0).getDate();
}

function aFechaISO(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function mesAnterior(anio: number, mes: number) {
  return mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 };
}

function mesSiguiente(anio: number, mes: number) {
  return mes === 12 ? { anio: anio + 1, mes: 1 } : { anio, mes: mes + 1 };
}

const MESES_CORTOS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function formatearRango(
  inicio: { anio: number; mes: number; dia: number },
  fin: { anio: number; mes: number; dia: number }
): string {
  if (inicio.mes === fin.mes && inicio.anio === fin.anio) {
    return `${inicio.dia}–${fin.dia} ${MESES_CORTOS[inicio.mes - 1]}`;
  }
  return `${inicio.dia} ${MESES_CORTOS[inicio.mes - 1]} – ${fin.dia} ${MESES_CORTOS[fin.mes - 1]}`;
}

function crearPeriodo(
  quincena: 1 | 2,
  inicio: { anio: number; mes: number; dia: number },
  fin: { anio: number; mes: number; dia: number }
): PeriodoQuincena {
  return {
    quincena,
    mes: aFechaISO(inicio.anio, inicio.mes, 1).slice(0, 7),
    inicio: aFechaISO(inicio.anio, inicio.mes, inicio.dia),
    fin: aFechaISO(fin.anio, fin.mes, fin.dia),
    etiqueta: `Q${quincena} · ${formatearRango(inicio, fin)}`,
  };
}

function periodoQuincenaCalendario(
  anio: number,
  mes: number,
  quincena: 1 | 2
): PeriodoQuincena {
  if (quincena === 1) {
    return crearPeriodo(1, { anio, mes, dia: 1 }, { anio, mes, dia: 15 });
  }
  const ultimoDia = ultimoDiaDelMes(anio, mes);
  return crearPeriodo(2, { anio, mes, dia: 16 }, { anio, mes, dia: ultimoDia });
}

/** Quincenas de calendario: Q1 del 1 al 15, Q2 del 16 al fin de mes */
export function periodoDeFecha(
  fecha: string,
  _diasPago?: [number, number]
): PeriodoQuincena {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return periodoQuincenaCalendario(anio, mes, dia <= 15 ? 1 : 2);
}

export function obtenerQuincenaActual(
  _configuracion?: ConfiguracionUsuario,
  referencia: Date = new Date()
): PeriodoQuincena {
  const hoy = aFechaISO(
    referencia.getFullYear(),
    referencia.getMonth() + 1,
    referencia.getDate()
  );
  return periodoDeFecha(hoy);
}

export function obtenerQuincenaAnterior(
  periodo: PeriodoQuincena,
  _diasPago?: [number, number]
): PeriodoQuincena {
  const [anio, mes] = periodo.inicio.split("-").map(Number);

  if (periodo.quincena === 1) {
    const anterior = mesAnterior(anio, mes);
    return periodoQuincenaCalendario(anterior.anio, anterior.mes, 2);
  }

  return periodoQuincenaCalendario(anio, mes, 1);
}

export function obtenerQuincenaSiguiente(
  periodo: PeriodoQuincena,
  _diasPago?: [number, number]
): PeriodoQuincena {
  const [anio, mes] = periodo.inicio.split("-").map(Number);

  if (periodo.quincena === 1) {
    return periodoQuincenaCalendario(anio, mes, 2);
  }

  const siguiente = mesSiguiente(anio, mes);
  return periodoQuincenaCalendario(siguiente.anio, siguiente.mes, 1);
}

export function obtenerAmbasQuincenas(
  configuracion: ConfiguracionUsuario,
  referencia: Date = new Date()
): [PeriodoQuincena, PeriodoQuincena] {
  const actual = obtenerQuincenaActual(configuracion, referencia);
  const [anio, mes] = actual.inicio.split("-").map(Number);
  const q1 = periodoQuincenaCalendario(anio, mes, 1);
  const q2 = periodoQuincenaCalendario(anio, mes, 2);
  return [q1, q2];
}

/** Quincenas del mes calendario (1–15 y 16–fin) */
export function obtenerQuincenasDelMes(
  mes: string,
  _diasPago?: [number, number]
): PeriodoQuincena[] {
  const [anio, mesNum] = mes.split("-").map(Number);
  return [
    periodoQuincenaCalendario(anio, mesNum, 1),
    periodoQuincenaCalendario(anio, mesNum, 2),
  ];
}

export function periodosSonIguales(a: PeriodoQuincena, b: PeriodoQuincena): boolean {
  return a.inicio === b.inicio && a.fin === b.fin;
}

export function fechaEnPeriodo(fecha: string, periodo: PeriodoQuincena): boolean {
  return fecha >= periodo.inicio && fecha <= periodo.fin;
}

export function asignarQuincena(
  fecha: string,
  _configuracion?: ConfiguracionUsuario
): { quincena: 1 | 2; mes: string } {
  const periodo = periodoDeFecha(fecha);
  return { quincena: periodo.quincena, mes: periodo.mes };
}

export function formatearMoneda(monto: number, moneda = "DOP"): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: 2,
  }).format(monto);
}
