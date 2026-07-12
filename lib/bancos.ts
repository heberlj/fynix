/** Bancos múltiples autorizados por la Superintendencia de Bancos (RD) */
export const BANCOS_CERTIFICADOS = [
  "Banreservas",
  "Banco Popular",
  "Banco BHD",
  "Banco Santa Cruz",
  "Scotiabank",
  "Banco Promerica",
  "Banco Caribe",
  "Banco Qik",
] as const;

export type BancoCertificado = (typeof BANCOS_CERTIFICADOS)[number];

export function esBancoCertificado(valor: string): valor is BancoCertificado {
  return (BANCOS_CERTIFICADOS as readonly string[]).includes(valor);
}

export function bancoPermitido(banco: string, legacyPermitido?: string): boolean {
  if (esBancoCertificado(banco)) return true;
  return legacyPermitido !== undefined && banco === legacyPermitido;
}

/** Opciones del selector; incluye valor guardado si no está en la lista (datos antiguos). */
export function opcionesBanco(valorActual?: string): string[] {
  if (valorActual && !esBancoCertificado(valorActual)) {
    return [valorActual, ...BANCOS_CERTIFICADOS];
  }
  return [...BANCOS_CERTIFICADOS];
}
