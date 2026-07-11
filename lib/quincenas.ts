import type { ConfiguracionUsuario, PeriodoQuincena } from "@/types/finanzas";

function ultimoDiaDelMes(anio: number, mes: number): number {
  return new Date(anio, mes, 0).getDate();
}

function diaEfectivo(anio: number, mes: number, dia: number): number {
  return Math.min(dia, ultimoDiaDelMes(anio, mes));
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

function restarUnDia(anio: number, mes: number, dia: number) {
  const fecha = new Date(anio, mes - 1, dia);
  fecha.setDate(fecha.getDate() - 1);
  return {
    anio: fecha.getFullYear(),
    mes: fecha.getMonth() + 1,
    dia: fecha.getDate(),
  };
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

/** Determina el periodo de pago al que pertenece una fecha */
export function periodoDeFecha(
  fecha: string,
  diasPago: [number, number]
): PeriodoQuincena {
  const [p1, p2] = [...diasPago].sort((a, b) => a - b) as [number, number];
  const [anio, mes, dia] = fecha.split("-").map(Number);

  if (dia >= p2) {
    const inicio = { anio, mes, dia: diaEfectivo(anio, mes, p2) };
    const siguiente = mesSiguiente(anio, mes);
    const fin = restarUnDia(siguiente.anio, siguiente.mes, diaEfectivo(siguiente.anio, siguiente.mes, p1));
    return crearPeriodo(2, inicio, fin);
  }

  if (dia >= p1) {
    const inicio = { anio, mes, dia: diaEfectivo(anio, mes, p1) };
    const fin = restarUnDia(anio, mes, diaEfectivo(anio, mes, p2));
    return crearPeriodo(1, inicio, fin);
  }

  const anterior = mesAnterior(anio, mes);
  const inicio = {
    anio: anterior.anio,
    mes: anterior.mes,
    dia: diaEfectivo(anterior.anio, anterior.mes, p2),
  };
  const fin = restarUnDia(anio, mes, diaEfectivo(anio, mes, p1));
  return crearPeriodo(2, inicio, fin);
}

export function obtenerQuincenaActual(
  configuracion: ConfiguracionUsuario,
  referencia: Date = new Date()
): PeriodoQuincena {
  const hoy = aFechaISO(
    referencia.getFullYear(),
    referencia.getMonth() + 1,
    referencia.getDate()
  );
  return periodoDeFecha(hoy, configuracion.diasPago);
}

export function obtenerQuincenaAnterior(
  periodo: PeriodoQuincena,
  diasPago: [number, number]
): PeriodoQuincena {
  const [anio, mes, dia] = periodo.inicio.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  fecha.setDate(fecha.getDate() - 1);
  const anterior = aFechaISO(
    fecha.getFullYear(),
    fecha.getMonth() + 1,
    fecha.getDate()
  );
  return periodoDeFecha(anterior, diasPago);
}

export function obtenerQuincenaSiguiente(
  periodo: PeriodoQuincena,
  diasPago: [number, number]
): PeriodoQuincena {
  const [finAnio, finMes, finDia] = periodo.fin.split("-").map(Number);
  const unDiaMas = new Date(finAnio, finMes - 1, finDia);
  unDiaMas.setDate(unDiaMas.getDate() + 1);
  const inicioSiguiente = aFechaISO(
    unDiaMas.getFullYear(),
    unDiaMas.getMonth() + 1,
    unDiaMas.getDate()
  );
  return periodoDeFecha(inicioSiguiente, diasPago);
}

export function obtenerAmbasQuincenas(
  configuracion: ConfiguracionUsuario,
  referencia: Date = new Date()
): [PeriodoQuincena, PeriodoQuincena] {
  const actual = obtenerQuincenaActual(configuracion, referencia);
  const siguiente = obtenerQuincenaSiguiente(actual, configuracion.diasPago);

  if (actual.quincena === 1) {
    return [actual, siguiente];
  }
  return [siguiente, actual];
}

/** Quincenas cuyo periodo intersecta con un mes calendario */
export function obtenerQuincenasDelMes(
  mes: string,
  diasPago: [number, number]
): PeriodoQuincena[] {
  const [anio, mesNum] = mes.split("-").map(Number);
  const ultimoDia = ultimoDiaDelMes(anio, mesNum);
  const inicioMes = `${mes}-01`;
  const finMes = `${mes}-${String(ultimoDia).padStart(2, "0")}`;

  const claves = new Set<string>();
  const periodos: PeriodoQuincena[] = [];

  function agregar(fecha: string) {
    const periodo = periodoDeFecha(fecha, diasPago);
    if (periodo.fin < inicioMes || periodo.inicio > finMes) return;
    const clave = `${periodo.inicio}_${periodo.fin}`;
    if (claves.has(clave)) return;
    claves.add(clave);
    periodos.push(periodo);
  }

  agregar(inicioMes);
  agregar(finMes);

  const [p1, p2] = [...diasPago].sort((a, b) => a - b);
  agregar(aFechaISO(anio, mesNum, diaEfectivo(anio, mesNum, p1)));
  agregar(aFechaISO(anio, mesNum, diaEfectivo(anio, mesNum, p2)));

  return periodos.sort((a, b) => a.inicio.localeCompare(b.inicio));
}

export function periodosSonIguales(a: PeriodoQuincena, b: PeriodoQuincena): boolean {
  return a.inicio === b.inicio && a.fin === b.fin;
}

export function fechaEnPeriodo(fecha: string, periodo: PeriodoQuincena): boolean {
  return fecha >= periodo.inicio && fecha <= periodo.fin;
}

export function asignarQuincena(
  fecha: string,
  configuracion: ConfiguracionUsuario
): { quincena: 1 | 2; mes: string } {
  const periodo = periodoDeFecha(fecha, configuracion.diasPago);
  return { quincena: periodo.quincena, mes: periodo.mes };
}

export function formatearMoneda(monto: number, moneda = "USD"): string {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: moneda,
    minimumFractionDigits: 2,
  }).format(monto);
}
