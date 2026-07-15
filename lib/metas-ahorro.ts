import type { MetaAhorro } from "@/types/finanzas";

export function progresoMeta(meta: MetaAhorro): number {
  if (meta.montoObjetivo <= 0) return 0;
  return Math.min(100, (meta.montoActual / meta.montoObjetivo) * 100);
}

export function faltanteMeta(meta: MetaAhorro): number {
  return Math.max(0, Math.round((meta.montoObjetivo - meta.montoActual) * 100) / 100);
}

export function metaCompletada(meta: MetaAhorro): boolean {
  return meta.montoActual >= meta.montoObjetivo;
}

export function diasHastaLimite(fechaLimite?: string): number | null {
  if (!fechaLimite) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(`${fechaLimite}T12:00:00`);
  if (Number.isNaN(limite.getTime())) return null;
  return Math.ceil((limite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

export function metasOrdenadas(metas: MetaAhorro[]): MetaAhorro[] {
  return [...metas].sort((a, b) => {
    const aCompleta = metaCompletada(a);
    const bCompleta = metaCompletada(b);
    if (aCompleta !== bCompleta) return aCompleta ? 1 : -1;
    return progresoMeta(b) - progresoMeta(a);
  });
}

export function totalAhorradoPorMoneda(metas: MetaAhorro[]): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const meta of metas) {
    mapa.set(meta.moneda, (mapa.get(meta.moneda) ?? 0) + meta.montoActual);
  }
  return mapa;
}
