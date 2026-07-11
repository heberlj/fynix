import type {
  ConfiguracionUsuario,
  CuotaPopular,
  CuentaBancaria,
  GastoFijo,
  ItemSugerenciaPago,
  PeriodoQuincena,
  Prestamo,
  ProyeccionProximoIngreso,
  ResultadoSugerencias,
  TarjetaCredito,
  Transaccion,
} from "@/types/finanzas";
import {
  calcularResumenQuincena,
  obtenerCuotasPopularDetalle,
  obtenerCuotasPrestamosDetalle,
  obtenerGastosFijosDetalle,
  obtenerPagosTarjetasDetalle,
} from "@/lib/calculos";
import { totalCuentasPorMoneda } from "@/lib/cuentas";
import { diasHastaPago } from "@/lib/tarjetas";
import { diasHastaCuota } from "@/lib/prestamos";
import {
  obtenerQuincenaActual,
  obtenerQuincenaAnterior,
  obtenerQuincenaSiguiente,
} from "@/lib/quincenas";

function redondear(n: number): number {
  return Math.round(n * 100) / 100;
}

export function liquidezEnMoneda(
  cuentas: CuentaBancaria[],
  efectivo: number,
  moneda: string
): number {
  const mapa = totalCuentasPorMoneda(cuentas);
  return redondear((mapa.get(moneda) ?? 0) + efectivo);
}

export function periodoProximoIngreso(
  configuracion: ConfiguracionUsuario
): PeriodoQuincena {
  const actual = obtenerQuincenaActual(configuracion);
  return obtenerQuincenaSiguiente(actual, configuracion.diasPago);
}

export function estimarIngresoQuincena(
  transacciones: Transaccion[],
  tarjetas: TarjetaCredito[],
  prestamos: Prestamo[],
  cuotasPopular: CuotaPopular[],
  gastosFijos: GastoFijo[],
  periodoObjetivo: PeriodoQuincena,
  configuracion: ConfiguracionUsuario,
  ingresoManual?: number | null
): number {
  const moneda = configuracion.moneda;
  if (ingresoManual != null && ingresoManual > 0) {
    return ingresoManual;
  }

  let cursor = obtenerQuincenaActual(configuracion);
  const montos: number[] = [];

  for (let i = 0; i < 8 && montos.length < 4; i++) {
    if (cursor.quincena === periodoObjetivo.quincena) {
      const resumen = calcularResumenQuincena(
        transacciones,
        tarjetas,
        prestamos,
        cuotasPopular,
        gastosFijos,
        cursor,
        moneda
      );
      if (resumen.ingresosTotales > 0) {
        montos.push(resumen.ingresosTotales);
      }
    }
    cursor = obtenerQuincenaAnterior(cursor, configuracion.diasPago);
  }

  if (montos.length === 0) {
    const ingresos = transacciones
      .filter((t) => t.tipo === "ingreso" && t.moneda === moneda)
      .slice(0, 6);
    if (ingresos.length === 0) return 0;
    const suma = ingresos.reduce((s, t) => s + t.monto, 0);
    return redondear(suma / ingresos.length);
  }

  return redondear(montos.reduce((a, b) => a + b, 0) / montos.length);
}

export function estimarGastosVariables(
  transacciones: Transaccion[],
  tarjetas: TarjetaCredito[],
  prestamos: Prestamo[],
  cuotasPopular: CuotaPopular[],
  gastosFijos: GastoFijo[],
  periodoObjetivo: PeriodoQuincena,
  configuracion: ConfiguracionUsuario
): number {
  const moneda = configuracion.moneda;
  let cursor = obtenerQuincenaActual(configuracion);
  const montos: number[] = [];

  for (let i = 0; i < 8 && montos.length < 4; i++) {
    if (cursor.quincena === periodoObjetivo.quincena) {
      const resumen = calcularResumenQuincena(
        transacciones,
        tarjetas,
        prestamos,
        cuotasPopular,
        gastosFijos,
        cursor,
        moneda
      );
      const variables = Math.max(
        0,
        resumen.gastosTotales -
          (resumen.pagosTarjetas +
            resumen.cuotasPrestamos +
            resumen.cuotasPopular +
            resumen.gastosFijos)
      );
      if (variables > 0) montos.push(variables);
    }
    cursor = obtenerQuincenaAnterior(cursor, configuracion.diasPago);
  }

  if (montos.length === 0) return 0;
  return redondear(montos.reduce((a, b) => a + b, 0) / montos.length);
}

