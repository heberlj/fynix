import type { ReactNode } from "react";

interface PanelConfiguracionProps {
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  className?: string;
}

export function PanelConfiguracion({
  titulo,
  descripcion,
  children,
  className = "",
}: PanelConfiguracionProps) {
  return (
    <section
      className={`rounded-xl border border-border bg-surface p-6 shadow-sm ${className}`}
    >
      <header>
        <h2 className="text-base font-semibold text-foreground">{titulo}</h2>
        {descripcion && (
          <p className="mt-1 text-xs text-muted">{descripcion}</p>
        )}
      </header>
      <div className="mt-5">{children}</div>
    </section>
  );
}
