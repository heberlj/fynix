"use client";

import { useMemo } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { codificarOrigen } from "@/lib/transacciones";
import { formatearMoneda } from "@/lib/quincenas";

const selectClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

interface SelectorOrigenFondoProps {
  value: string;
  onChange: (valor: string) => void;
  tipo: "gasto" | "ingreso" | "transferencia-origen" | "transferencia-destino";
  /** Solo efectivo y cuentas (sin tarjetas) */
  soloLiquido?: boolean;
  /** No mostrar esta opción (ej. mismo origen en transferencias) */
  excluirValor?: string;
}

export function SelectorOrigenFondo({
  value,
  onChange,
  tipo,
  soloLiquido = false,
  excluirValor,
}: SelectorOrigenFondoProps) {
  const { cuentas, tarjetas, efectivo, configuracion } = useFinanzas();

  const etiqueta =
    tipo === "gasto"
      ? "Pagar con"
      : tipo === "ingreso"
        ? "Depositar en"
        : tipo === "transferencia-origen"
          ? "Desde"
          : "Hacia";

  const soloLiquidoEfectivo =
    soloLiquido || tipo === "transferencia-origen";
  const destinoTransferencia = tipo === "transferencia-destino";

  const opciones = useMemo(() => {
    const items: { valor: string; grupo: string; label: string }[] = [];

    if (!destinoTransferencia) {
      items.push({
        valor: codificarOrigen({ tipo: "efectivo" }),
        grupo: "Efectivo",
        label: `Efectivo (${formatearMoneda(efectivo, configuracion.moneda)})`,
      });

      cuentas.forEach((c) => {
        items.push({
          valor: codificarOrigen({ tipo: "cuenta", id: c.id }),
          grupo: "Cuentas bancarias",
          label: `${c.banco} · ${c.nombre}${c.ultimosCuatro ? ` ·••• ${c.ultimosCuatro}` : ""} (${formatearMoneda(c.saldoActual, c.moneda)})`,
        });
      });
    }

    if (destinoTransferencia) {
      items.push({
        valor: codificarOrigen({ tipo: "efectivo" }),
        grupo: "Efectivo",
        label: `Efectivo (${formatearMoneda(efectivo, configuracion.moneda)})`,
      });

      cuentas.forEach((c) => {
        items.push({
          valor: codificarOrigen({ tipo: "cuenta", id: c.id }),
          grupo: "Cuentas bancarias",
          label: `${c.banco} · ${c.nombre}${c.ultimosCuatro ? ` ·••• ${c.ultimosCuatro}` : ""} (${formatearMoneda(c.saldoActual, c.moneda)})`,
        });
      });

      tarjetas.forEach((t) => {
        items.push({
          valor: codificarOrigen({ tipo: "tarjeta", id: t.id }),
          grupo: "Tarjetas de crédito",
          label: `${t.banco} · ${t.nombreTarjeta} ·••• ${t.ultimosCuatro} (deuda: ${formatearMoneda(t.deudaActual, t.moneda)})`,
        });
      });
    }

    if (!soloLiquidoEfectivo && !destinoTransferencia) {
      tarjetas.forEach((t) => {
        items.push({
          valor: codificarOrigen({ tipo: "tarjeta", id: t.id }),
          grupo: "Tarjetas de crédito",
          label: `${t.banco} · ${t.nombreTarjeta} ·••• ${t.ultimosCuatro} (deuda: ${formatearMoneda(t.deudaActual, t.moneda)})`,
        });
      });
    }

    return items.filter((op) => op.valor !== excluirValor);
  }, [
    cuentas,
    tarjetas,
    efectivo,
    configuracion.moneda,
    soloLiquidoEfectivo,
    destinoTransferencia,
    excluirValor,
  ]);

  const grupos = useMemo(() => {
    const mapa = new Map<string, typeof opciones>();
    opciones.forEach((op) => {
      const lista = mapa.get(op.grupo) ?? [];
      lista.push(op);
      mapa.set(op.grupo, lista);
    });
    return Array.from(mapa.entries());
  }, [opciones]);

  return (
    <label className="flex flex-col gap-1.5 sm:col-span-2">
      <span className="text-sm font-medium text-foreground">{etiqueta}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
        required
      >
        <option value="">Seleccionar...</option>
        {grupos.map(([grupo, ops]) => (
          <optgroup key={grupo} label={grupo}>
            {ops.map((op) => (
              <option key={op.valor} value={op.valor}>
                {op.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {tipo === "gasto" && tarjetas.length > 0 && !soloLiquidoEfectivo && (
        <span className="text-xs text-muted">
          Si pagas con tarjeta, la deuda de la tarjeta aumentará automáticamente
        </span>
      )}
      {tipo === "ingreso" && tarjetas.length > 0 && (
        <span className="text-xs text-muted">
          Si eliges una tarjeta, el ingreso se registrará como pago y reducirá la deuda
        </span>
      )}
      {tipo === "transferencia-origen" && (
        <span className="text-xs text-muted">
          El dinero saldrá de tu cuenta o efectivo
        </span>
      )}
      {tipo === "transferencia-destino" && (
        <span className="text-xs text-muted">
          Elige otra cuenta, efectivo o una tarjeta para pagar su deuda
        </span>
      )}
    </label>
  );
}
