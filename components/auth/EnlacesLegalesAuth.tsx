import Link from "next/link";

export function EnlacesLegalesAuth() {
  return (
    <p className="mt-4 text-center text-xs">
      <Link
        href="/politica-privacidad"
        className="text-accent underline hover:text-accent-hover"
      >
        Política de Privacidad
      </Link>
      <span className="mx-1.5 text-muted">·</span>
      <Link
        href="/terminos-y-condiciones"
        className="text-accent underline hover:text-accent-hover"
      >
        Términos y Condiciones
      </Link>
    </p>
  );
}