function puntuacionGastoFijo(gasto: GastoFijo, dias: number): number {
  let score = gasto.tipoPresupuesto === "esencial" ? 92 : 35;
  if (dias <= 3) score += 10;
  else if (dias <= 7) score += 5;
  return Math.min(100, score);
}

function puntuacionTarjeta(tarjeta: TarjetaCredito, dias: number): number {
  const uso = tarjeta.limite > 0 ? tarjeta.deudaActual / tarjeta.limite : 1;
  let score = 55;
  if (dias <= 3) score = 95;
  else if (dias <= 7) score = 80;
  else if (dias <= 14) score = 65;
  if (uso >= 0.9) score += 15;
  else if (uso >= 0.7) score += 8;
  return Math.min(100, score);
}

function puntuacionPrestamo(dias: number): number {
  if (dias <= 3) return 98;
  if (dias <= 7) return 88;
  return 78;
}

function puntuacionCuotaPopular(dias: number): number {
  if (dias <= 3) return 90;
  if (dias <= 7) return 82;
  return 72;
}

function razonPrioridad(
  prioridad: ItemSugerenciaPago["prioridad"],
  tipo: ItemSugerenciaPago["tipo"],
  tipoPresupuesto?: ItemSugerenciaPago["tipoPresupuesto"]
): string {
  if (prioridad === "pagar") {
    if (tipo === "tarjeta") return "Evita intereses y protege tu historial crediticio";
    if (tipo === "prestamo") return "Cuota contractual; prioridad alta para no caer en mora";
    if (tipo === "cuota-popular") return "Compromiso activo en tu plan de cuotas";
    if (tipo === "gasto-fijo" && tipoPresupuesto === "esencial") {
      return "Marcado como esencial para tu presupuesto";
    }
    return "Cabe en tu presupuesto con el próximo ingreso";
  }
  if (prioridad === "posponer") {
    if (tipo === "gasto-fijo" && tipoPresupuesto === "esencial") {
      return "Esencial, pero puedes cubrirlo después de lo más urgente";
    }
    return "Importante, pero puedes cubrirlo después de lo urgente";
  }
  if (tipo === "gasto-fijo") {
    return "Marcado como flexible; pospón si el presupuesto está ajustado";
  }
  return "Gasto flexible; pospón si el presupuesto está ajustado";
}

