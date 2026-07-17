/** Número de soporte (RD). Se puede sobreescribir con NEXT_PUBLIC_WHATSAPP_SOPORTE */
export const NUMERO_WHATSAPP_SOPORTE_DEFAULT = "18097273599";

export const MENSAJE_REPORTE_PROBLEMA = `¡Hola! Vengo desde Fynix para reportar un problema 🛠️

¿Qué pasó?
(Ej: no guarda una transacción, algo no se ve bien…)

¿Dónde lo notaste?
(Ej: Home, Transacciones, Quincenas…)

¿Cuándo pasó?
(Hoy, ayer, después de actualizar…)

Cualquier detalle extra que ayude:
`;

export const MENSAJE_SUGERENCIA = `¡Hola! Vengo desde Fynix con una idea 💡

Mi sugerencia:
(¿Qué te gustaría que hiciera la app o qué mejorarías?)

¿Por qué te serviría?
(Cuéntanos cómo te ayudaría en tu día a día)

¡Gracias por tomarte el tiempo!`;

export function numeroWhatsAppSoporte(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_WHATSAPP_SOPORTE?.trim() ||
    NUMERO_WHATSAPP_SOPORTE_DEFAULT;
  const digitos = raw.replace(/\D/g, "");
  return digitos.length >= 10 ? digitos : null;
}

export function enlaceWhatsAppSoporte(mensaje: string): string | null {
  const numero = numeroWhatsAppSoporte();
  if (!numero) return null;

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
