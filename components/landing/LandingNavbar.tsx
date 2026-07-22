"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ENLACES_NAV_LANDING } from "@/lib/landing-contenido";

export function LandingNavbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    if (!menuAbierto) return;

    function cerrarConEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuAbierto(false);
    }

    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [menuAbierto]);

  useEffect(() => {
    document.body.style.overflow = menuAbierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuAbierto]);

  function cerrarMenu() {
    setMenuAbierto(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0e17]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/logo-fynix.png"
            alt="Fynix"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            priority
            unoptimized
          />
          <span className="text-lg font-semibold text-white">Fynix</span>
        </Link>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Secciones de la página"
        >
          {ENLACES_NAV_LANDING.map((enlace) => (
            <a
              key={enlace.href}
              href={enlace.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              {enlace.etiqueta}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            Crear cuenta
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
          aria-expanded={menuAbierto}
          aria-controls="landing-menu-movil"
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setMenuAbierto((prev) => !prev)}
        >
          {menuAbierto ? (
            <span className="text-xl leading-none" aria-hidden>
              ×
            </span>
          ) : (
            <span className="flex flex-col gap-1" aria-hidden>
              <span className="block h-0.5 w-5 rounded bg-current" />
              <span className="block h-0.5 w-5 rounded bg-current" />
              <span className="block h-0.5 w-5 rounded bg-current" />
            </span>
          )}
        </button>
      </div>

      {menuAbierto && (
        <div
          id="landing-menu-movil"
          className="border-t border-white/5 bg-[#0a0e17]/95 px-4 py-4 lg:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Menú móvil">
            {ENLACES_NAV_LANDING.map((enlace) => (
              <a
                key={enlace.href}
                href={enlace.href}
                onClick={cerrarMenu}
                className="rounded-lg px-3 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                {enlace.etiqueta}
              </a>
            ))}
            <div className="my-2 border-t border-white/10" />
            <Link
              href="/login"
              onClick={cerrarMenu}
              className="rounded-lg px-3 py-3 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              onClick={cerrarMenu}
              className="rounded-lg bg-blue-600 px-3 py-3 text-center text-sm font-medium text-white hover:bg-blue-500"
            >
              Crear cuenta
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
