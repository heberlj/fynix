import Image from "next/image";

type VarianteLogo = "completo" | "compacto";

interface LogoProps {
  variante?: VarianteLogo;
  className?: string;
}

export function Logo({ variante = "completo", className = "" }: LogoProps) {
  if (variante === "compacto") {
    return (
      <Image
        src="/logo.png"
        alt="Fynix"
        width={36}
        height={36}
        className={`h-9 w-9 rounded-lg object-cover object-top ${className}`}
        priority
      />
    );
  }

  return (
    <Image
      src="/logo.png"
      alt="Fynix — Tu dinero, tu futuro"
      width={220}
      height={220}
      className={`mx-auto h-auto w-full max-w-[200px] ${className}`}
      priority
    />
  );
}
