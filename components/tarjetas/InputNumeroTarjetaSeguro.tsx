"use client";

import { useRef } from "react";
import { enmascararNumero, limpiarNumeroTarjeta } from "@/lib/tarjetas";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

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
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key >= "0" && e.key <= "9") {
      e.preventDefault();
      if (digitos.length < maxDigitos) {
        onDigitosChange(digitos + e.key);
      }
      return;
    }

    if (e.key === "Backspace") {
      e.preventDefault();
      onDigitosChange(digitos.slice(0, -1));
      return;
    }

    if (e.key === "Delete") {
      e.preventDefault();
      onDigitosChange("");
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pegado = limpiarNumeroTarjeta(e.clipboardData.getData("text")).slice(
      0,
      maxDigitos
    );
    if (pegado) onDigitosChange(pegado);
  }

  const valorVisible = digitos ? enmascararNumero(digitos) : "";

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={valorVisible}
      readOnly
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onFocus={() => inputRef.current?.select()}
      placeholder={placeholder}
      className={className}
      aria-label="Número de tarjeta con primeros y últimos cuatro dígitos visibles"
    />
  );
}
