import Image from "next/image";

export type NavIconName =
  | "home"
  | "dashboard"
  | "transacciones"
  | "gastos-fijos"
  | "quincenas"
  | "cuentas"
  | "tarjetas"
  | "prestamos"
  | "metas-ahorro"
  | "ia-fynix"
  | "configuracion";

interface NavIconProps {
  name: NavIconName;
  className?: string;
}

export function NavIcon({ name, className = "h-[18px] w-[18px]" }: NavIconProps) {
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
    case "home":
    case "dashboard":
      return (
        <svg {...props}>
          <path d="M4 10.5 12 4l8 6.5" />
          <path d="M6 9.5V19a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1V9.5" />
        </svg>
      );
    case "transacciones":
      return (
        <svg {...props}>
          <path d="M7 8h10l-2.5-2.5M17 8l-2.5 2.5" />
          <path d="M17 16H7l2.5 2.5M7 16l2.5-2.5" />
        </svg>
      );
    case "gastos-fijos":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 3v4M16 3v4" />
          <path d="M12 14v3" />
          <path d="M10.5 15.5 12 17l3-3" />
        </svg>
      );
    case "quincenas":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 3v4M16 3v4" />
          <path d="M12 10v11" />
          <path d="M6.5 14h4M13.5 17h4" />
        </svg>
      );
    case "cuentas":
      return (
        <svg {...props}>
          <path d="M6 10c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <ellipse cx="12" cy="10.5" rx="7.5" ry="3.2" />
          <path d="M5.5 10.5v2.2c0 2 2.9 3.6 6.5 3.6s6.5-1.6 6.5-3.6v-2.2" />
          <circle cx="15" cy="8.5" r="0.9" fill="currentColor" stroke="none" />
          <path d="M9.5 16.2v2.1c0 .8.7 1.4 1.5 1.4h1.5" />
        </svg>
      );
    case "tarjetas":
      return (
        <svg {...props}>
          <rect x="2" y="5" width="20" height="14" rx="2.5" />
          <path d="M2 10h20" />
          <path d="M6 15.5h5" />
          <path d="M15 15.5h3" />
        </svg>
      );
    case "prestamos":
      return (
        <svg {...props}>
          <path d="M9 6.5c0-2 1.6-3.5 3.5-3.5S16 4.5 16 6.5c0 2.3-3.5 4.5-3.5 7.5" />
          <path d="M12.5 14v1.8" />
          <path d="M8.5 19.5h7c1.4 0 2.5-1.1 2.5-2.5v-1.2H6v1.2c0 1.4 1.1 2.5 2.5 2.5z" />
          <path d="M10 11.5h4.5" />
        </svg>
      );
    case "metas-ahorro":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
        </svg>
      );
    case "ia-fynix":
      return (
        <Image
          src="/ia-fynix-icon.png"
          alt=""
          width={18}
          height={18}
          className={`${className} object-contain`}
          aria-hidden
        />
      );
    case "configuracion":
      return (
        <svg {...props}>
          <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.6 1.13 1 1.51H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
      );
  }
}
