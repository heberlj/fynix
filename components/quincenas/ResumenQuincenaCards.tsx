import { formatearMoneda } from "@/lib/quincenas";

interface ResumenQuincenaCardsProps {
  ingresos: number;
  gastos: number;
  disponible: number;
  moneda: string;
  titulo?: string;
  esActual?: boolean;
  className?: string;
}

function TarjetaMetrica({
  etiqueta,
  monto,
  moneda,
  variante = "neutro",
  nota,
}: {
  etiqueta: string;
  monto: number;
  moneda: string;
  variante?: "neutro" | "ingreso" | "gasto" | "pendiente";
  nota?: string;
}) {
  const estilos = {
    neutro: "border-border bg-background",
    ingreso: "border-ingreso/30 bg-ingreso/5",
    gasto: "border-gasto/30 bg-gasto/5",
    pendiente: "border-border bg-background",
  }[variante];

  const colorMonto = {
    neutro: "text-foreground",
    ingreso: "text-ingreso",
    gasto: "text-gasto",
    pendiente: "text-muted",
  }[variante];

  return (
    <div
      className={`flex min-h-[148px] flex-col rounded-xl border p-4 shadow-sm sm:min-h-[156px] sm:p-5 ${estilos}`}
    >
      <p className="text-sm font-medium text-muted">{etiqueta}</p>
      <p
        className={`mt-3 text-xl font-bold tracking-tight sm:text-2xl ${colorMonto}`}
      >
        {formatearMoneda(monto, moneda)}
      </p>
      <p className="mt-auto min-h-[2.5rem] pt-2 text-xs leading-relaxed text-muted">
        {nota ?? "\u00A0"}
      </p>
    </div>
  );
}

export function ResumenQuincenaCards({
  ingresos,
  gastos,
  disponible,
  moneda,
  titulo,
  esActual = false,
  className = "",
}: ResumenQuincenaCardsProps) {
  const sinIngresos = ingresos <= 0;
  const varianteDisponible = sinIngresos
    ? "pendiente"
    : disponible >= 0
      ? "ingreso"
      : "gasto";
  const notaDisponible = sinIngresos
    ? "Registra tu nómina o salario para calcular el disponible"
    : disponible >= 0
      ? "Saldo positivo en la quincena"
      : "Saldo negativo en la quincena";

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {titulo && (
        <div className="mb-3 flex min-h-[1.75rem] items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{titulo}</p>
          {esActual && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              Actual
            </span>
          )}
        </div>
      )}
      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <TarjetaMetrica etiqueta="Ingresos" monto={ingresos} moneda={moneda} />
        <TarjetaMetrica etiqueta="Gastos" monto={gastos} moneda={moneda} />
        <TarjetaMetrica
          etiqueta="Disponible"
          monto={sinIngresos ? 0 : disponible}
          moneda={moneda}
          variante={varianteDisponible}
          nota={notaDisponible}
        />
      </div>
    </div>
  );
}
