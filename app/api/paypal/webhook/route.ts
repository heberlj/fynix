import { NextResponse } from "next/server";
import {
  mapearEstadoPaypal,
  obtenerSuscripcionPaypal,
  paypalConfigurado,
  verificarWebhookPaypal,
} from "@/lib/paypal";
import { supabaseAdminConfigurado } from "@/lib/supabase/admin";
import {
  activarProPorPagoEnlace,
  EVENTOS_PAGO_ENLACE,
  type EventoPagoPaypal,
} from "@/lib/paypal-pago-enlace";
import {
  guardarSuscripcionUsuario,
  obtenerUsuarioPorSuscripcionPaypal,
} from "@/lib/suscripcion-server";

export const runtime = "nodejs";

const EVENTOS_SUSCRIPCION = [
  "BILLING.SUBSCRIPTION.ACTIVATED",
  "BILLING.SUBSCRIPTION.UPDATED",
  "BILLING.SUBSCRIPTION.CANCELLED",
  "BILLING.SUBSCRIPTION.EXPIRED",
  "BILLING.SUBSCRIPTION.SUSPENDED",
] as const;

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

  let event: EventoPagoPaypal & {
    resource?: { id?: string; custom_id?: string };
  };

  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!event.event_type) {
    return NextResponse.json({ received: true });
  }

  try {
    if (EVENTOS_PAGO_ENLACE.includes(event.event_type as (typeof EVENTOS_PAGO_ENLACE)[number])) {
      await activarProPorPagoEnlace(event);
      return NextResponse.json({ received: true });
    }

    if (!EVENTOS_SUSCRIPCION.includes(event.event_type as (typeof EVENTOS_SUSCRIPCION)[number])) {
      return NextResponse.json({ received: true });
    }

    const subscriptionId = event.resource?.id;
    if (!subscriptionId) {
      return NextResponse.json({ received: true });
    }

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
