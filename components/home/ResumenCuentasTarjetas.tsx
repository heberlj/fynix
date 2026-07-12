"use client";

import Link from "next/link";
import type { CuentaBancaria, IconoHome, TarjetaCredito } from "@/types/finanzas";
import { claseColorSaldoCuenta } from "@/lib/cuentas";
import {
  COLOR_HOME_EFECTIVO,
  colorHomeCuenta,
  colorHomeTarjeta,
  ESTILOS_COLOR_HOME,
  iconoHomeCuenta,
} from "@/lib/personalizacion-home";
import { idSeleccionFuente, type SeleccionFuenteHome } from "@/lib/resumen-home";
import { formatearMoneda } from "@/lib/quincenas";
import { IconoHome as IconoHomeSvg } from "@/components/ui/IconoHome";

interface ResumenCuentasTarjetasProps {
  cuentas: CuentaBancaria[];
  tarjetas: TarjetaCredito[];
  efectivo: number;
  moneda: string;
  seleccion: SeleccionFuenteHome | null;
  onSeleccionChange: (seleccion: SeleccionFuenteHome | null) => void;
}

function TarjetaResumen({
  titulo,
  subtitulo,
  monto,
  moneda,
  colorMonto,
  colorHome,
  icono,
  seleccionada,
  onClick,
}: {
  titulo: string;
  subtitulo?: string;
  monto: number;
  moneda: string;
  colorMonto: string;
  colorHome: keyof typeof ESTILOS_COLOR_HOME;
  icono: IconoHome;
  seleccionada: boolean;
  onClick: () => void;
}) {
  const estilo = ESTILOS_COLOR_HOME[colorHome];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 flex-col rounded-lg border p-3 text-left transition-all ${estilo.fondo} ${
        seleccionada
          ? "ring-2 ring-accent ring-offset-2 ring-offset-background"
          : estilo.borde
      } hover:brightness-[1.02]`}
      aria-pressed={seleccionada}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${estilo.iconoFondo} ${estilo.icono}`}
      >
        <IconoHomeSvg nombre={icono} className="h-5 w-5" />
      </div>
      <p className="mt-2 truncate text-sm font-medium text-foreground">{titulo}</p>
      {subtitulo && (
        <p className="mt-0.5 truncate text-xs text-muted">{subtitulo}</p>
      )}
      <p className={`mt-2 text-base font-bold leading-tight ${colorMonto}`}>
        {formatearMoneda(monto, moneda)}
      </p>
    </button>
  );
}

export function ResumenCuentasTarjetas({
  cuentas,
  tarjetas,
  efectivo,
  moneda,
  seleccion,
  onSeleccionChange,
}: ResumenCuentasTarjetasProps) {
  const idSeleccionado = seleccion ? idSeleccionFuente(seleccion) : null;

  function alternarSeleccion(fuente: SeleccionFuenteHome) {
    const id = idSeleccionFuente(fuente);
    onSeleccionChange(idSeleccionado === id ? null : fuente);
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Cuentas, tarjetas y efectivo
          </h2>
          <p className="mt-1 text-xs text-muted">
            Toca una fuente para filtrar el gráfico de abajo por sus transacciones
          </p>
        </div>
        {seleccion && (
          <button
            type="button"
            onClick={() => onSeleccionChange(null)}
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
          >
            Ver todas
          </button>
        )}
      </div>

      <div className="mt-4 space-y-5">
        <section>
          <h3 className="text-sm font-semibold text-foreground">Cuentas y Efectivo</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            <TarjetaResumen
              titulo="Efectivo en mano"
              monto={efectivo}
              moneda={moneda}
              colorMonto={efectivo > 0 ? "text-ingreso" : "text-muted"}
              colorHome={COLOR_HOME_EFECTIVO}
              icono="efectivo"
              seleccionada={idSeleccionado === "efectivo"}
              onClick={() => alternarSeleccion({ tipo: "efectivo" })}
            />

            {cuentas.map((cuenta, indice) => (
              <TarjetaResumen
                key={`cuenta-${cuenta.id}`}
                titulo={cuenta.banco}
                subtitulo={cuenta.nombre}
                monto={cuenta.saldoActual}
                moneda={cuenta.moneda}
                colorMonto={claseColorSaldoCuenta(cuenta.saldoActual)}
                colorHome={colorHomeCuenta(cuenta, indice)}
                icono={iconoHomeCuenta(cuenta)}
                seleccionada={idSeleccionado === `cuenta:${cuenta.id}`}
                onClick={() => alternarSeleccion({ tipo: "cuenta", id: cuenta.id })}
              />
            ))}
          </div>

          {cuentas.length === 0 && (
            <p className="mt-3 text-xs text-muted">
              Sin cuentas registradas.{" "}
              <Link href="/cuentas" className="font-medium text-accent hover:underline">
                Agregar cuenta
              </Link>
            </p>
          )}
        </section>

        <div className="border-t border-border" aria-hidden />

        <section>
          <h3 className="text-sm font-semibold text-foreground">Tarjetas</h3>
          {tarjetas.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {tarjetas.map((tarjeta, indice) => {
                const disponible = tarjeta.limite - tarjeta.deudaActual;
                return (
                  <TarjetaResumen
                    key={`tarjeta-${tarjeta.id}`}
                    titulo={`${tarjeta.banco} · ${tarjeta.nombreTarjeta}`}
                    subtitulo={`•••• ${tarjeta.ultimosCuatro}`}
                    monto={disponible}
                    moneda={tarjeta.moneda}
                    colorMonto={disponible > 0 ? "text-ingreso" : "text-muted"}
                    colorHome={colorHomeTarjeta(tarjeta, indice)}
                    icono="tarjeta"
                    seleccionada={idSeleccionado === `tarjeta:${tarjeta.id}`}
                    onClick={() =>
                      alternarSeleccion({ tipo: "tarjeta", id: tarjeta.id })
                    }
                  />
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted">
              Sin tarjetas registradas.{" "}
              <Link href="/tarjetas" className="font-medium text-accent hover:underline">
                Agregar tarjeta
              </Link>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
