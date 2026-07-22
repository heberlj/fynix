"use client";

import { useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { OnboardingInicial } from "@/components/onboarding/OnboardingInicial";
import { debeMostrarOnboarding } from "@/lib/onboarding";

export function ControlOnboarding() {
  const finanzas = useFinanzas();
  const [omitidoManualmente, setOmitidoManualmente] = useState(false);

  const mostrar =
    !omitidoManualmente && debeMostrarOnboarding(finanzas, finanzas.cargado);

  if (!mostrar) return null;

  return (
    <OnboardingInicial
      abierto
      onCerrar={() => setOmitidoManualmente(true)}
    />
  );
}
