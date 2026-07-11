import { formatearMoneda } from "@/lib/quincenas";

interface ResumenQuincenaCardsProps {
  ingresos: number;
  gastos: number;
  disponible: number;
  moneda: string;
  className?: string;
}

export function ResumenQuincenaCards({
  ingresos,
  gastos,
  disponible,
  moneda,
  className = "",
}: ResumenQuincenaCardsProps) {
  const positivo = disponible >= 0;

  return (
    <div className={`grid gap-4 sm:grid-cols-3 ${className}`}>
      <div className="rounded-xl border border-border bg-background p-5 shadow-sm sm:p-6">
        <p className="text-sm font-medium text-muted">Ingresos</p>
        <p className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {formatearMoneda(ingresos, moneda)}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-background p-5 shadow-sm sm:p-6">
        <p className="text-sm font-medium text-muted">Gastos</p>
        <p className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {formatearMoneda(gastos, moneda)}
        </p>
      </div>

      <div
        className={`rounded-xl border p-5 shadow-sm sm:p-6 ${
          positivo
            ? "border-ingreso/30 bg-ingreso/5"
            : "border-gasto/30 bg-gasto/5"
        }`}
      >
        <p className="text-sm font-medium text-muted">Disponible</p>
        <p
          className={`mt-3 text-2xl font-bold tracking-tight sm:text-3xl ${
            positivo ? "text-ingreso" : "text-gasto"
          }`}
        >
          {formatearMoneda(disponible, moneda)}
        </p>
        <p className="mt-2 text-xs text-muted">
          {positivo ? "Saldo positivo" : "Saldo negativo"}
        </p>
      </div>
    </div>
  );
}
