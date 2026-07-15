import { NextResponse } from "next/server";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import { obtenerPlanProId, paypalConfigurado, paypalModo } from "@/lib/paypal";

export async function GET() {
  if (!paypalConfigurado()) {
    return NextResponse.json(
      { error: "PayPal no está configurado en el servidor" },
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

  try {
    const planId = await obtenerPlanProId();

    return NextResponse.json({
      planId,
      clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "",
      usuarioId: user.id,
      modo: paypalModo(),
    });
  } catch (error) {
    console.error("Error en /api/paypal/config:", error);
    const modo = paypalModo();
    const mensaje =
      error instanceof Error && error.message === "PAYPAL_AUTH_401"
        ? `Credenciales de PayPal inválidas. Verifica Client ID y Secret en modo ${modo} y que PAYPAL_MODE=${modo}.`
        : "No se pudo conectar con PayPal. Revisa las credenciales en .env.local.";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
