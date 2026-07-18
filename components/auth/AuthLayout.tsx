import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { BotonTemaAuth } from "@/components/auth/BotonTemaAuth";
import { BotonVolverInicio } from "@/components/auth/BotonVolverInicio";

export function AuthLayout({
  titulo,
  subtitulo,
  children,
  pie,
}: {
  titulo: string;
  subtitulo: string;
  children: React.ReactNode;
  pie?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <BotonVolverInicio />
      <BotonTemaAuth />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <Logo />
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Fynix</h1>
          <p className="mt-1 text-sm text-muted">{subtitulo}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-foreground">{titulo}</h2>
          <div className="mt-6">{children}</div>
        </div>

        {pie}

        <p className="mt-6 text-center text-[10px] text-muted">
          © 2026 Fynix. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
