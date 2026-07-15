const BENEFICIOS = [
  {
    titulo: "Quincenas a tu medida",
    descripcion:
      "Q1 del 1 al 15 y Q2 del 16 al fin de mes. Tus cobros del 15 y 30 guían tus quincenas.",
    icono: "📅",
    color: "bg-blue-500/15 text-blue-400",
  },
  {
    titulo: "Gastos fijos y diezmos",
    descripcion:
      "Alquiler, servicios, suscripciones y diezmo opcional calculado sobre tus ingresos.",
    icono: "🏠",
    color: "bg-emerald-500/15 text-emerald-400",
  },
  {
    titulo: "Tarjetas y cuotas bancarias",
    descripcion:
      "Cuotas Popular, Cuotas BHD y Credimás con asignación automática a la quincena correcta.",
    icono: "💳",
    color: "bg-amber-500/15 text-amber-400",
  },
  {
    titulo: "Metas de ahorro",
    descripcion:
      "Define objetivos como fondo de emergencia o un viaje y sigue tu progreso con cada aporte.",
    icono: "🎯",
    color: "bg-yellow-500/15 text-yellow-400",
  },
  {
    titulo: "Cuentas y multi-moneda",
    descripcion:
      "Bancos, efectivo, DOP y USD en un solo lugar. Conversiones al registrar gastos.",
    icono: "🏦",
    color: "bg-rose-500/15 text-rose-400",
  },
  {
    titulo: "Resumen quincenal claro",
    descripcion:
      "Ingresos, gastos, tarjetas, préstamos y disponible proyectado en cada quincena.",
    icono: "📈",
    color: "bg-indigo-500/15 text-indigo-400",
  },
];

export function LandingBeneficios() {
  return (
    <section className="border-t border-white/5 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
          Beneficios
        </p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold text-white sm:text-4xl">
          Todo lo que necesitas para tener tus finanzas en orden
        </h2>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFICIOS.map((item) => (
            <article
              key={item.titulo}
              className="rounded-2xl border border-white/8 bg-[#111827]/50 p-5 transition-colors hover:border-white/15"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${item.color}`}
              >
                {item.icono}
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">
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
