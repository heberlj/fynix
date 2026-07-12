"use client";

import { useEffect, useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import type { Transaccion } from "@/types/finanzas";
import {
  CATEGORIA_PAGO_TARJETA,
  CATEGORIA_TRANSFERENCIA_CUENTAS,
} from "@/types/finanzas";
import { fechaHoy } from "@/lib/fechas";
import {
  obtenerCategoriasGasto,
  obtenerCategoriasIngreso,
} from "@/lib/categorias-transacciones";
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
import { SelectorOrigenFondo } from "@/components/ui/SelectorOrigenFondo";
import { SelectorMoneda } from "@/components/ui/SelectorMoneda";
import {
  CamposCuotasPopular,
  type ValoresCuotasPopular,
} from "@/components/transacciones/CamposCuotasPopular";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

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
  transaccion,
}: {
  onExito?: () => void;
  onCancelar?: () => void;
  gastoFijoInicialId?: string;
  transaccion?: Transaccion;
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

  const puedeTransferir = cuentas.length >= 1 || tarjetas.length > 0;

  const montoNumerico = parseFloat(monto) || 0;
  const tasaNum = parseFloat(tasaCambio) || 0;

  const montoDebitoOrigen = useMemo(() => {
    if (!requiereTasaCambio || tasaNum <= 0) return montoNumerico;
    return calcularMontoOrigen(montoNumerico, tasaNum);
  }, [requiereTasaCambio, tasaNum, montoNumerico]);

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
    setUsarCuotasPopular(false);
    setCuotasValores(CUOTAS_INICIAL);
    setError("");
  }, [transaccion]);

  useEffect(() => {
    if (tipo === "gasto") {
      setCategoria((actual) =>
        categoriasGasto.includes(actual)
          ? actual
          : (categoriasGasto[0] ?? "Otros")
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
    if (tipo !== "gasto" || !gastoFijoId) return;
    const gasto = gastosFijos.find((g) => g.id === gastoFijoId);
    if (!gasto) return;
    setDescripcion(gasto.nombre);
    setMonto(String(gasto.monto));
    setCategoria(gasto.categoria);
    setMoneda(gasto.moneda);
  }, [gastoFijoId, gastosFijos, tipo]);

  function cambiarTipo(nuevoTipo: "gasto" | "ingreso" | "transferencia") {
    setTipo(nuevoTipo);
    if (nuevoTipo === "gasto") {
      setCategoria(categoriasGasto[0] ?? "Otros");
    } else if (nuevoTipo === "ingreso") {
      setCategoria(categoriasIngreso[0] ?? "Otros");
    }
    setUsarCuotasPopular(false);
    setCuotasValores(CUOTAS_INICIAL);
    setDestinoValor("");
    setTasaCambio("");
    if (nuevoTipo !== "gasto") setGastoFijoId("");
  }

  function cambiarOrigen(valor: string) {
    setOrigenValor(valor);
    setUsarCuotasPopular(false);
    setCuotasValores(CUOTAS_INICIAL);
    setTasaCambio("");
    const origenNuevo = decodificarOrigen(valor);
    if (origenNuevo && tipo !== "transferencia") {
      setMoneda(monedaDeOrigen(origenNuevo, cuentas, tarjetas, configuracion.moneda));
    }
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
    if (
      origenDecodificado.tipo !== "efectivo" &&
      moneda !== monedaOrigen
    ) {
      setError(
        `La moneda debe coincidir con la del origen seleccionado (${monedaOrigen})`
      );
      return;
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
      origen: origenDecodificado,
      gastoFijoId:
        tipo === "gasto" && gastoFijoId && !transaccion?.prestamoId
          ? gastoFijoId
          : undefined,
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
    setUsarCuotasPopular(false);
    setCuotasValores(CUOTAS_INICIAL);
    onExito?.();
  }

  const periodo = periodoDeFecha(fecha, configuracion.diasPago);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"
    >
      <h2 className="text-base font-semibold text-foreground">
        {modoEdicion ? "Editar transacción" : "Nueva transacción"}
      </h2>
      <p className="mt-1 text-xs text-muted">
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
      <div className="mt-4 flex rounded-lg border border-border p-1">
        <button
          type="button"
          onClick={() => cambiarTipo("gasto")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
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
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
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
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
            tipo === "transferencia"
              ? "bg-accent text-white"
              : "text-muted hover:text-foreground"
          }`}
        >
          Mover dinero
        </button>
      </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
            <SelectorMoneda value={moneda} onChange={setMoneda} />
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
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-foreground">Categoría</span>
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
          </label>
        )}

        {tipo === "gasto" &&
          gastosFijosActivos.length > 0 &&
          !transaccion?.prestamoId && (
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
          <SelectorOrigenFondo
            value={origenValor}
            onChange={cambiarOrigen}
            tipo={tipo}
          />
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

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover sm:w-auto"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={tipo === "transferencia" && !puedeTransferir}
          className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1 ${
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
