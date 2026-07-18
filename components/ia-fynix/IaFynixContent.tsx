"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFinanzas } from "@/context/FinanzasContext";
import { construirContextoIaFynix } from "@/lib/ia-fynix-contexto";
import {
  CREDITOS_IA_GRATIS,
  CREDITOS_IA_PRO,
} from "@/lib/ia-fynix-constantes";
import {
  calcularRenuevaEn,
  formatoRenovacionCreditos,
  inicioPeriodoSemanalActual,
} from "@/lib/ia-fynix-uso";
import { PageContainer } from "@/components/layout/PageContainer";
import { useEntradaPagina } from "@/components/layout/useEntradaPagina";
import { AyudaPagina } from "@/components/ayuda/AyudaPagina";
import type { CreditosIaFynix, MensajeChatIa } from "@/types/ia-fynix";

const CONSULTAS_RAPIDAS = [
  "¿En qué he gastado mucho?",
  "¿Qué tarjeta me conviene pagar?",
  "¿Cómo puedo ahorrar más?",
  "Tengo dinero de más en una cuenta",
];

function creditosPorDefecto(): CreditosIaFynix {
  const periodoInicio = inicioPeriodoSemanalActual();
  const renuevaEn = calcularRenuevaEn(periodoInicio);
  return {
    usado: 0,
    limite: CREDITOS_IA_GRATIS,
    restante: CREDITOS_IA_GRATIS,
    periodoInicio,
    renuevaEn,
    plan: "gratis",
  };
}

function primerNombre(nombre?: string | null): string {
  if (!nombre?.trim()) return "ahí";
  return nombre.trim().split(/\s+/)[0];
}

function IconoAsistenteIa({
  size = 32,
  animar = false,
}: {
  size?: number;
  animar?: boolean;
}) {
  return (
    <Image
      src="/ia-fynix-icon.png"
      alt=""
      width={size}
      height={size}
      className={`shrink-0 object-contain ${animar ? "ia-anim-icono" : ""}`}
      aria-hidden
    />
  );
}

