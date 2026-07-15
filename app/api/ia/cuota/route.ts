import { NextResponse } from "next/server";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import { obtenerCreditosIaUsuario } from "@/lib/ia-fynix-uso";
import { openaiConfigurado } from "@/lib/openai";

export async function GET() {
  const supabase = await crearClienteSupabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  try {
    const creditos = await obtenerCreditosIaUsuario(supabase, user.id);
    return NextResponse.json({
      creditos,
      cuota: creditos,
      agenteDisponible: openaiConfigurado(),
    });
  } catch (error) {
    console.error("Error en GET /api/ia/cuota:", error);
    return NextResponse.json(
      { error: "No se pudieron obtener los créditos" },
      { status: 500 }
    );
  }
}
