import { NextResponse } from "next/server";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import { supabaseAdminConfigurado } from "@/lib/supabase/admin";
import {
  mapearEstadoPaypal,
  obtenerSuscripcionPaypal,
  paypalConfigurado,
} from "@/lib/paypal";
import { guardarSuscripcionUsuario } from "@/lib/suscripcion-server";

export async function POST(request: Request) {
  if (!paypalConfigurado() || !supabaseAdminConfigurado()) {
    return NextResponse.json(
      { error: "Servidor no configurado" },
      { status: 503 }
    );
  }

  const supabase = await crearClienteSupabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  let body: { subscriptionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const subscriptionId = body.subscriptionId;
  if (!subscriptionId) {
    return NextResponse.json(
      { error: "subscriptionId requerido" },
      { status: 400 }
    );
  }

  try {
    const sub = await obtenerSuscripcionPaypal(subscriptionId);

    if (sub.custom_id && sub.custom_id !== user.id) {
      return NextResponse.json({ error: "Suscripción no autorizada" }, { status: 403 });
    }

    const { plan, estado } = mapearEstadoPaypal(sub.status);
    const periodoFin = sub.billing_info?.next_billing_time
      ? new Date(sub.billing_info.next_billing_time)
      : null;

    await guardarSuscripcionUsuario({
      usuarioId: user.id,
      plan,
      estado,
      paypalSubscriptionId: sub.id,
      paypalPayerId: sub.subscriber?.payer_id ?? null,
      periodoFin,
    });

    return NextResponse.json({ ok: true, plan, estado });
  } catch (error) {
    console.error("Error activando suscripción PayPal:", error);
    return NextResponse.json(
      { error: "No se pudo verificar la suscripción" },
      { status: 500 }
    );
  }
}
