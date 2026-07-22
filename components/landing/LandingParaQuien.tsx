import { LandingIcono } from "@/components/landing/LandingIcono";
import { PUBLICO_FYNIX } from "@/lib/landing-contenido";

export function LandingParaQuien() {
  return (
    <section className="border-t border-white/5 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
          Para quién es
        </p>
        <h2 className="mt-2 max-w-2xl text-2xl font-bold text-white sm:text-3xl">
          Pensado para tu forma de cobrar y gastar
        </h2>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PUBLICO_FYNIX.map((item) => (
            <article
              key={item.titulo}
              className="flex gap-4 rounded-xl border border-white/8 bg-[#111827]/40 p-5"
            >
              <LandingIcono name={item.icono} />
              <div>
                <h3 className="text-sm font-semibold text-white">{item.titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                  {item.descripcion}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
