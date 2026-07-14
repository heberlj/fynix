"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ConfiguracionPerfil } from "@/components/configuracion/ConfiguracionPerfil";
import { ConfiguracionApariencia } from "@/components/configuracion/ConfiguracionApariencia";
import { ConfiguracionAporteIngreso } from "@/components/configuracion/ConfiguracionAporteIngreso";
import { ConfiguracionSuscripcion } from "@/components/configuracion/ConfiguracionSuscripcion";
import { ConfiguracionAcercaDe } from "@/components/configuracion/ConfiguracionAcercaDe";
import {
  SECCIONES_CONFIGURACION,
  type SeccionConfiguracionId,
} from "@/components/configuracion/secciones-configuracion";
import { ConfigSeccionIcon } from "@/components/configuracion/ConfigSeccionIcon";
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

function esSeccionValida(valor: string | null): valor is SeccionConfiguracionId {
  return SECCIONES_CONFIGURACION.some((s) => s.id === valor);
}

function ConfiguracionContentInner() {
  const searchParams = useSearchParams();
  const [seccionActiva, setSeccionActiva] =
    useState<SeccionConfiguracionId>("perfil");

  useEffect(() => {
    const seccion = searchParams.get("seccion");
    if (esSeccionValida(seccion)) {
      setSeccionActiva(seccion);
    }
  }, [searchParams]);

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

        <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-start">
          <nav
            aria-label="Secciones de configuración"
            className="lg:w-52 lg:shrink-0"
          >
            <ul className="flex gap-1 overflow-x-auto border-b border-border pb-px lg:flex-col lg:gap-0.5 lg:overflow-visible lg:border-b-0 lg:pb-0">
              {SECCIONES_CONFIGURACION.map((seccion) => {
                const activa = seccionActiva === seccion.id;
                return (
                  <li key={seccion.id} className="shrink-0 lg:shrink">
                    <button
                      type="button"
                      onClick={() => setSeccionActiva(seccion.id)}
                      className={`group flex w-full items-center gap-3 border-b-2 px-3 py-2.5 text-left transition-colors lg:border-b-0 lg:rounded-lg ${
                        activa
                          ? "border-accent text-foreground lg:bg-accent/10"
                          : "border-transparent text-muted hover:text-foreground lg:hover:bg-surface-hover"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center transition-colors ${
                          activa
                            ? "text-accent"
                            : "text-muted group-hover:text-foreground"
                        }`}
                      >
                        <ConfigSeccionIcon name={seccion.id} />
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block text-sm ${
                            activa ? "font-medium" : "font-normal"
                          }`}
                        >
                          {seccion.label}
                        </span>
                        <span className="mt-0.5 hidden text-xs text-muted lg:block">
                          {seccion.descripcion}
                        </span>
                      </span>
                      {activa && (
                        <span
                          className="ml-auto hidden h-4 w-0.5 shrink-0 rounded-full bg-accent lg:block"
                          aria-hidden
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
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

export function ConfiguracionContent() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center p-8">
          <p className="text-muted">Cargando configuración...</p>
        </div>
      }
    >
      <ConfiguracionContentInner />
    </Suspense>
  );
}
