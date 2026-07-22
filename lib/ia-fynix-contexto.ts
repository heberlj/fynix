import type { EstadoFinanzas } from "@/types/finanzas";
import { mesActual } from "@/lib/fechas";
import {
  cuotaPagadaEnPeriodo,
  cuotaPopularCompletada,
  diaPagoCuota,
  nombreCuotaPopular,
} from "@/lib/cuotas-popular";
import { obtenerGastosFijosDetalle } from "@/lib/gastos-fijos";
import { gastosPorCategoriaEnPeriodo } from "@/lib/graficos";
import { faltanteMeta, progresoMeta } from "@/lib/metas-ahorro";
import { rangoPeriodoHome } from "@/lib/periodos-home";
import {
  diasHastaCuota,
  montoCuotaPrestamoPendienteEnPeriodo,
  prestamoCompletado,
} from "@/lib/prestamos";
import { listarProximosPagos } from "@/lib/proximos-pagos";
import { calcularResumenPeriodoHome } from "@/lib/resumen-home";
import { diasHastaPago } from "@/lib/tarjetas";
import { obtenerQuincenaActual } from "@/lib/quincenas";

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

export interface QuincenaContextoIa {
  numero: 1 | 2;
  etiqueta: string;
  inicio: string;
  fin: string;
}

export interface ProximoPagoContextoIa {
  tipo: string;
  nombre: string;
  monto: number;
  moneda: string;
  diasHastaVencimiento: number;
  urgente: boolean;
  esHoy: boolean;
}

export interface GastoFijoQuincenaContextoIa {
  nombre: string;
  monto: number;
  montoPendiente: number;
  moneda: string;
  diaPago: number;
  categoria: string;
  pagado: boolean;
}

export interface PrestamoContextoIa {
  entidad: string;
  montoCuota: number;
  montoPendienteQuincena: number;
  moneda: string;
  cuotaActual: number;
  cuotasTotales: number;
  diasHastaPago: number;
  pagadoEnQuincenaActual: boolean;
}

export interface CuotaPopularContextoIa {
  nombre: string;
  montoCuota: number;
  moneda: string;
  cuotaActual: number;
  cuotasTotales: number;
  diasHastaPago: number;
  pagadoEnQuincenaActual: boolean;
}

export interface ContextoIaFynix {
  monedaReferencia: string;
  periodoEtiqueta: string;
  ingresosMes: number;
  gastosMes: number;
  balanceMes: number;
  liquidezDisponible: number;
  gastosPorCategoria: GastoCategoriaContextoIa[];
  cuentas: CuentaContextoIa[];
  efectivo: number;
  tarjetas: TarjetaContextoIa[];
  metasAhorro: MetaContextoIa[];
  quincenaActual: QuincenaContextoIa;
  proximosPagos: ProximoPagoContextoIa[];
  gastosFijosQuincenaActual: GastoFijoQuincenaContextoIa[];
  prestamosActivos: PrestamoContextoIa[];
  cuotasPopularActivas: CuotaPopularContextoIa[];
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

  const periodoQuincena = obtenerQuincenaActual(estado.configuracion);

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

  const cuentas = estado.cuentas.map((c) => ({
    nombre: c.nombre,
    banco: c.banco,
    saldo: c.saldoActual,
    moneda: c.moneda,
  }));

  const liquidezDisponible =
    estado.efectivo +
    cuentas
      .filter((c) => c.moneda === monedaReferencia)
      .reduce((sum, c) => sum + c.saldo, 0);

  const proximosPagos = listarProximosPagos(estado, new Date(), 20).map((p) => ({
    tipo: p.tipo,
    nombre: p.nombre,
    monto: p.monto,
    moneda: p.moneda,
    diasHastaVencimiento: p.diasRestantes,
    urgente: p.urgente,
    esHoy: p.esHoy,
  }));

  const gastosFijosQuincenaActual = obtenerGastosFijosDetalle(
    estado.gastosFijos,
    periodoQuincena,
    estado.transacciones
  ).map((g) => ({
    nombre: g.nombre,
    monto: g.monto,
    montoPendiente: g.montoPendiente,
    moneda: g.moneda,
    diaPago: g.dia,
    categoria: g.categoria,
    pagado: g.pagado,
  }));

  const prestamosActivos = estado.prestamos
    .filter((p) => !prestamoCompletado(p))
    .map((p) => {
      const pendiente = montoCuotaPrestamoPendienteEnPeriodo(
        p,
        estado.transacciones,
        periodoQuincena,
        p.moneda
      );
      return {
        entidad: p.entidad,
        montoCuota: p.montoCuota,
        montoPendienteQuincena: pendiente,
        moneda: p.moneda,
        cuotaActual: p.cuotasPagadas + 1,
        cuotasTotales: p.cuotasTotales,
        diasHastaPago: diasHastaCuota(p.diaPago),
        pagadoEnQuincenaActual: pendiente <= 0,
      };
    })
    .sort((a, b) => a.diasHastaPago - b.diasHastaPago);

  const cuotasPopularActivas = estado.cuotasPopular
    .filter((c) => !cuotaPopularCompletada(c))
    .map((c) => {
      const dia = diaPagoCuota(c, estado.tarjetas);
      const pagado = cuotaPagadaEnPeriodo(
        c.id,
        estado.transacciones,
        periodoQuincena
      );
      return {
        nombre: nombreCuotaPopular(c, estado.tarjetas),
        montoCuota: c.montoCuota,
        moneda: c.moneda,
        cuotaActual: c.cuotasPagadas + 1,
        cuotasTotales: c.cuotasTotales,
        diasHastaPago: diasHastaCuota(dia),
        pagadoEnQuincenaActual: pagado,
      };
    })
    .sort((a, b) => a.diasHastaPago - b.diasHastaPago);

  return {
    monedaReferencia,
    periodoEtiqueta: rango.etiqueta,
    ingresosMes: resumen.ingresos,
    gastosMes: resumen.gastos,
    balanceMes: resumen.ingresos - resumen.gastos,
    liquidezDisponible,
    gastosPorCategoria,
    cuentas,
    efectivo: estado.efectivo,
    tarjetas,
    metasAhorro,
    quincenaActual: {
      numero: periodoQuincena.quincena,
      etiqueta: periodoQuincena.etiqueta,
      inicio: periodoQuincena.inicio,
      fin: periodoQuincena.fin,
    },
    proximosPagos,
    gastosFijosQuincenaActual,
    prestamosActivos,
    cuotasPopularActivas,
  };
}
