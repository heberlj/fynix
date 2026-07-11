import type { CuentaBancaria } from "@/types/finanzas";

export function etiquetaTipoCuenta(tipo: CuentaBancaria["tipo"]): string {
  return tipo === "ahorro" ? "Ahorro" : "Corriente";
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
