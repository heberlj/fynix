"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useFinanzas } from "@/context/FinanzasContext";
import { SelectorTema } from "@/components/ui/SelectorTema";
import { Logo } from "@/components/ui/Logo";
import { NavIcon } from "@/components/ui/NavIcon";
import {
  NAV_CONFIGURACION,
  NAV_HOME,
  NAV_GRUPOS,
  type NavItem,
} from "@/components/layout/navegacion";
import { notificarEntradaPagina } from "@/components/layout/useEntradaPagina";
import { useAuth } from "@/context/AuthContext";
import { EtiquetaPlan } from "@/components/suscripcion/EtiquetaPlan";
import { aplicarTema } from "@/lib/tema";
import type { TemaApp } from "@/types/finanzas";

interface SidebarProps {
  abierto: boolean;
  onCerrar: () => void;
  nombreUsuario?: string;
}

function enlaceActivo(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavLink({
  item,
  pathname,
  onCerrar,
}: {
  item: NavItem;
  pathname: string;
  onCerrar: () => void;
}) {
  const activo = enlaceActivo(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={() => {
        onCerrar();
        notificarEntradaPagina(item.href);
      }}
      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors lg:py-2.5 ${
        activo
          ? "bg-accent/10 text-accent"
          : "text-muted hover:bg-surface-hover hover:text-foreground"
      }`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        <NavIcon name={item.icon} />
      </span>
      {item.label}
    </Link>
  );
}

export function Sidebar({ abierto, onCerrar, nombreUsuario }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { configuracion, actualizarConfiguracion } = useFinanzas();
  const { cerrarSesion } = useAuth();

  function cambiarTema(tema: TemaApp) {
    aplicarTema(tema);
    actualizarConfiguracion({ tema });
  }

  return (
    <>
      {abierto && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onCerrar}
          aria-label="Cerrar menú"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 max-w-[85vw] flex-col border-r border-border bg-surface transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:z-auto lg:w-64 lg:max-w-none lg:translate-x-0 ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4 lg:px-6 lg:py-5">
          <div className="flex items-center gap-3">
            <Logo variante="compacto" />
            <div>
              <p className="text-sm font-semibold text-foreground">Fynix</p>
              <p className="text-xs text-muted">Tu dinero, tu futuro</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-foreground lg:hidden"
            aria-label="Cerrar menú"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <NavLink item={NAV_HOME} pathname={pathname} onCerrar={onCerrar} />

          {NAV_GRUPOS.map((grupo) => (
            <div key={grupo.titulo}>
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
                {grupo.titulo}
              </p>
              <div className="flex flex-col gap-0.5">
                {grupo.items.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onCerrar={onCerrar}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto space-y-3 border-t border-border p-4">
          <NavLink
            item={NAV_CONFIGURACION}
            pathname={pathname}
            onCerrar={onCerrar}
          />

          {nombreUsuario && (
            <div className="rounded-lg bg-background px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted">
                Sesión
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="min-w-0 truncate text-sm font-medium text-foreground">
                  {nombreUsuario}
                </p>
                <EtiquetaPlan />
              </div>
            </div>
          )}
          <SelectorTema
            value={configuracion.tema ?? "claro"}
            onChange={cambiarTema}
            compacto
          />
          <p className="text-[10px] text-muted/80">
            © 2026 Fynix. Todos los derechos reservados.
          </p>
          <button
            type="button"
            onClick={() => {
              cerrarSesion();
              onCerrar();
              router.replace("/login");
            }}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
