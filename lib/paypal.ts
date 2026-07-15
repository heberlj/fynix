import { PRECIO_PRO_MENSUAL_USD } from "@/lib/suscripcion";
import type { EstadoSuscripcion, PlanSuscripcion } from "@/types/suscripcion";

export function paypalConfigurado(): boolean {
  return Boolean(
    process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
  );
}

export function paypalModo(): "live" | "sandbox" {
  return process.env.PAYPAL_MODE === "live" ? "live" : "sandbox";
}

function paypalApiBase(): string {
  return paypalModo() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

let tokenCache: { token: string; expira: number } | null = null;

async function obtenerAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expira) {
    return tokenCache.token;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("PAYPAL_NO_CONFIGURADO");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const detalle = await res.text();
    console.error("PayPal auth error:", res.status, detalle);
    throw new Error(`PAYPAL_AUTH_${res.status}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    token: data.access_token,
    expira: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

async function paypalApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await obtenerAccessToken();
  const res = await fetch(`${paypalApiBase()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const texto = await res.text();
    throw new Error(`PayPal ${res.status}: ${texto}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export interface PayPalSubscription {
  id: string;
  status: string;
  custom_id?: string;
  subscriber?: {
    payer_id?: string;
    email_address?: string;
  };
  billing_info?: {
    next_billing_time?: string;
  };
}

export function mapearEstadoPaypal(status: string): {
  plan: PlanSuscripcion;
  estado: EstadoSuscripcion;
} {
  switch (status) {
    case "ACTIVE":
    case "APPROVED":
      return { plan: "pro", estado: "activo" };
    case "APPROVAL_PENDING":
      return { plan: "gratis", estado: "pendiente" };
    case "CANCELLED":
      return { plan: "gratis", estado: "cancelado" };
    case "EXPIRED":
    case "SUSPENDED":
      return { plan: "gratis", estado: "vencido" };
    default:
      return { plan: "gratis", estado: "pendiente" };
  }
}

export async function obtenerSuscripcionPaypal(
  subscriptionId: string
): Promise<PayPalSubscription> {
  return paypalApi(`/v1/billing/subscriptions/${subscriptionId}`);
}

export async function cancelarSuscripcionPaypal(
  subscriptionId: string,
  motivo?: string
): Promise<void> {
  await paypalApi(`/v1/billing/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    body: JSON.stringify({
      reason: motivo ?? "Usuario canceló desde Fynix",
    }),
  });
}

export interface PayPalSubscriptionLink {
  href: string;
  rel: string;
  method: string;
}

export interface PayPalSubscriptionCreada {
  id: string;
  status: string;
  links?: PayPalSubscriptionLink[];
}

export function urlBaseApp(desde?: string | URL): string {
  const configurada = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configurada) return configurada.replace(/\/$/, "");
  if (desde) return new URL(desde).origin;
  return "http://localhost:3000";
}

export async function crearSuscripcionPaypal(opciones: {
  planId: string;
  usuarioId: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<PayPalSubscriptionCreada> {
  return paypalApi<PayPalSubscriptionCreada>("/v1/billing/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: opciones.planId,
      custom_id: opciones.usuarioId,
      application_context: {
        brand_name: "Fynix",
        locale: "es-ES",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        payment_method: {
          payer_selected: "PAYPAL",
          payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
        },
        return_url: opciones.returnUrl,
        cancel_url: opciones.cancelUrl,
      },
    }),
  });
}

async function asegurarPlanActivo(planId: string): Promise<string> {
  const plan = await paypalApi<{ id: string; status?: string }>(
    `/v1/billing/plans/${planId}`
  );

  if (plan.status !== "ACTIVE") {
    await paypalApi(`/v1/billing/plans/${planId}/activate`, { method: "POST" });
  }

  return planId;
}

async function buscarPlanProExistente(): Promise<string | null> {
  const data = await paypalApi<{ plans?: { id: string; name?: string; status?: string }[] }>(
    "/v1/billing/plans?page_size=20&total_required=true"
  );

  const plan = data.plans?.find(
    (item) => item.name === "Fynix Pro Mensual" && item.status === "ACTIVE"
  );

  return plan?.id ?? null;
}

let planIdCache: string | null = null;

export async function obtenerPlanProId(): Promise<string> {
  const existente = process.env.PAYPAL_PLAN_ID?.trim();
  if (existente) {
    planIdCache = await asegurarPlanActivo(existente);
    return planIdCache;
  }

  if (planIdCache) {
    return asegurarPlanActivo(planIdCache);
  }

  const reutilizable = await buscarPlanProExistente();
  if (reutilizable) {
    planIdCache = reutilizable;
    return planIdCache;
  }

  const producto = await paypalApi<{ id: string }>("/v1/catalogs/products", {
    method: "POST",
    body: JSON.stringify({
      name: "Fynix Pro",
      description: "Suscripción mensual a Fynix Pro",
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });

  const plan = await paypalApi<{ id: string; status?: string }>(
    "/v1/billing/plans",
    {
      method: "POST",
      body: JSON.stringify({
        product_id: producto.id,
        name: "Fynix Pro Mensual",
        description: `Fynix Pro · US$${PRECIO_PRO_MENSUAL_USD}/mes`,
        status: "ACTIVE",
        billing_cycles: [
          {
            frequency: { interval_unit: "MONTH", interval_count: 1 },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: {
                value: PRECIO_PRO_MENSUAL_USD.toFixed(2),
                currency_code: "USD",
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3,
        },
        taxes: {
          percentage: "0",
          inclusive: false,
        },
      }),
    }
  );

  planIdCache = await asegurarPlanActivo(plan.id);
  console.info(`[PayPal] Plan Fynix Pro listo: ${planIdCache}`);
  return planIdCache;
}

export async function verificarWebhookPaypal(
  headers: Headers,
  body: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;

  const resultado = await paypalApi<{ verification_status: string }>(
    "/v1/notifications/verify-webhook-signature",
    {
      method: "POST",
      body: JSON.stringify({
        auth_algo: headers.get("paypal-auth-algo"),
        cert_url: headers.get("paypal-cert-url"),
        transmission_id: headers.get("paypal-transmission-id"),
        transmission_sig: headers.get("paypal-transmission-sig"),
        transmission_time: headers.get("paypal-transmission-time"),
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
      }),
    }
  );

  return resultado.verification_status === "SUCCESS";
}
