"use client";

import { useEffect, useLayoutEffect } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { aplicarTema, observarTemaSistema } from "@/lib/tema";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Mantiene el tema sincronizado en el DOM (sobrevive a la hidratación de React) */
export function ThemeSync() {
  const { configuracion, cargado } = useFinanzas();
  const preferencia = configuracion.tema ?? "claro";

  useIsomorphicLayoutEffect(() => {
    aplicarTema(preferencia);
  }, [preferencia]);

  useIsomorphicLayoutEffect(() => {
    if (cargado) {
      aplicarTema(preferencia);
    }
  }, [cargado, preferencia]);

  useEffect(() => {
    if (preferencia !== "sistema") return;
    return observarTemaSistema(() => aplicarTema("sistema"));
  }, [preferencia]);

  return null;
}
