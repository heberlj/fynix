interface DivisorSeccionProps {
  titulo: string;
  className?: string;
}

export function DivisorSeccion({ titulo, className = "" }: DivisorSeccionProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-px flex-1 bg-border" aria-hidden />
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">
        {titulo}
      </span>
      <div className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}
