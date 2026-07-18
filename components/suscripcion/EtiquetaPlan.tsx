"use client";

import { usePlanLimites } from "@/hooks/usePlanLimites";

export function EtiquetaPlan() {
  const { esPro, cargado } = usePlanLimites();

  if (!cargado) return null;

  if (esPro) {
    return (
      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30">
        Pro
      </span>
    );
  }

  return (
    <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-muted/15 text-muted ring-1 ring-border">
      Free
    </span>
  );
}
