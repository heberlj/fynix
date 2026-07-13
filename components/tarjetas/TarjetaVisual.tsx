"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import type { MarcaTarjeta, TarjetaCredito } from "@/types/finanzas";

interface TarjetaVisualProps {
  tarjeta: Pick<
    TarjetaCredito,
    | "marca"
    | "titular"
    | "numeroEnmascarado"
    | "fechaExpiracion"
    | "cvv"
    | "banco"
    | "nombreTarjeta"
    | "moneda"
  >;
  compacta?: boolean;
}

const ESTILOS_MARCA: Record<
  MarcaTarjeta,
  { gradiente: string; acento: string; brillo: string }
> = {
  visa: {
    gradiente: "from-[#0f1d5c] via-[#1a3a8f] to-[#0d2a6e]",
    acento: "text-sky-200/90",
    brillo: "bg-sky-300/10",
  },
  mastercard: {
    gradiente: "from-[#14141f] via-[#4a1515] to-[#1a0a0a]",
    acento: "text-orange-200/90",
    brillo: "bg-orange-300/10",
  },
  desconocida: {
    gradiente: "from-zinc-800 via-zinc-700 to-zinc-900",
    acento: "text-zinc-300",
    brillo: "bg-white/5",
  },
};

function LogoMarca({
  marca,
  compacta,
}: {
  marca: MarcaTarjeta;
  compacta: boolean;
}) {
  const altura = compacta ? "h-6" : "h-8";

  if (marca === "visa") {
    return (
      <Image
        src="/visa-logo.png"
        alt="Visa"
        width={120}
        height={72}
        className={`${altura} w-auto object-contain`}
        priority
      />
    );
  }

  if (marca === "mastercard") {
    return (
      <Image
        src="/mastercard-logo.png"
        alt="Mastercard"
        width={96}
        height={72}
        className={`${compacta ? "h-7" : "h-9"} w-auto object-contain`}
        priority
      />
    );
  }

  return (
    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
      Tarjeta
    </span>
  );
}

function Chip({ compacta }: { compacta: boolean }) {
  return (
    <div
      className={`rounded-md bg-linear-to-br from-amber-200 via-yellow-400 to-amber-500 shadow-inner ${
        compacta ? "h-7 w-10" : "h-8 w-11"
      }`}
    >
      <div className="grid h-full w-full grid-cols-2 gap-px p-1 opacity-30">
        <div className="rounded-sm border border-amber-900/40" />
        <div className="rounded-sm border border-amber-900/40" />
        <div className="rounded-sm border border-amber-900/40" />
        <div className="rounded-sm border border-amber-900/40" />
      </div>
    </div>
  );
}

