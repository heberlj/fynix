"use client";

import { opcionesBanco } from "@/lib/bancos";

const selectClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

interface SelectorBancoProps {
  value: string;
  onChange: (value: string) => void;
  etiqueta?: string;
  className?: string;
  id?: string;
}

export function SelectorBanco({
  value,
  onChange,
  etiqueta = "Banco",
  className = "",
  id,
}: SelectorBancoProps) {
  const opciones = opcionesBanco(value);

  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-sm font-medium text-foreground">{etiqueta}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
        required
      >
        <option value="" disabled>
          Selecciona un banco
        </option>
        {opciones.map((banco) => (
          <option key={banco} value={banco}>
            {banco}
          </option>
        ))}
      </select>
      <span className="text-xs text-muted">
        Bancos múltiples autorizados por la Superintendencia de Bancos
      </span>
    </label>
  );
}
