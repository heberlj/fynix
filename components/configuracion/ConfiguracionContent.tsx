"use client";

import { useState } from "react";
import { ConfiguracionPerfil } from "@/components/configuracion/ConfiguracionPerfil";
import { ConfiguracionApariencia } from "@/components/configuracion/ConfiguracionApariencia";
import { ConfiguracionAporteIngreso } from "@/components/configuracion/ConfiguracionAporteIngreso";
import { ConfiguracionSuscripcion } from "@/components/configuracion/ConfiguracionSuscripcion";
import { ConfiguracionAcercaDe } from "@/components/configuracion/ConfiguracionAcercaDe";
import {
  SECCIONES_CONFIGURACION,
  type SeccionConfiguracionId,
} from "@/components/configuracion/secciones-configuracion";
import { PageContainer } from "@/components/layout/PageContainer";
import { EncabezadoPagina } from "@/components/layout/EncabezadoPagina";
import { AyudaPagina } from "@/components/ayuda/AyudaPagina";

function ContenidoSeccion({ seccion }: { seccion: SeccionConfiguracionId }) {
  switch (seccion) {
    case "perfil":
      return <ConfiguracionPerfil />;
    case "apariencia":
      return <ConfiguracionApariencia />;
    case "diezmos":
      return <ConfiguracionAporteIngreso />;
    case "suscripcion":
      return <ConfiguracionSuscripcion />;
    case "acerca":
      return <ConfiguracionAcercaDe />;
    default:
      return null;
  }
}

export function ConfiguracionContent() {
  const [seccionActiva, setSeccionActiva] =
    useState<SeccionConfiguracionId>("perfil");

  const seccionActual = SECCIONES_CONFIGURACION.find(
    (s) => s.id === seccionActiva
  );

  return (
    <AyudaPagina pagina="configuracion">
      <PageContainer>
        <EncabezadoPagina
          titulo="Configuración"
          descripcion="Perfil, apariencia, diezmos y más"
        />

        <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
          <nav
            aria-label="Secciones de configuración"
            className="lg:w-60 lg:shrink-0"
          >
            <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {SECCIONES_CONFIGURACION.map((seccion) => {
                const activa = seccionActiva === seccion.id;
                return (
                  <button
                    key={seccion.id}
                    type="button"
                    onClick={() => setSeccionActiva(seccion.id)}
                    className={`flex min-w-[9.5rem] shrink-0 items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors lg:min-w-0 lg:w-full ${
                      activa
                        ? "border-accent bg-accent/10"
                        : "border-border bg-surface hover:border-accent/30 hover:bg-surface-hover"
                    }`}
                  >
                    <span className="text-lg leading-none" aria-hidden>
                      {seccion.icono}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block text-sm font-medium ${
                          activa ? "text-accent" : "text-foreground"
                        }`}
                      >
                        {seccion.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {seccion.descripcion}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="min-w-0 flex-1" data-ayuda="preferencias">
            {seccionActual && (
              <p className="mb-4 text-sm text-muted lg:hidden">
                {seccionActual.descripcion}
              </p>
            )}
            <ContenidoSeccion seccion={seccionActiva} />
          </div>
        </div>
      </PageContainer>
    </AyudaPagina>
  );
}