export function recolectarObligaciones(
  tarjetas: TarjetaCredito[],
  prestamos: Prestamo[],
  cuotasPopular: CuotaPopular[],
  gastosFijos: GastoFijo[],
  transacciones: Transaccion[],
  periodo: PeriodoQuincena,
  moneda: string
): Omit<ItemSugerenciaPago, "prioridad" | "razon">[] {
  const items: Omit<ItemSugerenciaPago, "prioridad" | "razon">[] = [];

  obtenerPagosTarjetasDetalle(tarjetas, periodo)
    .filter((p) => p.moneda === moneda)
    .forEach((p) => {
      const tarjeta = tarjetas.find(
        (t) => `${t.banco} · ${t.nombreTarjeta}` === p.nombre
      );
      const dias = diasHastaPago(p.dia);
      items.push({
        id: `tarjeta-${p.nombre}`,
        tipo: "tarjeta",
        nombre: p.nombre,
        monto: p.monto,
        moneda: p.moneda,
        diaPago: p.dia,
        diasRestantes: dias,
        puntuacion: tarjeta
          ? puntuacionTarjeta(tarjeta, dias)
          : puntuacionTarjeta(
              { limite: 1, deudaActual: 1 } as TarjetaCredito,
              dias
            ),
      });
    });

  obtenerCuotasPrestamosDetalle(prestamos, periodo)
    .filter((p) => p.moneda === moneda)
    .forEach((p, i) => {
      const dias = diasHastaCuota(p.dia);
      items.push({
        id: `prestamo-${i}-${p.nombre}`,
        tipo: "prestamo",
        nombre: p.nombre,
        monto: p.monto,
        moneda: p.moneda,
        diaPago: p.dia,
        diasRestantes: dias,
        puntuacion: puntuacionPrestamo(dias),
      });
    });

  obtenerCuotasPopularDetalle(cuotasPopular, tarjetas, periodo, transacciones)
    .filter((p) => p.moneda === moneda)
    .forEach((p, i) => {
      const dias = diasHastaCuota(p.dia);
      items.push({
        id: `cp-${i}-${p.nombre}`,
        tipo: "cuota-popular",
        nombre: p.nombre,
        monto: p.monto,
        moneda: p.moneda,
        diaPago: p.dia,
        diasRestantes: dias,
        puntuacion: puntuacionCuotaPopular(dias),
      });
    });

  obtenerGastosFijosDetalle(gastosFijos, periodo)
    .filter((p) => p.moneda === moneda)
    .forEach((p) => {
      const gasto = gastosFijos.find((g) => g.nombre === p.nombre);
      const dias = diasHastaCuota(p.dia);
      const categoria = gasto?.categoria ?? p.categoria;
      const tipoPresupuesto = gasto?.tipoPresupuesto ?? "flexible";
      items.push({
        id: `gf-${p.nombre}`,
        tipo: "gasto-fijo",
        nombre: p.nombre,
        monto: p.monto,
        moneda: p.moneda,
        diaPago: p.dia,
        diasRestantes: dias,
        puntuacion: gasto
          ? puntuacionGastoFijo(gasto, dias)
          : puntuacionGastoFijo(
              {
                categoria: p.categoria,
                tipoPresupuesto,
              } as GastoFijo,
              dias
            ),
        categoria,
        tipoPresupuesto,
      });
    });

  return items.sort((a, b) => {
    if (b.puntuacion !== a.puntuacion) return b.puntuacion - a.puntuacion;
    return a.diasRestantes - b.diasRestantes;
  });
}

