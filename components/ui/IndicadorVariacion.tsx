import { formatearMoneda } from "@/lib/quincenas";

export interface VariacionStat {
  diferencia: number;
  moneda: string;
  /** Si true, un aumento se muestra en rojo (gastos, compromisos) */
  invertirColor?: boolean;
  etiqueta?: string;
}

export function IndicadorVariacion({ variacion }: { variacion: VariacionStat }) {
  const {
    diferencia,
    moneda,
    invertirColor = false,
    etiqueta = "vs quincena anterior",
  } = variacion;

  if (diferencia === 0) {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
        <span aria-hidden>—</span>
        <span>Sin cambio {etiqueta}</span>
      </p>
    );
  }

  const subio = diferencia > 0;
  const esFavorable = invertirColor ? !subio : subio;
  const color = esFavorable ? "text-ingreso" : "text-gasto";
  const flecha = subio ? "↑" : "↓";
  const signo = subio ? "+" : "−";

  return (
    <p className={`mt-2 flex flex-wrap items-center gap-1.5 text-xs ${color}`}>
      <span className="text-base font-bold leading-none" aria-hidden>
        {flecha}
      </span>
      <span className="font-semibold">
        {signo}
        {formatearMoneda(Math.abs(diferencia), moneda)}
      </span>
      <span className="text-muted">{etiqueta}</span>
    </p>
  );
}
