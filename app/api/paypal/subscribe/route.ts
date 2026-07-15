import { NextResponse } from "next/server";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import {
  crearSuscripcionPaypal,
  obtenerPlanProId,
  paypalConfigurado,
  urlBaseApp,
} from "@/lib/paypal";

export async function POST(request: Request) {
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

  try {
    const planId = await obtenerPlanProId();
    const base = urlBaseApp(request.url);

    const suscripcion = await crearSuscripcionPaypal({
      planId,
      usuarioId: user.id,
      returnUrl: `${base}/configuracion?paypal=return`,
      cancelUrl: `${base}/configuracion?paypal=cancel`,
    });

    const approvalUrl = suscripcion.links?.find((link) => link.rel === "approve")
      ?.href;

    if (!approvalUrl) {
      return NextResponse.json(
        { error: "PayPal no devolvió enlace de aprobación" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscriptionId: suscripcion.id,
      approvalUrl,
      planId,
    });
  } catch (error) {
    console.error("Error en POST /api/paypal/subscribe:", error);
    const detalle =
      error instanceof Error ? error.message : "Error desconocido";
    const mensaje = detalle.includes("PAYPAL_AUTH")
      ? "Credenciales de PayPal inválidas. Revisa .env.local y reinicia el servidor."
      : "No se pudo iniciar el pago con PayPal. Verifica que tu cuenta Business tenga suscripciones activadas.";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
