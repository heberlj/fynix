import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/5 px-4 py-12 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
        <div>
          <p className="text-sm font-semibold text-white">Fynix</p>
          <p className="mt-1 text-xs text-slate-500">Tu dinero, tu futuro.</p>
        </div>

        <nav
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-400"
          aria-label="Enlaces legales"
        >
          <Link
            href="/politica-privacidad"
            className="transition-colors hover:text-white"
          >
            Política de privacidad
          </Link>
          <Link
            href="/terminos-y-condiciones"
            className="transition-colors hover:text-white"
          >
            Términos y condiciones
          </Link>
          <Link href="/login" className="transition-colors hover:text-white">
            Iniciar sesión
          </Link>
          <Link href="/registro" className="transition-colors hover:text-white">
            Crear cuenta
          </Link>
        </nav>
      </div>

      <p className="mx-auto mt-8 max-w-6xl text-center text-[10px] text-slate-600">
        © 2026 Fynix. Todos los derechos reservados.
      </p>
    </footer>
  );
}
