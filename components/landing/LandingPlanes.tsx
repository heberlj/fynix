import Link from "next/link";
import {
  BENEFICIOS_PLAN_GRATIS,
  BENEFICIOS_PLAN_PRO,
  PRECIO_PRO_MENSUAL_USD,
} from "@/lib/planes-contenido";

function ListaBeneficios({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
          <span
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs text-emerald-400"
            aria-hidden
          >
            ✓
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function LandingPlanes() {
  return (
    <section
      id="planes"
      className="border-t border-white/5 px-4 py-20 sm:px-6 scroll-mt-20"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
          Planes
        </p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold text-white sm:text-4xl">
          Empieza gratis. Mejora cuando lo necesites.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
          Sin anuncios ni trucos. El plan Gratis cubre lo esencial; Pro desbloquea
          importación bancaria, más IA y herramientas avanzadas.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/8 bg-[#111827]/50 p-6 sm:p-8">
            <p className="text-sm font-medium text-slate-400">Gratis</p>
            <p className="mt-2 text-3xl font-bold text-white">
              US$0
              <span className="text-base font-normal text-slate-500"> / siempre</span>
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Para organizar tus quincenas sin pagar nada.
            </p>
            <ListaBeneficios items={BENEFICIOS_PLAN_GRATIS} />
            <Link
              href="/registro"
              className="mt-8 inline-flex w-full items-center justify-center rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
            >
              Crear cuenta gratis
            </Link>
          </article>

          <article className="relative rounded-2xl border border-blue-500/40 bg-gradient-to-b from-blue-950/40 to-[#111827]/60 p-6 shadow-lg shadow-blue-950/30 sm:p-8">
            <span className="absolute right-6 top-6 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-300">
              Recomendado
            </span>
            <p className="text-sm font-medium text-blue-300">Fynix Pro</p>
            <p className="mt-2 text-3xl font-bold text-white">
              US${PRECIO_PRO_MENSUAL_USD}
              <span className="text-base font-normal text-slate-500"> / mes</span>
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Pago seguro con PayPal. Cancela cuando quieras.
            </p>
            <ListaBeneficios items={BENEFICIOS_PLAN_PRO} />
            <Link
              href="/registro"
              className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 sm:w-auto"
            >
              Probar con cuenta gratis
            </Link>
            <p className="mt-3 text-xs text-slate-500">
              Activa Pro después del registro, desde Configuración → Suscripción.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
