import { Logo } from "@/components/ui/Logo";

export function AuthLayout({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo />
          <p className="mt-4 text-sm text-muted">{subtitulo}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-foreground">{titulo}</h2>
          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-6 text-center text-[10px] text-muted">
          © 2026 Fynix. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
