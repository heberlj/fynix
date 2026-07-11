import type { ConfiguracionUsuario, Prestamo, TipoTasaInteres } from "@/types/finanzas";
import { periodoDeFecha } from "@/lib/quincenas";

export function tasaMensual(tasa: number, tipo: TipoTasaInteres): number {
  if (tasa <= 0) return 0;
  if (tipo === "mensual") return tasa / 100;
  return tasa / 100 / 12;
}

export function calcularCuotaSugerida(
  montoPrestado: number,
  cuotasTotales: number
): number {
  if (cuotasTotales <= 0) return 0;
  return Math.round((montoPrestado / cuotasTotales) * 100) / 100;
}

export function calcularCuotaConInteres(
  montoPrestado: number,
  tasaInteres: number,
  cuotasTotales: number,
  tipoTasa: TipoTasaInteres
): number {
  if (cuotasTotales <= 0 || montoPrestado <= 0) return 0;
  if (tasaInteres <= 0) {
    return calcularCuotaSugerida(montoPrestado, cuotasTotales);
  }

  const r = tasaMensual(tasaInteres, tipoTasa);
  const n = cuotasTotales;
  const factor = Math.pow(1 + r, n);

  if (factor === 1) {
    return calcularCuotaSugerida(montoPrestado, cuotasTotales);
  }

  const cuota = (montoPrestado * r * factor) / (factor - 1);
  return Math.round(cuota * 100) / 100;
}

export function totalAPagar(prestamo: Prestamo): number {
  return Math.round(prestamo.montoCuota * prestamo.cuotasTotales * 100) / 100;
}

export function totalIntereses(prestamo: Prestamo): number {
  return Math.max(0, Math.round((totalAPagar(prestamo) - prestamo.montoPrestado) * 100) / 100);
}

export function cuotasRestantes(prestamo: Prestamo): number {
  return Math.max(0, prestamo.cuotasTotales - prestamo.cuotasPagadas);
}

export function saldoPendiente(prestamo: Prestamo): number {
  return Math.round(cuotasRestantes(prestamo) * prestamo.montoCuota * 100) / 100;
}

export function interesesPendientes(prestamo: Prestamo): number {
  if (prestamo.cuotasTotales <= 0) return 0;
  const pendientes = cuotasRestantes(prestamo);
  const interesPorCuota = totalIntereses(prestamo) / prestamo.cuotasTotales;
  return Math.round(pendientes * interesPorCuota * 100) / 100;
}

export function progresoPrestamo(prestamo: Prestamo): number {
  if (prestamo.cuotasTotales <= 0) return 0;
  return Math.min(100, (prestamo.cuotasPagadas / prestamo.cuotasTotales) * 100);
}

export function prestamoCompletado(prestamo: Prestamo): boolean {
  return prestamo.cuotasPagadas >= prestamo.cuotasTotales;
}

export function diasHastaCuota(diaPago: number, desde: Date = new Date()): number {
  const hoy = desde.getDate();
  const mes = desde.getMonth();
  const anio = desde.getFullYear();
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();
  const diaEfectivo = Math.min(diaPago, ultimoDia);

  if (hoy <= diaEfectivo) return diaEfectivo - hoy;

  const ultimoSiguiente = new Date(anio, mes + 2, 0).getDate();
  const diaSiguiente = Math.min(diaPago, ultimoSiguiente);
  return ultimoDia - hoy + diaSiguiente;
}

export function quincenaDePago(
  diaPago: number,
  configuracion: ConfiguracionUsuario,
  referencia: Date = new Date()
): string {
  const anio = referencia.getFullYear();
  const mes = referencia.getMonth() + 1;
  const ultimoDia = new Date(anio, mes, 0).getDate();
  const dia = Math.min(diaPago, ultimoDia);
  const fecha = `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  const periodo = periodoDeFecha(fecha, configuracion.diasPago);
  return `Q${periodo.quincena}`;
}

export function etiquetaTasa(prestamo: Prestamo): string {
  if (prestamo.tasaInteres <= 0) return "Sin interés";
  const tipo = prestamo.tipoTasa === "anual" ? "anual" : "mensual";
  return `${prestamo.tasaInteres}% ${tipo}`;
}
