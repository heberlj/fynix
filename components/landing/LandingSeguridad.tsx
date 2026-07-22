const PRIVACIDAD = [
  {
    titulo: "Tus datos son tuyos",
    descripcion:
      "Tú controlas tu información. Exporta o importa tus datos cuando quieras en formato JSON.",
    icono: "🔒",
  },
  {
    titulo: "Cuenta segura en la nube",
    descripcion:
      "Inicio de sesión con correo y contraseña. Tu estado financiero se guarda vinculado a tu cuenta.",
    icono: "☁️",
  },
  {
    titulo: "Tarjetas protegidas",
    descripcion:
      "Los números sensibles se cifran localmente. Solo tú puedes verlos desde tu sesión.",
    icono: "🛡️",
  },
  {
    titulo: "Sin vender tu información",
    descripcion:
      "Fynix no usa tus movimientos para publicidad ni para entrenar modelos de terceros.",
    icono: "✓",
  },
];

export function LandingSeguridad() {
  return (
    <section
      id="seguridad"
      className="border-t border-white/5 px-4 py-20 sm:px-6 scroll-mt-20"
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
            Seguridad y privacidad
          </p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            Tu información es tuya. Punto.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-400 sm:text-base">
            Fynix es una herramienta personal de organización. No accedemos a tu
            correo ni a tus bancos: tú registras lo que quieras y decides qué
            guardar.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {PRIVACIDAD.map((item) => (
            <article
              key={item.titulo}
              className="rounded-xl border border-white/8 bg-[#111827]/40 p-4"
            >
              <span className="text-xl" aria-hidden>
                {item.icono}
              </span>
              <h3 className="mt-3 text-sm font-semibold text-white">
                {item.titulo}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                {item.descripcion}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
