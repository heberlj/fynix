export const MENSAJE_REPORTE_PROBLEMA =
  "Hola, quiero reportar un problema en Fynix:\n\n";

export const MENSAJE_SUGERENCIA =
  "Hola, tengo una sugerencia para Fynix:\n\n";

export function numeroWhatsAppSoporte(): string | null {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_SOPORTE?.trim();
  if (!raw) return null;

  const digitos = raw.replace(/\D/g, "");
  return digitos.length >= 10 ? digitos : null;
}

export function enlaceWhatsAppSoporte(mensaje: string): string | null {
  const numero = numeroWhatsAppSoporte();
  if (!numero) return null;

  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
