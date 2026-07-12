import type { MarcaTarjeta } from "@/types/finanzas";
import { cifrarTexto } from "@/lib/cifrado-tarjetas";

export function limpiarNumeroTarjeta(numero: string): string {
  return numero.replace(/\D/g, "");
}

export function formatearNumeroTarjeta(numero: string): string {
  const limpio = limpiarNumeroTarjeta(numero).slice(0, 16);
  return limpio.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function detectarMarca(numero: string): MarcaTarjeta {
  const limpio = limpiarNumeroTarjeta(numero);
  if (!limpio) return "desconocida";

  if (/^4\d{0,15}$/.test(limpio)) return "visa";

  const primerosDos = parseInt(limpio.slice(0, 2), 10);
  const primerosCuatro = parseInt(limpio.slice(0, 4), 10);
  if (
    (primerosDos >= 51 && primerosDos <= 55) ||
    (primerosCuatro >= 2221 && primerosCuatro <= 2720)
  ) {
    return "mastercard";
  }

  return "desconocida";
}

export function validarLuhn(numero: string): boolean {
  const limpio = limpiarNumeroTarjeta(numero);
  if (limpio.length < 13) return false;

  let suma = 0;
  let alternar = false;

  for (let i = limpio.length - 1; i >= 0; i--) {
    let digito = parseInt(limpio[i], 10);
    if (alternar) {
      digito *= 2;
      if (digito > 9) digito -= 9;
    }
    suma += digito;
    alternar = !alternar;
  }

  return suma % 10 === 0;
}

export function enmascararNumero(numero: string): string {
  const limpio = limpiarNumeroTarjeta(numero);
  if (!limpio) return "";
  if (limpio.length <= 4) return formatearNumeroTarjeta(limpio);

  const inicio = limpio.slice(0, 4);

  if (limpio.length < 13) {
    const ocultos = limpio.length - 4;
    const bullets = "•".repeat(ocultos);
    const grupos = bullets.match(/.{1,4}/g)?.join(" ") ?? bullets;
    return `${inicio} ${grupos}`;
  }

  const ultimos = limpio.slice(-4);
  const longitudMedio = limpio.length - 8;
  const gruposMedio = Math.ceil(longitudMedio / 4);
  const medio = Array.from({ length: gruposMedio }, () => "••••").join(" ");
  return `${inicio} ${medio} ${ultimos}`;
}

export function obtenerPrimerosCuatro(numero: string): string {
  return limpiarNumeroTarjeta(numero).slice(0, 4);
}

export function obtenerUltimosCuatro(numero: string): string {
  return limpiarNumeroTarjeta(numero).slice(-4);
}

export function formatearExpiracion(valor: string): string {
  const limpio = valor.replace(/\D/g, "").slice(0, 4);
  if (limpio.length <= 2) return limpio;
  return `${limpio.slice(0, 2)}/${limpio.slice(2)}`;
}

export function validarExpiracion(expiracion: string): boolean {
  const match = expiracion.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;

  const mes = parseInt(match[1], 10);
  const anio = 2000 + parseInt(match[2], 10);
  if (mes < 1 || mes > 12) return false;

  const hoy = new Date();
  const finMes = new Date(anio, mes, 0);
  return finMes >= new Date(hoy.getFullYear(), hoy.getMonth(), 1);
}

export function validarCvv(cvv: string, marca: MarcaTarjeta): boolean {
  const limpio = cvv.replace(/\D/g, "");
  if (marca === "visa") return /^\d{3}$/.test(limpio);
  if (marca === "mastercard") return /^\d{3}$/.test(limpio);
  return /^\d{3,4}$/.test(limpio);
}

export function diasHastaPago(diaPago: number, desde: Date = new Date()): number {
  const hoy = desde.getDate();
  const mes = desde.getMonth();
  const anio = desde.getFullYear();
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();
  const diaEfectivo = Math.min(diaPago, ultimoDia);

  if (hoy <= diaEfectivo) return diaEfectivo - hoy;

  const siguienteMes = mes + 1;
  const siguienteAnio = siguienteMes > 11 ? anio + 1 : anio;
  const siguienteMesNorm = siguienteMes % 12;
  const ultimoSiguiente = new Date(siguienteAnio, siguienteMesNorm + 1, 0).getDate();
  const diaSiguiente = Math.min(diaPago, ultimoSiguiente);

  return ultimoDia - hoy + diaSiguiente;
}

export function validarNumeroCuotas(numero: string): boolean {
  const limpio = limpiarNumeroTarjeta(numero);
  return limpio.length === 16;
}

export function numeroCuotasDesdeEntrada(numero: string): {
  numeroEnmascarado: string;
  primerosCuatro: string;
  ultimosCuatro: string;
} {
  const limpio = limpiarNumeroTarjeta(numero);
  return {
    numeroEnmascarado: enmascararNumero(limpio),
    primerosCuatro: obtenerPrimerosCuatro(limpio),
    ultimosCuatro: obtenerUltimosCuatro(limpio),
  };
}

export async function almacenarNumeroTarjeta(
  numero: string,
  usuarioId: string
): Promise<{
  numeroCifrado: string;
  numeroEnmascarado: string;
  primerosCuatro: string;
  ultimosCuatro: string;
}> {
  const limpio = limpiarNumeroTarjeta(numero);
  const primerosCuatro = obtenerPrimerosCuatro(limpio);
  const ultimosCuatro = obtenerUltimosCuatro(limpio);
  const medio = limpio.slice(4, -4);
  const numeroCifrado =
    medio.length > 0 ? await cifrarTexto(medio, usuarioId) : "";

  return {
    numeroCifrado,
    numeroEnmascarado: enmascararNumero(limpio),
    primerosCuatro,
    ultimosCuatro,
  };
}

export const MARCA_ETIQUETA: Record<MarcaTarjeta, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  desconocida: "Desconocida",
};
