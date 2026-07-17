"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
  /** sheet: panel inferior en móvil. centro: diálogo centrado con blur en todo el fondo */
  variant?: "sheet" | "centro";
  tamano?: "normal" | "amplio";
}

export function Modal({
  abierto,
  onCerrar,
  titulo,
  children,
  variant = "sheet",
  tamano = "normal",
}: ModalProps) {
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    if (!abierto) return;

    const main = document.querySelector("main");
    const overflowBody = document.body.style.overflow;
    const overflowMain =
      main instanceof HTMLElement ? main.style.overflow : null;

    document.body.style.overflow = "hidden";
    if (main instanceof HTMLElement) {
      main.style.overflow = "hidden";
    }

    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = overflowBody;
      if (main instanceof HTMLElement && overflowMain !== null) {
        main.style.overflow = overflowMain;
      }
      window.removeEventListener("keydown", onEscape);
    };
  }, [abierto, onCerrar]);

  if (!abierto || !montado) return null;

  const anchoModal = tamano === "amplio" ? "max-w-2xl" : "max-w-lg";

  const encabezado = (
    <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-6">
      <h2 id="modal-titulo" className="text-base font-semibold text-foreground">
        {titulo}
      </h2>
      <button
        type="button"
        onClick={onCerrar}
        className="rounded-lg px-2 py-1 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        aria-label="Cerrar"
      >
        ✕
      </button>
    </div>
  );

  const contenido =
    variant === "centro" ? (
      <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
        <button
          type="button"
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          aria-label="Cerrar"
          onClick={onCerrar}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-titulo"
          className={`relative z-10 flex max-h-[min(92dvh,720px)] w-full ${anchoModal} flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-xl sm:max-h-[min(90vh,720px)] sm:rounded-xl pb-[env(safe-area-inset-bottom)]`}
        >
          {encabezado}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
            {children}
          </div>
        </div>
      </div>
    ) : (
      <div className="fixed inset-0 z-[100] flex items-end justify-center lg:hidden">
        <button
          type="button"
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          aria-label="Cerrar"
          onClick={onCerrar}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-titulo"
          className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-xl border border-border bg-surface shadow-lg"
        >
          {encabezado}
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
        </div>
      </div>
    );

  return createPortal(contenido, document.body);
}
