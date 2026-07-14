"use client";

import { useEffect, useState } from "react";
import type { TemaApp } from "@/types/finanzas";
import {
  aplicarTema,
  leerTemaLocal,
  resolverTemaVisual,
} from "@/lib/tema";

export function BotonTemaAuth() {
  const [tema, setTema] = useState<TemaApp>(() => leerTemaLocal() ?? "claro");

  useEffect(() => {
    const guardado = leerTemaLocal();
    if (guardado) {
      setTema(guardado);
      aplicarTema(guardado);
    }
  }, []);

  const esOscuro = resolverTemaVisual(tema) === "oscuro";

  function alternar() {
    const siguiente: TemaApp = esOscuro ? "claro" : "oscuro";
    setTema(siguiente);
    aplicarTema(siguiente);
  }

  return (
    <button
      type="button"
      onClick={alternar}
      className="fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-lg shadow-sm transition-colors hover:bg-surface-hover"
      aria-label={esOscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={esOscuro ? "Tema claro" : "Tema oscuro"}
    >
      <span aria-hidden className="text-base leading-none">
        {esOscuro ? "☀" : "☾"}
      </span>
    </button>
  );
}
