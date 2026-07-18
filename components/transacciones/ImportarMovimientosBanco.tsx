"use client";

import { useMemo, useRef, useState } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import { usePlanLimites } from "@/hooks/usePlanLimites";
import {
  obtenerCategoriasGasto,
  obtenerCategoriasIngreso,
} from "@/lib/categorias-transacciones";
import {
  PLANTILLAS_IMPORTACION,
  parsearMovimientosBanco,
} from "@/lib/importacion-banco";
import { MENSAJE_IMPORTAR_BANCO } from "@/lib/plan-limites";
import { codificarOrigen, decodificarOrigen } from "@/lib/transacciones";
import { formatearMoneda } from "@/lib/quincenas";
import { formatearFecha } from "@/lib/fechas";
import type {
  MovimientoBancoPendiente,
  PlantillaImportacionBanco,
} from "@/types/importacion-banco";
import type { OrigenFondo } from "@/types/finanzas";
import { AvisoLimitePro } from "@/components/suscripcion/AvisoLimitePro";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

type Paso = "config" | "revision" | "listo";

interface ImportarMovimientosBancoProps {
  onCerrar: () => void;
  onImportado?: (cantidad: number) => void;
}

export function ImportarMovimientosBanco({
  onCerrar,
  onImportado,
}: ImportarMovimientosBancoProps) {
  const {
    transacciones,
    cuentas,
    tarjetas,
    configuracion,
    agregarTransaccion,
  } = useFinanzas();
  const { puedeImportarBanco } = usePlanLimites();

  const inputRef = useRef<HTMLInputElement>(null);
  const [paso, setPaso] = useState<Paso>("config");
  const [plantilla, setPlantilla] =
    useState<PlantillaImportacionBanco>("popular-cuenta");
  const [origenValor, setOrigenValor] = useState("");
  const [moneda, setMoneda] = useState(configuracion.moneda);
  const [movimientos, setMovimientos] = useState<MovimientoBancoPendiente[]>(
    []
  );
  const [errores, setErrores] = useState<string[]>([]);
  const [advertencias, setAdvertencias] = useState<string[]>([]);
  const [importados, setImportados] = useState(0);
  const [procesando, setProcesando] = useState(false);

  const metaPlantilla = PLANTILLAS_IMPORTACION.find((p) => p.id === plantilla)!;
  const categoriasGasto = useMemo(
    () => obtenerCategoriasGasto(configuracion),
    [configuracion]
  );
  const categoriasIngreso = useMemo(
    () => obtenerCategoriasIngreso(configuracion),
    [configuracion]
  );

  const opcionesOrigen = useMemo(() => {
    const mapCuentas = cuentas.map((c) => ({
      valor: codificarOrigen({ tipo: "cuenta" as const, id: c.id }),
      etiqueta: `${c.banco} · ${c.nombre}${c.ultimosCuatro ? ` ·••• ${c.ultimosCuatro}` : ""}`,
      moneda: c.moneda,
    }));
    const mapTarjetas = tarjetas.map((t) => ({
      valor: codificarOrigen({ tipo: "tarjeta" as const, id: t.id }),
      etiqueta: `${t.banco} · ${t.nombreTarjeta} ·••• ${t.ultimosCuatro}`,
      moneda: t.moneda,
    }));

    if (plantilla === "generica") {
      return [...mapCuentas, ...mapTarjetas];
    }

    const lista =
      metaPlantilla.tipo === "tarjeta" ? mapTarjetas : mapCuentas;

    if (metaPlantilla.banco) {
      const delBanco = lista.filter((o) =>
        o.etiqueta.toLowerCase().includes(metaPlantilla.banco.toLowerCase())
      );
      return delBanco.length > 0 ? delBanco : lista;
    }
    return lista;
  }, [cuentas, tarjetas, metaPlantilla, plantilla]);

  const seleccionados = movimientos.filter((m) => m.seleccionado && !m.duplicado);

  function cambiarPlantilla(id: PlantillaImportacionBanco) {
    setPlantilla(id);
    setOrigenValor("");
    const nueva = PLANTILLAS_IMPORTACION.find((p) => p.id === id)!;
    if (nueva.tipo === "tarjeta" && tarjetas.length === 1) {
      setOrigenValor(codificarOrigen({ tipo: "tarjeta", id: tarjetas[0].id }));
      setMoneda(tarjetas[0].moneda);
    }
    if (nueva.tipo === "cuenta" && cuentas.length === 1) {
      setOrigenValor(codificarOrigen({ tipo: "cuenta", id: cuentas[0].id }));
      setMoneda(cuentas[0].moneda);
    }
  }

  async function handleArchivo(archivo: File) {
    setProcesando(true);
    setErrores([]);
    setAdvertencias([]);

    try {
      const texto = await archivo.text();
      const resultado = parsearMovimientosBanco(
        texto,
        plantilla,
        moneda,
        transacciones,
        categoriasGasto,
        categoriasIngreso
      );

      if (resultado.errores.length > 0) {
        setErrores(resultado.errores);
        setMovimientos([]);
        return;
      }

      setMovimientos(resultado.movimientos);
      setAdvertencias(resultado.advertencias);
      setPaso("revision");
    } catch {
      setErrores(["No se pudo leer el archivo CSV."]);
    } finally {
      setProcesando(false);
    }
  }

  function actualizarMovimiento(
    id: string,
    cambios: Partial<MovimientoBancoPendiente>
  ) {
    setMovimientos((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...cambios } : m))
    );
  }

  function confirmarImportacion() {
    const origen = decodificarOrigen(origenValor);
    if (!origen) return;

    let count = 0;
    for (const mov of seleccionados) {
      agregarTransaccion({
        descripcion: mov.descripcion,
        monto: mov.monto,
        tipo: mov.tipo,
        categoria: mov.categoria,
        fecha: mov.fecha,
        moneda: mov.moneda,
        origen: origen as OrigenFondo,
      });
      count++;
    }

    setImportados(count);
    onImportado?.(count);
    setPaso("listo");
  }

  if (!puedeImportarBanco) {
    return (
      <div className="space-y-4">
        <AvisoLimitePro mensaje={MENSAJE_IMPORTAR_BANCO} />
        <button
          type="button"
          onClick={onCerrar}
          className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-hover"
        >
          Cerrar
        </button>
      </div>
    );
  }

  if (paso === "listo") {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-foreground">
          Se importaron{" "}
          <span className="font-semibold text-ingreso">{importados}</span>{" "}
          movimiento{importados !== 1 ? "s" : ""} correctamente.
        </p>
        <button
          type="button"
          onClick={onCerrar}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Listo
        </button>
      </div>
    );
  }

  if (paso === "revision") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Revisa los movimientos antes de importarlos. Los duplicados aparecen
          desmarcados.
        </p>

        {advertencias.length > 0 && (
          <div className="max-h-24 overflow-y-auto rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted">
            {advertencias.map((a) => (
              <p key={a}>{a}</p>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={() =>
              setMovimientos((prev) =>
                prev.map((m) =>
                  m.duplicado ? m : { ...m, seleccionado: true }
                )
              )
            }
            className="rounded-lg border border-border px-2 py-1 hover:bg-surface-hover"
          >
            Seleccionar todos
          </button>
          <button
            type="button"
            onClick={() =>
              setMovimientos((prev) =>
                prev.map((m) => ({ ...m, seleccionado: false }))
              )
            }
            className="rounded-lg border border-border px-2 py-1 hover:bg-surface-hover"
          >
            Ninguno
          </button>
          <span className="ml-auto self-center text-muted">
            {seleccionados.length} de {movimientos.length} por importar
          </span>
        </div>

        <div className="max-h-[min(50vh,400px)] overflow-y-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-border text-muted">
                <th className="p-2 w-8" />
                <th className="p-2">Fecha</th>
                <th className="p-2">Descripción</th>
                <th className="p-2">Monto</th>
                <th className="p-2">Categoría</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((mov) => {
                const categorias =
                  mov.tipo === "gasto" ? categoriasGasto : categoriasIngreso;
                return (
                  <tr
                    key={mov.id}
                    className={`border-b border-border/60 ${mov.duplicado ? "opacity-50" : ""}`}
                  >
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={mov.seleccionado}
                        disabled={mov.duplicado}
                        onChange={(e) =>
                          actualizarMovimiento(mov.id, {
                            seleccionado: e.target.checked,
                          })
                        }
                      />
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {formatearFecha(mov.fecha)}
                    </td>
                    <td className="p-2 max-w-[140px] truncate" title={mov.descripcion}>
                      {mov.descripcion}
                      {mov.duplicado && (
                        <span className="ml-1 text-[10px] text-gasto">
                          (duplicado)
                        </span>
                      )}
                    </td>
                    <td
                      className={`p-2 whitespace-nowrap font-medium ${mov.tipo === "ingreso" ? "text-ingreso" : "text-gasto"}`}
                    >
                      {mov.tipo === "gasto" ? "−" : "+"}
                      {formatearMoneda(mov.monto, mov.moneda)}
                    </td>
                    <td className="p-2">
                      <select
                        value={mov.categoria}
                        onChange={(e) =>
                          actualizarMovimiento(mov.id, {
                            categoria: e.target.value,
                          })
                        }
                        className="max-w-[120px] rounded border border-border bg-background px-1 py-0.5 text-xs"
                      >
                        {categorias.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setPaso("config")}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-hover"
          >
            Volver
          </button>
          <button
            type="button"
            disabled={seleccionados.length === 0}
            onClick={confirmarImportacion}
            className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            Importar {seleccionados.length} movimiento
            {seleccionados.length !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Descarga el CSV desde la app o web de tu banco y súbelo aquí. Los
        movimientos quedarán pendientes de tu confirmación.
      </p>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Plantilla</span>
        <select
          value={plantilla}
          onChange={(e) =>
            cambiarPlantilla(e.target.value as PlantillaImportacionBanco)
          }
          className={inputClass}
        >
          {PLANTILLAS_IMPORTACION.map((p) => (
            <option key={p.id} value={p.id}>
              {p.etiqueta}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">
          {plantilla === "generica"
            ? "Cuenta o tarjeta destino"
            : `${metaPlantilla.tipo === "tarjeta" ? "Tarjeta" : "Cuenta"} destino`}
        </span>
        <select
          value={origenValor}
          onChange={(e) => {
            setOrigenValor(e.target.value);
            const op = opcionesOrigen.find((o) => o.valor === e.target.value);
            if (op) setMoneda(op.moneda);
          }}
          className={inputClass}
          required
        >
          <option value="">Selecciona...</option>
          {opcionesOrigen.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </select>
        {opcionesOrigen.length === 0 && (
          <span className="text-xs text-gasto">
            Registra una {metaPlantilla.tipo} antes de importar.
          </span>
        )}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Moneda del CSV</span>
        <select
          value={moneda}
          onChange={(e) => setMoneda(e.target.value)}
          className={inputClass}
        >
          <option value="DOP">DOP</option>
          <option value="USD">USD</option>
        </select>
      </label>

      <div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            if (archivo) void handleArchivo(archivo);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={!origenValor || procesando || opcionesOrigen.length === 0}
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {procesando ? "Leyendo archivo..." : "Seleccionar archivo CSV"}
        </button>
      </div>

      {errores.length > 0 && (
        <div className="rounded-lg border border-gasto/30 bg-gasto/10 px-3 py-2 text-sm text-gasto">
          {errores.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onCerrar}
        className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface-hover"
      >
        Cancelar
      </button>
    </div>
  );
}
