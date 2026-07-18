"use client";

import type { FinanciamientoCuotas, ProductoFinanciamientoCuotas } from "@/types/finanzas";
import {
  etiquetaProductoFinanciamiento,
  etiquetaQuincenaVencimiento,
  financiamientoPorDefecto,
  PRODUCTOS_FINANCIAMIENTO,
  productoFinanciamientoActivo,
  quincenaDeVencimientoFinanciamiento,
} from "@/lib/financiamiento-cuotas";
import { InputNumeroTarjetaSeguro } from "@/components/tarjetas/InputNumeroTarjetaSeguro";
import { AvisoLimitePro } from "@/components/suscripcion/AvisoLimitePro";
import { MENSAJE_FINANCIAMIENTO_CUOTAS } from "@/lib/plan-limites";

const inputClass =
  "w-full min-w-0 rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none focus:border-accent sm:py-2 sm:text-sm";

export interface FormularioFinanciamientoCuotasProps {
  value: FinanciamientoCuotas;
  onChange: (value: FinanciamientoCuotas) => void;
  moneda: string;
  diaCorteTarjeta?: number;
  diaPagoTarjeta?: number;
  /** Solo Cuotas Popular: número de convenio 16 dígitos */
  digitosCuotasPopular?: string;
  onDigitosCuotasPopularChange?: (digitos: string) => void;
  numeroCuotasPopularGuardado?: string;
  /** Si false, solo se permite "Ninguna" (salvo producto ya activo). */
  permitirFinanciamiento?: boolean;
}

export function FormularioFinanciamientoCuotas({
  value,
  onChange,
  moneda,
  diaCorteTarjeta,
  diaPagoTarjeta,
  digitosCuotasPopular = "",
  onDigitosCuotasPopularChange,
  numeroCuotasPopularGuardado,
  permitirFinanciamiento = true,
}: FormularioFinanciamientoCuotasProps) {
  const activo = productoFinanciamientoActivo(value.producto);
  const diaPagoNum = Number(value.diaPago) || financiamientoPorDefecto().diaPago;
  const quincena = quincenaDeVencimientoFinanciamiento(diaPagoNum);

  const opcionesProducto = permitirFinanciamiento
    ? PRODUCTOS_FINANCIAMIENTO
    : PRODUCTOS_FINANCIAMIENTO.filter(
        (p) => p.valor === "ninguna" || p.valor === value.producto
      );

  function actualizar(parcial: Partial<FinanciamientoCuotas>) {
    onChange({ ...value, ...parcial });
  }

  function cambiarProducto(producto: ProductoFinanciamientoCuotas) {
    if (
      !permitirFinanciamiento &&
      productoFinanciamientoActivo(producto)
    ) {
      return;
    }

    if (producto === "ninguna") {
      onChange(financiamientoPorDefecto(diaCorteTarjeta, diaPagoTarjeta));
      return;
    }

    onChange({
      ...value,
      producto,
      diaCorte: value.diaCorte || diaCorteTarjeta || 15,
      diaPago: value.diaPago || diaPagoTarjeta || 30,
    });
  }

  return (
    <div className="sm:col-span-2 rounded-lg border border-border bg-background p-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">
          Financiamiento en cuotas fijas
        </span>
        <select
          value={value.producto}
          onChange={(e) =>
            cambiarProducto(e.target.value as ProductoFinanciamientoCuotas)
          }
          className={inputClass}
        >
          {opcionesProducto.map((p) => (
            <option key={p.valor} value={p.valor}>
              {p.etiqueta}
            </option>
          ))}
        </select>
        {!permitirFinanciamiento && (
          <AvisoLimitePro mensaje={MENSAJE_FINANCIAMIENTO_CUOTAS} />
        )}
        {permitirFinanciamiento && (
        <span className="text-xs text-muted">
          Al guardar con Cuotas Popular, Cuotas BHD o Credimás, se crea
          automáticamente un gasto fijo en la quincena correspondiente.
        </span>
        )}
      </label>

      {activo && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {value.producto === "cuotas-popular" && onDigitosCuotasPopularChange && (
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-foreground">
                Número Cuotas Popular (16 dígitos)
              </span>
              <InputNumeroTarjetaSeguro
                digitos={digitosCuotasPopular}
                onDigitosChange={onDigitosCuotasPopularChange}
              />
              {numeroCuotasPopularGuardado && (
                <span className="text-xs text-muted">
                  Guardado: {numeroCuotasPopularGuardado}. Escribe uno nuevo solo
                  si quieres cambiarlo.
                </span>
              )}
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Límite aprobado ({moneda})
            </span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={value.limiteAprobado || ""}
              onChange={(e) =>
                actualizar({ limiteAprobado: parseFloat(e.target.value) || 0 })
              }
              placeholder="Ej: 42000"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Balance a la fecha ({moneda})
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={value.balancePendiente || ""}
              onChange={(e) =>
                actualizar({ balancePendiente: parseFloat(e.target.value) || 0 })
              }
              placeholder="Consumido o pendiente"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-foreground">
              Cuota mensual fija ({moneda})
            </span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={value.montoCuotaMensual || ""}
              onChange={(e) =>
                actualizar({
                  montoCuotaMensual: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="Monto que pagas cada mes"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Día de corte
            </span>
            <input
              type="number"
              min={1}
              max={31}
              value={value.diaCorte}
              onChange={(e) =>
                actualizar({ diaCorte: parseInt(e.target.value, 10) || 1 })
              }
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">
              Día de pago / vencimiento
            </span>
            <input
              type="number"
              min={1}
              max={31}
              value={value.diaPago}
              onChange={(e) =>
                actualizar({ diaPago: parseInt(e.target.value, 10) || 1 })
              }
              className={inputClass}
            />
            <span className="text-xs text-muted">
              {etiquetaQuincenaVencimiento(diaPagoNum)} · Q{quincena}
            </span>
          </label>

          <div className="sm:col-span-2 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2 text-xs text-muted">
            <span className="font-medium text-foreground">
              {etiquetaProductoFinanciamiento(value.producto)}
            </span>
            {" · "}
            Vence día {value.diaPago}: si es del 1 al 24 se presupuesta en Q1
            (cobro del 15); del 25 al fin de mes, en Q2 (cobro del 30).
          </div>
        </div>
      )}
    </div>
  );
}
