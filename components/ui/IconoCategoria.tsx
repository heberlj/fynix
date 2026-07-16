"use client";

import type { CSSProperties } from "react";
import type { IconoCategoriaId } from "@/lib/iconos-categoria";

interface IconoCategoriaProps {
  icono: IconoCategoriaId;
  className?: string;
  style?: CSSProperties;
}

export function IconoCategoria({
  icono,
  className = "h-4 w-4",
  style,
}: IconoCategoriaProps) {
  const props = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    style,
    "aria-hidden": true,
  };

  switch (icono) {
    case "transporte":
      return (
        <svg {...props}>
          <path d="M7 17h10M5 11h14l-1.5-5H6.5L5 11Z" />
          <circle cx="7.5" cy="17" r="1.5" />
          <circle cx="16.5" cy="17" r="1.5" />
        </svg>
      );
    case "combustible":
      return (
        <svg {...props}>
          <path d="M6 20V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14" />
          <path d="M6 10h8M14 8l4-2v8l-4-2" />
        </svg>
      );
    case "bares-restaurantes":
      return (
        <svg {...props}>
          <path d="M8 3v9M12 3v9M16 3v9" />
          <path d="M6 12h12v2H6zM8 14v7M16 14v7" />
        </svg>
      );
    case "delivery":
      return (
        <svg {...props}>
          <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7" />
          <circle cx="7.5" cy="17.5" r="1.5" />
          <circle cx="17.5" cy="17.5" r="1.5" />
        </svg>
      );
    case "supermercado":
      return (
        <svg {...props}>
          <path d="M6 7h15l-1.5 9H7.5L6 7Z" />
          <path d="M6 7 5 3H2" />
          <circle cx="9.5" cy="19" r="1.5" />
          <circle cx="17.5" cy="19" r="1.5" />
        </svg>
      );
    case "suscripciones":
      return (
        <svg {...props}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M10 10l6 2-6 2z" />
        </svg>
      );
    case "cuidado-personal":
      return (
        <svg {...props}>
          <path d="M12 3c2 2 4 4 4 7a4 4 0 0 1-8 0c0-3 2-5 4-7Z" />
          <path d="M8 21h8" />
        </svg>
      );
    case "viajes":
      return (
        <svg {...props}>
          <path d="M3 12h18M12 3l4 9-4 9-4-9z" />
        </svg>
      );
    case "salud":
      return (
        <svg {...props}>
          <path d="M12 21s-6-3.5-6-9a4 4 0 0 1 8 0 4 4 0 0 1 8 0c0 5.5-6 9-6 9Z" />
        </svg>
      );
    case "ropa":
      return (
        <svg {...props}>
          <path d="M8 4l-3 4v12h14V8l-3-4" />
          <path d="M8 4h8" />
        </svg>
      );
    case "compras-online":
      return (
        <svg {...props}>
          <path d="M7 7h10l2 12H5L7 7Z" />
          <path d="M9 7V5a3 3 0 0 1 6 0v2" />
        </svg>
      );
    case "efectivo":
      return (
        <svg {...props}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case "servicios-basicos":
      return (
        <svg {...props}>
          <path d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z" />
        </svg>
      );
    case "prestamo":
      return (
        <svg {...props}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M7 12h4M13 12h4" />
        </svg>
      );
    case "educacion":
      return (
        <svg {...props}>
          <path d="M4 8.5 12 4l8 4.5-8 4.5-8-4.5Z" />
          <path d="M6 10.5V16l6 3 6-3v-5.5" />
        </svg>
      );
    case "gimnasio":
      return (
        <svg {...props}>
          <path d="M6 9v6M18 9v6M9 12h6M4 10h2v4H4zM18 10h2v4h-2z" />
        </svg>
      );
    case "servicios-hogar":
      return (
        <svg {...props}>
          <path d="M4 10.5 12 4l8 6.5V20H4z" />
          <path d="M10 20v-5h4v5" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5M12 16h.01" />
        </svg>
      );
  }
}
