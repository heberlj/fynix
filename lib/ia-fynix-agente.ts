import type { ContextoIaFynix } from "@/lib/ia-fynix-contexto";
import { MAX_HISTORIAL_AGENTE } from "@/lib/ia-fynix-constantes";
import { completarChatOpenAI } from "@/lib/openai";
import type { MensajeChatIa } from "@/types/ia-fynix";

const SYSTEM_PROMPT = `Eres el asistente financiero de Fynix. Respondes en español, de forma clara y práctica.

Reglas:
- Usa SOLO los datos del contexto JSON que te envían. No inventes montos, cuentas ni tarjetas.
- Si falta información, dilo y sugiere qué registrar en la app.
- Enfócate en: ahorro, qué tarjeta pagar primero, qué hacer con dinero disponible y dónde gastó más.
- No prometas rendimientos ni des asesoría legal/fiscal.
- Respuestas concisas (máximo 3-4 párrafos cortos). Usa listas cuando ayude.
- Montos en la moneda indicada en el contexto.`;

export function serializarContextoIa(ctx: ContextoIaFynix): string {
  return JSON.stringify(ctx, null, 2);
}

function recortarHistorial(historial: MensajeChatIa[]): MensajeChatIa[] {
  return historial.slice(-MAX_HISTORIAL_AGENTE);
}

export async function responderAgenteIaFynix(
  mensaje: string,
  contexto: ContextoIaFynix,
  historial: MensajeChatIa[] = []
): Promise<string> {
  const mensajes = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    {
      role: "user" as const,
      content: `Contexto financiero del usuario (${contexto.periodoEtiqueta}):\n\`\`\`json\n${serializarContextoIa(contexto)}\n\`\`\``,
    },
    {
      role: "assistant" as const,
      content:
        "Entendido. Usaré solo ese contexto para responder. ¿En qué te ayudo?",
    },
    ...recortarHistorial(historial).map((m) => ({
      role: (m.rol === "usuario" ? "user" : "assistant") as "user" | "assistant",
      content: m.contenido,
    })),
    { role: "user" as const, content: mensaje },
  ];

  return completarChatOpenAI(mensajes);
}
