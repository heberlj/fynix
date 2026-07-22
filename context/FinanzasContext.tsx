"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  ConfiguracionUsuario,
  CuotaPopular,
  CuentaBancaria,
  EstadoFinanzas,
  GastoFijo,
  MetaAhorro,
  OrigenFondo,
  PlanCuotasPopularNuevo,
  Prestamo,
  TarjetaCredito,
  Transaccion,
} from "@/types/finanzas";
import { CATEGORIA_PAGO_TARJETA } from "@/types/finanzas";
import { fechaHoy, mesActual } from "@/lib/fechas";
import { asignarQuincena, obtenerQuincenasDelMes } from "@/lib/quincenas";
import { disponibleLimiteCuotasPopular } from "@/lib/cuotas-popular";
import {
  eliminarGastosFijosDeTarjeta,
  obtenerFinanciamientoTarjeta,
  sincronizarGastoFijoFinanciamiento,
} from "@/lib/financiamiento-cuotas";
import { aplicarEfectoTransaccion, origenPorDefectoPago } from "@/lib/transacciones";
import {
  esGastoUnico,
  gastoFijoPagable,
  marcarGastoUnicoPagado,
  obtenerGastosFijosPendientesEnPeriodo,
} from "@/lib/gastos-fijos";
import { normalizarAporteIngreso } from "@/lib/aporte-ingreso";
import { colorCategoria } from "@/lib/graficos";
import { iconoDefectoParaCategoria } from "@/lib/iconos-categoria";
import { aplicarTema } from "@/lib/tema";
import { cargarEstado, estadoInicial, generarId, guardarEstado, normalizarEstado } from "@/lib/storage";

export type DatosActualizarTransaccion = Pick<
  Transaccion,
  | "descripcion"
  | "monto"
  | "categoria"
  | "fecha"
  | "moneda"
  | "origen"
  | "destino"
  | "monedaOrigen"
  | "montoOrigen"
  | "tasaCambio"
  | "gastoFijoId"
>;

interface FinanzasContextValue extends EstadoFinanzas {
  cargado: boolean;
  errorCarga: string | null;
  recargarDatos: () => Promise<void>;
  agregarTransaccion: (
    datos: Omit<Transaccion, "id" | "quincena" | "modoPagoTarjeta" | "cuotaPopularId">,
    planCuotasPopular?: PlanCuotasPopularNuevo
  ) => void;
  eliminarTransaccion: (id: string) => void;
  actualizarTransaccion: (id: string, datos: DatosActualizarTransaccion) => void;
  agregarTarjeta: (datos: Omit<TarjetaCredito, "id">) => void;
  actualizarTarjeta: (id: string, datos: Partial<TarjetaCredito>) => void;
  eliminarTarjeta: (id: string) => void;
  agregarPrestamo: (datos: Omit<Prestamo, "id">) => void;
  actualizarPrestamo: (id: string, datos: Partial<Prestamo>) => void;
  registrarCuotaPrestamo: (id: string) => void;
  registrarPagoPrestamo: (prestamoId: string, fecha?: string) => void;
  eliminarPrestamo: (id: string) => void;
  agregarMetaAhorro: (datos: Omit<MetaAhorro, "id">) => void;
  actualizarMetaAhorro: (id: string, datos: Partial<MetaAhorro>) => void;
  eliminarMetaAhorro: (id: string) => void;
  agregarCuotaPopular: (datos: Omit<CuotaPopular, "id">) => void;
  actualizarCuotaPopular: (id: string, datos: Partial<CuotaPopular>) => void;
  registrarCuotaPopularPagada: (id: string, origen?: OrigenFondo) => void;
  eliminarCuotaPopular: (id: string) => void;
  agregarGastoFijo: (datos: Omit<GastoFijo, "id">) => void;
  actualizarGastoFijo: (id: string, datos: Partial<GastoFijo>) => void;
  eliminarGastoFijo: (id: string) => void;
  registrarPagoGastoFijo: (gastoFijoId: string, fecha?: string) => void;
  registrarPagoTarjeta: (tarjetaId: string, fecha?: string) => void;
  agregarCuenta: (datos: Omit<CuentaBancaria, "id">) => void;
  actualizarCuenta: (id: string, datos: Partial<CuentaBancaria>) => void;
  eliminarCuenta: (id: string) => void;
  actualizarEfectivo: (monto: number) => void;
  actualizarConfiguracion: (config: Partial<ConfiguracionUsuario>) => void;
  agregarCategoriaGastoFijo: (nombre: string) => void;
  renombrarCategoriaGastoFijo: (anterior: string, nuevo: string) => void;
  eliminarCategoriaGastoFijo: (nombre: string) => void;
  agregarCategoriaGasto: (nombre: string) => void;
  renombrarCategoriaGasto: (anterior: string, nuevo: string) => void;
  eliminarCategoriaGasto: (nombre: string) => void;
  actualizarColorCategoriaGasto: (nombre: string, color: string) => void;
  actualizarIconoCategoriaGasto: (nombre: string, icono: string) => void;
  agregarCategoriaIngreso: (nombre: string) => void;
  renombrarCategoriaIngreso: (anterior: string, nuevo: string) => void;
  eliminarCategoriaIngreso: (nombre: string) => void;
  importarEstado: (estado: EstadoFinanzas) => void;
  registrarPagosGastosFijosEnLote: (
    quincena: 1 | 2,
    fecha?: string
  ) => ResultadoRegistroLoteGastosFijos;
}

