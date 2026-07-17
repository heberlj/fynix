"use client";

import type {
  CuentaBancaria,
  TarjetaCredito,
  Transaccion,
} from "@/types/finanzas";
import {
  type FiltroDetalleHome,
  type SeleccionFuenteHome,
} from "@/lib/resumen-home";
import { ListaTransaccionesHome } from "@/components/home/ListaTransaccionesHome";

const ETIQUETAS_FILTRO: Record<FiltroDetalleHome, string> = {
  ingresos: "Ingresos",
  gastos: "Gastos",
  movimientos: "Movimientos",
};

const LIMITE_INLINE = 10;

interface DetalleTransaccionesHomeProps {
  transacciones: Transaccion[];
  filtro: FiltroDetalleHome;
  moneda: string;
  fuente?: SeleccionFuenteHome | null;
  cuentas: CuentaBancaria[];
  tarjetas: TarjetaCredito[];
  titulo?: string;
  onVerMas?: () => void;
}

export function DetalleTransaccionesHome({
  transacciones,
  filtro,
  moneda,
  fuente,
  cuentas,
  tarjetas,
  titulo,
  onVerMas,
}: DetalleTransaccionesHomeProps) {
  const preview = transacciones.slice(0, LIMITE_INLINE);
  const hayMas = transacciones.length > LIMITE_INLINE;
  const encabezado = titulo ?? ETIQUETAS_FILTRO[filtro];

  return (
    <div className="mt-3 rounded-xl border border-border bg-background shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">
          {encabezado}
        </h3>
        <p className="mt-0.5 text-xs text-muted">
          Últimas {Math.min(transacciones.length, LIMITE_INLINE)} de{" "}
          {transacciones.length}
        </p>
      </div>

      <div className="px-4 py-3">
        <ListaTransaccionesHome
          transacciones={preview}
          filtro={filtro}
          moneda={moneda}
          fuente={fuente}
          cuentas={cuentas}
          tarjetas={tarjetas}
        />
      </div>

      {hayMas && onVerMas && (
        <div className="border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={onVerMas}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
          >
            Ver todas ({transacciones.length})
          </button>
        </div>
      )}
    </div>
  );
}
