"use client";

import { PanelConfiguracion } from "@/components/configuracion/PanelConfiguracion";
import {
  enlaceWhatsAppSoporte,
  MENSAJE_REPORTE_PROBLEMA,
  MENSAJE_SUGERENCIA,
  numeroWhatsAppSoporte,
} from "@/lib/soporte-whatsapp";

interface OpcionSoporteProps {
  titulo: string;
  descripcion: string;
  href: string | null;
  icono: "problema" | "sugerencia";
}

function IconoSoporte({ tipo }: { tipo: OpcionSoporteProps["icono"] }) {
  const props = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-5 w-5",
    "aria-hidden": true,
  };

  if (tipo === "problema") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4" />
        <circle cx="12" cy="16" r="0.75" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      <path d="M8 10h8M8 14h5" />
    </svg>
  );
}

function OpcionSoporte({
  titulo,
  descripcion,
  href,
  icono,
}: OpcionSoporteProps) {
  const contenido = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
        <IconoSoporte tipo={icono} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{titulo}</span>
          {href && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              className="h-3.5 w-3.5 shrink-0 text-muted"
              aria-hidden
            >
              <path d="M7 17L17 7M17 7H9M17 7v8" />
            </svg>
          )}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-muted">
          {descripcion}
        </span>
      </span>
    </>
  );

  if (!href) {
    return (
      <div className="flex items-start gap-4 rounded-lg border border-dashed border-border bg-background p-4 opacity-60">
        {contenido}
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-4 rounded-lg border border-border bg-background p-4 transition-colors hover:border-accent/40 hover:bg-surface-hover"
    >
      {contenido}
    </a>
  );
}

export function ConfiguracionSoporte() {
  const whatsappConfigurado = Boolean(numeroWhatsAppSoporte());
  const enlaceProblema = enlaceWhatsAppSoporte(MENSAJE_REPORTE_PROBLEMA);
  const enlaceSugerencia = enlaceWhatsAppSoporte(MENSAJE_SUGERENCIA);

  return (
    <PanelConfiguracion
      titulo="Soporte"
      descripcion="Cuéntanos si algo no funciona o si tienes ideas para mejorar Fynix"
    >
      {!whatsappConfigurado && (
        <p className="mb-4 rounded-lg border border-border bg-background px-4 py-3 text-xs text-muted">
          El contacto por WhatsApp no está disponible en este momento.
        </p>
      )}

      <div className="space-y-3">
        <OpcionSoporte
          titulo="Reportar un problema"
          descripcion="Algo no funciona, ves un error o perdiste información. Te atendemos por WhatsApp."
          href={enlaceProblema}
          icono="problema"
        />
        <OpcionSoporte
          titulo="Sugerencias"
          descripcion="Comparte ideas para nuevas funciones o mejoras en la app."
          href={enlaceSugerencia}
          icono="sugerencia"
        />
      </div>

      <p className="mt-4 text-xs text-muted">
        Al tocar una opción se abrirá WhatsApp con un mensaje inicial. Solo
        tienes que completar el detalle y enviarlo.
      </p>
    </PanelConfiguracion>
  );
}
