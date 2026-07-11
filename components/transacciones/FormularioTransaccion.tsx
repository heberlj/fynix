"use client";

import { useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import {
  CATEGORIAS_GASTO,
  CATEGORIAS_INGRESO,
} from "@/types/finanzas";
import { fechaHoy } from "@/lib/fechas";
import {
  disponibleLimiteCuotasPopular,
  tarjetaTieneCuotasPopular,
} from "@/lib/cuotas-popular";
import { decodificarOrigen, monedaDeOrigen } from "@/lib/transacciones";
import { formatearMoneda, periodoDeFecha } from "@/lib/quincenas";
import { SelectorOrigenFondo } from "@/components/ui/SelectorOrigenFondo";
import { SelectorMoneda } from "@/components/ui/SelectorMoneda";
import {
  CamposCuotasPopular,
  type ValoresCuotasPopular,
} from "@/components/transacciones/CamposCuotasPopular";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

const CUOTAS_INICIAL: ValoresCuotasPopular = {
  tasaInteres: "",
  tipoTasa: "anual",
  cuotasTotales: "",
  montoCuota: "",
  cuotaManual: false,
};

export function FormularioTransaccion({ onExito }: { onExito?: () => void } = {}) {
  const { agregarTransaccion, configuracion, tarjetas, cuotasPopular, cuentas } =
    useFinanzas();
  const [tipo, setTipo] = useState<"gasto" | "ingreso">("gasto");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState(configuracion.moneda);
  const [categoria, setCategoria] = useState<string>(CATEGORIAS_GASTO[0]);
  const [fecha, setFecha] = useState(fechaHoy());
  const [origenValor, setOrigenValor] = useState("efectivo");
  const [usarCuotasPopular, setUsarCuotasPopular] = useState(false);
  const [cuotasValores, setCuotasValores] =
    useState<ValoresCuotasPopular>(CUOTAS_INICIAL);
  const [error, setError] = useState("");

  const categorias =
    tipo === "gasto" ? CATEGORIAS_GASTO : CATEGORIAS_INGRESO;

  const origen = decodificarOrigen(origenValor);
  const tarjetaSeleccionada =
    origen?.tipo === "tarjeta"
      ? tarjetas.find((t) => t.id === origen.id)
      : undefined;

  const puedeCuotasPopular =
    tipo === "gasto" &&
    tarjetaSeleccionada &&
    tarjetaTieneCuotasPopular(tarjetaSeleccionada);

  const limiteDisponible = useMemo(() => {
    if (!tarjetaSeleccionada) return 0;
    return disponibleLimiteCuotasPopular(tarjetaSeleccionada, cuotasPopular);
  }, [tarjetaSeleccionada, cuotasPopular]);

  function cambiarTipo(nuevoTipo: "gasto" | "ingreso") {
    setTipo(nuevoTipo);
    setCategoria(
      nuevoTipo === "gasto" ? CATEGORIAS_GASTO[0] : CATEGORIAS_INGRESO[0]
    );
    setUsarCuotasPopular(false);
    setCuotasValores(CUOTAS_INICIAL);
  }

  function cambiarOrigen(valor: string) {
    setOrigenValor(valor);
    setUsarCuotasPopular(false);
    setCuotasValores(CUOTAS_INICIAL);
    const origenNuevo = decodificarOrigen(valor);
    if (origenNuevo) {
      setMoneda(monedaDeOrigen(origenNuevo, cuentas, tarjetas, configuracion.moneda));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

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

    if (usarCuotasPopular) {
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

      planCuotasPopular = {
        tasaInteres: tasaNum,
        tipoTasa: cuotasValores.tipoTasa,
        cuotasTotales: cuotasNum,
        montoCuota: cuotaNum,
        montoTotal: Math.round(cuotaNum * cuotasNum * 100) / 100,
      };
    }

    agregarTransaccion(
      {
        descripcion: descripcion.trim(),
        monto: montoNumerico,
        tipo,
        categoria,
        fecha,
        moneda,
        origen: origenDecodificado,
      },
      planCuotasPopular
    );

    setDescripcion("");
    setMonto("");
    setMoneda(configuracion.moneda);
    setFecha(fechaHoy());
    setUsarCuotasPopular(false);
    setCuotasValores(CUOTAS_INICIAL);
    onExito?.();
  }

  const periodo = periodoDeFecha(fecha, configuracion.diasPago);
  const montoNumerico = parseFloat(monto) || 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6"
    >
      <h2 className="text-base font-semibold text-foreground">
        Nueva transacción
      </h2>
      <p className="mt-1 text-xs text-muted">
        La quincena se asigna automáticamente según tu configuración
      </p>

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
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-foreground">Descripción</span>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder={
              tipo === "gasto" ? "Ej: Almuerzo, Uber, Netflix..." : "Ej: Salario quincenal"
            }
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Monto</span>
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

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Moneda</span>
          <SelectorMoneda value={moneda} onChange={setMoneda} />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">Fecha</span>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={inputClass}
          />
        </label>

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

        <SelectorOrigenFondo
          value={origenValor}
          onChange={cambiarOrigen}
          tipo={tipo}
        />

        {puedeCuotasPopular && (
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

      <button
        type="submit"
        className={`mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors ${
          tipo === "gasto"
            ? "bg-gasto hover:opacity-90"
            : "bg-ingreso hover:opacity-90"
        }`}
      >
        Registrar {tipo}
      </button>
    </form>
  );
}
