"use client";

import { useFinanzas } from "@/context/FinanzasContext";

export function AvisoCargaFinanzas() {
  const { cargado, errorCarga, recargarDatos } = useFinanzas();

  if (!cargado || !errorCarga) return null;

  return (
    <div className="border-b border-gasto/30 bg-gasto/10 px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            No se pudieron cargar tus datos
          </p>
          <p className="mt-1 text-xs text-muted">{errorCarga}</p>
        </div>
        <button
          type="button"
          onClick={() => void recargarDatos()}
          className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
