import { MODELO_IA_FYNIX_DEFAULT } from "@/lib/ia-fynix-constantes";

export function openaiConfigurado(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

interface MensajeOpenAI {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function completarChatOpenAI(
  mensajes: MensajeOpenAI[]
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_NO_CONFIGURADO");
  }

  const model = process.env.IA_FYNIX_MODEL?.trim() || MODELO_IA_FYNIX_DEFAULT;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: mensajes,
      temperature: 0.4,
      max_tokens: 700,
    }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    throw new Error(`OPENAI_ERROR_${res.status}: ${detalle.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const contenido = data.choices?.[0]?.message?.content?.trim();
  if (!contenido) {
    throw new Error("OPENAI_RESPUESTA_VACIA");
  }

  return contenido;
}
