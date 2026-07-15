import { NextResponse } from "next/server";
import { crearClienteSupabaseServidor } from "@/lib/supabase/server";
import { tienePlanPro, filaASuscripcion } from "@/lib/suscripcion";
import type { SuscripcionFila } from "@/types/suscripcion";

export async function GET() {
  const supabase = await crearClienteSupabaseServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const { data: suscripcion } = await supabase
    .from("suscripciones")
    .select("*")
    .eq("usuario_id", user.id)
    .maybeSingle();

  const plan = suscripcion
    ? filaASuscripcion(suscripcion as SuscripcionFila)
    : null;

  const { data: pagoPendiente } = await supabase
    .from("paypal_pagos_pendientes")
    .select("estado, expira_en")
    .eq("usuario_id", user.id)
    .eq("estado", "pendiente")
    .gt("expira_en", new Date().toISOString())
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    pro: plan ? tienePlanPro(plan) : false,
    plan: plan?.plan ?? "gratis",
    estado: plan?.estado ?? "activo",
    pagoPendiente: Boolean(pagoPendiente),
  });
}
