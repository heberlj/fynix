import { MONEDAS } from "@/types/finanzas";

const selectClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

interface SelectorMonedaProps {
  value: string;
  onChange: (valor: string) => void;
  id?: string;
  className?: string;
}

export function SelectorMoneda({
  value,
  onChange,
  id,
  className = selectClass,
}: SelectorMonedaProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      {MONEDAS.map((m) => (
        <option key={m.codigo} value={m.codigo}>
          {m.codigo} — {m.nombre}
        </option>
      ))}
    </select>
  );
}
