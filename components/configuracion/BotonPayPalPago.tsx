function LogoPayPal({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 101 32"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#003087"
        d="M12.24 2.4h8.1c3.9 0 6.6 2.1 6.6 6.1 0 4.5-2.9 7.2-7.5 7.2h-2.8l-1.1 6.9H8.3L12.24 2.4zm3.5 9.8h1.4c2.1 0 3.3-1 3.3-2.9 0-1.7-1-2.5-2.8-2.5h-1.5l-.4 5.4z"
      />
      <path
        fill="#0070E0"
        d="M35.04 2.4h8.1c3.9 0 6.6 2.1 6.6 6.1 0 4.5-2.9 7.2-7.5 7.2h-2.8l-1.1 6.9h-7.5L35.04 2.4zm3.5 9.8h1.4c2.1 0 3.3-1 3.3-2.9 0-1.7-1-2.5-2.8-2.5h-1.5l-.4 5.4z"
      />
      <path
        fill="#003087"
        d="M57.84 2.4h7.5c5.2 0 8.2 2.6 8.2 7.1 0 5.2-3.5 8.5-9.1 8.5h-4.9l-2.2 13.6h-7.5L57.84 2.4zm4.2 12.1h1.8c2.8 0 4.3-1.3 4.3-3.8 0-2.2-1.3-3.4-3.7-3.4h-1.6l-.8 7.2z"
      />
    </svg>
  );
}

interface BotonPayPalPagoProps {
  href?: string;
  onClick?: () => void;
  deshabilitado?: boolean;
  cargando?: boolean;
  precio?: number;
}

export function BotonPayPalPago({
  href,
  onClick,
  deshabilitado,
  cargando,
  precio,
}: BotonPayPalPagoProps) {
  const bloqueado = deshabilitado || cargando;

  const clases = `group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl px-5 py-3.5 shadow-md transition-all duration-200 ${
    bloqueado
      ? "pointer-events-none cursor-not-allowed opacity-60"
      : "hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md"
  }`;

  const estilo = {
    background: "linear-gradient(180deg, #ffd86a 0%, #ffc439 55%, #f5b800 100%)",
  };

  const contenido = cargando ? (
    <span className="relative text-sm font-semibold text-[#003087]">
      Abriendo PayPal…
    </span>
  ) : (
    <>
      <span className="relative text-sm font-semibold text-[#003087]">
        Pagar con
      </span>
      <LogoPayPal className="relative h-5 w-auto" />
    </>
  );

  const brillo = (
    <span
      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 50%)",
      }}
    />
  );

  return (
    <div className="mt-4 space-y-2">
      {href ? (
        <a
          href={href}
          aria-disabled={bloqueado}
          onClick={(e) => {
            if (bloqueado) e.preventDefault();
          }}
          className={clases}
          style={estilo}
        >
          {brillo}
          {contenido}
        </a>
      ) : (
        <button
          type="button"
          onClick={onClick}
          disabled={bloqueado}
          className={clases}
          style={estilo}
        >
          {brillo}
          {contenido}
        </button>
      )}

      {precio != null && (
        <p className="text-center text-[11px] text-muted">
          US${precio.toFixed(2)}/mes · pago seguro y rápido en PayPal
        </p>
      )}
    </div>
  );
}
