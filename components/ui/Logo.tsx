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
        src="/icon.png"
        alt="Fynix"
        width={36}
        height={36}
        className={`h-9 w-9 object-contain ${className}`}
        priority
      />
    );
  }

  return (
    <Image
      src="/icon.png"
      alt="Fynix — Tu dinero, tu futuro"
      width={120}
      height={120}
      className={`mx-auto h-auto w-full max-w-[100px] object-contain ${className}`}
      priority
    />
  );
}
