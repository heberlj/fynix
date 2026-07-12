import type { IconoHome } from "@/types/finanzas";

interface IconoHomeProps {
  nombre: IconoHome;
  className?: string;
}

export function IconoHome({ nombre, className = "h-5 w-5" }: IconoHomeProps) {
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

  switch (nombre) {
    case "cuenta":
      return (
        <svg {...props}>
          <path d="M6 10c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <ellipse cx="12" cy="10.5" rx="7.5" ry="3.2" />
          <path d="M5.5 10.5v2.2c0 2 2.9 3.6 6.5 3.6s6.5-1.6 6.5-3.6v-2.2" />
        </svg>
      );
    case "banco":
      return (
        <svg {...props}>
          <path d="M4 10 12 4l8 6" />
          <path d="M6 10v8M10 10v8M14 10v8M18 10v8" />
          <path d="M4 18h16" />
        </svg>
      );
    case "ahorro":
      return (
        <svg {...props}>
          <path d="M12 6c-2.5 0-4.5 1.5-4.5 3.5S9.5 13 12 13s4.5-1.5 4.5-3.5S14.5 6 12 6z" />
          <path d="M7.5 9.5V14c0 2.5 2 4.5 4.5 4.5s4.5-2 4.5-4.5V9.5" />
          <path d="M10 11h4" />
        </svg>
      );
    case "monedas":
      return (
        <svg {...props}>
          <ellipse cx="9" cy="8" rx="5" ry="2.5" />
          <path d="M4 8v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V8" />
          <ellipse cx="15" cy="13" rx="5" ry="2.5" />
          <path d="M10 13v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-4" />
        </svg>
      );
    case "cartera":
      return (
        <svg {...props}>
          <path d="M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" />
          <path d="M4 12h16" />
          <path d="M16 14h2" />
          <path d="M8 6h8a2 2 0 0 1 2 2v0H6v0a2 2 0 0 1 2-2z" />
        </svg>
      );
    case "estrella":
      return (
        <svg {...props}>
          <path d="m12 3 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 8.2l5-.7L12 3z" />
        </svg>
      );
    case "tarjeta":
      return (
        <svg {...props}>
          <rect x="2" y="5" width="20" height="14" rx="2.5" />
          <path d="M2 10h20" />
          <path d="M6 15.5h5" />
        </svg>
      );
    case "efectivo":
      return (
        <svg {...props}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M7 9.5h.01M17 14.5h.01" />
        </svg>
      );
  }
}
