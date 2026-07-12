"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AYUDA_POR_PAGINA,
  type PuntoAyuda,
} from "@/lib/ayuda/puntos";

interface AyudaContextValue {
  activo: boolean;
  toggle: () => void;
  cerrar: () => void;
  puntos: PuntoAyuda[];
}

const AyudaContext = createContext<AyudaContextValue | null>(null);

function useAyudaInterno() {
  const ctx = useContext(AyudaContext);
  if (!ctx) {
    throw new Error("useAyuda debe usarse dentro de AyudaPagina");
  }
  return ctx;
}

export function useAyuda() {
  return useAyudaInterno();
}

function CapaBolitasAyuda() {
  const { activo, puntos, cerrar } = useAyudaInterno();
  const [seleccionado, setSeleccionado] = useState<PuntoAyuda | null>(null);
  const [coords, setCoords] = useState<
    { id: string; top: number; left: number }[]
  >([]);

  const actualizarPosiciones = useCallback(() => {
    setCoords(
      puntos
        .map((punto) => {
          const el = document.querySelector(`[data-ayuda="${punto.id}"]`);
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          return {
            id: punto.id,
            top: rect.top + rect.height / 2 - 12,
            left: Math.min(rect.right - 12, window.innerWidth - 32),
          };
        })
        .filter((c): c is { id: string; top: number; left: number } =>
          Boolean(c)
        )
    );
  }, [puntos]);

  useEffect(() => {
    if (!activo) {
      setSeleccionado(null);
      return;
    }

    actualizarPosiciones();
    window.addEventListener("resize", actualizarPosiciones);
    window.addEventListener("scroll", actualizarPosiciones, true);

    return () => {
      window.removeEventListener("resize", actualizarPosiciones);
      window.removeEventListener("scroll", actualizarPosiciones, true);
    };
  }, [activo, actualizarPosiciones]);

  useEffect(() => {
    if (!activo) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (seleccionado) setSeleccionado(null);
        else cerrar();
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [activo, seleccionado, cerrar]);

  if (!activo) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={cerrar}
        aria-hidden
      />

      {coords.map((coord) => (
        <button
          key={coord.id}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const punto = puntos.find((p) => p.id === coord.id);
            if (punto) setSeleccionado(punto);
          }}
          className="fixed z-50 flex h-6 w-6 items-center justify-center rounded-full bg-accent shadow-lg ring-4 ring-accent/30 animate-pulse"
          style={{ top: coord.top, left: coord.left }}
          aria-label="Ver ayuda de esta sección"
        >
          <span className="h-2 w-2 rounded-full bg-white" />
        </button>
      ))}

      <p className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-surface px-4 py-2 text-xs font-medium text-foreground shadow-lg sm:bottom-6">
        Toca una bolita para ver la explicación
      </p>

      {seleccionado && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
          onClick={() => setSeleccionado(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground">
                {seleccionado.titulo}
              </h3>
              <button
                type="button"
                onClick={() => setSeleccionado(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-hover"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {seleccionado.descripcion}
            </p>
            <button
              type="button"
              onClick={() => setSeleccionado(null)}
              className="mt-4 w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function AyudaPagina({
  pagina,
  children,
}: {
  pagina: string;
  children: ReactNode;
}) {
  const [activo, setActivo] = useState(false);
  const puntos = AYUDA_POR_PAGINA[pagina] ?? [];

  const value = useMemo(
    () => ({
      activo,
      toggle: () => setActivo((a) => !a),
      cerrar: () => setActivo(false),
      puntos,
    }),
    [activo, puntos]
  );

  useEffect(() => {
    if (!activo) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [activo]);

  return (
    <AyudaContext.Provider value={value}>
      {children}
      <CapaBolitasAyuda />
    </AyudaContext.Provider>
  );
}

export function BotonAyuda() {
  const { activo, toggle } = useAyuda();

  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition-colors ${
        activo
          ? "border-accent bg-accent text-white"
          : "border-border bg-surface text-accent hover:bg-accent/10"
      }`}
      title={activo ? "Cerrar ayuda" : "Ayuda de esta página"}
      aria-label={activo ? "Cerrar ayuda" : "Ayuda de esta página"}
      aria-pressed={activo}
    >
      ?
    </button>
  );
}
