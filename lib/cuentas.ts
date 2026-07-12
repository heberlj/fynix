import type { CuentaBancaria } from "@/types/finanzas";

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
