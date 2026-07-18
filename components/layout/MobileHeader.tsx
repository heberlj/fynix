"use client";

import { Logo } from "@/components/ui/Logo";
import { BarraAccionesUsuario } from "@/components/layout/BarraAccionesUsuario";

interface MobileHeaderProps {
  onAbrirMenu: () => void;
  tituloPagina: string;
  nombreUsuario: string;
}

export function MobileHeader({
  onAbrirMenu,
  tituloPagina,
  nombreUsuario,
}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur-sm lg:hidden">
      <button
        type="button"
        onClick={onAbrirMenu}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-surface-hover"
        aria-label="Abrir menú"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <Logo variante="compacto" className="h-8 w-8" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{tituloPagina}</p>
          <p className="truncate text-[11px] text-muted">Fynix</p>
        </div>
      </div>

      <BarraAccionesUsuario nombreUsuario={nombreUsuario} />
    </header>
  );
}
