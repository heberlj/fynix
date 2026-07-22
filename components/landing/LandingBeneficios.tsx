import { LandingIcono, type LandingIconName } from "@/components/landing/LandingIcono";

const BENEFICIOS: {
  titulo: string;
  descripcion: string;
  icono: LandingIconName;
  etiqueta?: string;
}[] = [
  {
    titulo: "Quincenas a tu medida",
    descripcion:
      "Q1 y Q2 alineadas a tus días de cobro (15 y 30). Ingresos, gastos y disponible proyectado en cada periodo.",
    icono: "calendario",
  },
  {
    titulo: "Gastos fijos y diezmos",
    descripcion:
      "Alquiler, servicios, suscripciones y diezmo opcional. Marca pagados en lote por quincena.",
    icono: "casa",
  },
  {
    titulo: "Recordatorios de pagos",
    descripcion:
      "En Home ves qué vence pronto. Opcionalmente, avisos del navegador para no olvidar compromisos.",
    icono: "campana",
  },
  {
    titulo: "IA Fynix",
    descripcion:
      "Pregunta qué pagar primero, en qué gastas más o cómo ahorrar. Respuestas con contexto de tus quincenas.",
    icono: "ia",
  },
  {
    titulo: "Tarjetas y cuotas",
    descripcion:
      "Cuotas Popular, BHD y Credimás (Pro) asignadas a la quincena correcta junto a tus gastos fijos.",
    icono: "tarjeta",
    etiqueta: "Pro",
  },
  {
    titulo: "Importación bancaria",
    descripcion:
      "Sube el CSV de tu banco (Pro). Detecta transferencias, gastos fijos y aprende tus categorías.",
    icono: "descarga",
    etiqueta: "Pro",
  },
  {
    titulo: "Cuentas y multi-moneda",
    descripcion:
      "Bancos, efectivo, DOP y USD en un solo lugar. Registra gastos en la moneda que corresponda.",
    icono: "banco",
  },
  {
    titulo: "Metas de ahorro",
    descripcion:
      "Fondo de emergencia, viaje u otro objetivo. Sigue el progreso con cada aporte que registres.",
    icono: "meta",
  },
  {
    titulo: "App en tu celular",
    descripcion:
      "Añade Fynix a la pantalla de inicio (PWA). Acceso rápido sin tienda de apps ni instalación pesada.",
    icono: "movil",
  },
];

export function LandingBeneficios() {
  return (
    <section
      id="beneficios"
      className="border-t border-white/5 px-4 py-20 sm:px-6 scroll-mt-20"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
          Beneficios
        </p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold text-white sm:text-4xl">
          Más que un registro: claridad quincena a quincena
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-400 sm:text-base">
          Desde recordatorios e IA hasta importación bancaria en Pro — todo
          orientado a saber qué pagar y cuánto te queda.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFICIOS.map((item) => (
            <article
              key={item.titulo}
              className="rounded-2xl border border-white/8 bg-[#111827]/50 p-5 transition-colors hover:border-white/15"
            >
              <div className="flex items-start justify-between gap-2">
                <LandingIcono name={item.icono} size="sm" />
                {item.etiqueta && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {item.etiqueta}
                  </span>
                )}
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
