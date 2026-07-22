export type LandingIconName =
  | "usuario"
  | "tarjeta"
  | "grafico"
  | "calendario"
  | "monedas"
  | "casa"
  | "campana"
  | "ia"
  | "descarga"
  | "banco"
  | "meta"
  | "movil";

const CONTENEDOR = {
  sm: "h-10 w-10 rounded-lg",
  md: "h-11 w-11 rounded-xl",
} as const;

function SvgIcono({
  name,
  className,
}: {
  name: LandingIconName;
  className: string;
}) {
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
    case "usuario":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5.5 19.5c.9-3.2 3.4-5 6.5-5s5.6 1.8 6.5 5" />
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
    case "grafico":
      return (
        <svg {...props}>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 15V11" />
          <path d="M12 15V8" />
          <path d="M16 15v-4" />
        </svg>
      );
    case "calendario":
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 3v4M16 3v4" />
          <path d="M8 14h2M14 14h2" />
        </svg>
      );
    case "monedas":
      return (
        <svg {...props}>
          <circle cx="9" cy="9" r="5" />
          <path d="M9 7v4M7.5 9h3" />
          <path d="M14.5 14.5 19 19" />
          <circle cx="16.5" cy="16.5" r="3.5" />
        </svg>
      );
    case "casa":
      return (
        <svg {...props}>
          <path d="M4 10.5 12 4l8 6.5" />
          <path d="M6 9.5V19a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1V9.5" />
        </svg>
      );
    case "campana":
      return (
        <svg {...props}>
          <path d="M12 4a4 4 0 0 0-4 4v3.5L6.5 14.5h11L16 11.5V8a4 4 0 0 0-4-4z" />
          <path d="M10 17.5a2 2 0 0 0 4 0" />
        </svg>
      );
    case "ia":
      return (
        <svg {...props}>
          <path d="m12 3 1.2 3.6L17 8l-3.8 1.4L12 13l-1.2-3.6L7 8l3.8-1.4z" />
          <path d="m5 14 1 2.8L9 18l-3 1.1L5 22l-1-2.9L1 18l3-1.2z" />
          <path d="m19 14 1 2.8L23 18l-3 1.1L19 22l-1-2.9L15 18l3-1.2z" />
        </svg>
      );
    case "descarga":
      return (
        <svg {...props}>
          <path d="M12 4v10" />
          <path d="m8.5 10.5 3.5 3.5 3.5-3.5" />
          <path d="M5 18h14" />
        </svg>
      );
    case "banco":
      return (
        <svg {...props}>
          <path d="M3 10 12 4l9 6" />
          <path d="M5.5 10v8M9.5 10v8M14.5 10v8M18.5 10v8" />
          <path d="M3 18h18" />
        </svg>
      );
    case "meta":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "movil":
      return (
        <svg {...props}>
          <rect x="7" y="3" width="10" height="18" rx="2" />
          <path d="M11 17h2" />
        </svg>
      );
  }
}

export function LandingIcono({
  name,
  size = "md",
}: {
  name: LandingIconName;
  size?: keyof typeof CONTENEDOR;
}) {
  const iconClass = size === "sm" ? "h-[18px] w-[18px]" : "h-5 w-5";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center border border-white/10 bg-white/[0.04] text-slate-300 ${CONTENEDOR[size]}`}
      aria-hidden
    >
      <SvgIcono name={name} className={iconClass} />
    </span>
  );
}
