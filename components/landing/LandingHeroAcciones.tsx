"use client";

import Link from "next/link";
import Image from "next/image";
import {
  BotonGoogleAuth,
  SeparadorAuth,
} from "@/components/auth/BotonGoogleAuth";

const DESTACADOS_HERO = [
  { icono: "📱", texto: "Instalable en tu celular" },
  { icono: "✓", texto: "Sin anuncios" },
  { icono: "🆓", texto: "Gratis para empezar" },
] as const;

export function LandingHeroAcciones() {
  return (
    <div className="mt-8 max-w-md">
      <div className="space-y-3">
        <Link
          href="/registro"
          className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
          Crear cuenta gratis
        </Link>

        <BotonGoogleAuth destino="/" variant="landing" />

        <SeparadorAuth variant="landing" />

        <Link
          href="/login"
          className="flex w-full items-center justify-center rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          Ya tengo cuenta
        </Link>
      </div>

      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Ventajas de Fynix">
        {DESTACADOS_HERO.map((item) => (
          <li
            key={item.texto}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
          >
            <span aria-hidden>{item.icono}</span>
            {item.texto}
          </li>
        ))}
      </ul>

      <p className="mt-4 flex items-start gap-2.5 text-xs leading-relaxed text-slate-500">
        <Image
          src="/pwa/icon-192.png"
          alt=""
          width={28}
          height={28}
          className="mt-0.5 h-7 w-7 shrink-0 rounded-lg"
          unoptimized
        />
        <span>
          En móvil, abre Fynix en el navegador y elige{" "}
          <strong className="font-medium text-slate-400">
            Añadir a pantalla de inicio
          </strong>{" "}
          para usarla como app con tu icono.
        </span>
      </p>
    </div>
  );
}
