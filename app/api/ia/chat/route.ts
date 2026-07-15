import { NextResponse } from "next/server";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import { responderAgenteIaFynix } from "@/lib/ia-fynix-agente";
import {
  consumirCreditoIa,
  formatoRenovacionCreditos,
  obtenerCreditosIaUsuario,
} from "@/lib/ia-fynix-uso";
import { openaiConfigurado } from "@/lib/openai";
import type { ContextoIaFynix } from "@/lib/ia-fynix-contexto";
import { respuestaLocalComoChat } from "@/lib/ia-fynix-sugerencias";
import { mensajeErrorOpenAI } from "@/lib/openai-errores";
import type { ChatIaRequest, MensajeChatIa } from "@/types/ia-fynix";

function contextoValido(ctx: unknown): ctx is ContextoIaFynix {
  if (!ctx || typeof ctx !== "object") return false;
  const c = ctx as ContextoIaFynix;
  return (
    typeof c.monedaReferencia === "string" &&
    typeof c.periodoEtiqueta === "string" &&
    Array.isArray(c.gastosPorCategoria) &&
    Array.isArray(c.cuentas) &&
    Array.isArray(c.tarjetas) &&
    Array.isArray(c.metasAhorro)
  );
}

function historialValido(historial: unknown): historial is MensajeChatIa[] {
  if (!Array.isArray(historial)) return false;
  return historial.every(
    (m) =>
      m &&
      typeof m === "object" &&
      (m.rol === "usuario" || m.rol === "asistente") &&
      typeof m.contenido === "string"
  );
}

function mensajeSinCreditos(
  plan: string,
  renuevaEn: string
): string {
  const cuando = ` Se renuevan ${formatoRenovacionCreditos(renuevaEn)}.`;
  if (plan === "pro") {
    return `Usaste tus 50 créditos de este período.${cuando}`;
  }
  return `Usaste tus 10 créditos de este período. Con Fynix Pro tienes 50 cada 24 h.${cuando}`;
}

export async function POST(request: Request) {
  const supabase = await crearClienteSupabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  let body: ChatIaRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const mensaje = body.mensaje?.trim();
  if (!mensaje) {
    return NextResponse.json({ error: "Escribe un mensaje" }, { status: 400 });
  }

  if (!contextoValido(body.contexto)) {
    return NextResponse.json({ error: "Contexto inválido" }, { status: 400 });
  }

  const historial = historialValido(body.historial) ? body.historial : [];

  try {
    const creditosActuales = await obtenerCreditosIaUsuario(supabase, user.id);

    if (!openaiConfigurado()) {
      return NextResponse.json({
        respuesta: respuestaLocalComoChat(body.contexto, mensaje),
        creditos: creditosActuales,
        origen: "local",
      });
    }

    if (creditosActuales.restante <= 0) {
      return NextResponse.json(
        {
          error: mensajeSinCreditos(
            creditosActuales.plan,
            creditosActuales.renuevaEn
          ),
          creditos: creditosActuales,
        },
        { status: 429 }
      );
    }

    const respuesta = await responderAgenteIaFynix(
      mensaje,
      body.contexto,
      historial
    );

    const consumo = await consumirCreditoIa(supabase, user.id);
    if (!consumo.ok) {
      return NextResponse.json(
        {
          error: mensajeSinCreditos(
            consumo.creditos.plan,
            consumo.creditos.renuevaEn
          ),
          creditos: consumo.creditos,
        },
        { status: 429 }
      );
    }

    return NextResponse.json({
      respuesta,
      creditos: consumo.creditos,
      origen: "agente",
    });
  } catch (error) {
    console.error("Error en POST /api/ia/chat:", error);
    return NextResponse.json(
      { error: mensajeErrorOpenAI(error) },
      { status: 500 }
    );
  }
}
