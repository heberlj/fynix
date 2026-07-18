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
          <path d="M7 3h10l1.5 2.5H19a1 1 0 0 1 1 1v11.5c0 .3-.2.5-.5.5H17l-1 1.5-1-1.5h-1l-1 1.5-1-1.5H9l-1 1.5-1-1.5H6.5a.5.5 0 0 1-.5-.5V6.5A1.5 1.5 0 0 1 7.5 5H7V3z" />
          <path d="M9 8.5h6M9 11.5h6M9 14.5h4" />
          <path d="M18 5.5a2.2 2.2 0 1 0-1.5 4" />
          <path d="M17.2 7.2 18 5.5l1.6.9" />
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
          <path d="M3 10 12 4l9 6" />
          <path d="M5.5 10v8M9.5 10v8M14.5 10v8M18.5 10v8" />
          <path d="M3 18h18" />
          <path d="M10.5 15.5v2.5h3v-2.5" />
          <circle cx="12" cy="8" r="1.1" fill="currentColor" stroke="none" />
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
          <path d="M9.2 11 14.8 8.8 15.3 12.2 9.7 14.4 9.2 11z" />
          <circle cx="12.25" cy="11.6" r="1" />
          <path d="M12.25 10.8v1.6" />
          <path d="M3 8.8c2-1.5 4.5-1.5 6.5 0" />
          <path d="M4.2 7.2c.9-.8 2-.7 2.7.2" />
          <path d="M6 6.3c1-.5 2-.2 2.6.6" />
          <path d="M8 5.8c.9-.4 1.8 0 2.1.8" />
          <path d="M10.2 5.8c.7-.2 1.3.4 1.3 1.2" />
          <path d="M21 15.2c-2-1.5-4.5-1.5-6.5 0" />
          <path d="M19.8 13.6c-.9-.8-2-.7-2.7.2" />
          <path d="M18 12.7c-1-.5-2-.2-2.6.6" />
          <path d="M16 12.2c-.9-.4-1.8 0-2.1.8" />
          <path d="M13.8 12.2c-.7-.2-1.3.4-1.3 1.2" />
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
