import Link from "next/link";

export function BotonVolverInicio() {
  return (
    <Link
      href="/"
      className="fixed top-4 left-4 z-50 flex h-10 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-surface-hover"
      aria-label="Volver al inicio"
    >
      <span aria-hidden className="text-base leading-none">
        ←
      </span>
      <span className="hidden sm:inline">Inicio</span>
    </Link>
  );
}
