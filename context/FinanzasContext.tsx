"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ConfiguracionUsuario,
  CuotaPopular,
  CuentaBancaria,
  EstadoFinanzas,
  GastoFijo,
  OrigenFondo,
  PlanCuotasPopularNuevo,
  Prestamo,
  TarjetaCredito,
  Transaccion,
} from "@/types/finanzas";
import { fechaHoy } from "@/lib/fechas";
import { asignarQuincena } from "@/lib/quincenas";
import { disponibleLimiteCuotasPopular } from "@/lib/cuotas-popular";
import { aplicarEfectoTransaccion, origenPorDefectoPago } from "@/lib/transacciones";
import { aplicarTema } from "@/lib/tema";
import { cargarEstado, generarId, guardarEstado, normalizarEstado } from "@/lib/storage";

interface FinanzasContextValue extends EstadoFinanzas {
  cargado: boolean;
  agregarTransaccion: (
    datos: Omit<Transaccion, "id" | "quincena" | "modoPagoTarjeta" | "cuotaPopularId">,
    planCuotasPopular?: PlanCuotasPopularNuevo
  ) => void;
  eliminarTransaccion: (id: string) => void;
  agregarTarjeta: (datos: Omit<TarjetaCredito, "id">) => void;
  actualizarTarjeta: (id: string, datos: Partial<TarjetaCredito>) => void;
  eliminarTarjeta: (id: string) => void;
  agregarPrestamo: (datos: Omit<Prestamo, "id">) => void;
  actualizarPrestamo: (id: string, datos: Partial<Prestamo>) => void;
  registrarCuotaPrestamo: (id: string) => void;
  eliminarPrestamo: (id: string) => void;
  agregarCuotaPopular: (datos: Omit<CuotaPopular, "id">) => void;
  actualizarCuotaPopular: (id: string, datos: Partial<CuotaPopular>) => void;
  registrarCuotaPopularPagada: (id: string, origen?: OrigenFondo) => void;
  eliminarCuotaPopular: (id: string) => void;
  agregarGastoFijo: (datos: Omit<GastoFijo, "id">) => void;
  actualizarGastoFijo: (id: string, datos: Partial<GastoFijo>) => void;
  eliminarGastoFijo: (id: string) => void;
  agregarCuenta: (datos: Omit<CuentaBancaria, "id">) => void;
  actualizarCuenta: (id: string, datos: Partial<CuentaBancaria>) => void;
  eliminarCuenta: (id: string) => void;
  actualizarEfectivo: (monto: number) => void;
  actualizarConfiguracion: (config: Partial<ConfiguracionUsuario>) => void;
  importarEstado: (estado: EstadoFinanzas) => void;
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

  function estadoInicial(): EstadoFinanzas {
    return cargarEstado(usuarioId);
  }

  useEffect(() => {
    setCargado(false);
    const datos = cargarEstado(usuarioId);
    setEstado(datos);
    aplicarTema(datos.configuracion.tema ?? "claro");
    setCargado(true);
  }, [usuarioId]);

  useEffect(() => {
    if (cargado) guardarEstado(estado, usuarioId);
  }, [estado, cargado, usuarioId]);

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
        return {
          ...conSaldos,
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

      return {
        ...sinEfecto,
        cuotasPopular,
        transacciones: prev.transacciones.filter((t) => t.id !== id),
      };
    });
  }, []);

  const agregarTarjeta = useCallback((datos: Omit<TarjetaCredito, "id">) => {
    setEstado((prev) => ({
      ...prev,
      tarjetas: [...prev.tarjetas, { ...datos, id: generarId() }],
    }));
  }, []);

  const actualizarTarjeta = useCallback(
    (id: string, datos: Partial<TarjetaCredito>) => {
      setEstado((prev) => ({
        ...prev,
        tarjetas: prev.tarjetas.map((t) =>
          t.id === id ? { ...t, ...datos } : t
        ),
      }));
    },
    []
  );

  const eliminarTarjeta = useCallback((id: string) => {
    setEstado((prev) => ({
      ...prev,
      tarjetas: prev.tarjetas.filter((t) => t.id !== id),
      cuotasPopular: prev.cuotasPopular.filter((c) => c.tarjetaId !== id),
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

  const registrarCuotaPrestamo = useCallback((id: string) => {
    setEstado((prev) => ({
      ...prev,
      prestamos: prev.prestamos.map((p) => {
        if (p.id !== id) return p;
        if (p.cuotasPagadas >= p.cuotasTotales) return p;
        return { ...p, cuotasPagadas: p.cuotasPagadas + 1 };
      }),
    }));
  }, []);

  const eliminarPrestamo = useCallback((id: string) => {
    setEstado((prev) => ({
      ...prev,
      prestamos: prev.prestamos.filter((p) => p.id !== id),
    }));
  }, []);

  const agregarCuotaPopular = useCallback((datos: Omit<CuotaPopular, "id">) => {
    setEstado((prev) => ({
      ...prev,
      cuotasPopular: [...prev.cuotasPopular, { ...datos, id: generarId() }],
    }));
  }, []);

  const actualizarCuotaPopular = useCallback(
    (id: string, datos: Partial<CuotaPopular>) => {
      setEstado((prev) => ({
        ...prev,
        cuotasPopular: prev.cuotasPopular.map((c) =>
          c.id === id ? { ...c, ...datos } : c
        ),
      }));
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
    }));
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
        const nuevaConfig = { ...prev.configuracion, ...config };
        if (config.tema) aplicarTema(config.tema);
        return {
          ...prev,
          configuracion: nuevaConfig,
        };
      });
    },
    []
  );

  const importarEstado = useCallback((nuevo: EstadoFinanzas) => {
    const normalizado = normalizarEstado(nuevo);
    aplicarTema(normalizado.configuracion.tema ?? "claro");
    setEstado(normalizado);
  }, []);

  const value = useMemo(
    () => ({
      ...estado,
      cargado,
      agregarTransaccion,
      eliminarTransaccion,
      agregarTarjeta,
      actualizarTarjeta,
      eliminarTarjeta,
      agregarPrestamo,
      actualizarPrestamo,
      registrarCuotaPrestamo,
      eliminarPrestamo,
      agregarCuotaPopular,
      actualizarCuotaPopular,
      registrarCuotaPopularPagada,
      eliminarCuotaPopular,
      agregarGastoFijo,
      actualizarGastoFijo,
      eliminarGastoFijo,
      agregarCuenta,
      actualizarCuenta,
      eliminarCuenta,
      actualizarEfectivo,
      actualizarConfiguracion,
      importarEstado,
    }),
    [
      estado,
      cargado,
      agregarTransaccion,
      eliminarTransaccion,
      agregarTarjeta,
      actualizarTarjeta,
      eliminarTarjeta,
      agregarPrestamo,
      actualizarPrestamo,
      registrarCuotaPrestamo,
      eliminarPrestamo,
      agregarCuotaPopular,
      actualizarCuotaPopular,
      registrarCuotaPopularPagada,
      eliminarCuotaPopular,
      agregarGastoFijo,
      actualizarGastoFijo,
      eliminarGastoFijo,
      agregarCuenta,
      actualizarCuenta,
      eliminarCuenta,
      actualizarEfectivo,
      actualizarConfiguracion,
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
