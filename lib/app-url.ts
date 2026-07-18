const URL_PRODUCCION = "https://fynixmoney.com";

/** URL pública de la app (emails de auth, PayPal, etc.). */
export function urlBaseApp(): string {
  const configurada = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configurada) {
    return configurada.replace(/\/$/, "");
  }

  const netlify = process.env.URL?.trim();
  if (netlify) {
    return `https://${netlify.replace(/\/$/, "")}`;
  }

  const deployPrime = process.env.DEPLOY_PRIME_URL?.trim();
  if (deployPrime) {
    return deployPrime.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (typeof window !== "undefined") {
    const { origin, hostname } = window.location;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return origin;
    }
  }

  return URL_PRODUCCION;
}

export function urlAuthCallback(destino = "/login"): string {
  const base = urlBaseApp();
  const ruta = destino.startsWith("/") ? destino : `/${destino}`;
  return `${base}/auth/callback?next=${encodeURIComponent(ruta)}`;
}
