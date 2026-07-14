import Link from "next/link";

export function LandingMercadoLocal() {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-rose-600 p-8 text-center sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-3xl">
            🇩🇴
          </div>
          <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
            Hecho para República Dominicana
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-blue-50/90 sm:text-base">
            Pensado para los bancos dominicanos, con soporte para pesos (DOP) y
            dólares (USD), quincenas del 15 y 30, y categorías en español. Sin
            jerga financiera innecesaria.
          </p>
          <Link
            href="/registro"
            className="mt-8 inline-flex rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-50"
          >
            Empezar gratis
          </Link>
        </div>

        <footer className="mt-12 border-t border-white/5 pt-8 text-center">
          <p className="text-sm font-semibold text-white">Fynix</p>
          <p className="mt-1 text-xs text-slate-500">
            Tu dinero, tu futuro
          </p>
          <p className="mt-4 text-[10px] text-slate-600">
            © 2026 Fynix. Todos los derechos reservados.
          </p>
        </footer>
      </div>
    </section>
  );
}
