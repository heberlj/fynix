import type { CuentaBancaria } from "@/types/finanzas";

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

export function etiquetaTipoCuenta(tipo: CuentaBancaria["tipo"]): string {
  return tipo === "ahorro" ? "Ahorro" : "Corriente";
}

/** Clase de color según el saldo: negativo rojo, cero naranja, positivo verde */
export function claseColorSaldoCuenta(saldo: number): string {
  if (saldo < 0) return "text-gasto";
  if (saldo === 0) return "text-orange-500";
  return "text-ingreso";
}

export function totalCuentasPorMoneda(
  cuentas: CuentaBancaria[]
): Map<string, number> {
  const mapa = new Map<string, number>();
  cuentas.forEach((c) => {
    mapa.set(c.moneda, (mapa.get(c.moneda) ?? 0) + c.saldoActual);
  });
  return mapa;
}

/** Suma saldos de cuentas en una moneda más efectivo (en moneda principal) */
export function balanceTotalEnMoneda(
  cuentas: CuentaBancaria[],
  efectivo: number,
  moneda: string
): number {
  const enCuentas = cuentas
    .filter((c) => c.moneda === moneda)
    .reduce((sum, c) => sum + c.saldoActual, 0);
  return redondear(enCuentas + efectivo);
}
