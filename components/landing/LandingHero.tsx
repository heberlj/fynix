import Link from "next/link";

function BarraCategoria({
  etiqueta,
  porcentaje,
  color,
}: {
  etiqueta: string;
  porcentaje: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{etiqueta}</span>
        <span className="font-medium text-slate-200">{porcentaje}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-12 sm:px-6 sm:pb-28 sm:pt-16">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
            Tus finanzas{" "}
            <span className="text-blue-400">en orden</span>, quincena a quincena
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Fynix organiza tus ingresos, gastos fijos, tarjetas y compromisos
            por <strong className="font-medium text-slate-200">quincena</strong>.
            Pensado para quien cobra los días{" "}
            <strong className="font-medium text-blue-400">15 y 30</strong>, con
            soporte para pesos y dólares.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/registro"
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Crear cuenta gratis
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="rounded-2xl border border-white/10 bg-[#111827]/90 p-5 shadow-2xl shadow-blue-950/40 backdrop-blur sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-300">
                Gastos de la quincena
              </p>
              <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-medium text-blue-300">
                Q1 · Julio
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold text-white">RD$ 18,420</p>
            <p className="mt-1 text-xs text-slate-500">
              Disponible proyectado: RD$ 6,580
            </p>

            <div className="mt-6 space-y-4">
              <BarraCategoria
                etiqueta="Gastos fijos"
                porcentaje={42}
                color="bg-blue-500"
              />
              <BarraCategoria
                etiqueta="Tarjetas y cuotas"
                porcentaje={28}
                color="bg-emerald-500"
              />
              <BarraCategoria
                etiqueta="Variables"
                porcentaje={18}
                color="bg-amber-500"
              />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 text-center">
              <div>
                <p className="text-xs text-slate-500">Ingresos Q1</p>
                <p className="mt-0.5 text-sm font-semibold text-emerald-400">
                  RD$ 25,000
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Próximo pago</p>
                <p className="mt-0.5 text-sm font-semibold text-white">
                  Día 15
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
