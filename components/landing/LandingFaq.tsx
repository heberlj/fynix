import { FAQ_LANDING } from "@/lib/landing-contenido";

export function LandingFaq() {
  return (
    <section
      id="faq"
      className="border-t border-white/5 px-4 py-20 sm:px-6 scroll-mt-20"
    >
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
          Preguntas frecuentes
        </p>
        <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
          Dudas antes de empezar
        </h2>
        <p className="mt-3 text-sm text-slate-400 sm:text-base">
          Respuestas claras sobre cómo funciona Fynix, sin letra pequeña.
        </p>

        <div className="mt-10 space-y-3">
          {FAQ_LANDING.map((item) => (
            <details
              key={item.pregunta}
              className="group rounded-xl border border-white/8 bg-[#111827]/50 open:border-white/15"
            >
              <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-white marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.pregunta}
                  <span
                    className="shrink-0 text-slate-500 transition-transform group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="border-t border-white/5 px-5 pb-4 pt-3 text-sm leading-relaxed text-slate-400">
                {item.respuesta}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
