import type { TemaApp } from "@/types/finanzas";

const TEMAS: TemaApp[] = ["claro", "oscuro", "sistema"];
const CLAVE_TEMA_LOCAL = "fynix-tema";

export function leerTemaLocal(): TemaApp | null {
  if (typeof window === "undefined") return null;
  try {
    const valor = localStorage.getItem(CLAVE_TEMA_LOCAL);
    if (valor && TEMAS.includes(valor as TemaApp)) {
      return valor as TemaApp;
    }
  } catch {
    /* ignorar */
  }
  return null;
}

export function guardarTemaLocal(tema: TemaApp): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CLAVE_TEMA_LOCAL, tema);
  } catch {
    /* ignorar */
  }
}

export function resolverTemaVisual(tema: TemaApp | undefined): "claro" | "oscuro" {
  const preferencia: TemaApp =
    tema && TEMAS.includes(tema) ? tema : "claro";

  if (preferencia === "oscuro") return "oscuro";
  if (preferencia === "sistema" && typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "oscuro"
      : "claro";
  }
  return "claro";
}

export function aplicarTema(tema: TemaApp | undefined): void {
  if (typeof document === "undefined") return;

  const preferencia: TemaApp =
    tema && TEMAS.includes(tema) ? tema : "claro";
  const visual = resolverTemaVisual(preferencia);
  const html = document.documentElement;

  html.setAttribute("data-theme-preference", preferencia);
  html.setAttribute("data-theme", visual);
  html.style.colorScheme = visual === "oscuro" ? "dark" : "light";

  if (preferencia !== "sistema") {
    guardarTemaLocal(preferencia);
  }
}

export function obtenerTemaInicial(): TemaApp {
  return "claro";
}

export function observarTemaSistema(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => callback();
  media.addEventListener("change", handler);
  return () => media.removeEventListener("change", handler);
}
