import type {
  ConfiguracionUsuario,
  CuotaPopular,
  EstadoFinanzas,
  GastoFijo,
  Prestamo,
  TarjetaCredito,
  Transaccion,
} from "@/types/finanzas";
import {
  calcularMontoAporteSugerido,
  diaPagoAporteEnQuincena,
  montoPendienteAporteEnPeriodo,
  obtenerAporteIngreso,
} from "@/lib/aporte-ingreso";
import {
  cuotaPagadaEnPeriodo,
  cuotaPopularCompletada,
  diaPagoCuota,
  nombreCuotaPopular,
} from "@/lib/cuotas-popular";
import {
  gastoAplicaEnPeriodo,
  gastoVisibleEnPresupuesto,
  montoPendienteGastoFijoEnPeriodo,
} from "@/lib/gastos-fijos";
import {
  montoCuotaPrestamoPendienteEnPeriodo,
  prestamoCompletado,
} from "@/lib/prestamos";
import { obtenerRecordatoriosPagos } from "@/lib/recordatorios-pagos";
import { diasHastaPago } from "@/lib/tarjetas";
import { periodoDeFecha } from "@/lib/quincenas";
import { fechaHoy } from "@/lib/fechas";

export type TipoProximoPago =
  | "tarjeta"
  | "prestamo"
  | "cuota-popular"
  | "gasto-fijo"
  | "aporte-ingreso";

export interface ProximoPago {
  id: string;
  tipo: TipoProximoPago;
  nombre: string;
  monto: number;
  moneda: string;
  diaPago: number;
  diasRestantes: number;
  fechaPago: string;
  urgente: boolean;
  esHoy: boolean;
  etiquetaTipo: string;
  href: string;
}

