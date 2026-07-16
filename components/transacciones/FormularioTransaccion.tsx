"use client";

import { useEffect, useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import type { Transaccion } from "@/types/finanzas";
import {
  CATEGORIA_PAGO_TARJETA,
  CATEGORIA_TRANSFERENCIA_CUENTAS,
  CATEGORIAS_GASTO_DEFAULT,
} from "@/types/finanzas";
import { fechaHoy } from "@/lib/fechas";
import {
  obtenerCategoriasGasto,
  obtenerCategoriasIngreso,
} from "@/lib/categorias-transacciones";
import { SelectorCategoriaConIconos } from "@/components/ui/SelectorCategoriaConIconos";
import {
  disponibleLimiteCuotasPopular,
  tarjetaTieneCuotasPopular,
} from "@/lib/cuotas-popular";
import { decodificarOrigen, monedaDeOrigen, codificarOrigen } from "@/lib/transacciones";
import {
  calcularMontoOrigen,
  etiquetaTasaCambio,
  movimientoConCambio,
} from "@/lib/cambio";
import { formatearMoneda, periodoDeFecha } from "@/lib/quincenas";
import { numeroCuotasDesdeEntrada, validarNumeroCuotas } from "@/lib/tarjetas";
import {
  calcularMontoAporteSugerido,
  obtenerAporteIngreso,
} from "@/lib/aporte-ingreso";
import { SelectorOrigenFondo } from "@/components/ui/SelectorOrigenFondo";
import { SelectorMoneda } from "@/components/ui/SelectorMoneda";
import {
  CamposCuotasPopular,
  type ValoresCuotasPopular,
} from "@/components/transacciones/CamposCuotasPopular";

const inputClass =
  "w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none focus:border-accent sm:py-2 sm:text-sm";

const CUOTAS_INICIAL: ValoresCuotasPopular = {
  numeroReferencia: "",
  tasaInteres: "",
  tipoTasa: "anual",
  cuotasTotales: "",
  montoCuota: "",
  cuotaManual: false,
};

export function FormularioTransaccion({
  onExito,
  onCancelar,
  gastoFijoInicialId,
  aporteIngresoInicial,
  transaccion,
  enModal = false,
}: {
  onExito?: () => void;
  onCancelar?: () => void;
  gastoFijoInicialId?: string;
  aporteIngresoInicial?: boolean;
  transaccion?: Transaccion;
  enModal?: boolean;
} = {}) {
  const modoEdicion = Boolean(transaccion);
  const {
    agregarTransaccion,
    actualizarTransaccion,
    configuracion,
    tarjetas,
    cuotasPopular,
    cuentas,
    efectivo,
    gastosFijos,
    transacciones,
  } = useFinanzas();
  const [tipo, setTipo] = useState<"gasto" | "ingreso" | "transferencia">("gasto");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState(configuracion.moneda);
  const [categoria, setCategoria] = useState("");
  const [fecha, setFecha] = useState(fechaHoy());
  const [origenValor, setOrigenValor] = useState("efectivo");
  const [destinoValor, setDestinoValor] = useState("");
  const [tasaCambio, setTasaCambio] = useState("");
  const [usarCuotasPopular, setUsarCuotasPopular] = useState(false);
  const [cuotasValores, setCuotasValores] =
    useState<ValoresCuotasPopular>(CUOTAS_INICIAL);
  const [error, setError] = useState("");
  const [gastoFijoId, setGastoFijoId] = useState(gastoFijoInicialId ?? "");
  const [esPagoAporte, setEsPagoAporte] = useState(aporteIngresoInicial ?? false);

  const aporteConfig = useMemo(
    () => obtenerAporteIngreso(configuracion),
    [configuracion]
  );

  const gastosFijosActivos = useMemo(
    () => gastosFijos.filter((g) => g.activo),
    [gastosFijos]
  );

  const categoriasGasto = useMemo(
    () => obtenerCategoriasGasto(configuracion),
    [configuracion]
  );
  const categoriasIngreso = useMemo(
    () => obtenerCategoriasIngreso(configuracion),
    [configuracion]
  );

  const categorias =
    tipo === "gasto"
      ? categoriasGasto
      : tipo === "ingreso"
        ? categoriasIngreso
        : [];

  const origen = decodificarOrigen(origenValor);
  const destino = decodificarOrigen(destinoValor);
  const tarjetaSeleccionada =
    origen?.tipo === "tarjeta"
      ? tarjetas.find((t) => t.id === origen.id)
      : undefined;

  const puedeCuotasPopular =
    tipo === "gasto" &&
    tarjetaSeleccionada &&
    tarjetaTieneCuotasPopular(tarjetaSeleccionada);

  const tarjetaDestino =
    tipo === "transferencia" && destino?.tipo === "tarjeta"
      ? tarjetas.find((t) => t.id === destino.id)
      : undefined;

  const monedaOrigenTransferencia = origen
    ? monedaDeOrigen(origen, cuentas, tarjetas, configuracion.moneda)
    : configuracion.moneda;

  const monedaDestinoTransferencia = destino
    ? monedaDeOrigen(destino, cuentas, tarjetas, configuracion.moneda)
    : moneda;

  const requiereTasaCambio =
    tipo === "transferencia" &&
    Boolean(destino) &&
    movimientoConCambio(monedaOrigenTransferencia, monedaDestinoTransferencia);

  const monedaOrigenPago = origen
    ? monedaDeOrigen(origen, cuentas, tarjetas, configuracion.moneda)
    : configuracion.moneda;

  const requiereTasaCambioGastoIngreso =
    tipo !== "transferencia" &&
    Boolean(origen) &&
    movimientoConCambio(monedaOrigenPago, moneda);

  const puedeTransferir = cuentas.length >= 1 || tarjetas.length > 0;

  const montoNumerico = parseFloat(monto) || 0;
  const tasaNum = parseFloat(tasaCambio) || 0;

  const montoDebitoOrigen = useMemo(() => {
    if (!requiereTasaCambio || tasaNum <= 0) return montoNumerico;
    return calcularMontoOrigen(montoNumerico, tasaNum);
  }, [requiereTasaCambio, tasaNum, montoNumerico]);

  const montoDebitoGastoIngreso = useMemo(() => {
    if (!requiereTasaCambioGastoIngreso || tasaNum <= 0) return null;
    return calcularMontoOrigen(montoNumerico, tasaNum);
  }, [requiereTasaCambioGastoIngreso, tasaNum, montoNumerico]);

  const limiteDisponible = useMemo(() => {
    if (!tarjetaSeleccionada) return 0;
    return disponibleLimiteCuotasPopular(tarjetaSeleccionada, cuotasPopular);
  }, [tarjetaSeleccionada, cuotasPopular]);

  useEffect(() => {
    if (!transaccion) return;
    setTipo(transaccion.tipo);
    setDescripcion(transaccion.descripcion);
    setMonto(String(transaccion.monto));
    setMoneda(transaccion.moneda);
    setCategoria(transaccion.categoria);
    setFecha(transaccion.fecha);
    setOrigenValor(
      transaccion.origen ? codificarOrigen(transaccion.origen) : "efectivo"
    );
    setDestinoValor(
      transaccion.destino ? codificarOrigen(transaccion.destino) : ""
    );
    setTasaCambio(
      transaccion.tasaCambio != null ? String(transaccion.tasaCambio) : ""
    );
    setGastoFijoId(transaccion.gastoFijoId ?? "");
    setEsPagoAporte(Boolean(transaccion.aporteIngreso));
    setUsarCuotasPopular(false);
    setCuotasValores(CUOTAS_INICIAL);
    setError("");
  }, [transaccion]);

  useEffect(() => {
    if (tipo === "gasto") {
      setCategoria((actual) =>
        categoriasGasto.includes(actual)
          ? actual
          : (categoriasGasto[0] ?? CATEGORIAS_GASTO_DEFAULT[0])
      );
    } else if (tipo === "ingreso") {
      setCategoria((actual) =>
        categoriasIngreso.includes(actual)
          ? actual
          : (categoriasIngreso[0] ?? "Otros")
      );
    }
  }, [tipo, categoriasGasto, categoriasIngreso]);

  useEffect(() => {
    if (!gastoFijoInicialId) return;
    setGastoFijoId(gastoFijoInicialId);
    setTipo("gasto");
  }, [gastoFijoInicialId]);

  useEffect(() => {
    if (!aporteIngresoInicial || !aporteConfig) return;
    setEsPagoAporte(true);
    setTipo("gasto");
    setGastoFijoId("");
  }, [aporteIngresoInicial, aporteConfig]);

  useEffect(() => {
    if (!esPagoAporte || !aporteConfig || modoEdicion) return;
    setDescripcion(aporteConfig.nombre);
    setCategoria(aporteConfig.categoria);
    setMoneda(aporteConfig.moneda);
    const periodo = periodoDeFecha(fecha, configuracion.diasPago);
    const { monto: montoSugerido } = calcularMontoAporteSugerido(
      transacciones,
      aporteConfig,
      periodo
    );
    if (montoSugerido > 0) {
      setMonto(String(montoSugerido));
    }
  }, [
    esPagoAporte,
    aporteConfig,
    transacciones,
    fecha,
    configuracion.diasPago,
    modoEdicion,
  ]);

  useEffect(() => {
    if (tipo !== "gasto" || !gastoFijoId) return;
    const gasto = gastosFijos.find((g) => g.id === gastoFijoId);
    if (!gasto) return;
    setDescripcion(gasto.nombre);
    setMonto(String(gasto.monto));
    setCategoria(gasto.categoria);
    setMoneda(gasto.moneda);

    if (gastoFijoInicialId === gastoFijoId && !modoEdicion) {
      const tarjeta = tarjetas.find((t) => t.moneda === gasto.moneda);
      const cuenta = cuentas.find((c) => c.moneda === gasto.moneda);
      if (tarjeta) {
        setOrigenValor(codificarOrigen({ tipo: "tarjeta", id: tarjeta.id }));
      } else if (cuenta) {
        setOrigenValor(codificarOrigen({ tipo: "cuenta", id: cuenta.id }));
      }
    }
  }, [
    gastoFijoId,
    gastosFijos,
    tipo,
    gastoFijoInicialId,
    modoEdicion,
    tarjetas,
    cuentas,
  ]);

  function cambiarTipo(nuevoTipo: "gasto" | "ingreso" | "transferencia") {
    setTipo(nuevoTipo);
    if (nuevoTipo === "gasto") {
      setCategoria(categoriasGasto[0] ?? CATEGORIAS_GASTO_DEFAULT[0]);
    } else if (nuevoTipo === "ingreso") {
      setCategoria(categoriasIngreso[0] ?? "Otros");
    }
    setUsarCuotasPopular(false);
    setCuotasValores(CUOTAS_INICIAL);
    setDestinoValor("");
    setTasaCambio("");
    if (nuevoTipo !== "gasto") {
      setGastoFijoId("");
      setEsPagoAporte(false);
    }
  }

  function cambiarOrigen(valor: string) {
    setOrigenValor(valor);
    setUsarCuotasPopular(false);
    setCuotasValores(CUOTAS_INICIAL);
    setTasaCambio("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (modoEdicion && transaccion?.cuotaPopularId) {
      setError("No se puede editar la compra que creó un plan Cuotas Popular");
      return;
    }

    const montoNumerico = parseFloat(monto);
    if (!descripcion.trim()) {
      setError("La descripción es obligatoria");
      return;
    }
    if (!monto || isNaN(montoNumerico) || montoNumerico <= 0) {
      setError("Ingresa un monto válido mayor a 0");
      return;
    }

    const origenDecodificado = decodificarOrigen(origenValor);
    if (!origenDecodificado) {
      setError("Selecciona de dónde sale o entra el dinero");
      return;
    }

    if (tipo === "transferencia") {
      const destinoDecodificado = decodificarOrigen(destinoValor);
      if (!destinoDecodificado) {
        setError("Selecciona hacia dónde va el dinero");
        return;
      }
      if (origenDecodificado.tipo === "tarjeta") {
        setError("El origen debe ser una cuenta o efectivo");
        return;
      }
      if (origenValor === destinoValor) {
        setError("El origen y el destino deben ser distintos");
        return;
      }

      const monedaOrigen = monedaDeOrigen(
        origenDecodificado,
        cuentas,
        tarjetas,
        configuracion.moneda
      );
      const monedaDestino = monedaDeOrigen(
        destinoDecodificado,
        cuentas,
        tarjetas,
        configuracion.moneda
      );

      if (destinoDecodificado.tipo === "tarjeta") {
        const tarjeta = tarjetas.find((t) => t.id === destinoDecodificado.id);
        if (!tarjeta) {
          setError("Tarjeta de destino no encontrada");
          return;
        }
      } else if (destinoDecodificado.tipo === "cuenta") {
        const cuenta = cuentas.find((c) => c.id === destinoDecodificado.id);
        if (!cuenta) {
          setError("Cuenta de destino no encontrada");
          return;
        }
      }

      if (movimientoConCambio(monedaOrigen, monedaDestino)) {
        if (!tasaCambio || isNaN(tasaNum) || tasaNum <= 0) {
          setError(
            `Ingresa la tasa del día (${etiquetaTasaCambio(monedaOrigen, monedaDestino)})`
          );
          return;
        }
      } else if (moneda !== monedaOrigen && destinoDecodificado.tipo === "tarjeta") {
        setError(`La moneda debe coincidir con la del origen (${monedaOrigen})`);
        return;
      }

      const debitoOrigen = movimientoConCambio(monedaOrigen, monedaDestino)
        ? calcularMontoOrigen(montoNumerico, tasaNum)
        : montoNumerico;

      if (!modoEdicion && origenDecodificado.tipo === "efectivo" && debitoOrigen > efectivo) {
        setError("No tienes suficiente efectivo");
        return;
      }
      if (!modoEdicion && origenDecodificado.tipo === "cuenta") {
        const cuenta = cuentas.find((c) => c.id === origenDecodificado.id);
        if (!cuenta || debitoOrigen > cuenta.saldoActual) {
          setError("Saldo insuficiente en la cuenta seleccionada");
          return;
        }
      }

      const esPagoTarjeta = destinoDecodificado.tipo === "tarjeta";

      const datosTransferencia = {
        descripcion: descripcion.trim(),
        monto: montoNumerico,
        categoria: esPagoTarjeta
          ? CATEGORIA_PAGO_TARJETA
          : CATEGORIA_TRANSFERENCIA_CUENTAS,
        fecha,
        moneda: monedaDestino,
        monedaOrigen: monedaOrigen,
        montoOrigen: debitoOrigen,
        tasaCambio: movimientoConCambio(monedaOrigen, monedaDestino)
          ? tasaNum
          : undefined,
        origen: origenDecodificado,
        destino: destinoDecodificado,
      };

      if (modoEdicion && transaccion) {
        actualizarTransaccion(transaccion.id, datosTransferencia);
      } else {
        agregarTransaccion({
          ...datosTransferencia,
          tipo: "transferencia",
        });
      }

      setDescripcion("");
      setMonto("");
      setMoneda(configuracion.moneda);
      setFecha(fechaHoy());
      setDestinoValor("");
      setTasaCambio("");
      onExito?.();
      return;
    }

    const monedaOrigen = monedaDeOrigen(
      origenDecodificado,
      cuentas,
      tarjetas,
      configuracion.moneda
    );

    if (origenDecodificado.tipo === "tarjeta" && moneda !== monedaOrigen) {
      setError(
        `Para pagar con tarjeta, la moneda del ${tipo} debe ser ${monedaOrigen}. Elige una cuenta en otra moneda e indica la tasa.`
      );
      return;
    }

    let montoOrigenFinal: number | undefined;
    let tasaCambioFinal: number | undefined;

    if (movimientoConCambio(monedaOrigen, moneda)) {
      if (!tasaCambio || isNaN(tasaNum) || tasaNum <= 0) {
        setError(
          `Ingresa la tasa del día (${etiquetaTasaCambio(monedaOrigen, moneda)})`
        );
        return;
      }
      montoOrigenFinal = calcularMontoOrigen(montoNumerico, tasaNum);
      tasaCambioFinal = tasaNum;
    }

    if (tipo === "gasto") {
      const debitoOrigen = montoOrigenFinal ?? montoNumerico;

      if (!modoEdicion && origenDecodificado.tipo === "efectivo" && debitoOrigen > efectivo) {
        setError("No tienes suficiente efectivo");
        return;
      }
      if (!modoEdicion && origenDecodificado.tipo === "cuenta") {
        const cuenta = cuentas.find((c) => c.id === origenDecodificado.id);
        if (!cuenta || debitoOrigen > cuenta.saldoActual) {
          setError("Saldo insuficiente en la cuenta seleccionada");
          return;
        }
      }
    }

    let planCuotasPopular;

    if (!modoEdicion && usarCuotasPopular) {
      if (!tarjetaSeleccionada) {
        setError("Selecciona una tarjeta con Cuotas Popular activo");
        return;
      }
      if (montoNumerico > limiteDisponible) {
        setError(
          `Supera el límite disponible de Cuotas Popular (${formatearMoneda(limiteDisponible, tarjetaSeleccionada.moneda)})`
        );
        return;
      }

      const tasaNum = parseFloat(cuotasValores.tasaInteres) || 0;
      const cuotasNum = parseInt(cuotasValores.cuotasTotales, 10);
      const cuotaNum = parseFloat(cuotasValores.montoCuota);

      if (tasaNum < 0) {
        setError("La tasa de interés no puede ser negativa");
        return;
      }
      if (!cuotasValores.cuotasTotales || isNaN(cuotasNum) || cuotasNum <= 0) {
        setError("Ingresa el número de cuotas");
        return;
      }
      if (!cuotasValores.montoCuota || isNaN(cuotaNum) || cuotaNum <= 0) {
        setError("Ingresa un monto de cuota válido");
        return;
      }
      if (!validarNumeroCuotas(cuotasValores.numeroReferencia)) {
        setError("Ingresa el número de referencia del plan (16 dígitos)");
        return;
      }

      planCuotasPopular = {
        tasaInteres: tasaNum,
        tipoTasa: cuotasValores.tipoTasa,
        cuotasTotales: cuotasNum,
        montoCuota: cuotaNum,
        montoTotal: Math.round(cuotaNum * cuotasNum * 100) / 100,
        ...numeroCuotasDesdeEntrada(cuotasValores.numeroReferencia),
      };
    }

    const datosGastoIngreso = {
      descripcion: descripcion.trim(),
      monto: montoNumerico,
      categoria,
      fecha,
      moneda,
      monedaOrigen: montoOrigenFinal != null ? monedaOrigen : undefined,
      montoOrigen: montoOrigenFinal,
      tasaCambio: tasaCambioFinal,
      origen: origenDecodificado,
      gastoFijoId:
        tipo === "gasto" && gastoFijoId && !transaccion?.prestamoId && !esPagoAporte
          ? gastoFijoId
          : undefined,
      aporteIngreso: tipo === "gasto" && esPagoAporte ? true : undefined,
    };

    if (modoEdicion && transaccion) {
      actualizarTransaccion(transaccion.id, datosGastoIngreso);
    } else {
      agregarTransaccion(
        {
          ...datosGastoIngreso,
          tipo,
        },
        planCuotasPopular
      );
    }

    setDescripcion("");
    setMonto("");
    setMoneda(configuracion.moneda);
    setFecha(fechaHoy());
    setGastoFijoId("");
    setEsPagoAporte(false);
    setUsarCuotasPopular(false);
    setCuotasValores(CUOTAS_INICIAL);
    onExito?.();
  }

  const periodo = periodoDeFecha(fecha, configuracion.diasPago);

  return (
    <form
      onSubmit={handleSubmit}
      className={
        enModal
          ? ""
          : "rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"
      }
    >
      {!enModal && (
        <h2 className="text-base font-semibold text-foreground">
          {modoEdicion ? "Editar transacción" : "Nueva transacción"}
        </h2>
      )}
      <p className={`text-xs text-muted ${enModal ? "" : "mt-1"}`}>
        {modoEdicion
          ? "Ajusta los datos; los saldos se recalculan automáticamente"
          : "La quincena se asigna automáticamente según tu configuración"}
      </p>

      {modoEdicion ? (
        <p className="mt-3 inline-flex rounded-full bg-background px-3 py-1 text-xs font-medium text-muted">
          {tipo === "gasto"
            ? "Gasto"
            : tipo === "ingreso"
              ? "Ingreso"
              : "Movimiento"}
        </p>
      ) : (
      !gastoFijoInicialId &&
      !aporteIngresoInicial && (
      <div className="mt-4 flex rounded-lg border border-border p-0.5 sm:p-1">
        <button
          type="button"
          onClick={() => cambiarTipo("gasto")}
          className={`flex-1 rounded-md px-1 py-2 text-xs font-medium transition-colors sm:px-2 sm:text-sm ${
            tipo === "gasto"
              ? "bg-gasto text-white"
              : "text-muted hover:text-foreground"
          }`}
        >
          Gasto
        </button>
        <button
          type="button"
          onClick={() => cambiarTipo("ingreso")}
          className={`flex-1 rounded-md px-1 py-2 text-xs font-medium transition-colors sm:px-2 sm:text-sm ${
            tipo === "ingreso"
              ? "bg-ingreso text-white"
              : "text-muted hover:text-foreground"
          }`}
        >
          Ingreso
        </button>
        <button
          type="button"
          onClick={() => cambiarTipo("transferencia")}
          className={`flex-1 rounded-md px-1 py-2 text-xs font-medium transition-colors sm:px-2 sm:text-sm ${
            tipo === "transferencia"
              ? "bg-accent text-white"
              : "text-muted hover:text-foreground"
          }`}
        >
          Mover dinero
        </button>
      </div>
      )
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">Descripción</span>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder={
              tipo === "transferencia"
                ? "Ej: Pago tarjeta Visa, Traspaso a ahorros..."
                : tipo === "gasto"
                  ? "Ej: Almuerzo, Uber, Netflix..."
                  : "Ej: Salario quincenal"
            }
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            {tipo === "transferencia" && destino
              ? destino.tipo === "tarjeta"
                ? `Monto a pagar (${monedaDestinoTransferencia})`
                : `Monto a transferir (${monedaDestinoTransferencia})`
              : "Monto"}
          </span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0.00"
            className={inputClass}
          />
        </label>

        {tipo !== "transferencia" && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Moneda</span>
            {gastoFijoId ? (
              <input
                type="text"
                value={moneda}
                readOnly
                className={`${inputClass} bg-background text-muted`}
              />
            ) : (
              <SelectorMoneda value={moneda} onChange={setMoneda} />
            )}
          </label>
        )}

        {tipo === "transferencia" && destino && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Moneda del destino</span>
            <input
              type="text"
              value={monedaDestinoTransferencia}
              readOnly
              className={`${inputClass} bg-background text-muted`}
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Fecha</span>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={inputClass}
          />
        </label>

        {tipo !== "transferencia" && (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-foreground">Categoría</span>
            {tipo === "gasto" ? (
              <SelectorCategoriaConIconos
                categorias={categorias}
                valor={categoria}
                onChange={setCategoria}
                configuracion={configuracion}
              />
            ) : (
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className={inputClass}
              >
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {tipo === "gasto" &&
          gastosFijosActivos.length > 0 &&
          !transaccion?.prestamoId &&
          !gastoFijoInicialId &&
          !aporteIngresoInicial &&
          !esPagoAporte && (
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-foreground">
              Gasto fijo (opcional)
            </span>
            <select
              value={gastoFijoId}
              onChange={(e) => setGastoFijoId(e.target.value)}
              className={inputClass}
            >
              <option value="">Ninguno — gasto variable</option>
              {gastosFijosActivos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre} · {g.categoria} · Q{g.quincena} ·{" "}
                  {formatearMoneda(g.monto, g.moneda)}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted">
              Si eliges un gasto fijo, el pago no se duplicará en el disponible de
              la quincena
            </span>
          </label>
        )}

        {tipo === "transferencia" ? (
          <>
            <SelectorOrigenFondo
              value={origenValor}
              onChange={cambiarOrigen}
              tipo="transferencia-origen"
            />
            <SelectorOrigenFondo
              value={destinoValor}
              onChange={(valor) => {
                setDestinoValor(valor);
                setTasaCambio("");
              }}
              tipo="transferencia-destino"
              excluirValor={origenValor}
            />

            {requiereTasaCambio && (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">
                    Tasa del día ({etiquetaTasaCambio(
                      monedaOrigenTransferencia,
                      monedaDestinoTransferencia
                    )})
                  </span>
                  <input
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={tasaCambio}
                    onChange={(e) => setTasaCambio(e.target.value)}
                    placeholder="Ej: 58.50"
                    className={inputClass}
                  />
                </label>

                <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-xs text-muted sm:col-span-2">
                  {tasaNum > 0 && montoNumerico > 0 ? (
                    <p>
                      Se debitarán{" "}
                      <span className="font-semibold text-foreground">
                        {formatearMoneda(montoDebitoOrigen, monedaOrigenTransferencia)}
                      </span>
                      {" "}de tu {origen?.tipo === "efectivo" ? "efectivo" : "cuenta"} y se
                      abonarán{" "}
                      <span className="font-semibold text-foreground">
                        {formatearMoneda(montoNumerico, monedaDestinoTransferencia)}
                      </span>
                      {" "}
                      {destino?.tipo === "tarjeta"
                        ? "a la tarjeta."
                        : destino?.tipo === "efectivo"
                          ? "en efectivo."
                          : "en la cuenta destino."}
                    </p>
                  ) : (
                    <p>
                      Ingresa el monto en {monedaDestinoTransferencia} y la tasa del día
                      para calcular cuánto saldrá de tu cuenta en{" "}
                      {monedaOrigenTransferencia}.
                    </p>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <SelectorOrigenFondo
              value={origenValor}
              onChange={cambiarOrigen}
              tipo={tipo}
            />

            {requiereTasaCambioGastoIngreso && (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">
                    Tasa del día ({etiquetaTasaCambio(monedaOrigenPago, moneda)})
                  </span>
                  <input
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={tasaCambio}
                    onChange={(e) => setTasaCambio(e.target.value)}
                    placeholder="Ej: 58.50"
                    className={inputClass}
                  />
                </label>

                <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3 text-xs text-muted sm:col-span-2">
                  {montoDebitoGastoIngreso != null && montoNumerico > 0 ? (
                    <p>
                      Se debitarán{" "}
                      <span className="font-semibold text-foreground">
                        {formatearMoneda(montoDebitoGastoIngreso, monedaOrigenPago)}
                      </span>
                      {" "}de tu{" "}
                      {origen?.tipo === "efectivo" ? "efectivo" : "cuenta"} por un{" "}
                      {tipo === "gasto" ? "gasto" : "ingreso"} de{" "}
                      <span className="font-semibold text-foreground">
                        {formatearMoneda(montoNumerico, moneda)}
                      </span>
                      .
                    </p>
                  ) : (
                    <p>
                      Ingresa el monto en {moneda} y la tasa del día para calcular
                      cuánto saldrá de tu{" "}
                      {origen?.tipo === "efectivo" ? "efectivo" : "cuenta"} en{" "}
                      {monedaOrigenPago}.
                    </p>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {tipo === "transferencia" && !puedeTransferir && (
          <p className="sm:col-span-2 text-xs text-gasto">
            Registra al menos dos cuentas, o una cuenta y efectivo, para mover dinero
            entre ellas. También puedes pagar una tarjeta si tienes una registrada.
          </p>
        )}

        {puedeCuotasPopular && !modoEdicion && (
          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-3">
              <input
                type="checkbox"
                checked={usarCuotasPopular}
                onChange={(e) => {
                  setUsarCuotasPopular(e.target.checked);
                  if (!e.target.checked) setCuotasValores(CUOTAS_INICIAL);
                }}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Pagar en Cuotas Popular
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  Límite disponible:{" "}
                  <span className="font-semibold text-foreground">
                    {formatearMoneda(limiteDisponible, tarjetaSeleccionada!.moneda)}
                  </span>
                  {" "}
                  de{" "}
                  {formatearMoneda(
                    tarjetaSeleccionada!.extensionCuotasPopular!.limiteAprobado,
                    tarjetaSeleccionada!.moneda
                  )}
                </p>
              </div>
            </label>
          </div>
        )}

        {usarCuotasPopular && tarjetaSeleccionada && (
          <CamposCuotasPopular
            montoCompra={montoNumerico}
            moneda={tarjetaSeleccionada.moneda}
            valores={cuotasValores}
            onChange={setCuotasValores}
            diaPago={tarjetaSeleccionada.diaPago}
          />
        )}
      </div>

      <p className="mt-3 text-xs text-muted">
        Se registrará en{" "}
        <span className="font-medium text-accent">{periodo.etiqueta}</span>
        {tipo === "transferencia" && destino && (
          <>
            {" "}
            ·{" "}
            {destino.tipo === "tarjeta"
              ? "se moverá de tu cuenta/efectivo a la tarjeta"
              : "se moverá entre tus cuentas sin afectar ingresos ni gastos"}
          </>
        )}
        {usarCuotasPopular && (
          <>
            {" "}
            · se creará un plan de cuotas en{" "}
            <span className="font-medium text-foreground">
              {tarjetaSeleccionada?.nombreTarjeta}
            </span>
          </>
        )}
      </p>

      {error && (
        <p className="mt-3 text-sm text-gasto">{error}</p>
      )}

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row">
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="w-full rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover sm:w-auto sm:py-2.5"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={tipo === "transferencia" && !puedeTransferir}
          className={`w-full rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1 sm:py-2.5 ${
            tipo === "gasto"
              ? "bg-gasto hover:opacity-90"
              : tipo === "ingreso"
                ? "bg-ingreso hover:opacity-90"
                : "bg-accent hover:bg-accent-hover"
          }`}
        >
          {modoEdicion
            ? "Guardar cambios"
            : tipo === "transferencia"
              ? "Mover dinero"
              : `Registrar ${tipo}`}
        </button>
      </div>
    </form>
  );
}
