export function esErrorOpenAIRecuperable(error: unknown): boolean {
  const texto =
    error instanceof Error ? error.message : String(error);

  return (
    texto.includes("OPENAI_ERROR_") ||
    texto.includes("OPENAI_NO_CONFIGURADO") ||
    texto.includes("OPENAI_RESPUESTA_VACIA") ||
    texto.includes("Incorrect API key") ||
    texto.includes("exceeded your current quota")
  );
}

export function mensajeErrorOpenAI(error: unknown): string {
  const texto =
    error instanceof Error ? error.message : String(error);

  if (texto.includes("OPENAI_ERROR_429") || texto.includes("exceeded your current quota")) {
    return "Tu cuenta de OpenAI no tiene saldo activo. Agrega un método de pago en platform.openai.com → Billing y vuelve a intentar.";
  }

  if (texto.includes("OPENAI_ERROR_401") || texto.includes("Incorrect API key")) {
    return "La API key de OpenAI no es válida. Revisa OPENAI_API_KEY en .env.local y reinicia el servidor.";
  }

  if (texto.includes("OPENAI_NO_CONFIGURADO")) {
    return "OpenAI no está configurado en el servidor.";
  }

  return "No se pudo obtener respuesta del agente. Intenta de nuevo en unos segundos.";
}
