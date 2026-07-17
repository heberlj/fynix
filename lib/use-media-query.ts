"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [coincide, setCoincide] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const actualizar = () => setCoincide(media.matches);
    actualizar();
    media.addEventListener("change", actualizar);
    return () => media.removeEventListener("change", actualizar);
  }, [query]);

  return coincide;
}

export function useEsMovil(): boolean {
  return useMediaQuery("(max-width: 639px)");
}
