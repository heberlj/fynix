import Link from "next/link";

interface EstadoVacioProps {
  titulo: string;
  descripcion?: string;
  accionEtiqueta?: string;
  onAccion?: () => void;
  accionHref?: string;
  className?: string;
  compacto?: boolean;
}

export function EstadoVacio({
  titulo,
  descripcion,
  accionEtiqueta,
  onAccion,
  accionHref,
  className = "",
  compacto = false,
}: EstadoVacioProps) {
  const botonClass =
    "mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover";

  const paddingClass = compacto
    ? "px-4 py-8 sm:py-10"
    : "px-6 py-12 sm:py-16";

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface text-center ${paddingClass} ${className}`}
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