function fechaProximoPago(diaPago: number, desde: Date = new Date()): string {
  const dias = diasHastaPago(diaPago, desde);
  const fecha = new Date(desde);
  fecha.setHours(12, 0, 0, 0);
  fecha.setDate(fecha.getDate() + dias);
  const anio = fecha.getFullYear();
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function etiquetaTipoPago(tipo: TipoProximoPago): string {
  switch (tipo) {
    case "tarjeta":
      return "Tarjeta";
    case "prestamo":
      return "Préstamo";
    case "cuota-popular":
      return "Cuotas Popular";
    case "gasto-fijo":
      return "Gasto fijo";
    case "aporte-ingreso":
      return "Aporte";
  }
}

function hrefTipoPago(tipo: TipoProximoPago): string {
  switch (tipo) {
    case "tarjeta":
      return "/tarjetas";
    case "prestamo":
      return "/prestamos";
    case "cuota-popular":
      return "/tarjetas";
    case "gasto-fijo":
      return "/gastos";
    case "aporte-ingreso":
      return "/configuracion?seccion=diezmos";
  }
}

function crearPago(
  item: Omit<ProximoPago, "urgente" | "esHoy" | "etiquetaTipo" | "href">,
  diasAntes: number
): ProximoPago {
  const esHoy = item.diasRestantes === 0;
  const urgente = item.diasRestantes <= diasAntes;
  return {
    ...item,
    esHoy,
    urgente,
    etiquetaTipo: etiquetaTipoPago(item.tipo),
    href: hrefTipoPago(item.tipo),
  };
}

export function listarProximosPagos(
  estado: Pick<
    EstadoFinanzas,
    | "tarjetas"
    | "prestamos"
    | "cuotasPopular"
    | "gastosFijos"
    | "transacciones"
    | "configuracion"
  >,
  desde: Date = new Date(),
  limite?: number
): ProximoPago[] {
  const {
    tarjetas,
    prestamos,
    cuotasPopular,
    gastosFijos,
    transacciones,
    configuracion,
  } = estado;
  const recordatorios = obtenerRecordatoriosPagos(configuracion);
  const diasAntes = recordatorios.diasAntes;
  const pagos: ProximoPago[] = [];

  tarjetas.forEach((tarjeta) => {
    if (tarjeta.deudaActual <= 0) return;
    const diaPago = tarjeta.diaPago;
    const diasRestantes = diasHastaPago(diaPago, desde);
    pagos.push(
      crearPago(
        {
          id: `tarjeta-${tarjeta.id}`,
          tipo: "tarjeta",
          nombre: `${tarjeta.banco} · ${tarjeta.nombreTarjeta}`,
          monto: tarjeta.deudaActual,
          moneda: tarjeta.moneda,
          diaPago,
          diasRestantes,
          fechaPago: fechaProximoPago(diaPago, desde),
        },
        diasAntes
      )
    );
  });

  prestamos.forEach((prestamo) => {
    if (prestamoCompletado(prestamo)) return;
    const diaPago = prestamo.diaPago;
    const fechaPago = fechaProximoPago(diaPago, desde);
    const periodo = periodoDeFecha(fechaPago, configuracion.diasPago);
    const pendiente = montoCuotaPrestamoPendienteEnPeriodo(
      prestamo,
      transacciones,
      periodo,
      prestamo.moneda
    );
    if (pendiente <= 0) return;

    pagos.push(
      crearPago(
        {
          id: `prestamo-${prestamo.id}`,
          tipo: "prestamo",
          nombre: prestamo.entidad,
          monto: pendiente,
          moneda: prestamo.moneda,
          diaPago,
          diasRestantes: diasHastaPago(diaPago, desde),
          fechaPago,
        },
        diasAntes
      )
    );
  });

  cuotasPopular.forEach((cuota) => {
    if (cuotaPopularCompletada(cuota)) return;
    const diaPago = diaPagoCuota(cuota, tarjetas);
    const fechaPago = fechaProximoPago(diaPago, desde);
    const periodo = periodoDeFecha(fechaPago, configuracion.diasPago);
    if (cuotaPagadaEnPeriodo(cuota.id, transacciones, periodo)) return;

    pagos.push(
      crearPago(
        {
          id: `cuota-popular-${cuota.id}`,
          tipo: "cuota-popular",
          nombre: nombreCuotaPopular(cuota, tarjetas),
          monto: cuota.montoCuota,
          moneda: cuota.moneda,
          diaPago,
          diasRestantes: diasHastaPago(diaPago, desde),
          fechaPago,
        },
        diasAntes
      )
    );
  });

  gastosFijos.forEach((gasto) => {
    if (!gastoVisibleEnPresupuesto(gasto, transacciones)) return;
    const diaPago = gasto.diaPago;
    const fechaPago = fechaProximoPago(diaPago, desde);
    const periodo = periodoDeFecha(fechaPago, configuracion.diasPago);
    if (!gastoAplicaEnPeriodo(gasto, periodo, transacciones)) return;

    const pendiente = montoPendienteGastoFijoEnPeriodo(
      gasto,
      transacciones,
      periodo,
      gasto.moneda
    );
    if (pendiente <= 0) return;

    pagos.push(
      crearPago(
        {
          id: `gasto-fijo-${gasto.id}`,
          tipo: "gasto-fijo",
          nombre: gasto.nombre,
          monto: pendiente,
          moneda: gasto.moneda,
          diaPago,
          diasRestantes: diasHastaPago(diaPago, desde),
          fechaPago,
        },
        diasAntes
      )
    );
  });

  const aporte = obtenerAporteIngreso(configuracion);
  if (aporte) {
    for (const quincena of aporte.quincenas) {
      const diaPago = diaPagoAporteEnQuincena(aporte, quincena);
      const fechaPago = fechaProximoPago(diaPago, desde);
      const periodo = periodoDeFecha(fechaPago, configuracion.diasPago);
      const pendiente = montoPendienteAporteEnPeriodo(
        transacciones,
        aporte,
        periodo
      );
      if (pendiente <= 0) continue;

      const { monto } = calcularMontoAporteSugerido(
        transacciones,
        aporte,
        periodo
      );

      pagos.push(
        crearPago(
          {
            id: `aporte-ingreso-q${quincena}`,
            tipo: "aporte-ingreso",
            nombre: aporte.nombre,
            monto: monto > 0 ? monto : pendiente,
            moneda: aporte.moneda,
            diaPago,
            diasRestantes: diasHastaPago(diaPago, desde),
            fechaPago,
          },
          diasAntes
        )
      );
    }
  }

  const ordenados = pagos.sort((a, b) => {
    if (a.diasRestantes !== b.diasRestantes) {
      return a.diasRestantes - b.diasRestantes;
    }
    return a.nombre.localeCompare(b.nombre, "es");
  });

  return limite != null ? ordenados.slice(0, limite) : ordenados;
}

export function pagosUrgentes(
  pagos: ProximoPago[],
  diasAntes: number
): ProximoPago[] {
  return pagos.filter((p) => p.diasRestantes <= diasAntes);
}

/** Compatibilidad con la función anterior en calculos.ts */
export function obtenerProximosPagos(
  tarjetas: TarjetaCredito[],
  prestamos: Prestamo[],
  cuotasPopular: CuotaPopular[],
  gastosFijos: GastoFijo[],
  desde: Date = new Date(),
  transacciones: Transaccion[] = [],
  configuracion?: ConfiguracionUsuario
): {
  tipo: TipoProximoPago;
  nombre: string;
  monto: number;
  dia: number;
}[] {
  const lista = listarProximosPagos(
    {
      tarjetas,
      prestamos,
      cuotasPopular,
      gastosFijos,
      transacciones,
      configuracion: configuracion ?? {
        diasPago: [15, 30],
        moneda: "DOP",
        tema: "claro",
        categoriasGastosFijos: [],
        categoriasGasto: [],
        categoriasIngreso: [],
      },
    },
    desde
  );

  return lista.map((p) => ({
    tipo: p.tipo,
    nombre: p.nombre,
    monto: p.monto,
    dia: p.diaPago,
  }));
}

export function etiquetaDiasRestantes(pago: ProximoPago): string {
  if (pago.esHoy) return "¡Hoy!";
  if (pago.diasRestantes === 1) return "Mañana";
  return `En ${pago.diasRestantes} días`;
}

export function fechaHoyRecordatorio(): string {
  return fechaHoy();
}
