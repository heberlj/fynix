"use client";

import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingComoFunciona } from "@/components/landing/LandingComoFunciona";
import { LandingParaQuien } from "@/components/landing/LandingParaQuien";
import { LandingCapturas } from "@/components/landing/LandingCapturas";
import { LandingBeneficios } from "@/components/landing/LandingBeneficios";
import { LandingSeguridad } from "@/components/landing/LandingSeguridad";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingPlanes } from "@/components/landing/LandingPlanes";
import { LandingCtaFinal } from "@/components/landing/LandingCtaFinal";
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
          <LandingParaQuien />
        </div>
        <div className="landing-anim-item">
          <LandingCapturas />
        </div>
        <div className="landing-anim-item">
          <LandingBeneficios />
        </div>
        <div className="landing-anim-item">
          <LandingSeguridad />
        </div>
        <div className="landing-anim-item">
          <LandingFaq />
        </div>
        <div className="landing-anim-item">
          <LandingPlanes />
        </div>
        <div className="landing-anim-item">
          <LandingCtaFinal />
        </div>
      </main>
      <div className="landing-anim-item landing-anim-footer">
        <LandingFooter />
      </div>
    </div>
  );
}
