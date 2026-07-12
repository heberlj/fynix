export function validarDiasPago(
  dia1: number,
  dia2: number
): string | null {
  if (!Number.isFinite(dia1) || !Number.isFinite(dia2)) {
    return "Ingresa días de pago válidos (del 1 al 31).";
  }
  if (dia1 < 1 || dia1 > 31 || dia2 < 1 || dia2 > 31) {
    return "Los días de pago deben estar entre 1 y 31.";
  }
  if (dia1 === dia2) {
    return "Los dos días de pago deben ser distintos.";
  }
  return null;
}
