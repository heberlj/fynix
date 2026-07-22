import Link from "next/link";

export function LandingCtaFinal() {
  return (
    <section className="border-t border-white/5 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-gradient-to-b from-blue-950/30 to-[#111827]/80 px-6 py-12 text-center sm:px-10 sm:py-14">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Empieza hoy. Gratis y sin tarjeta.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-400 sm:text-base">
          Organiza tu próxima quincena en minutos. Sin anuncios, sin vender tus
          datos y con respaldo de tu información cuando lo necesites.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/registro"
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </div>
    </section>
  );
}
