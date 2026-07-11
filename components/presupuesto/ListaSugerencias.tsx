import type { ItemSugerenciaPago, PrioridadSugerencia } from "@/types/finanzas";
import { formatearMoneda } from "@/lib/quincenas";

const ETIQUETAS_TIPO: Record<ItemSugerenciaPago["tipo"], string> = {
  tarjeta: "Tarjeta",
  prestamo: "Préstamo",
  "cuota-popular": "Cuota Popular",
  "gasto-fijo": "Gasto fijo",
};

const ETIQUETAS_PRIORIDAD: Record<
  PrioridadSugerencia,
  { titulo: string; clase: string; icono: string }
> = {
  pagar: {
    titulo: "Pagar",
    clase: "border-ingreso/30 bg-ingreso/5",
    icono: "✓",
  },
  posponer: {
    titulo: "Posponer",
    clase: "border-yellow-500/30 bg-yellow-500/5",
    icono: "◷",
  },
  evitar: {
    titulo: "Evitar por ahora",
    clase: "border-gasto/30 bg-gasto/5",
    icono: "✕",
  },
};

interface ListaSugerenciasProps {
  items: ItemSugerenciaPago[];
  moneda: string;
}

export function ListaSugerencias({ items, moneda }: ListaSugerenciasProps) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        No hay compromisos en la próxima quincena para sugerir.
      </p>
    );
  }

  const grupos: PrioridadSugerencia[] = ["pagar", "posponer", "evitar"];

  return (
    <div className="space-y-6">
      {grupos.map((prioridad) => {
        const lista = items.filter((i) => i.prioridad === prioridad);
        if (lista.length === 0) return null;
        const meta = ETIQUETAS_PRIORIDAD[prioridad];
        const total = lista.reduce((s, i) => s + i.monto, 0);

        return (
          <section key={prioridad}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {meta.icono} {meta.titulo}
              </h3>
              <span className="text-xs font-medium text-muted">
                {formatearMoneda(total, moneda)}
              </span>
            </div>
            <ul className="space-y-2">
              {lista.map((item) => (
                <li
                  key={item.id}
                  className={`rounded-lg border px-4 py-3 ${meta.clase}`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {item.nombre}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {ETIQUETAS_TIPO[item.tipo]}
                        {item.categoria ? ` · ${item.categoria}` : ""}
                        {" · día "}
                        {item.diaPago}
                        {item.diasRestantes === 0
                          ? " (hoy)"
                          : item.diasRestantes > 0
                            ? ` (en ${item.diasRestantes} día${item.diasRestantes !== 1 ? "s" : ""})`
                            : ""}
                      </p>
                      <p className="mt-1.5 text-xs text-muted">{item.razon}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-foreground">
                      {formatearMoneda(item.monto, item.moneda)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
