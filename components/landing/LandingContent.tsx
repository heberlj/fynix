"use client";

import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingComoFunciona } from "@/components/landing/LandingComoFunciona";
import { LandingBeneficios } from "@/components/landing/LandingBeneficios";
import { LandingSeguridad } from "@/components/landing/LandingSeguridad";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { useEntradaPagina } from "@/components/layout/useEntradaPagina";

export function LandingContent() {
  const entradaActiva = useEntradaPagina(true);

  return (
    <div
      className={`min-h-screen bg-[#0a0e17] text-white ${
        entradaActiva ? "landing-entrada-activa" : "landing-entrada-pending"
      }`}
    >
      <div className="landing-anim-nav">
        <LandingNavbar />
      </div>
      <main>
        <div className="landing-anim-item">
          <LandingHero />
        </div>
        <div className="landing-anim-item">
          <LandingComoFunciona />
        </div>
        <div className="landing-anim-item">
          <LandingBeneficios />
        </div>
        <div className="landing-anim-item">
          <LandingSeguridad />
        </div>
      </main>
      <div className="landing-anim-item landing-anim-footer">
        <LandingFooter />
      </div>
    </div>
  );
}
