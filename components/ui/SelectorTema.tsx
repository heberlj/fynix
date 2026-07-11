import type { TemaApp } from "@/types/finanzas";

const OPCIONES: { valor: TemaApp; etiqueta: string; icono: string }[] = [
  { valor: "claro", etiqueta: "Claro", icono: "☀" },
  { valor: "oscuro", etiqueta: "Oscuro", icono: "☾" },
  { valor: "sistema", etiqueta: "Sistema", icono: "◐" },
];

interface SelectorTemaProps {
  value: TemaApp;
  onChange: (tema: TemaApp) => void;
  compacto?: boolean;
}

export function SelectorTema({ value, onChange, compacto = false }: SelectorTemaProps) {
  if (compacto) {
    const actual = OPCIONES.find((o) => o.valor === value) ?? OPCIONES[0];
    const siguiente =
      OPCIONES[(OPCIONES.findIndex((o) => o.valor === value) + 1) % OPCIONES.length];

    return (
      <button
        type="button"
        onClick={() => onChange(siguiente.valor)}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        title={`Tema: ${actual.etiqueta}. Clic para cambiar`}
      >
        <span>{actual.icono}</span>
        <span>{actual.etiqueta}</span>
      </button>
    );
  }

  return (
    <div className="flex rounded-lg border border-border p-1">
      {OPCIONES.map((op) => (
        <button
          key={op.valor}
          type="button"
          onClick={() => onChange(op.valor)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors ${
            value === op.valor
              ? "bg-accent text-white"
              : "text-muted hover:text-foreground"
          }`}
        >
          <span>{op.icono}</span>
          {op.etiqueta}
        </button>
      ))}
    </div>
  );
}
