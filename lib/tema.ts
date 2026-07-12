import type { TemaApp } from "@/types/finanzas";

const TEMAS: TemaApp[] = ["claro", "oscuro", "sistema"];

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