export interface ResultadoRegistroLoteGastosFijos {
  registrados: number;
  omitidos: { nombre: string; motivo: string }[];
}

function resolverOrigenPagoGastoFijo(
  estado: EstadoFinanzas,
  gasto: GastoFijo
): OrigenFondo | null {
  const tarjeta = estado.tarjetas.find((t) => t.moneda === gasto.moneda);
  if (tarjeta) {
    return { tipo: "tarjeta", id: tarjeta.id };
  }
  const cuenta = estado.cuentas.find((c) => c.moneda === gasto.moneda);
  if (cuenta) {
    return { tipo: "cuenta", id: cuenta.id };
  }
  if (gasto.moneda === estado.configuracion.moneda) {
    return origenPorDefectoPago(estado.cuentas, gasto.moneda);
  }
  return null;
}

const FinanzasContext = createContext<FinanzasContextValue | null>(null);

export function FinanzasProvider({
  usuarioId,
  children,
}: {
  usuarioId: string;
  children: ReactNode;
}) {
  const [estado, setEstado] = useState<EstadoFinanzas>(estadoInicial);
  const [cargado, setCargado] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const puedePersistirRef = useRef(false);

  const recargarDatos = useCallback(async () => {
    setCargado(false);
    setErrorCarga(null);
    puedePersistirRef.current = false;

    const resultado = await cargarEstado(usuarioId);
    if (!resultado.ok) {
      setErrorCarga(resultado.error);
      setCargado(true);
      return;
    }

    setEstado(resultado.estado);
    aplicarTema(resultado.estado.configuracion.tema ?? "claro");
    puedePersistirRef.current = true;
    setCargado(true);
  }, [usuarioId]);

  useEffect(() => {
    let cancelado = false;
    setCargado(false);
    setErrorCarga(null);
    puedePersistirRef.current = false;

    void cargarEstado(usuarioId).then((resultado) => {
      if (cancelado) return;

      if (!resultado.ok) {
        setErrorCarga(resultado.error);
        setCargado(true);
        return;
      }

      setEstado(resultado.estado);
      aplicarTema(resultado.estado.configuracion.tema ?? "claro");
      puedePersistirRef.current = true;
      setCargado(true);
    });

    return () => {
      cancelado = true;
    };
  }, [usuarioId]);

  useEffect(() => {
    if (!cargado || !puedePersistirRef.current) return;

    const timer = window.setTimeout(() => {
      void guardarEstado(estado, usuarioId).then((resultado) => {
        if (!resultado.ok && resultado.error.includes("proteger")) {
          void recargarDatos();
        }
      });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [estado, cargado, usuarioId, recargarDatos]);

  const agregarTransaccion = useCallback(
    (
      datos: Omit<
        Transaccion,
        "id" | "quincena" | "modoPagoTarjeta" | "cuotaPopularId"
      >,
      planCuotasPopular?: PlanCuotasPopularNuevo
    ) => {
      setEstado((prev) => {
        const { quincena } = asignarQuincena(datos.fecha, prev.configuracion);
        const transaccionId = generarId();
        let cuotaPopularId: string | undefined;
        let modoPagoTarjeta: Transaccion["modoPagoTarjeta"];
        let cuotasPopular = prev.cuotasPopular;

        if (planCuotasPopular && datos.origen?.tipo === "tarjeta") {
          const tarjetaId = datos.origen.id;
          const tarjeta = prev.tarjetas.find((t) => t.id === tarjetaId);
          if (!tarjeta?.extensionCuotasPopular) return prev;

          const disponible = disponibleLimiteCuotasPopular(
            tarjeta,
            prev.cuotasPopular
          );
          if (datos.monto > disponible) return prev;

          const cuotaId = generarId();
          cuotaPopularId = cuotaId;
          modoPagoTarjeta = "cuotas-popular";

          const nuevaCuota: CuotaPopular = {
            id: cuotaId,
            tarjetaId: datos.origen.id,
            descripcion: datos.descripcion,
            numeroEnmascarado: planCuotasPopular.numeroEnmascarado,
            ultimosCuatro: planCuotasPopular.ultimosCuatro,
            montoCompra: datos.monto,
            montoTotal: planCuotasPopular.montoTotal,
            montoCuota: planCuotasPopular.montoCuota,
            tasaInteres: planCuotasPopular.tasaInteres,
            tipoTasa: planCuotasPopular.tipoTasa,
            cuotasTotales: planCuotasPopular.cuotasTotales,
            cuotasPagadas: 0,
            moneda: tarjeta.moneda,
            fechaInicio: datos.fecha,
            transaccionId,
          };
          cuotasPopular = [nuevaCuota, ...prev.cuotasPopular];
        } else if (datos.origen?.tipo === "tarjeta") {
          modoPagoTarjeta = "rotativo";
        }

        const transaccion: Transaccion = {
          ...datos,
          id: transaccionId,
          quincena,
          modoPagoTarjeta,
          cuotaPopularId,
        };

        const conSaldos = aplicarEfectoTransaccion(prev, transaccion, 1);

        let gastosFijos = conSaldos.gastosFijos;
        if (datos.gastoFijoId) {
          const gasto = prev.gastosFijos.find((g) => g.id === datos.gastoFijoId);
          if (gasto && esGastoUnico(gasto)) {
            gastosFijos = marcarGastoUnicoPagado(gastosFijos, gasto.id, true);
          }
        }

        return {
          ...conSaldos,
          gastosFijos,
          cuotasPopular,
          transacciones: [transaccion, ...prev.transacciones],
        };
      });
    },
    []
  );

  const eliminarTransaccion = useCallback((id: string) => {
    setEstado((prev) => {
      const transaccion = prev.transacciones.find((t) => t.id === id);
      if (!transaccion) return prev;
      const sinEfecto = aplicarEfectoTransaccion(prev, transaccion, -1);

      let cuotasPopular = prev.cuotasPopular;
      if (transaccion.cuotaPopularId) {
        cuotasPopular = cuotasPopular.filter(
          (c) => c.id !== transaccion.cuotaPopularId
        );
      } else if (transaccion.pagoCuotaPopularId) {
        cuotasPopular = cuotasPopular.map((c) => {
          if (c.id !== transaccion.pagoCuotaPopularId) return c;
          return {
            ...c,
            cuotasPagadas: Math.max(0, c.cuotasPagadas - 1),
          };
        });
      }

      let prestamos = prev.prestamos;
      if (transaccion.prestamoId) {
        prestamos = prestamos.map((p) => {
          if (p.id !== transaccion.prestamoId) return p;
          return {
            ...p,
            cuotasPagadas: Math.max(0, p.cuotasPagadas - 1),
          };
        });
      }

      let gastosFijos = sinEfecto.gastosFijos;
      if (transaccion.gastoFijoId) {
        const gasto = prev.gastosFijos.find((g) => g.id === transaccion.gastoFijoId);
        if (gasto && esGastoUnico(gasto)) {
          const quedanPagos = prev.transacciones.some(
            (t) =>
              t.id !== id &&
              t.tipo === "gasto" &&
              t.gastoFijoId === transaccion.gastoFijoId
          );
          if (!quedanPagos) {
            gastosFijos = marcarGastoUnicoPagado(
              gastosFijos,
              transaccion.gastoFijoId,
              false
            );
          }
        }
      }

      return {
        ...sinEfecto,
        gastosFijos,
        cuotasPopular,
        prestamos,
        transacciones: prev.transacciones.filter((t) => t.id !== id),
      };
    });
  }, []);

  const actualizarTransaccion = useCallback(
    (id: string, datos: DatosActualizarTransaccion) => {
      setEstado((prev) => {
        const anterior = prev.transacciones.find((t) => t.id === id);
        if (!anterior || anterior.cuotaPopularId) return prev;

        let estado = aplicarEfectoTransaccion(prev, anterior, -1);

        let cuotasPopular = prev.cuotasPopular;
        if (anterior.pagoCuotaPopularId) {
          cuotasPopular = cuotasPopular.map((c) => {
            if (c.id !== anterior.pagoCuotaPopularId) return c;
            return {
              ...c,
              cuotasPagadas: Math.max(0, c.cuotasPagadas - 1),
            };
          });
        }

        let prestamos = prev.prestamos;
        if (anterior.prestamoId) {
          prestamos = prestamos.map((p) => {
            if (p.id !== anterior.prestamoId) return p;
            return {
              ...p,
              cuotasPagadas: Math.max(0, p.cuotasPagadas - 1),
            };
          });
        }

        estado = { ...estado, cuotasPopular, prestamos };

        const fecha = datos.fecha ?? anterior.fecha;
        const { quincena } = asignarQuincena(fecha, prev.configuracion);
        const actualizada: Transaccion = {
          ...anterior,
          ...datos,
          fecha,
          quincena,
          tipo: anterior.tipo,
        };

        let conSaldos = aplicarEfectoTransaccion(estado, actualizada, 1);

        if (actualizada.pagoCuotaPopularId) {
          cuotasPopular = conSaldos.cuotasPopular.map((c) => {
            if (c.id !== actualizada.pagoCuotaPopularId) return c;
            return { ...c, cuotasPagadas: c.cuotasPagadas + 1 };
          });
        }

        if (actualizada.prestamoId) {
          prestamos = conSaldos.prestamos.map((p) => {
            if (p.id !== actualizada.prestamoId) return p;
            return { ...p, cuotasPagadas: p.cuotasPagadas + 1 };
          });
        }

        return {
          ...conSaldos,
          cuotasPopular,
          prestamos,
          transacciones: prev.transacciones.map((t) =>
            t.id === id ? actualizada : t
          ),
        };
      });
    },
    []
  );

  const agregarTarjeta = useCallback((datos: Omit<TarjetaCredito, "id">) => {
    setEstado((prev) => {
      const id = generarId();
      const tarjeta: TarjetaCredito = { ...datos, id };
      const financiamiento =
        tarjeta.financiamientoCuotas ?? obtenerFinanciamientoTarjeta(tarjeta);
      const { gastosFijos, financiamiento: finSync } =
        sincronizarGastoFijoFinanciamiento(prev, tarjeta, financiamiento);

      return {
        ...prev,
        tarjetas: [
          ...prev.tarjetas,
          { ...tarjeta, financiamientoCuotas: finSync },
        ],
        gastosFijos,
      };
    });
  }, []);

  const actualizarTarjeta = useCallback(
    (id: string, datos: Partial<TarjetaCredito>) => {
      setEstado((prev) => {
        const actual = prev.tarjetas.find((t) => t.id === id);
        if (!actual) return prev;

        const tarjeta: TarjetaCredito = { ...actual, ...datos };
        const financiamiento =
          tarjeta.financiamientoCuotas ?? obtenerFinanciamientoTarjeta(tarjeta);
        const { gastosFijos, financiamiento: finSync } =
          sincronizarGastoFijoFinanciamiento(prev, tarjeta, financiamiento);

        return {
          ...prev,
          tarjetas: prev.tarjetas.map((t) =>
            t.id === id ? { ...tarjeta, financiamientoCuotas: finSync } : t
          ),
          gastosFijos,
        };
      });
    },
    []
  );

  const eliminarTarjeta = useCallback((id: string) => {
    setEstado((prev) => ({
      ...prev,
      tarjetas: prev.tarjetas.filter((t) => t.id !== id),
      cuotasPopular: prev.cuotasPopular.filter((c) => c.tarjetaId !== id),
      gastosFijos: eliminarGastosFijosDeTarjeta(prev.gastosFijos, id),
    }));
  }, []);

  const agregarPrestamo = useCallback((datos: Omit<Prestamo, "id">) => {
    setEstado((prev) => ({
      ...prev,
      prestamos: [...prev.prestamos, { ...datos, id: generarId() }],
    }));
  }, []);

  const actualizarPrestamo = useCallback(
    (id: string, datos: Partial<Prestamo>) => {
      setEstado((prev) => ({
        ...prev,
        prestamos: prev.prestamos.map((p) =>
          p.id === id ? { ...p, ...datos } : p
        ),
      }));
    },
    []
  );

  const registrarPagoPrestamo = useCallback((prestamoId: string, fecha?: string) => {
    setEstado((prev) => {
      const prestamo = prev.prestamos.find((p) => p.id === prestamoId);
      if (!prestamo || prestamo.cuotasPagadas >= prestamo.cuotasTotales) {
        return prev;
      }

      const fechaPago = fecha ?? fechaHoy();
      const { quincena } = asignarQuincena(fechaPago, prev.configuracion);
      const numeroCuota = prestamo.cuotasPagadas + 1;
      const origen = origenPorDefectoPago(prev.cuentas, prestamo.moneda);

      const transaccion: Transaccion = {
        id: generarId(),
        descripcion: `Cuota ${numeroCuota}/${prestamo.cuotasTotales} · ${prestamo.entidad}`,
        monto: prestamo.montoCuota,
        tipo: "gasto",
        categoria: "Otros",
        fecha: fechaPago,
        quincena,
        moneda: prestamo.moneda,
        origen,
        prestamoId,
      };

      const conSaldos = aplicarEfectoTransaccion(prev, transaccion, 1);
      return {
        ...conSaldos,
        prestamos: prev.prestamos.map((p) =>
          p.id === prestamoId ? { ...p, cuotasPagadas: p.cuotasPagadas + 1 } : p
        ),
        transacciones: [transaccion, ...prev.transacciones],
      };
    });
  }, []);

  const registrarCuotaPrestamo = useCallback(
    (id: string) => {
      registrarPagoPrestamo(id);
    },
    [registrarPagoPrestamo]
  );

  const eliminarPrestamo = useCallback((id: string) => {
    setEstado((prev) => ({
      ...prev,
      prestamos: prev.prestamos.filter((p) => p.id !== id),
      transacciones: prev.transacciones.map((t) =>
        t.prestamoId === id ? { ...t, prestamoId: undefined } : t
      ),
    }));
  }, []);

  const agregarMetaAhorro = useCallback((datos: Omit<MetaAhorro, "id">) => {
    setEstado((prev) => ({
      ...prev,
      metasAhorro: [...prev.metasAhorro, { ...datos, id: generarId() }],
    }));
  }, []);

  const actualizarMetaAhorro = useCallback(
    (id: string, datos: Partial<MetaAhorro>) => {
      setEstado((prev) => ({
        ...prev,
        metasAhorro: prev.metasAhorro.map((m) =>
          m.id === id ? { ...m, ...datos } : m
        ),
      }));
    },
    []
  );

  const eliminarMetaAhorro = useCallback((id: string) => {
    setEstado((prev) => ({
      ...prev,
      metasAhorro: prev.metasAhorro.filter((m) => m.id !== id),
      transacciones: prev.transacciones.map((t) =>
        t.metaAhorroId === id ? { ...t, metaAhorroId: undefined } : t
      ),
    }));
  }, []);

  const agregarCuotaPopular = useCallback((datos: Omit<CuotaPopular, "id">) => {
    setEstado((prev) => {
      const tarjeta = prev.tarjetas.find((t) => t.id === datos.tarjetaId);
      if (!tarjeta) return prev;
      const disponible = disponibleLimiteCuotasPopular(tarjeta, prev.cuotasPopular);
      if (datos.montoCompra > disponible) return prev;
      return {
        ...prev,
        cuotasPopular: [...prev.cuotasPopular, { ...datos, id: generarId() }],
      };
    });
  }, []);

  const actualizarCuotaPopular = useCallback(
    (id: string, datos: Partial<CuotaPopular>) => {
      setEstado((prev) => {
        const cuota = prev.cuotasPopular.find((c) => c.id === id);
        if (!cuota) return prev;

        const actualizada = { ...cuota, ...datos };

        let transacciones = prev.transacciones;
        if (cuota.transaccionId) {
          transacciones = transacciones.map((t) =>
            t.id === cuota.transaccionId
              ? {
                  ...t,
                  monto: actualizada.montoCompra,
                  descripcion: actualizada.descripcion,
                  moneda: actualizada.moneda,
                }
              : t
          );
        }

        return {
          ...prev,
          cuotasPopular: prev.cuotasPopular.map((c) =>
            c.id === id ? actualizada : c
          ),
          transacciones,
        };
      });
    },
    []
  );

  const registrarCuotaPopularPagada = useCallback(
    (id: string, origen?: OrigenFondo) => {
      setEstado((prev) => {
        const cuota = prev.cuotasPopular.find((c) => c.id === id);
        if (!cuota || cuota.cuotasPagadas >= cuota.cuotasTotales) return prev;

        const fecha = fechaHoy();
        const { quincena } = asignarQuincena(fecha, prev.configuracion);
        const numeroCuota = cuota.cuotasPagadas + 1;
        const origenPago =
          origen ?? origenPorDefectoPago(prev.cuentas, cuota.moneda);

        const transaccion: Transaccion = {
          id: generarId(),
          descripcion: `Cuota ${numeroCuota}/${cuota.cuotasTotales} · ${cuota.descripcion}`,
          monto: cuota.montoCuota,
          tipo: "gasto",
          categoria: "Compras",
          fecha,
          quincena,
          moneda: cuota.moneda,
          origen: origenPago,
          pagoCuotaPopularId: cuota.id,
        };

        const conSaldos = aplicarEfectoTransaccion(prev, transaccion, 1);

        return {
          ...conSaldos,
          cuotasPopular: prev.cuotasPopular.map((c) =>
            c.id === id ? { ...c, cuotasPagadas: c.cuotasPagadas + 1 } : c
          ),
          transacciones: [transaccion, ...prev.transacciones],
        };
      });
    },
    []
  );

  const eliminarCuotaPopular = useCallback((id: string) => {
    setEstado((prev) => {
      const vinculadas = prev.transacciones.filter(
        (t) => t.cuotaPopularId === id || t.pagoCuotaPopularId === id
      );

      let estado = prev;
      for (const t of vinculadas) {
        estado = aplicarEfectoTransaccion(estado, t, -1);
      }

      return {
        ...estado,
        cuotasPopular: prev.cuotasPopular.filter((c) => c.id !== id),
        transacciones: prev.transacciones.filter(
          (t) => t.cuotaPopularId !== id && t.pagoCuotaPopularId !== id
        ),
      };
    });
  }, []);

  const agregarGastoFijo = useCallback((datos: Omit<GastoFijo, "id">) => {
    setEstado((prev) => ({
      ...prev,
      gastosFijos: [...prev.gastosFijos, { ...datos, id: generarId() }],
    }));
  }, []);

  const actualizarGastoFijo = useCallback(
    (id: string, datos: Partial<GastoFijo>) => {
      setEstado((prev) => ({
        ...prev,
        gastosFijos: prev.gastosFijos.map((g) =>
          g.id === id ? { ...g, ...datos } : g
        ),
      }));
    },
    []
  );

  const eliminarGastoFijo = useCallback((id: string) => {
    setEstado((prev) => ({
      ...prev,
      gastosFijos: prev.gastosFijos.filter((g) => g.id !== id),
      transacciones: prev.transacciones.map((t) =>
        t.gastoFijoId === id ? { ...t, gastoFijoId: undefined } : t
      ),
    }));
  }, []);

  const registrarPagoGastoFijo = useCallback(
    (gastoFijoId: string, fecha?: string) => {
      setEstado((prev) => {
        const gasto = prev.gastosFijos.find((g) => g.id === gastoFijoId);
        if (!gasto || !gastoFijoPagable(gasto)) return prev;

        const origen = resolverOrigenPagoGastoFijo(prev, gasto);
        if (!origen) return prev;

        const monedaOrigen =
          origen.tipo === "tarjeta"
            ? prev.tarjetas.find((t) => t.id === origen.id)?.moneda
            : origen.tipo === "cuenta"
              ? prev.cuentas.find((c) => c.id === origen.id)?.moneda
              : prev.configuracion.moneda;

        if (monedaOrigen !== gasto.moneda) return prev;

        const fechaPago = fecha ?? fechaHoy();
        const { quincena } = asignarQuincena(fechaPago, prev.configuracion);

        const transaccion: Transaccion = {
          id: generarId(),
          descripcion: gasto.nombre,
          monto: gasto.monto,
          tipo: "gasto",
          categoria: gasto.categoria,
          fecha: fechaPago,
          quincena,
          moneda: gasto.moneda,
          origen,
          gastoFijoId,
        };

        const conSaldos = aplicarEfectoTransaccion(prev, transaccion, 1);
        let gastosFijos = conSaldos.gastosFijos;
        if (esGastoUnico(gasto)) {
          gastosFijos = marcarGastoUnicoPagado(gastosFijos, gasto.id, true);
        }
        return {
          ...conSaldos,
          gastosFijos,
          transacciones: [transaccion, ...prev.transacciones],
        };
      });
    },
    []
  );

  const registrarPagosGastosFijosEnLote = useCallback(
    (quincena: 1 | 2, fecha?: string): ResultadoRegistroLoteGastosFijos => {
      const resultado: ResultadoRegistroLoteGastosFijos = {
        registrados: 0,
        omitidos: [],
      };

      setEstado((prev) => {
        const periodos = obtenerQuincenasDelMes(
          mesActual(),
          prev.configuracion.diasPago
        );
        const periodo =
          periodos.find((p) => p.quincena === quincena) ??
          periodos[quincena - 1];
        if (!periodo) return prev;

        const pendientes = obtenerGastosFijosPendientesEnPeriodo(
          prev.gastosFijos,
          prev.transacciones,
          periodo
        );
        if (pendientes.length === 0) return prev;

        const fechaPago = fecha ?? fechaHoy();
        const { quincena: quincenaTx } = asignarQuincena(
          fechaPago,
          prev.configuracion
        );

        let estadoActual = prev;
        const nuevasTransacciones: Transaccion[] = [];
        const omitidos: { nombre: string; motivo: string }[] = [];

        for (const { gasto, montoPendiente } of pendientes) {
          const origen = resolverOrigenPagoGastoFijo(estadoActual, gasto);
          if (!origen) {
            omitidos.push({
              nombre: gasto.nombre,
              motivo: `Sin cuenta ni tarjeta en ${gasto.moneda}`,
            });
            continue;
          }

          const monedaOrigen =
            origen.tipo === "tarjeta"
              ? estadoActual.tarjetas.find((t) => t.id === origen.id)?.moneda
              : origen.tipo === "cuenta"
                ? estadoActual.cuentas.find((c) => c.id === origen.id)?.moneda
                : estadoActual.configuracion.moneda;

          if (monedaOrigen !== gasto.moneda) {
            omitidos.push({
              nombre: gasto.nombre,
              motivo: `Origen en moneda distinta (${monedaOrigen})`,
            });
            continue;
          }

          const transaccion: Transaccion = {
            id: generarId(),
            descripcion: gasto.nombre,
            monto: montoPendiente,
            tipo: "gasto",
            categoria: gasto.categoria,
            fecha: fechaPago,
            quincena: quincenaTx,
            moneda: gasto.moneda,
            origen,
            gastoFijoId: gasto.id,
          };

          estadoActual = aplicarEfectoTransaccion(estadoActual, transaccion, 1);
          if (esGastoUnico(gasto)) {
            estadoActual = {
              ...estadoActual,
              gastosFijos: marcarGastoUnicoPagado(
                estadoActual.gastosFijos,
                gasto.id,
                true
              ),
            };
          }
          nuevasTransacciones.push(transaccion);
        }

        if (nuevasTransacciones.length === 0) {
          resultado.omitidos = omitidos;
          return prev;
        }

        resultado.registrados = nuevasTransacciones.length;
        resultado.omitidos = omitidos;

        return {
          ...estadoActual,
          transacciones: [...nuevasTransacciones, ...prev.transacciones],
        };
      });

      return resultado;
    },
    []
  );

  const registrarPagoTarjeta = useCallback((tarjetaId: string, fecha?: string) => {
    setEstado((prev) => {
      const tarjeta = prev.tarjetas.find((t) => t.id === tarjetaId);
      if (!tarjeta || tarjeta.deudaActual <= 0) return prev;

      const fechaPago = fecha ?? fechaHoy();
      const { quincena } = asignarQuincena(fechaPago, prev.configuracion);
      const origen = origenPorDefectoPago(prev.cuentas, tarjeta.moneda);

      const transaccion: Transaccion = {
        id: generarId(),
        descripcion: `Pago ${tarjeta.banco} · ${tarjeta.nombreTarjeta}`,
        monto: tarjeta.deudaActual,
        tipo: "transferencia",
        categoria: CATEGORIA_PAGO_TARJETA,
        fecha: fechaPago,
        quincena,
        moneda: tarjeta.moneda,
        origen,
        destino: { tipo: "tarjeta", id: tarjetaId },
      };

      const conSaldos = aplicarEfectoTransaccion(prev, transaccion, 1);
      return {
        ...conSaldos,
        transacciones: [transaccion, ...prev.transacciones],
      };
    });
  }, []);

  const agregarCuenta = useCallback((datos: Omit<CuentaBancaria, "id">) => {
    setEstado((prev) => ({
      ...prev,
      cuentas: [...prev.cuentas, { ...datos, id: generarId() }],
    }));
  }, []);

  const actualizarCuenta = useCallback(
    (id: string, datos: Partial<CuentaBancaria>) => {
      setEstado((prev) => ({
        ...prev,
        cuentas: prev.cuentas.map((c) =>
          c.id === id ? { ...c, ...datos } : c
        ),
      }));
    },
    []
  );

  const eliminarCuenta = useCallback((id: string) => {
    setEstado((prev) => ({
      ...prev,
      cuentas: prev.cuentas.filter((c) => c.id !== id),
    }));
  }, []);

  const actualizarEfectivo = useCallback((monto: number) => {
    setEstado((prev) => ({
      ...prev,
      efectivo: monto,
    }));
  }, []);

  const actualizarConfiguracion = useCallback(
    (config: Partial<ConfiguracionUsuario>) => {
      setEstado((prev) => {
        const merged = { ...prev.configuracion, ...config };
        const nuevaConfig = {
          ...merged,
          aporteIngreso: config.aporteIngreso
            ? normalizarAporteIngreso(config.aporteIngreso, merged)
            : merged.aporteIngreso,
        };
        if (config.tema) aplicarTema(config.tema);
        return {
          ...prev,
          configuracion: nuevaConfig,
        };
      });
    },
    []
  );

  const agregarCategoriaGastoFijo = useCallback((nombre: string) => {
    const limpio = nombre.trim();
    if (!limpio) return;
    setEstado((prev) => {
      const cats = prev.configuracion.categoriasGastosFijos ?? [];
      if (cats.some((c) => c.toLowerCase() === limpio.toLowerCase())) return prev;
      return {
        ...prev,
        configuracion: {
          ...prev.configuracion,
          categoriasGastosFijos: [...cats, limpio],
        },
      };
    });
  }, []);

  const renombrarCategoriaGastoFijo = useCallback(
    (anterior: string, nuevo: string) => {
      const limpio = nuevo.trim();
      if (!limpio || anterior === limpio) return;
      setEstado((prev) => {
        const cats = prev.configuracion.categoriasGastosFijos ?? [];
        if (
          cats.some(
            (c) => c !== anterior && c.toLowerCase() === limpio.toLowerCase()
          )
        ) {
          return prev;
        }
        return {
          ...prev,
          configuracion: {
            ...prev.configuracion,
            categoriasGastosFijos: cats.map((c) =>
              c === anterior ? limpio : c
            ),
          },
          gastosFijos: prev.gastosFijos.map((g) =>
            g.categoria === anterior ? { ...g, categoria: limpio } : g
          ),
        };
      });
    },
    []
  );

  const eliminarCategoriaGastoFijo = useCallback((nombre: string) => {
    setEstado((prev) => {
      const cats = prev.configuracion.categoriasGastosFijos ?? [];
      if (cats.length <= 1) return prev;
      const fallback = cats.find((c) => c !== nombre) ?? "Otros";
      return {
        ...prev,
        configuracion: {
          ...prev.configuracion,
          categoriasGastosFijos: cats.filter((c) => c !== nombre),
        },
        gastosFijos: prev.gastosFijos.map((g) =>
          g.categoria === nombre ? { ...g, categoria: fallback } : g
        ),
      };
    });
  }, []);

  const agregarCategoriaGasto = useCallback((nombre: string) => {
    const limpio = nombre.trim();
    if (!limpio) return;
    setEstado((prev) => {
      const cats = prev.configuracion.categoriasGasto ?? [];
      if (cats.some((c) => c.toLowerCase() === limpio.toLowerCase())) return prev;
      const colores = { ...(prev.configuracion.coloresCategoriaGasto ?? {}) };
      if (!colores[limpio]) {
        colores[limpio] = colorCategoria(cats.length);
      }
      const iconos = { ...(prev.configuracion.iconosCategoriaGasto ?? {}) };
      if (!iconos[limpio]) {
        iconos[limpio] = iconoDefectoParaCategoria(limpio);
      }
      return {
        ...prev,
        configuracion: {
          ...prev.configuracion,
          categoriasGasto: [...cats, limpio],
          coloresCategoriaGasto: colores,
          iconosCategoriaGasto: iconos,
        },
      };
    });
  }, []);

  const renombrarCategoriaGasto = useCallback((anterior: string, nuevo: string) => {
    const limpio = nuevo.trim();
    if (!limpio || anterior === limpio) return;
    setEstado((prev) => {
      const cats = prev.configuracion.categoriasGasto ?? [];
      if (
        cats.some((c) => c !== anterior && c.toLowerCase() === limpio.toLowerCase())
      ) {
        return prev;
      }
      const colores = { ...(prev.configuracion.coloresCategoriaGasto ?? {}) };
      if (colores[anterior]) {
        colores[limpio] = colores[anterior];
        delete colores[anterior];
      }
      const iconos = { ...(prev.configuracion.iconosCategoriaGasto ?? {}) };
      if (iconos[anterior]) {
        iconos[limpio] = iconos[anterior];
        delete iconos[anterior];
      }
      return {
        ...prev,
        configuracion: {
          ...prev.configuracion,
          categoriasGasto: cats.map((c) => (c === anterior ? limpio : c)),
          coloresCategoriaGasto: colores,
          iconosCategoriaGasto: iconos,
        },
        transacciones: prev.transacciones.map((t) =>
          t.tipo === "gasto" && t.categoria === anterior
            ? { ...t, categoria: limpio }
            : t
        ),
      };
    });
  }, []);

  const eliminarCategoriaGasto = useCallback((nombre: string) => {
    setEstado((prev) => {
      const cats = prev.configuracion.categoriasGasto ?? [];
      if (cats.length <= 1) return prev;
      const fallback = cats.find((c) => c !== nombre) ?? cats[0];
      const colores = { ...(prev.configuracion.coloresCategoriaGasto ?? {}) };
      delete colores[nombre];
      const iconos = { ...(prev.configuracion.iconosCategoriaGasto ?? {}) };
      delete iconos[nombre];
      return {
        ...prev,
        configuracion: {
          ...prev.configuracion,
          categoriasGasto: cats.filter((c) => c !== nombre),
          coloresCategoriaGasto: colores,
          iconosCategoriaGasto: iconos,
        },
        transacciones: prev.transacciones.map((t) =>
          t.tipo === "gasto" && t.categoria === nombre
            ? { ...t, categoria: fallback }
            : t
        ),
      };
    });
  }, []);

  const actualizarColorCategoriaGasto = useCallback((nombre: string, color: string) => {
    if (!color) return;
    setEstado((prev) => ({
      ...prev,
      configuracion: {
        ...prev.configuracion,
        coloresCategoriaGasto: {
          ...(prev.configuracion.coloresCategoriaGasto ?? {}),
          [nombre]: color,
        },
      },
    }));
  }, []);

  const actualizarIconoCategoriaGasto = useCallback((nombre: string, icono: string) => {
    if (!icono) return;
    setEstado((prev) => ({
      ...prev,
      configuracion: {
        ...prev.configuracion,
        iconosCategoriaGasto: {
          ...(prev.configuracion.iconosCategoriaGasto ?? {}),
          [nombre]: icono,
        },
      },
    }));
  }, []);

  const agregarCategoriaIngreso = useCallback((nombre: string) => {
    const limpio = nombre.trim();
    if (!limpio) return;
    setEstado((prev) => {
      const cats = prev.configuracion.categoriasIngreso ?? [];
      if (cats.some((c) => c.toLowerCase() === limpio.toLowerCase())) return prev;
      return {
        ...prev,
        configuracion: {
          ...prev.configuracion,
          categoriasIngreso: [...cats, limpio],
        },
      };
    });
  }, []);

  const renombrarCategoriaIngreso = useCallback((anterior: string, nuevo: string) => {
    const limpio = nuevo.trim();
    if (!limpio || anterior === limpio) return;
    setEstado((prev) => {
      const cats = prev.configuracion.categoriasIngreso ?? [];
      if (
        cats.some((c) => c !== anterior && c.toLowerCase() === limpio.toLowerCase())
      ) {
        return prev;
      }
      return {
        ...prev,
        configuracion: {
          ...prev.configuracion,
          categoriasIngreso: cats.map((c) => (c === anterior ? limpio : c)),
        },
        transacciones: prev.transacciones.map((t) =>
          t.tipo === "ingreso" && t.categoria === anterior
            ? { ...t, categoria: limpio }
            : t
        ),
      };
    });
  }, []);

  const eliminarCategoriaIngreso = useCallback((nombre: string) => {
    setEstado((prev) => {
      const cats = prev.configuracion.categoriasIngreso ?? [];
      if (cats.length <= 1) return prev;
      const fallback = cats.find((c) => c !== nombre) ?? "Otros";
      return {
        ...prev,
        configuracion: {
          ...prev.configuracion,
          categoriasIngreso: cats.filter((c) => c !== nombre),
        },
        transacciones: prev.transacciones.map((t) =>
          t.tipo === "ingreso" && t.categoria === nombre
            ? { ...t, categoria: fallback }
            : t
        ),
      };
    });
  }, []);

  const importarEstado = useCallback((nuevo: EstadoFinanzas) => {
    const normalizado = normalizarEstado(nuevo);
    aplicarTema(normalizado.configuracion.tema ?? "claro");
    puedePersistirRef.current = true;
    setErrorCarga(null);
    setEstado(normalizado);
  }, []);

  const value = useMemo(
    () => ({
      ...estado,
      cargado,
      errorCarga,
      recargarDatos,
      agregarTransaccion,
      eliminarTransaccion,
      actualizarTransaccion,
      agregarTarjeta,
      actualizarTarjeta,
      eliminarTarjeta,
      agregarPrestamo,
      actualizarPrestamo,
      registrarCuotaPrestamo,
      registrarPagoPrestamo,
      eliminarPrestamo,
      agregarMetaAhorro,
      actualizarMetaAhorro,
      eliminarMetaAhorro,
      agregarCuotaPopular,
      actualizarCuotaPopular,
      registrarCuotaPopularPagada,
      eliminarCuotaPopular,
      agregarGastoFijo,
      actualizarGastoFijo,
      eliminarGastoFijo,
      registrarPagoGastoFijo,
      registrarPagosGastosFijosEnLote,
      registrarPagoTarjeta,
      agregarCuenta,
      actualizarCuenta,
      eliminarCuenta,
      actualizarEfectivo,
      actualizarConfiguracion,
      agregarCategoriaGastoFijo,
      renombrarCategoriaGastoFijo,
      eliminarCategoriaGastoFijo,
      agregarCategoriaGasto,
      renombrarCategoriaGasto,
      eliminarCategoriaGasto,
      actualizarColorCategoriaGasto,
      actualizarIconoCategoriaGasto,
      agregarCategoriaIngreso,
      renombrarCategoriaIngreso,
      eliminarCategoriaIngreso,
      importarEstado,
    }),
    [
      estado,
      cargado,
      errorCarga,
      recargarDatos,
      agregarTransaccion,
      eliminarTransaccion,
      actualizarTransaccion,
      agregarTarjeta,
      actualizarTarjeta,
      eliminarTarjeta,
      agregarPrestamo,
      actualizarPrestamo,
      registrarCuotaPrestamo,
      registrarPagoPrestamo,
      eliminarPrestamo,
      agregarMetaAhorro,
      actualizarMetaAhorro,
      eliminarMetaAhorro,
      agregarCuotaPopular,
      actualizarCuotaPopular,
      registrarCuotaPopularPagada,
      eliminarCuotaPopular,
      agregarGastoFijo,
      actualizarGastoFijo,
      eliminarGastoFijo,
      registrarPagoGastoFijo,
      registrarPagosGastosFijosEnLote,
      registrarPagoTarjeta,
      agregarCuenta,
      actualizarCuenta,
      eliminarCuenta,
      actualizarEfectivo,
      actualizarConfiguracion,
      agregarCategoriaGastoFijo,
      renombrarCategoriaGastoFijo,
      eliminarCategoriaGastoFijo,
      agregarCategoriaGasto,
      renombrarCategoriaGasto,
      eliminarCategoriaGasto,
      actualizarColorCategoriaGasto,
      actualizarIconoCategoriaGasto,
      agregarCategoriaIngreso,
      renombrarCategoriaIngreso,
      eliminarCategoriaIngreso,
      importarEstado,
    ]
  );

  return (
    <FinanzasContext.Provider value={value}>{children}</FinanzasContext.Provider>
  );
}

export function useFinanzas(): FinanzasContextValue {
  const ctx = useContext(FinanzasContext);
  if (!ctx) {
    throw new Error("useFinanzas debe usarse dentro de FinanzasProvider");
  }
  return ctx;
}
