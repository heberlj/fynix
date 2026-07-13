"use client";

import { useState } from "react";
import {
  enmascararNumero,
  formatearNumeroTarjeta,
  limpiarNumeroTarjeta,
} from "@/lib/tarjetas";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground outline-none focus:border-accent sm:text-sm";

interface InputNumeroTarjetaSeguroProps {
  digitos: string;
  onDigitosChange: (digitos: string) => void;
  maxDigitos?: number;
  placeholder?: string;
  className?: string;
}

export function InputNumeroTarjetaSeguro({
  digitos,
  onDigitosChange,
  maxDigitos = 16,
  placeholder = "0000 •••• •••• 0000",
  className = inputClass,
}: InputNumeroTarjetaSeguroProps) {
  const [enfocado, setEnfocado] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nuevosDigitos = limpiarNumeroTarjeta(e.target.value).slice(0, maxDigitos);
    onDigitosChange(nuevosDigitos);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pegado = limpiarNumeroTarjeta(e.clipboardData.getData("text")).slice(
      0,
      maxDigitos
    );
    if (pegado) onDigitosChange(pegado);
  }

  const valorVisible = digitos
    ? enfocado
      ? formatearNumeroTarjeta(digitos)
      : enmascararNumero(digitos)
    : "";

  return (
    <input
      type="tel"
      inputMode="numeric"
      autoComplete="cc-number"
      value={valorVisible}
      onChange={handleChange}
      onPaste={handlePaste}
      onFocus={() => setEnfocado(true)}
      onBlur={() => setEnfocado(false)}
      placeholder={placeholder}
      className={className}
      aria-label="Número de tarjeta con primeros y últimos cuatro dígitos visibles"
    />
  );
}
