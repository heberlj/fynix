"use client";

import { useEntradaPagina } from "@/components/layout/useEntradaPagina";

export function PageContainer({
  children,
  className = "",
  animar = true,
  listo = true,
}: {
  children: React.ReactNode;
  className?: string;
  /** Desactiva la animación de entrada (p. ej. IA con animación propia). */
  animar?: boolean;
  /** Espera a que los datos estén listos antes de animar. */
  listo?: boolean;
}) {
  const entradaActiva = useEntradaPagina(animar && listo);

  const clasesEntrada =
    animar && listo
      ? entradaActiva
        ? "pagina-entrada-activa"
        : "pagina-entrada-pending"
      : "";

  return (
    <div
      className={`flex min-w-0 flex-col gap-6 p-4 sm:gap-8 sm:p-6 lg:p-8 ${clasesEntrada} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
