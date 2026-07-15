"use client";

import { formatearMoneda } from "@/lib/quincenas";

export interface SegmentoCircular {
  id: string;
  etiqueta: string;
  valor: number;
  color: string;
  descripcion?: string;
}

interface GraficoCircularProps {
  segmentos: SegmentoCircular[];
  moneda: string;
  titulo: string;
  subtitulo?: string;
  centroEtiqueta?: string;
  centroValor?: string;
  centroNota?: string;
  totalReferencia?: number;
  mensajeVacio?: string;
  className?: string;
  segmentoSeleccionado?: string | null;
  onSegmentoClick?: (id: string) => void;
}

export function GraficoCircular({
  segmentos,
  moneda,
  titulo,
  subtitulo,
  centroEtiqueta,
  centroValor,
  centroNota,
  totalReferencia,
  mensajeVacio = "Sin datos para mostrar",
  className = "",
  segmentoSeleccionado = null,
  onSegmentoClick,
}: GraficoCircularProps) {
  const segmentosActivos = segmentos.filter((s) => s.valor > 0);
  const total =
    totalReferencia ??
    segmentosActivos.reduce((sum, s) => sum + s.valor, 0);

  let acumulado = 0;
  const gradiente =
    total > 0
      ? segmentosActivos
          .map((seg) => {
            const porcentaje = (seg.valor / total) * 100;
            const inicio = acumulado;
            acumulado += porcentaje;
            return `${seg.color} ${inicio}% ${acumulado}%`;
          })
          .join(", ")
      : "var(--border) 0% 100%";

  return (
    <div
      className={`flex h-full flex-col rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-6 ${className}`}
    >
      <h3 className="text-base font-semibold text-foreground">{titulo}</h3>
      {subtitulo && (
        <p className="mt-1 text-xs leading-relaxed text-muted">{subtitulo}</p>
      )}

      {segmentosActivos.length === 0 || total <= 0 ? (
        <div className="mt-6 flex flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-background min-h-[12rem]">
          <p className="px-4 text-center text-sm text-muted">{mensajeVacio}</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-1 flex-col gap-5 lg:mt-5 lg:justify-between">
          <div className="flex justify-center lg:py-1">
            <div className="relative h-40 w-40 shrink-0 sm:h-44 sm:w-44 lg:h-48 lg:w-48 xl:h-52 xl:w-52">
            <div
              className="h-full w-full rounded-full shadow-inner"
              style={{ background: `conic-gradient(${gradiente})` }}
              role="img"
              aria-label={titulo}
            />
            <div className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full bg-surface px-2 text-center shadow-sm">
              {centroEtiqueta && (
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted sm:text-xs">
                  {centroEtiqueta}
                </p>
              )}
              {centroValor && (
                <p className="mt-0.5 text-sm font-bold leading-tight text-foreground sm:text-base">
                  {centroValor}
                </p>
              )}
              {centroNota && (
                <p className="mt-1 text-[10px] leading-snug text-muted sm:text-xs">
                  {centroNota}
                </p>
              )}
            </div>
          </div>
          </div>

          <ul className="min-w-0 flex-1 space-y-2 lg:space-y-2.5">
            {segmentos.map((seg) => {
              const porcentaje =
                total > 0 && seg.valor > 0
                  ? (seg.valor / total) * 100
                  : 0;
              const seleccionado = segmentoSeleccionado === seg.id;
              const clickeable = Boolean(onSegmentoClick);

              const contenido = (
                <>
                  <div className="flex items-start gap-2.5">
                    <span
                      className="mt-1 h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: seg.color }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                        <span className="text-sm font-medium text-foreground">
                          {seg.etiqueta}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {formatearMoneda(seg.valor, moneda)}
                          {seg.valor > 0 && (
                            <span className="ml-1 text-xs font-normal text-muted">
                              ({porcentaje.toFixed(0)}%)
                            </span>
                          )}
                        </span>
                      </div>
                      {seg.descripcion && (
                        <p className="mt-0.5 text-xs leading-relaxed text-muted">
                          {seg.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              );

              return (
                <li key={seg.id}>
                  {clickeable ? (
                    <button
                      type="button"
                      onClick={() => onSegmentoClick?.(seg.id)}
                      disabled={seg.valor <= 0}
                      className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        seleccionado
                          ? "border-accent bg-accent/10 ring-1 ring-accent/30"
                          : "border-border bg-background hover:border-accent/40 hover:bg-surface-hover"
                      } ${seg.valor <= 0 ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      {contenido}
                    </button>
                  ) : (
                    <div
                      className={`rounded-lg border border-border bg-background px-3 py-2.5 ${
                        seg.valor <= 0 ? "opacity-50" : ""
                      }`}
                    >
                      {contenido}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
