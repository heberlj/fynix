"use client";

import { BarraAccionesUsuario } from "@/components/layout/BarraAccionesUsuario";

interface BarraSuperiorProps {
  nombreUsuario: string;
}

export function BarraSuperior({ nombreUsuario }: BarraSuperiorProps) {
  return (
    <header className="sticky top-0 z-30 hidden items-center justify-end border-b border-border bg-surface/95 px-6 py-2.5 backdrop-blur-sm lg:flex">
      <BarraAccionesUsuario nombreUsuario={nombreUsuario} />
    </header>
  );
}
