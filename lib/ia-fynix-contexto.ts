import type { EstadoFinanzas } from "@/types/finanzas";
import { mesActual } from "@/lib/fechas";
import { gastosPorCategoriaEnPeriodo } from "@/lib/graficos";
import { faltanteMeta, progresoMeta } from "@/lib/metas-ahorro";
import { rangoPeriodoHome } from "@/lib/periodos-home";
import { calcularResumenPeriodoHome } from "@/lib/resumen-home";
import { diasHastaPago } from "@/lib/tarjetas";

export interface CuentaContextoIa {
  nombre: string;
  banco: string;
  saldo: number;
  moneda: string;
}

export interface TarjetaContextoIa {
  id: string;
  nombre: string;
  banco: string;
  deuda: number;
  limite: number;
  utilizacion: number;
  diasHastaPago: number;
  moneda: string;
}

export interface MetaContextoIa {
  nombre: string;
  progreso: number;
  faltante: number;
  moneda: string;
}

export interface GastoCategoriaContextoIa {
  categoria: string;
  monto: number;
  porcentaje: number;
}

export interface ContextoIaFynix {
  monedaReferencia: string;
  periodoEtiqueta: string;
  ingresosMes: number;
  gastosMes: number;
  balanceMes: number;
  gastosPorCategoria: GastoCategoriaContextoIa[];
  cuentas: CuentaContextoIa[];
  efectivo: number;
  tarjetas: TarjetaContextoIa[];
  metasAhorro: MetaContextoIa[];
}

export function construirContextoIaFynix(estado: EstadoFinanzas): ContextoIaFynix {
  const monedaReferencia = estado.configuracion.moneda;
  const rango = rangoPeriodoHome("mes", mesActual());
  const resumen = calcularResumenPeriodoHome(
    estado.transacciones,
    rango,
    monedaReferencia
  );
  const gastosPorCategoria = gastosPorCategoriaEnPeriodo(
    estado.transacciones,
    rango,
    monedaReferencia
  );

  const tarjetas = estado.tarjetas
    .filter((t) => t.deudaActual > 0)
    .map((t) => ({
      id: t.id,
      nombre: t.nombreTarjeta,
      banco: t.banco,
      deuda: t.deudaActual,
      limite: t.limite,
      utilizacion: t.limite > 0 ? (t.deudaActual / t.limite) * 100 : 0,
      diasHastaPago: diasHastaPago(t.diaPago),
      moneda: t.moneda,
    }))
    .sort((a, b) => b.deuda - a.deuda);

  const metasAhorro = estado.metasAhorro
    .filter((m) => m.montoActual < m.montoObjetivo)
    .map((m) => ({
      nombre: m.nombre,
      progreso: progresoMeta(m),
      faltante: faltanteMeta(m),
      moneda: m.moneda,
    }))
    .sort((a, b) => a.progreso - b.progreso);

  return {
    monedaReferencia,
    periodoEtiqueta: rango.etiqueta,
    ingresosMes: resumen.ingresos,
    gastosMes: resumen.gastos,
    balanceMes: resumen.ingresos - resumen.gastos,
    gastosPorCategoria,
    cuentas: estado.cuentas.map((c) => ({
      nombre: c.nombre,
      banco: c.banco,
      saldo: c.saldoActual,
      moneda: c.moneda,
    })),
    efectivo: estado.efectivo,
    tarjetas,
    metasAhorro,
  };
}
