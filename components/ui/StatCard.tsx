import { formatearMoneda } from "@/lib/quincenas";
import {
  IndicadorVariacion,
  type VariacionStat,
} from "@/components/ui/IndicadorVariacion";

interface StatCardProps {
  titulo: string;
  valor: number;
  moneda: string;
  variante?: "default" | "ingreso" | "gasto" | "balance" | "disponible";
  subtitulo?: string;
  variacion?: VariacionStat;
}

const VARIANTES = {
  default: "text-foreground",
  ingreso: "text-foreground",
  gasto: "text-foreground",
  balance: "text-accent",
  disponible: "",
};

export function StatCard({
  titulo,
  valor,
  moneda,
  variante = "default",
  subtitulo,
  variacion,
}: StatCardProps) {
  const esDisponible = variante === "disponible";
  const positivo = valor >= 0;

  const valorClass = esDisponible
    ? positivo
      ? "text-ingreso"
      : "text-gasto"
    : VARIANTES[variante];

  const cardClass = esDisponible
    ? positivo
      ? "border-ingreso/25 bg-ingreso/5"
      : "border-gasto/25 bg-gasto/5"
    : "border-border bg-surface";

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${cardClass}`}>
      <p className="text-sm font-medium text-muted">{titulo}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${valorClass}`}>
        {formatearMoneda(valor, moneda)}
      </p>
      {variacion && <IndicadorVariacion variacion={variacion} />}
      {subtitulo && (
        <p className={`text-xs text-muted ${variacion ? "mt-1" : "mt-1"}`}>
          {subtitulo}
        </p>
      )}
    </div>
  );
}
