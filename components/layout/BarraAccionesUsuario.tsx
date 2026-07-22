"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { EtiquetaPlan } from "@/components/suscripcion/EtiquetaPlan";
import {
  enlaceWhatsAppSoporte,
  MENSAJE_REPORTE_PROBLEMA,
  MENSAJE_SUGERENCIA,
} from "@/lib/soporte-whatsapp";

interface BarraAccionesUsuarioProps {
  nombreUsuario: string;
}

function inicialesNombre(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

function useCerrarAlClickFuera(
  abierto: boolean,
  onCerrar: () => void,
  ref: React.RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!abierto) return;

    function handlePointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) {
        onCerrar();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [abierto, onCerrar, ref]);
}

function IconoSoporte() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      <path d="M8 10h8M8 14h5" />
    </svg>
  );
}

function BotonIconoBarra({
  label,
  activo,
  onClick,
  children,
}: {
  label: string;
  activo?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
        activo
          ? "border-accent bg-accent/10 text-accent"
          : "border-border bg-surface text-muted hover:border-accent/40 hover:bg-surface-hover hover:text-foreground"
      }`}
      aria-label={label}
      aria-expanded={activo}
      aria-haspopup="menu"
    >
      {children}
    </button>
  );
}

function MenuSoporte({ onCerrar }: { onCerrar: () => void }) {
  const enlaceProblema = enlaceWhatsAppSoporte(MENSAJE_REPORTE_PROBLEMA);
  const enlaceSugerencia = enlaceWhatsAppSoporte(MENSAJE_SUGERENCIA);

  const opciones = [
    {
      titulo: "Reportar un problema",
      descripcion: "Algo no funciona o ves un error",
      href: enlaceProblema,
    },
    {
      titulo: "Enviar sugerencia",
      descripcion: "Comparte ideas para mejorar Fynix",
      href: enlaceSugerencia,
    },
  ];

  return (
    <div
      role="menu"
      className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
    >
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">Soporte</p>
        <p className="mt-0.5 text-xs text-muted">
          Cuéntanos qué pasa o qué te gustaría ver
        </p>
      </div>
      <div className="p-2">
        {opciones.map((opcion) =>
          opcion.href ? (
            <a
              key={opcion.titulo}
              href={opcion.href}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              onClick={onCerrar}
              className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-hover"
            >
              <span className="text-sm font-medium text-foreground">
                {opcion.titulo}
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                {opcion.descripcion}
              </span>
            </a>
          ) : (
            <div
              key={opcion.titulo}
              className="rounded-lg px-3 py-2.5 opacity-50"
            >
              <span className="text-sm font-medium text-foreground">
                {opcion.titulo}
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                No disponible en este momento
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function MenuUsuario({
  nombreUsuario,
  onCerrar,
  onCerrarSesion,
}: {
  nombreUsuario: string;
  onCerrar: () => void;
  onCerrarSesion: () => void;
}) {
  return (
    <div
      role="menu"
      className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
    >
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
            {inicialesNombre(nombreUsuario)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {nombreUsuario}
            </p>
            <EtiquetaPlan />
          </div>
        </div>
      </div>
      <div className="p-2">
        <Link
          href="/configuracion"
          role="menuitem"
          onClick={onCerrar}
          className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
        >
          Configuración
        </Link>
        <Link
          href="/configuracion?seccion=suscripcion"
          role="menuitem"
          onClick={onCerrar}
          className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
        >
          Suscripción
        </Link>
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onCerrar();
            onCerrarSesion();
          }}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export function BarraAccionesUsuario({
  nombreUsuario,
}: BarraAccionesUsuarioProps) {
  const router = useRouter();
  const { cerrarSesion } = useAuth();
  const [menuSoporte, setMenuSoporte] = useState(false);
  const [menuUsuario, setMenuUsuario] = useState(false);
  const refSoporte = useRef<HTMLDivElement>(null);
  const refUsuario = useRef<HTMLDivElement>(null);

  useCerrarAlClickFuera(menuSoporte, () => setMenuSoporte(false), refSoporte);
  useCerrarAlClickFuera(menuUsuario, () => setMenuUsuario(false), refUsuario);

  function cerrarMenus() {
    setMenuSoporte(false);
    setMenuUsuario(false);
  }

  function toggleSoporte() {
    setMenuUsuario(false);
    setMenuSoporte((abierto) => !abierto);
  }

  function toggleUsuario() {
    setMenuSoporte(false);
    setMenuUsuario((abierto) => !abierto);
  }

  function handleCerrarSesion() {
    cerrarSesion();
    router.replace("/login");
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative" ref={refSoporte}>
        <BotonIconoBarra
          label="Soporte"
          activo={menuSoporte}
          onClick={toggleSoporte}
        >
          <IconoSoporte />
        </BotonIconoBarra>
        {menuSoporte && <MenuSoporte onCerrar={cerrarMenus} />}
      </div>

      <div className="relative" ref={refUsuario}>
        <button
          type="button"
          onClick={toggleUsuario}
          className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
            menuUsuario
              ? "border-accent bg-accent text-white"
              : "border-border bg-accent/15 text-accent hover:border-accent/40 hover:bg-accent/25"
          }`}
          aria-label={`Cuenta de ${nombreUsuario}`}
          aria-expanded={menuUsuario}
          aria-haspopup="menu"
        >
          {inicialesNombre(nombreUsuario)}
        </button>
        {menuUsuario && (
          <MenuUsuario
            nombreUsuario={nombreUsuario}
            onCerrar={cerrarMenus}
            onCerrarSesion={handleCerrarSesion}
          />
        )}
      </div>
    </div>
  );
}