function ContenidoFrente({
  tarjeta,
  estilo,
  compacta,
}: {
  tarjeta: TarjetaVisualProps["tarjeta"];
  estilo: (typeof ESTILOS_MARCA)[MarcaTarjeta];
  compacta: boolean;
}) {
  const padding = compacta ? "p-4" : "p-5 sm:p-6";
  const numeroClass = compacta
    ? "text-[13px] tracking-[0.14em] sm:text-sm"
    : "text-sm tracking-[0.16em] sm:text-base";

  return (
    <>
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full ${estilo.brillo}`}
      />
      <div
        className={`pointer-events-none absolute -bottom-14 -left-10 h-40 w-40 rounded-full ${estilo.brillo}`}
      />

      <div className={`relative flex h-full flex-col ${padding}`}>
        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p
              className={`truncate font-semibold uppercase tracking-[0.18em] ${estilo.acento} ${
                compacta ? "text-[9px]" : "text-[10px]"
              }`}
            >
              {tarjeta.banco || "Banco"}
            </p>
            <p
              className={`mt-0.5 truncate text-white/75 ${
                compacta ? "text-[11px]" : "text-xs"
              }`}
            >
              {tarjeta.nombreTarjeta || "Crédito"}
            </p>
          </div>
          {tarjeta.moneda && (
            <span
              className={`shrink-0 rounded-full bg-white/15 font-semibold text-white backdrop-blur-sm ${
                compacta
                  ? "px-1.5 py-0.5 text-[9px]"
                  : "px-2 py-0.5 text-[10px]"
              }`}
            >
              {tarjeta.moneda}
            </span>
          )}
        </div>

        {/* Chip */}
        <div className={compacta ? "mt-3" : "mt-4"}>
          <Chip compacta={compacta} />
        </div>

        {/* Número */}
        <div className={`flex flex-1 items-center ${compacta ? "py-1" : "py-2"}`}>
          <p
            className={`w-full font-mono font-medium text-white ${numeroClass}`}
            style={{ wordSpacing: compacta ? "0.2em" : "0.35em" }}
          >
            {tarjeta.numeroEnmascarado || "•••• •••• •••• ••••"}
          </p>
        </div>

        {/* Pie */}
        <div
          className={`grid items-end gap-x-3 ${
            tarjeta.marca === "visa" || tarjeta.marca === "mastercard"
              ? "grid-cols-[1fr_auto_auto]"
              : "grid-cols-[1fr_auto]"
          }`}
        >
          <div className="min-w-0">
            <p className="text-[9px] font-medium uppercase tracking-wider text-white/45">
              Titular
            </p>
            <p
              className={`truncate font-medium uppercase tracking-wide text-white ${
                compacta ? "text-[11px]" : "text-xs sm:text-sm"
              }`}
            >
              {tarjeta.titular || "Nombre Apellido"}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[9px] font-medium uppercase tracking-wider text-white/45">
              Válida hasta
            </p>
            <p
              className={`font-mono font-medium text-white ${
                compacta ? "text-[11px]" : "text-xs sm:text-sm"
              }`}
            >
              {tarjeta.fechaExpiracion || "MM/AA"}
            </p>
          </div>

          {(tarjeta.marca === "visa" || tarjeta.marca === "mastercard") && (
            <div className="flex shrink-0 items-end justify-end pb-0.5">
              <LogoMarca marca={tarjeta.marca} compacta={compacta} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ContenidoReverso({
  tarjeta,
  compacta,
}: {
  tarjeta: TarjetaVisualProps["tarjeta"];
  compacta: boolean;
}) {
  return (
    <div className={`flex h-full flex-col ${compacta ? "p-4" : "p-5 sm:p-6"}`}>
      <div className={`w-full rounded-sm bg-black/85 ${compacta ? "mt-2 h-8" : "mt-3 h-10"}`} />

      <div className={`flex flex-1 flex-col justify-center ${compacta ? "px-1 pt-3" : "px-2 pt-4"}`}>
        <div className="flex justify-end">
          <div
            className={`rounded bg-white/95 shadow-sm ${
              compacta ? "min-w-[72px] px-3 py-1.5" : "min-w-[84px] px-4 py-2"
            }`}
          >
            <p className="text-[9px] font-medium uppercase tracking-wider text-zinc-500">
              CVV
            </p>
            <p
              className={`text-right font-mono font-bold tracking-widest text-zinc-900 ${
                compacta ? "text-xs" : "text-sm"
              }`}
            >
              {tarjeta.cvv || "•••"}
            </p>
          </div>
        </div>

        <div
          className={`mt-4 rounded bg-white/15 ${
            compacta ? "h-6" : "h-8"
          }`}
        />
      </div>

      <p className="text-center text-[9px] text-white/35">
        Toca para voltear
      </p>
    </div>
  );
}

export function TarjetaVisual({ tarjeta, compacta = false }: TarjetaVisualProps) {
  const [mostrarReverso, setMostrarReverso] = useState(false);
  const estilo = ESTILOS_MARCA[tarjeta.marca];

  const voltear = useCallback(() => {
    setMostrarReverso((v) => !v);
  }, []);

  const manejarTecla = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        voltear();
      }
    },
    [voltear]
  );

  const claseCara = `card-face overflow-hidden bg-linear-to-br ${estilo.gradiente} shadow-xl ring-1 ring-white/10`;

  return (
    <div className={compacta ? "w-full max-w-[300px]" : "w-full max-w-[360px]"}>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={manejarTecla}
        className="perspective-card w-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        aria-label={
          mostrarReverso ? "Ver frente de la tarjeta" : "Ver reverso de la tarjeta"
        }
      >
        <div
          className={`card-inner cursor-pointer select-none ${
            mostrarReverso ? "is-flipped" : ""
          }`}
          onClick={voltear}
        >
          <div className={`card-face card-face-front ${claseCara}`}>
            <ContenidoFrente tarjeta={tarjeta} estilo={estilo} compacta={compacta} />
          </div>

          <div className={`card-face card-face-back ${claseCara}`}>
            <ContenidoReverso tarjeta={tarjeta} compacta={compacta} />
          </div>
        </div>
      </div>

      <p className="mt-2 text-center text-[11px] text-muted">
        Toca para ver el reverso
      </p>
    </div>
  );
}
