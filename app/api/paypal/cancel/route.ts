import { NextResponse } from "next/server";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import {
  cancelarSuscripcionPaypal,
  mapearEstadoPaypal,
  paypalConfigurado,
} from "@/lib/paypal";
import { guardarSuscripcionAuth } from "@/lib/suscripcion-server";

export async function POST() {
  if (!paypalConfigurado()) {
    return NextResponse.json(
      { error: "PayPal no está configurado" },
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

  const { data: fila } = await supabase
    .from("suscripciones")
    .select("paypal_subscription_id, plan, estado")
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (!fila?.paypal_subscription_id) {
    return NextResponse.json(
      { error: "No tienes una suscripción de PayPal activa" },
      { status: 400 }
    );
  }

  try {
    await cancelarSuscripcionPaypal(fila.paypal_subscription_id);
    const { plan, estado } = mapearEstadoPaypal("CANCELLED");

    await guardarSuscripcionAuth(supabase, {
      usuarioId: user.id,
      plan,
      estado,
      paypalSubscriptionId: fila.paypal_subscription_id,
      periodoFin: null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error cancelando suscripción PayPal:", error);
    return NextResponse.json(
      { error: "No se pudo cancelar la suscripción" },
      { status: 500 }
    );
  }
}
