import type {
  ConfiguracionUsuario,
  CuentaBancaria,
  GastoFijo,
  OrigenFondo,
  TarjetaCredito,
  Transaccion,
} from "@/types/finanzas";
import type {
  MovimientoBancoPendiente,
  ResumenEnriquecimientoImportacion,
} from "@/types/importacion-banco";
import { aplicarSugerenciaGastoFijo } from "@/lib/importacion-banco/gastos-fijos-match";
import { aplicarSugerenciaTransferencia } from "@/lib/importacion-banco/transferencias";

export interface ContextoEnriquecimientoImportacion {
  origen: OrigenFondo;
  cuentas: CuentaBancaria[];
  tarjetas: TarjetaCredito[];
  transacciones: Transaccion[];
  gastosFijos: GastoFijo[];
  configuracion: ConfiguracionUsuario;
}

export function enriquecerMovimientosImportacion(
  movimientos: MovimientoBancoPendiente[],
  ctx: ContextoEnriquecimientoImportacion
): {
  movimientos: MovimientoBancoPendiente[];
  resumen: ResumenEnriquecimientoImportacion;
} {
  const resumen: ResumenEnriquecimientoImportacion = {
    transferencias: 0,
    gastosFijos: 0,
    parejasExistentes: 0,
    categoriasAprendidas: 0,
  };

  const enriquecidos = movimientos.map((mov) => {
    let actual = { ...mov };

    actual = aplicarSugerenciaTransferencia(
      actual,
      ctx.origen,
      ctx.cuentas,
      ctx.tarjetas,
      ctx.transacciones
    );

    if (actual.tipo === "transferencia") {
      resumen.transferencias++;
      if (actual.parejaExistenteId) resumen.parejasExistentes++;
      return actual;
    }

    actual = aplicarSugerenciaGastoFijo(
      actual,
      ctx.gastosFijos,
      ctx.transacciones,
      ctx.configuracion.diasPago
    );

    if (actual.gastoFijoId) resumen.gastosFijos++;
    if (actual.aprendida) resumen.categoriasAprendidas++;

    return actual;
  });

  return { movimientos: enriquecidos, resumen };
}
