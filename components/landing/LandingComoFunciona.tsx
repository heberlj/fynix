const PASOS = [
  {
    paso: "01",
    titulo: "Configura tu perfil",
    descripcion:
      "Crea tu cuenta, indica los días en que cobras (15 y 30) y elige tu moneda principal.",
    icono: "👤",
    color: "bg-blue-500/15 text-blue-400",
  },
  {
    paso: "02",
    titulo: "Registra cuentas y compromisos",
    descripcion:
      "Añade tarjetas, gastos fijos, préstamos y financiamientos en cuotas de tus bancos.",
    icono: "💳",
    color: "bg-amber-500/15 text-amber-400",
  },
  {
    paso: "03",
    titulo: "Controla cada quincena",
    descripcion:
      "Ve ingresos, gastos y sugerencias de pago por Q1 y Q2. Sabes qué pagar y cuándo.",
    icono: "📊",
    color: "bg-emerald-500/15 text-emerald-400",
  },
];

export function LandingComoFunciona() {
  return (
    <section className="border-t border-white/5 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
          Cómo funciona
        </p>
        <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          De cero a tus finanzas claras en 3 pasos
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PASOS.map((item) => (
            <article
              key={item.paso}
              className="rounded-2xl border border-white/8 bg-[#111827]/60 p-6"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${item.color}`}
              >
                {item.icono}
              </div>
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Paso {item.paso}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                {item.titulo}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {item.descripcion}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
