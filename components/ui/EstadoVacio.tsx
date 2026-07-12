import Link from "next/link";

interface EstadoVacioProps {
  titulo: string;
  descripcion?: string;
  accionEtiqueta?: string;
  onAccion?: () => void;
  accionHref?: string;
  className?: string;
}

export function EstadoVacio({
  titulo,
  descripcion,
  accionEtiqueta,
  onAccion,
  accionHref,
  className = "",
}: EstadoVacioProps) {
  const botonClass =
    "mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover";

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center sm:py-16 ${className}`}
    >
      <p className="text-sm font-medium text-foreground">{titulo}</p>
      {descripcion && (
        <p className="mt-1 max-w-sm text-xs text-muted">{descripcion}</p>
      )}
      {accionEtiqueta && onAccion && (
        <button type="button" onClick={onAccion} className={botonClass}>
          {accionEtiqueta}
        </button>
      )}
      {accionEtiqueta && accionHref && !onAccion && (
        <Link href={accionHref} className={botonClass}>
          {accionEtiqueta}
        </Link>
      )}
    </div>
  );
}
