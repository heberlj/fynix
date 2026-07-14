import { NextResponse } from "next/server";
import {
  mapearEstadoPaypal,
  obtenerSuscripcionPaypal,
  paypalConfigurado,
  verificarWebhookPaypal,
} from "@/lib/paypal";
import { supabaseAdminConfigurado } from "@/lib/supabase/admin";
import {
  guardarSuscripcionUsuario,
  obtenerUsuarioPorSuscripcionPaypal,
} from "@/lib/suscripcion-server";

export const runtime = "nodejs";

async function sincronizarDesdePaypal(
  subscriptionId: string,
  usuarioId?: string
) {
  const sub = await obtenerSuscripcionPaypal(subscriptionId);
  const userId =
    usuarioId ?? sub.custom_id ?? (await obtenerUsuarioPorSuscripcionPaypal(sub.id));

  if (!userId) return;

  const { plan, estado } = mapearEstadoPaypal(sub.status);
  const periodoFin = sub.billing_info?.next_billing_time
    ? new Date(sub.billing_info.next_billing_time)
    : null;

  await guardarSuscripcionUsuario({
    usuarioId: userId,
    plan,
    estado,
    paypalSubscriptionId: sub.id,
    paypalPayerId: sub.subscriber?.payer_id ?? null,
    periodoFin,
  });
}

export async function POST(request: Request) {
  if (!paypalConfigurado() || !supabaseAdminConfigurado()) {
    return NextResponse.json({ error: "Servidor no configurado" }, { status: 503 });
  }

  const body = await request.text();

  if (process.env.PAYPAL_WEBHOOK_ID) {
    const valido = await verificarWebhookPaypal(request.headers, body);
    if (!valido) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
    }
  }

  let event: {
    event_type?: string;
    resource?: { id?: string; custom_id?: string };
  };

  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const subscriptionId = event.resource?.id;
  if (!subscriptionId) {
    return NextResponse.json({ received: true });
  }

  const eventos = [
    "BILLING.SUBSCRIPTION.ACTIVATED",
    "BILLING.SUBSCRIPTION.UPDATED",
    "BILLING.SUBSCRIPTION.CANCELLED",
    "BILLING.SUBSCRIPTION.EXPIRED",
    "BILLING.SUBSCRIPTION.SUSPENDED",
  ];

  if (!event.event_type || !eventos.includes(event.event_type)) {
    return NextResponse.json({ received: true });
  }

  try {
    await sincronizarDesdePaypal(
      subscriptionId,
      event.resource?.custom_id ?? undefined
    );
  } catch (error) {
    console.error("Error procesando webhook PayPal:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
