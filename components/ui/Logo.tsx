import Image from "next/image";

type VarianteLogo = "completo" | "compacto";

interface LogoProps {
  variante?: VarianteLogo;
  className?: string;
}

const LOGO_SRC = "/logo-fynix.png";

export function Logo({ variante = "completo", className = "" }: LogoProps) {
  if (variante === "compacto") {
    return (
      <Image
        src={LOGO_SRC}
        alt="Fynix"
        width={40}
        height={40}
        className={`h-10 w-10 object-contain ${className}`}
        priority
        unoptimized
      />
    );
  }

  return (
    <Image
      src={LOGO_SRC}
      alt="Fynix — Tu dinero, tu futuro"
      width={128}
      height={128}
      className={`mx-auto h-auto w-full max-w-[112px] object-contain ${className}`}
      priority
      unoptimized
    />
  );
}
