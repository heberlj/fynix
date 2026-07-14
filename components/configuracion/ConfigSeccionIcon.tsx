import type { SeccionConfiguracionId } from "@/components/configuracion/secciones-configuracion";

interface ConfigSeccionIconProps {
  name: SeccionConfiguracionId;
  className?: string;
}

export function ConfigSeccionIcon({
  name,
  className = "h-[18px] w-[18px]",
}: ConfigSeccionIconProps) {
  const props = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (name) {
    case "perfil":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
        </svg>
      );
    case "apariencia":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      );
    case "diezmos":
      return (
        <svg {...props}>
          <path d="M12 21s-6.5-4.35-6.5-9a4.5 4.5 0 0 1 8.2-2.6A4.5 4.5 0 0 1 18.5 12c0 4.65-6.5 9-6.5 9Z" />
        </svg>
      );
    case "suscripcion":
      return (
        <svg {...props}>
          <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.3L12 14.8 7.2 16.8l.9-5.3L4.2 7.7l5.4-.8L12 2Z" />
        </svg>
      );
    case "acerca":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <circle cx="12" cy="8" r="0.75" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}
