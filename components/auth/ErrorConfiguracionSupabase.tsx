"use client";

export function ErrorConfiguracionSupabase() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md rounded-xl border border-border bg-surface p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-foreground">
          Falta configurar Supabase
        </h1>
        <p className="mt-2 text-sm text-muted">
          La app no puede conectarse a la base de datos. En Netlify (o tu
          hosting), agrega estas variables de entorno y vuelve a desplegar:
        </p>
        <ul className="mt-4 space-y-1 text-left font-mono text-xs text-foreground">
          <li>NEXT_PUBLIC_SUPABASE_URL</li>
          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
        </ul>
        <p className="mt-4 text-xs text-muted">
          En Netlify: Site configuration → Environment variables → Add a
          variable. Luego Deploys → Trigger deploy.
        </p>
      </div>
    </div>
  );
}