export function generarSugerencias(
  tarjetas: TarjetaCredito[],
  prestamos: Prestamo[],
  cuotasPopular: CuotaPopular[],
  gastosFijos: GastoFijo[],
  transacciones: Transaccion[],
  cuentas: CuentaBancaria[],
  efectivo: number,
  configuracion: ConfiguracionUsuario,
  ingresoManual?: number | null
): ResultadoSugerencias {
  const moneda = configuracion.moneda;
  const periodo = periodoProximoIngreso(configuracion);
  const liquidez = liquidezEnMoneda(cuentas, efectivo, moneda);
  const ingresoEstimado = estimarIngresoQuincena(
    transacciones,
    tarjetas,
    prestamos,
    cuotasPopular,
    gastosFijos,
    periodo,
    configuracion,
    ingresoManual
  );

  const reservaSugerida = redondear(
    Math.max(liquidez * 0.1, ingresoEstimado * 0.05, 0)
  );
  const presupuestoAsignable = redondear(
    Math.max(0, liquidez + ingresoEstimado - reservaSugerida)
  );

  const base = recolectarObligaciones(
    tarjetas,
    prestamos,
    cuotasPopular,
    gastosFijos,
    transacciones,
    periodo,
    moneda
  );

  let restante = presupuestoAsignable;
  const items: ItemSugerenciaPago[] = base.map((item) => {
    let prioridad: ItemSugerenciaPago["prioridad"];

    if (item.puntuacion >= 75 && restante >= item.monto) {
      prioridad = "pagar";
      restante = redondear(restante - item.monto);
    } else if (item.puntuacion >= 50 && restante >= item.monto) {
      prioridad = "pagar";
      restante = redondear(restante - item.monto);
    } else if (item.puntuacion >= 40) {
      prioridad = "posponer";
    } else {
      prioridad = "evitar";
    }

    if (item.diasRestantes <= 2 && item.puntuacion >= 60 && prioridad !== "pagar") {
      if (restante >= item.monto) {
        prioridad = "pagar";
        restante = redondear(restante - item.monto);
      } else {
        prioridad = "posponer";
      }
    }

    return {
      ...item,
      prioridad,
      razon: razonPrioridad(prioridad, item.tipo, item.tipoPresupuesto),
    };
  });

  const totalPagar = items
    .filter((i) => i.prioridad === "pagar")
    .reduce((s, i) => s + i.monto, 0);
  const totalPosponer = items
    .filter((i) => i.prioridad === "posponer")
    .reduce((s, i) => s + i.monto, 0);
  const totalEvitar = items
    .filter((i) => i.prioridad === "evitar")
    .reduce((s, i) => s + i.monto, 0);

  let resumen: string;
  if (items.length === 0) {
    resumen =
      "No hay compromisos en la próxima quincena. Buen momento para ahorrar o adelantar pagos.";
  } else if (totalPagar === items.reduce((s, i) => s + i.monto, 0)) {
    resumen =
      "Con tu liquidez y el próximo ingreso puedes cubrir todos los compromisos de la quincena.";
  } else if (presupuestoAsignable < totalPagar + totalPosponer) {
    resumen = `Presupuesto ajustado: prioriza ${items.filter((i) => i.prioridad === "pagar").length} pagos urgentes y pospón lo flexible.`;
  } else {
    resumen =
      "Paga lo marcado en verde, evalúa lo amarillo y evita lo rojo hasta el siguiente ingreso.";
  }

  return {
    items,
    totalPagar: redondear(totalPagar),
    totalPosponer: redondear(totalPosponer),
    totalEvitar: redondear(totalEvitar),
    liquidez,
    ingresoEstimado,
    presupuestoAsignable,
    resumen,
    moneda,
  };
}

export function calcularProyeccionProximoIngreso(
  transacciones: Transaccion[],
  tarjetas: TarjetaCredito[],
  prestamos: Prestamo[],
  cuotasPopular: CuotaPopular[],
  gastosFijos: GastoFijo[],
  cuentas: CuentaBancaria[],
  efectivo: number,
  configuracion: ConfiguracionUsuario,
  ingresoManual?: number | null
): ProyeccionProximoIngreso {
  const moneda = configuracion.moneda;
  const periodo = periodoProximoIngreso(configuracion);
  const ingresoEstimado = estimarIngresoQuincena(
    transacciones,
    tarjetas,
    prestamos,
    cuotasPopular,
    gastosFijos,
    periodo,
    configuracion,
    ingresoManual
  );
  const resumen = calcularResumenQuincena(
    transacciones,
    tarjetas,
    prestamos,
    cuotasPopular,
    gastosFijos,
    periodo,
    moneda
  );
  const compromisos =
    resumen.pagosTarjetas +
    resumen.cuotasPrestamos +
    resumen.cuotasPopular +
    resumen.gastosFijos;
  const gastosVariablesEstimados = estimarGastosVariables(
    transacciones,
    tarjetas,
    prestamos,
    cuotasPopular,
    gastosFijos,
    periodo,
    configuracion
  );
  const liquidezActual = liquidezEnMoneda(cuentas, efectivo, moneda);
  const fondoTotal = redondear(liquidezActual + ingresoEstimado);
  const reservaSugerida = redondear(
    Math.max(liquidezActual * 0.1, ingresoEstimado * 0.05, 0)
  );
  const disponibleProyectado = redondear(
    fondoTotal - reservaSugerida - compromisos - gastosVariablesEstimados
  );

  return {
    periodo,
    ingresoEstimado,
    compromisos: redondear(compromisos),
    gastosVariablesEstimados,
    liquidezActual,
    fondoTotal,
    reservaSugerida,
    disponibleProyectado,
    moneda,
  };
}
