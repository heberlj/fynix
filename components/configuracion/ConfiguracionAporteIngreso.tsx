"use client";

import { useEffect, useMemo, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import type { AporteSegunIngreso, PeriodoAporteIngreso } from "@/types/finanzas";
import {
  aporteIngresoParaUi,
  aporteIngresoPorDefecto,
  etiquetaPeriodoAporte,
} from "@/lib/aporte-ingreso";
import { validarDiasPago } from "@/lib/validar-configuracion";
import { PanelConfiguracion } from "@/components/configuracion/PanelConfiguracion";
import { SelectorMoneda } from "@/components/ui/SelectorMoneda";

const inputClass =
  "w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none focus:border-accent sm:py-2 sm:text-sm";

export function ConfiguracionAporteIngreso() {
  const { configuracion, actualizarConfiguracion } = useFinanzas();
  const actual = useMemo(
    () => aporteIngresoParaUi(configuracion),
    [configuracion]
  );

  const [activo, setActivo] = useState(actual.activo);
  const [nombre, setNombre] = useState(actual.nombre);
  const [porcentaje, setPorcentaje] = useState(String(actual.porcentaje));
  const [periodo, setPeriodo] = useState<PeriodoAporteIngreso>(actual.periodo);
  const [diaPagoQ1, setDiaPagoQ1] = useState(String(actual.diasPago[0]));
  const [diaPagoQ2, setDiaPagoQ2] = useState(String(actual.diasPago[1]));
  const [quincenas, setQuincenas] = useState<(1 | 2)[]>(
    () => actual.quincenas ?? [1, 2]
  );
  const [categoria, setCategoria] = useState(actual.categoria);
  const [moneda, setMoneda] = useState(actual.moneda);
  const [tipoPresupuesto, setTipoPresupuesto] = useState(actual.tipoPresupuesto);
  const [categoriasIngreso, setCategoriasIngreso] = useState<string[]>(
    actual.categoriasIngreso
  );
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const a = aporteIngresoParaUi(configuracion);
    setActivo(a.activo);
    setNombre(a.nombre);
    setPorcentaje(String(a.porcentaje));
    setPeriodo(a.periodo);
    setDiaPagoQ1(String(a.diasPago[0]));
    setDiaPagoQ2(String(a.diasPago[1]));
    setQuincenas(a.quincenas ?? [1, 2]);
    setCategoria(a.categoria);
    setMoneda(a.moneda);
    setTipoPresupuesto(a.tipoPresupuesto);
    setCategoriasIngreso(a.categoriasIngreso);
  }, [configuracion]);

  function alternarCategoriaIngreso(cat: string) {
    setCategoriasIngreso((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function alternarQuincena(q: 1 | 2) {
    setQuincenas((prev) => {
      if (prev.includes(q)) {
        const resto = prev.filter((n) => n !== q);
        return resto.length > 0 ? resto : prev;
      }
      return [...prev, q].sort();
    });
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!activo) {
      actualizarConfiguracion({
        aporteIngreso: {
          ...aporteIngresoPorDefecto(
            configuracion.moneda,
            configuracion.diasPago
          ),
          activo: false,
        },
      });
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
      return;
    }

    const pct = parseFloat(porcentaje);
    const d1 = Number(diaPagoQ1);
    const d2 = Number(diaPagoQ2);

    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!porcentaje || isNaN(pct) || pct <= 0 || pct > 100) {
      setError("Ingresa un porcentaje entre 0.01 y 100");
      return;
    }
    const errorDias = validarDiasPago(d1, d2);
    if (errorDias) {
      setError(errorDias);
      return;
    }
    if (quincenas.length === 0) {
      setError("Selecciona al menos una quincena");
      return;
    }
    if (categoriasIngreso.length === 0) {
      setError("Selecciona al menos una categoría de ingreso");
      return;
    }
    if (!categoria.trim()) {
      setError("La categoría del gasto es obligatoria");
      return;
    }

    const datos: AporteSegunIngreso = {
      activo: true,
      nombre: nombre.trim(),
      porcentaje: pct,
      categoriasIngreso,
      periodo,
      diasPago: [d1, d2],
      quincenas: [...quincenas].sort(),
      categoria: categoria.trim(),
      moneda,
      tipoPresupuesto,
    };

    const catGasto = categoria.trim();
    const nuevasCategoriasGasto = configuracion.categoriasGasto.includes(catGasto)
      ? configuracion.categoriasGasto
      : [...configuracion.categoriasGasto, catGasto];

    actualizarConfiguracion({
      aporteIngreso: datos,
      ...(nuevasCategoriasGasto.length !== configuracion.categoriasGasto.length
        ? { categoriasGasto: nuevasCategoriasGasto }
        : {}),
    });
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  }

  return (
    <PanelConfiguracion
      titulo="Diezmos"
      descripcion="Opcional. Calcula un monto como porcentaje de tus ingresos (diezmo, donación u otro compromiso). Quien no lo use no verá nada en Gastos fijos."
    >
    <form onSubmit={guardar}>

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-3">
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
          className="mt-0.5"
        />
        <div>
          <p className="text-sm font-medium text-foreground">
            Activar cálculo según ingresos
          </p>
          <p className="mt-0.5 text-xs text-muted">
            Aparecerá en Gastos fijos con el monto sugerido del periodo
          </p>
        </div>
      </label>

      {activo && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-foreground">Nombre</span>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Diezmo, Donación, Iglesia..."
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Porcentaje</span>
            <input
              type="number"
              min="0.01"
              max="100"
              step="0.01"
              value={porcentaje}
              onChange={(e) => setPorcentaje(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Moneda</span>
            <SelectorMoneda value={moneda} onChange={setMoneda} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Calcular sobre
            </span>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as PeriodoAporteIngreso)}
              className={inputClass}
            >
              <option value="quincena">Ingresos de la quincena</option>
              <option value="mes">Ingresos del mes calendario</option>
            </select>
            <span className="text-xs text-muted">
              Base: {etiquetaPeriodoAporte(periodo)}
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Categoría al pagar
            </span>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className={inputClass}
            >
              {configuracion.categoriasGasto.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Día de pago Q1
            </span>
            <input
              type="number"
              min={1}
              max={31}
              value={diaPagoQ1}
              onChange={(e) => setDiaPagoQ1(e.target.value)}
              className={inputClass}
            />
            <span className="text-xs text-muted">Quincena del 1 al 15</span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Día de pago Q2
            </span>
            <input
              type="number"
              min={1}
              max={31}
              value={diaPagoQ2}
              onChange={(e) => setDiaPagoQ2(e.target.value)}
              className={inputClass}
            />
            <span className="text-xs text-muted">Quincena del 16 al fin de mes</span>
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-foreground">Prioridad</span>
            <select
              value={tipoPresupuesto}
              onChange={(e) =>
                setTipoPresupuesto(e.target.value as "esencial" | "flexible")
              }
              className={inputClass}
            >
              <option value="esencial">Esencial</option>
              <option value="flexible">Flexible</option>
            </select>
          </label>

          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-foreground">
              Mostrar en quincenas
            </p>
            <p className="mt-0.5 text-xs text-muted">
              Puedes elegir una o ambas. Con &quot;ingresos de la quincena&quot;,
              cada columna calcula el % de esa quincena.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {([1, 2] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => alternarQuincena(q)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    (quincenas ?? []).includes(q)
                      ? "bg-accent text-white"
                      : "bg-background text-muted hover:text-foreground"
                  }`}
                >
                  Quincena {q}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-foreground">
              Ingresos que cuentan
            </p>
            <p className="mt-0.5 text-xs text-muted">
              Solo se suman transacciones de ingreso en estas categorías
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {configuracion.categoriasIngreso.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => alternarCategoriaIngreso(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    categoriasIngreso.includes(cat)
                      ? "bg-accent text-white"
                      : "bg-background text-muted hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        className="mt-5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        {guardado ? "¡Guardado!" : "Guardar aporte"}
      </button>
      {error && <p className="mt-3 text-sm text-gasto">{error}</p>}
    </form>
    </PanelConfiguracion>
  );
}
