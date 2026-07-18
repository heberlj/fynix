import Link from "next/link";
import { BotonTemaAuth } from "@/components/auth/BotonTemaAuth";
import { BotonVolverInicio } from "@/components/auth/BotonVolverInicio";
import { Logo } from "@/components/ui/Logo";

export type SeccionLegal = {
  titulo: string;
  parrafos: string[];
  lista?: string[];
};

export function PaginaLegal({
  titulo,
  actualizado,
  secciones,
}: {
  titulo: string;
  actualizado: string;
  secciones: SeccionLegal[];
}) {
  return (
    <div className="relative min-h-screen bg-background px-4 py-16 sm:px-6">
      <BotonVolverInicio />
      <BotonTemaAuth />

      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <Logo />
          </Link>
        </div>

        <article className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-10">
          <header className="border-b border-border pb-6">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {titulo}
            </h1>
            <p className="mt-2 text-sm text-muted">
              Última actualización: {actualizado}
            </p>
          </header>

          <div className="mt-8 space-y-8">
            {secciones.map((seccion) => (
              <section key={seccion.titulo}>
                <h2 className="text-lg font-semibold text-foreground">
                  {seccion.titulo}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
                  {seccion.parrafos.map((parrafo) => (
                    <p key={parrafo}>{parrafo}</p>
                  ))}
                  {seccion.lista && (
                    <ul className="list-disc space-y-1.5 pl-5">
                      {seccion.lista.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>

          <footer className="mt-10 border-t border-border pt-6 text-center text-sm text-muted">
            <Link href="/login" className="font-medium text-accent hover:underline">
              Volver al inicio de sesión
            </Link>
          </footer>
        </article>

        <p className="mt-6 text-center text-[10px] text-muted">
          © 2026 Fynix. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
