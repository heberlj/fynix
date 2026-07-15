import Link from "next/link";
import Image from "next/image";

export function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0e17]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo-fynix.png"
            alt="Fynix"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            priority
            unoptimized
          />
          <span className="text-lg font-semibold text-white">Fynix</span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            Crear cuenta
          </Link>
        </nav>
      </div>
    </header>
  );
}
