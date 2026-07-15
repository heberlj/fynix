"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

export const EVENTO_ENTRADA_PAGINA = "pagina-entrada";

export function notificarEntradaPagina(href: string) {
  window.dispatchEvent(
    new CustomEvent(EVENTO_ENTRADA_PAGINA, { detail: { href } })
  );
}

function rutaCoincide(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function useEntradaPagina(activo = true) {
  const pathname = usePathname();
  const [entradaActiva, setEntradaActiva] = useState(false);

  const dispararEntrada = useCallback(() => {
    setEntradaActiva(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setEntradaActiva(true);
      });
    });
  }, []);

  useLayoutEffect(() => {
    if (!activo) {
      setEntradaActiva(false);
      return;
    }
    dispararEntrada();
  }, [pathname, activo, dispararEntrada]);

  useEffect(() => {
    function onEntradaDesdeNav(event: Event) {
      if (!activo) return;
      const href = (event as CustomEvent<{ href: string }>).detail?.href;
      if (!href || !rutaCoincide(pathname, href)) return;
      dispararEntrada();
    }

    window.addEventListener(EVENTO_ENTRADA_PAGINA, onEntradaDesdeNav);
    return () =>
      window.removeEventListener(EVENTO_ENTRADA_PAGINA, onEntradaDesdeNav);
  }, [pathname, activo, dispararEntrada]);

  return entradaActiva;
}
