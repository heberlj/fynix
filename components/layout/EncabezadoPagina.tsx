import type { ReactNode } from "react";

interface EncabezadoPaginaProps {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
}

export function EncabezadoPagina({
  titulo,
  descripcion,
  acciones,
}: EncabezadoPaginaProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
          {titulo}
        </h1>
        {descripcion && (
          <p className="mt-1 text-sm text-muted">{descripcion}</p>
        )}
      </div>

      {acciones && (
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:shrink-0">
          {acciones}
        </div>
      )}
    </header>
  );
}
