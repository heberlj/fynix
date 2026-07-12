"use client";

import { useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import type { CuentaBancaria, ColorHome, IconoHomeCuenta, TipoCuentaBancaria } from "@/types/finanzas";
import { SelectorMoneda } from "@/components/ui/SelectorMoneda";
import { SelectorBanco } from "@/components/ui/SelectorBanco";
import { bancoPermitido, esBancoCertificado } from "@/lib/bancos";
import { PersonalizacionCuentaHome } from "@/components/ui/PersonalizacionCuentaHome";
import { colorHomeCuenta, iconoHomeCuenta } from "@/lib/personalizacion-home";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

interface EditarCuentaFormProps {
  cuenta: CuentaBancaria;
  onCancelar: () => void;
}

export function EditarCuentaForm({ cuenta, onCancelar }: EditarCuentaFormProps) {
  const { actualizarCuenta } = useFinanzas();

  const [banco, setBanco] = useState(cuenta.banco);
  const [nombre, setNombre] = useState(cuenta.nombre);
  const [tipo, setTipo] = useState<TipoCuentaBancaria>(cuenta.tipo);
  const [saldoActual, setSaldoActual] = useState(String(cuenta.saldoActual));
  const [ultimosCuatro, setUltimosCuatro] = useState(cuenta.ultimosCuatro);
  const [moneda, setMoneda] = useState(cuenta.moneda);
  const [colorHome, setColorHome] = useState<ColorHome>(colorHomeCuenta(cuenta));
  const [iconoHome, setIconoHome] = useState<IconoHomeCuenta>(iconoHomeCuenta(cuenta));
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const saldoNum = parseFloat(saldoActual);
    if (!banco || !bancoPermitido(banco, cuenta.banco)) {
      setError("Selecciona un banco de la lista");
      return;
    }
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (isNaN(saldoNum) || saldoNum < 0) {
      setError("Ingresa un saldo válido");
      return;
    }

    actualizarCuenta(cuenta.id, {
      banco,
      nombre: nombre.trim(),
      tipo,
      saldoActual: saldoNum,
      moneda,
      ultimosCuatro: ultimosCuatro.replace(/\D/g, "").slice(-4),
      colorHome,
      iconoHome,
    });

    onCancelar();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 border-t border-border pt-6">
      <h4 className="text-sm font-semibold text-foreground">Editar cuenta</h4>
      <p className="text-xs text-muted">
        Puedes ajustar el saldo manualmente si no coincide con tu banco
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectorBanco value={banco} onChange={setBanco} className="sm:col-span-2" />

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">Nombre</span>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Tipo</span>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoCuentaBancaria)} className={inputClass}>
            <option value="ahorro">Ahorro</option>
            <option value="corriente">Corriente</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Moneda</span>
          <SelectorMoneda value={moneda} onChange={setMoneda} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Saldo actual</span>
          <input type="number" min="0" step="0.01" value={saldoActual} onChange={(e) => setSaldoActual(e.target.value)} className={inputClass} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Últimos 4 dígitos</span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={ultimosCuatro}
            onChange={(e) => setUltimosCuatro(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className={inputClass}
          />
        </label>

        <div className="sm:col-span-2">
          <PersonalizacionCuentaHome
            color={colorHome}
            icono={iconoHome}
            onColorChange={setColorHome}
            onIconoChange={setIconoHome}
          />
        </div>
      </div>

      {error && <p className="text-sm text-gasto">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
          Guardar cambios
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:bg-surface-hover hover:text-foreground"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
