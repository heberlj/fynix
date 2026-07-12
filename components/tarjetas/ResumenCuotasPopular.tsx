"use client";

import type { TarjetaCredito } from "@/types/finanzas";
import { formatearFecha } from "@/lib/fechas";
import { resumenEstadoCuotasPopular } from "@/lib/cuotas-popular";
import { formatearMoneda } from "@/lib/quincenas";
import { useFinanzas } from "@/context/FinanzasContext";

interface ResumenCuotasPopularProps {
  tarjeta: TarjetaCredito;
}

export function ResumenCuotasPopular({ tarjeta }: ResumenCuotasPopularProps) {
  const { cuotasPopular, tarjetas, transacciones } = useFinanzas();

  const resumen = resumenEstadoCuotasPopular(
    tarjeta,
    cuotasPopular,
    tarjetas,
    transacciones
  );

  if (!resumen) return null;

  const campos = [
    {
      etiqueta: "Límite aprobado",
      valor: formatearMoneda(resumen.limiteAprobado, tarjeta.moneda),
      destacado: false,
    },
    {
      etiqueta: "Balance a la fecha",
      valor: formatearMoneda(resumen.balanceFecha, tarjeta.moneda),
      destacado: true,
    },
    {
      etiqueta: "Disponible c/ sobregiro",
      valor: formatearMoneda(resumen.disponibleConSobregiro, tarjeta.moneda),
      destacado: false,
    },
    {
      etiqueta: "Fecha de corte",
      valor: formatearFecha(resumen.fechaCorte),
      destacado: false,
    },
    {
      etiqueta: "Balance al corte",
      valor: formatearMoneda(resumen.balanceCorte, tarjeta.moneda),
      destacado: true,
    },
    {
      etiqueta: "Pago mínimo",
      valor: formatearMoneda(resumen.pagoMinimo, tarjeta.moneda),
      destacado: true,
    },
    {
      etiqueta: "Fecha de vencimiento",
      valor: formatearFecha(resumen.fechaVencimiento),
      destacado: false,
    },
    {
      etiqueta: "Cuotas vencidas",
      valor: String(resumen.cuotasVencidas),
      destacado: resumen.cuotasVencidas > 0,
      alerta: resumen.cuotasVencidas > 0,
    },
  ];

  return (
    <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
          Cuotas Popular
        </p>
        <p className="font-mono text-xs text-muted">
          {resumen.numeroEnmascarado}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        {campos.map((campo) => (
          <div key={campo.etiqueta}>
            <p className="text-muted">{campo.etiqueta}</p>
            <p
              className={`font-semibold ${
                campo.alerta
                  ? "text-gasto"
                  : campo.destacado
                    ? "text-gasto"
                    : "text-foreground"
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
