import type { EstadoFinanzas } from "@/types/finanzas";

export function debeMostrarOnboarding(
  estado: EstadoFinanzas,
  cargado: boolean
): boolean {
  if (!cargado) return false;
  return !estado.configuracion.onboardingCompletado;
}
