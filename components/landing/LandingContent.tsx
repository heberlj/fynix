import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingComoFunciona } from "@/components/landing/LandingComoFunciona";
import { LandingBeneficios } from "@/components/landing/LandingBeneficios";
import { LandingSeguridad } from "@/components/landing/LandingSeguridad";
import { LandingMercadoLocal } from "@/components/landing/LandingMercadoLocal";

export function LandingContent() {
  return (
    <div className="min-h-screen bg-[#0a0e17] text-white">
      <LandingNavbar />
      <main>
        <LandingHero />
        <LandingComoFunciona />
        <LandingBeneficios />
        <LandingSeguridad />
        <LandingMercadoLocal />
      </main>
    </div>
  );
}
