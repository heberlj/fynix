"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { tituloDeRuta } from "@/components/layout/navegacion";
import { ThemeSync } from "@/components/layout/ThemeSync";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { FinanzasProvider } from "@/context/FinanzasContext";

const RUTAS_AUTH = [
  "/login",
  "/registro",
  "/recuperar-contrasena",
  "/restablecer-contrasena",
];

const RUTAS_PUBLICAS = new Set(["/", ...RUTAS_AUTH]);

function AppRoutes({ children }: { children: React.ReactNode }) {
  const { sesion, cargado } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const esRutaAuth = RUTAS_AUTH.includes(pathname);
  const esRutaPublica = RUTAS_PUBLICAS.has(pathname);
  const esLanding = pathname === "/" && !sesion;
  const esRestablecerContrasena = pathname === "/restablecer-contrasena";

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  useEffect(() => {
    if (!cargado) return;

    if (!sesion && !esRutaPublica) {
      router.replace("/");
      return;
    }

    if (sesion && esRutaAuth && !esRestablecerContrasena) {
      router.replace("/");
    }
  }, [cargado, sesion, esRutaAuth, esRestablecerContrasena, router]);

  useEffect(() => {
    document.body.style.overflow = menuAbierto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuAbierto]);

  if (!cargado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted">Cargando...</p>
      </div>
    );
  }

  if (esRutaAuth || esLanding) {
    if (sesion && esRutaAuth && !esRestablecerContrasena) return null;
    return <>{children}</>;
  }

  if (!sesion) return null;

  return (
    <FinanzasProvider key={sesion.usuarioId} usuarioId={sesion.usuarioId}>
      <ThemeSync />
      <div className="flex min-h-screen bg-background">
        <Sidebar
          abierto={menuAbierto}
          onCerrar={() => setMenuAbierto(false)}
          nombreUsuario={sesion.nombre}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileHeader
            onAbrirMenu={() => setMenuAbierto(true)}
            tituloPagina={tituloDeRuta(pathname)}
          />
          <main className="flex flex-1 flex-col overflow-auto">{children}</main>
        </div>
      </div>
    </FinanzasProvider>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppRoutes>{children}</AppRoutes>
    </AuthProvider>
  );
}
