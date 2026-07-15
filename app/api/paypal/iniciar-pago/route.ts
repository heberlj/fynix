import { NextResponse } from "next/server";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import { registrarPagoPendiente } from "@/lib/paypal-pago-enlace";
import { paypalEnlacePago } from "@/lib/paypal-client";

export async function POST() {
  if (!paypalEnlacePago()) {
    return NextResponse.json(
      { error: "Enlace de pago no configurado" },
      { status: 503 }
    );
  }

  const supabase = await crearClienteSupabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  try {
    await registrarPagoPendiente(supabase, user.id, user.email);

    return NextResponse.json({
      ok: true,
      enlace: paypalEnlacePago(),
    });
  } catch (error) {
    console.error("Error en POST /api/paypal/iniciar-pago:", error);
    return NextResponse.json(
      { error: "No se pudo preparar el pago. ¿Ejecutaste paypal-pagos-pendientes.sql?" },
      { status: 500 }
    );
  }
}
