"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { BarraSuperior } from "@/components/layout/BarraSuperior";
import { tituloDeRuta } from "@/components/layout/navegacion";
import { ThemeSync } from "@/components/layout/ThemeSync";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ControlSesionInactividad } from "@/components/auth/ControlSesionInactividad";
import { FinanzasProvider } from "@/context/FinanzasContext";
import { AvisoCargaFinanzas } from "@/components/layout/AvisoCargaFinanzas";
import { ControlRecordatoriosPagos } from "@/components/layout/ControlRecordatoriosPagos";
import { ControlOnboarding } from "@/components/onboarding/ControlOnboarding";
import { RegistroServiceWorker } from "@/components/layout/RegistroServiceWorker";

const RUTAS_AUTH = [
  "/login",
  "/registro",
  "/recuperar-contrasena",
  "/restablecer-contrasena",
];

const RUTAS_LEGALES = [
  "/politica-privacidad",
  "/terminos-y-condiciones",
];

const RUTAS_PUBLICAS = new Set(["/", ...RUTAS_AUTH, ...RUTAS_LEGALES]);

function AppRoutes({ children }: { children: React.ReactNode }) {
  const { sesion, cargado } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const esRutaAuth = RUTAS_AUTH.includes(pathname);
  const esRutaLegal = RUTAS_LEGALES.includes(pathname);
  const esRutaPublica = RUTAS_PUBLICAS.has(pathname);
  const esLanding = pathname === "/" && !sesion;
  const esRestablecerContrasena = pathname === "/restablecer-contrasena";
  const esChatIa = pathname === "/ia-fynix";

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

  if (esRutaAuth || esRutaLegal || esLanding) {
    if (sesion && esRutaAuth && !esRestablecerContrasena) return null;
    return <>{children}</>;
  }

  if (!sesion) return null;

  return (
    <FinanzasProvider key={sesion.usuarioId} usuarioId={sesion.usuarioId}>
      <ThemeSync />
      <ControlRecordatoriosPagos />
      <ControlOnboarding />
      <div className="flex min-h-screen bg-background">
        <Sidebar
          abierto={menuAbierto}
          onCerrar={() => setMenuAbierto(false)}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <BarraSuperior nombreUsuario={sesion.nombre} />
          <MobileHeader
            onAbrirMenu={() => setMenuAbierto(true)}
            tituloPagina={tituloDeRuta(pathname)}
            nombreUsuario={sesion.nombre}
          />
          <AvisoCargaFinanzas />
          <main
            className={`flex min-h-0 flex-1 flex-col ${
              esChatIa ? "overflow-hidden" : "overflow-auto"
            }`}
          >
            {children}
          </main>
        </div>
      </div>
    </FinanzasProvider>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RegistroServiceWorker />
      <ControlSesionInactividad />
      <AppRoutes>{children}</AppRoutes>
    </AuthProvider>
  );
}
