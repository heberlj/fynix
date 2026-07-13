"use client";

import type { TarjetaCredito } from "@/types/finanzas";
import { formatearMoneda } from "@/lib/quincenas";
import {
  etiquetaProductoFinanciamiento,
  etiquetaQuincenaVencimiento,
  obtenerFinanciamientoTarjeta,
  productoFinanciamientoActivo,
} from "@/lib/financiamiento-cuotas";

interface ResumenFinanciamientoCuotasProps {
  tarjeta: TarjetaCredito;
}

export function ResumenFinanciamientoCuotas({
  tarjeta,
}: ResumenFinanciamientoCuotasProps) {
  const f = obtenerFinanciamientoTarjeta(tarjeta);

  if (!productoFinanciamientoActivo(f.producto) || f.montoCuotaMensual <= 0) {
    return null;
  }

  const campos = [
    {
      etiqueta: "Límite aprobado",
      valor: formatearMoneda(f.limiteAprobado, tarjeta.moneda),
    },
    {
      etiqueta: "Balance a la fecha",
      valor: formatearMoneda(f.balancePendiente, tarjeta.moneda),
      destacado: true,
    },
    {
      etiqueta: "Cuota mensual",
      valor: formatearMoneda(f.montoCuotaMensual, tarjeta.moneda),
      destacado: true,
    },
    {
      etiqueta: "Día de corte",
      valor: `Día ${f.diaCorte}`,
    },
    {
      etiqueta: "Día de pago",
      valor: `Día ${f.diaPago}`,
    },
    {
      etiqueta: "Quincena asignada",
      valor: etiquetaQuincenaVencimiento(f.diaPago),
    },
  ];

  return (
    <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
        {etiquetaProductoFinanciamiento(f.producto)}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
        {campos.map((campo) => (
          <div key={campo.etiqueta}>
            <p className="text-muted">{campo.etiqueta}</p>
            <p
              className={`font-semibold ${
                campo.destacado ? "text-gasto" : "text-foreground"
              }`}
            >
              {campo.valor}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
