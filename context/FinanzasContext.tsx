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
import { CATEGORIA_PAGO_TARJETA } from "@/types/finanzas";
import { fechaHoy } from "@/lib/fechas";
import { asignarQuincena } from "@/lib/quincenas";
import { disponibleLimiteCuotasPopular } from "@/lib/cuotas-popular";
import { aplicarEfectoTransaccion, origenPorDefectoPago } from "@/lib/transacciones";
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
  agregarCategoriaIngreso: (nombre: string) => void;
  renombrarCategoriaIngreso: (anterior: string, nuevo: string) => void;
  eliminarCategoriaIngreso: (nombre: string) => void;
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

  useEffect(() => {
    let cancelado = false;
    setCargado(false);

    void cargarEstado(usuarioId).then((datos) => {
      if (cancelado) return;
      setEstado(datos);
      aplicarTema(datos.configuracion.tema ?? "claro");
      setCargado(true);
    });

    return () => {
      cancelado = true;
    };
  }, [usuarioId]);

  useEffect(() => {
    if (!cargado) return;

    const timer = window.setTimeout(() => {
      void guardarEstado(estado, usuarioId);
    }, 500);

    return () => window.clearTimeout(timer);
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

      return {
        ...sinEfecto,
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
        if (!gasto || !gasto.activo) return prev;

        const tarjeta = prev.tarjetas.find((t) => t.moneda === gasto.moneda);
        const cuenta = prev.cuentas.find((c) => c.moneda === gasto.moneda);
        let origen;
        if (tarjeta) {
          origen = { tipo: "tarjeta" as const, id: tarjeta.id };
        } else if (cuenta) {
          origen = { tipo: "cuenta" as const, id: cuenta.id };
        } else if (gasto.moneda === prev.configuracion.moneda) {
          origen = origenPorDefectoPago(prev.cuentas, gasto.moneda);
        } else {
          return prev;
        }

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
        return {
          ...conSaldos,
          transacciones: [transaccion, ...prev.transacciones],
        };
      });
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
      return {
        ...prev,
        configuracion: {
          ...prev.configuracion,
          categoriasGasto: [...cats, limpio],
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
      return {
        ...prev,
        configuracion: {
          ...prev.configuracion,
          categoriasGasto: cats.map((c) => (c === anterior ? limpio : c)),
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
      const fallback = cats.find((c) => c !== nombre) ?? "Otros";
      return {
        ...prev,
        configuracion: {
          ...prev.configuracion,
          categoriasGasto: cats.filter((c) => c !== nombre),
        },
        transacciones: prev.transacciones.map((t) =>
          t.tipo === "gasto" && t.categoria === nombre
            ? { ...t, categoria: fallback }
            : t
        ),
      };
    });
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
    setEstado(normalizado);
  }, []);

  const value = useMemo(
    () => ({
      ...estado,
      cargado,
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
      agregarCuotaPopular,
      actualizarCuotaPopular,
      registrarCuotaPopularPagada,
      eliminarCuotaPopular,
      agregarGastoFijo,
      actualizarGastoFijo,
      eliminarGastoFijo,
      registrarPagoGastoFijo,
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
      agregarCategoriaIngreso,
      renombrarCategoriaIngreso,
      eliminarCategoriaIngreso,
      importarEstado,
    }),
    [
      estado,
      cargado,
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
      agregarCuotaPopular,
      actualizarCuotaPopular,
      registrarCuotaPopularPagada,
      eliminarCuotaPopular,
      agregarGastoFijo,
      actualizarGastoFijo,
      eliminarGastoFijo,
      registrarPagoGastoFijo,
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