export function IaFynixContent() {
  const { sesion } = useAuth();
  const estado = useFinanzas();
  const entradaActiva = useEntradaPagina(estado.cargado);
  const [mensajes, setMensajes] = useState<MensajeChatIa[]>([]);
  const [consulta, setConsulta] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [creditos, setCreditos] = useState<CreditosIaFynix>(creditosPorDefecto);
  const [agenteDisponible, setAgenteDisponible] = useState(false);
  const finChatRef = useRef<HTMLDivElement>(null);

  const nombre = primerNombre(sesion?.nombre);
  const enInicio = mensajes.length === 0 && !cargando;

  const contexto = useMemo(
    () =>
      construirContextoIaFynix({
        transacciones: estado.transacciones,
        tarjetas: estado.tarjetas,
        cuentas: estado.cuentas,
        efectivo: estado.efectivo,
        metasAhorro: estado.metasAhorro,
        configuracion: estado.configuracion,
        prestamos: estado.prestamos,
        cuotasPopular: estado.cuotasPopular,
        gastosFijos: estado.gastosFijos,
      }),
    [
      estado.transacciones,
      estado.tarjetas,
      estado.cuentas,
      estado.efectivo,
      estado.metasAhorro,
      estado.configuracion,
      estado.prestamos,
      estado.cuotasPopular,
      estado.gastosFijos,
    ]
  );

  const cargarCreditos = useCallback(async () => {
    try {
      const res = await fetch("/api/ia/cuota");
      if (!res.ok) return;
      const data = (await res.json()) as {
        creditos?: CreditosIaFynix;
        cuota?: CreditosIaFynix;
        agenteDisponible: boolean;
      };
      const info = data.creditos ?? data.cuota;
      if (info) setCreditos(info);
      setAgenteDisponible(data.agenteDisponible);
    } catch {
      /* modo local */
    }
  }, []);

  useEffect(() => {
    void cargarCreditos();
  }, [cargarCreditos]);

  useEffect(() => {
    if (enInicio) return;
    finChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando, enInicio]);

  async function enviar(texto?: string) {
    const final = (texto ?? consulta).trim();
    if (!final || cargando) return;

    setError("");
    setConsulta("");
    setCargando(true);

    const historialEnvio = [...mensajes];
    setMensajes([...historialEnvio, { rol: "usuario", contenido: final }]);
    if (agenteDisponible && creditos.restante > 0) {
      setCreditos((prev) => ({
        ...prev,
        usado: prev.usado + 1,
        restante: Math.max(0, prev.restante - 1),
      }));
    }

    try {
      const res = await fetch("/api/ia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje: final,
          contexto,
          historial: historialEnvio,
        }),
      });

      const data = (await res.json()) as {
        respuesta?: string;
        creditos?: CreditosIaFynix;
        cuota?: CreditosIaFynix;
        error?: string;
        origen?: "agente" | "local";
      };

      const infoCreditos = data.creditos ?? data.cuota;
      if (infoCreditos) setCreditos(infoCreditos);

      if (!res.ok) {
        setError(data.error ?? "No se pudo obtener respuesta");
        setMensajes(historialEnvio);
        if (texto) setConsulta(texto);
        if (infoCreditos) setCreditos(infoCreditos);
        else void cargarCreditos();
        return;
      }

      if (data.respuesta) {
        setMensajes((prev) => [
          ...prev,
          { rol: "asistente", contenido: data.respuesta! },
        ]);
      }

      if (data.origen === "agente") {
        setAgenteDisponible(true);
      } else if (data.origen === "local") {
        setAgenteDisponible(false);
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setMensajes(historialEnvio);
      if (texto) setConsulta(texto);
      void cargarCreditos();
    } finally {
      setCargando(false);
    }
  }

  if (!estado.cargado) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted">Cargando...</p>
      </div>
    );
  }

  const sinCreditos = agenteDisponible && creditos.restante <= 0;
  const etiquetaPlan = creditos.plan === "pro" ? "Fynix Pro" : "Gratis";

  return (
    <AyudaPagina pagina="ia-fynix">
      <PageContainer
        animar={false}
        className="flex min-h-[calc(100dvh-4rem)] flex-col pb-4"
      >
        <div
          className={`flex min-h-0 flex-1 flex-col ${
            entradaActiva ? "ia-entrada-activa" : "ia-entrada-pending"
          }`}
        >
        <div className="ia-anim-subir-1 mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">IA de Fynix</h1>
            <p className="text-xs text-muted">
              {agenteDisponible
                ? `${etiquetaPlan} · ${creditos.restante}/${creditos.limite} créditos · renueva ${formatoRenovacionCreditos(creditos.renuevaEn)}`
                : "Modo local · sin OpenAI"}
            </p>
          </div>
          <IconoAsistenteIa size={36} animar />
        </div>

        <div
          className="ia-anim-panel relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 35%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 70%), var(--surface)",
          }}
        >
          <div className="ia-anim-resplandor pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,color-mix(in_srgb,var(--accent)_12%,transparent),transparent)]" />

          <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-8">
            {enInicio ? (
              <div className="flex flex-1 flex-col items-center justify-center px-2 text-center">
                <div className="mb-5">
                  <IconoAsistenteIa size={56} animar />
                </div>
                <h2 className="ia-anim-subir-2 text-3xl font-normal tracking-tight text-foreground sm:text-4xl">
                  Hola, {nombre}, empecemos
                </h2>
                <p className="ia-anim-subir-3 mt-3 max-w-md text-sm text-muted">
                  Pregúntame sobre ahorro, tarjetas, dinero en cuentas o en qué
                  gastas más en {contexto.periodoEtiqueta}.
                </p>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
                {mensajes.map((msg, i) => (
                  <div
                    key={`${msg.rol}-${i}`}
                    className={`flex gap-3 ${
                      msg.rol === "usuario" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.rol === "asistente" && (
                      <div className="mt-1">
                        <IconoAsistenteIa size={28} />
                      </div>
                    )}
                    <div
                      className={`max-w-[min(100%,32rem)] rounded-3xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.rol === "usuario"
                          ? "bg-accent/90 text-white"
                          : "bg-background/80 text-foreground shadow-sm ring-1 ring-border/60"
                      }`}
                    >
                      {msg.contenido}
                    </div>
                  </div>
                ))}

                {cargando && (
                  <div className="flex justify-start gap-3">
                    <div className="mt-1">
                      <IconoAsistenteIa size={28} />
                    </div>
                    <div className="rounded-3xl bg-background/80 px-4 py-3 text-sm text-muted ring-1 ring-border/60">
                      Pensando…
                    </div>
                  </div>
                )}
                <div ref={finChatRef} />
              </div>
            )}
          </div>

          <div className="relative shrink-0 border-t border-border/60 bg-surface/80 px-4 py-4 backdrop-blur-sm sm:px-6">
            <div className="mx-auto w-full max-w-2xl">
              <div className="ia-anim-subir-3 mb-3 flex flex-wrap justify-center gap-2">
                {CONSULTAS_RAPIDAS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    disabled={cargando || sinCreditos}
                    onClick={() => enviar(chip)}
                    className="rounded-full border border-border/80 bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent/40 hover:bg-accent/5 disabled:opacity-50"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {error && (
                <p className="mb-2 text-center text-sm text-gasto">{error}</p>
              )}
              {sinCreditos && (
                <p className="mb-2 text-center text-sm text-muted">
                  {creditos.plan === "pro"
                    ? `Usaste tus ${CREDITOS_IA_PRO} créditos. Se renuevan ${formatoRenovacionCreditos(creditos.renuevaEn)}.`
                    : `Usaste tus ${CREDITOS_IA_GRATIS} créditos. Se renuevan ${formatoRenovacionCreditos(creditos.renuevaEn)}. Con Fynix Pro tienes ${CREDITOS_IA_PRO} cada semana.`}
                </p>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void enviar();
                }}
                className="ia-anim-subir-4 flex items-center gap-2 rounded-full border border-border bg-background/95 px-2 py-2 shadow-sm ring-1 ring-border/50 focus-within:ring-accent/40"
              >
                <input
                  type="text"
                  value={consulta}
                  onChange={(e) => setConsulta(e.target.value)}
                  disabled={cargando || sinCreditos}
                  placeholder="Pregunta a Fynix"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={cargando || sinCreditos || !consulta.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-opacity hover:bg-accent-hover disabled:opacity-40"
                  aria-label="Enviar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden
                  >
                    <path d="M12 19V5" />
                    <path d="m5 12 7-7 7 7" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
        </div>
      </PageContainer>
    </AyudaPagina>
  );
}
