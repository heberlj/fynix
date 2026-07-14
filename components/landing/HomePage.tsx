"use client";

import { useAuth } from "@/context/AuthContext";
import { HomeContent } from "@/components/home/HomeContent";
import { LandingContent } from "@/components/landing/LandingContent";

export function HomePage() {
  const { sesion, cargado } = useAuth();

  if (!cargado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e17]">
        <p className="text-slate-400">Cargando...</p>
      </div>
    );
  }

  if (sesion) return <HomeContent />;
  return <LandingContent />;
}
