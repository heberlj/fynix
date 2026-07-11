import type { TemaApp } from "@/types/finanzas";
import { claveDatosUsuario } from "@/lib/auth";

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
  if (typeof window === "undefined") return "claro";

  try {
    const sesionRaw = localStorage.getItem("fynix-sesion");
    let raw: string | null = null;

    if (sesionRaw) {
      const sesion = JSON.parse(sesionRaw) as { usuarioId?: string };
      if (sesion.usuarioId) {
        raw = localStorage.getItem(claveDatosUsuario(sesion.usuarioId));
      }
    }

    if (!raw) raw = localStorage.getItem("gestor-money-data");
    if (!raw) return "claro";
    const parsed = JSON.parse(raw) as { configuracion?: { tema?: TemaApp } };
    const tema = parsed.configuracion?.tema;
    if (tema && TEMAS.includes(tema)) return tema;
  } catch {
    /* usar default */
  }
  return "claro";
}

export function observarTemaSistema(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => callback();
  media.addEventListener("change", handler);
  return () => media.removeEventListener("change", handler);
}
