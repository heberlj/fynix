import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanSuscripcion, EstadoSuscripcion } from "@/types/suscripcion";
import {
  crearSupabaseAdmin,
  supabaseAdminConfigurado,
} from "@/lib/supabase/admin";
import { SUSCRIPCION_GRATIS, filaASuscripcion } from "@/lib/suscripcion";
import type { SuscripcionFila, SuscripcionUsuario } from "@/types/suscripcion";

export async function guardarSuscripcionAuth(
  supabase: SupabaseClient,
  datos: {
    usuarioId: string;
    plan: PlanSuscripcion;
    estado: EstadoSuscripcion;
    paypalSubscriptionId?: string | null;
    paypalPayerId?: string | null;
    periodoFin?: Date | null;
  }
) {
  const { error } = await supabase.from("suscripciones").upsert({
    usuario_id: datos.usuarioId,
    plan: datos.plan,
    estado: datos.estado,
    paypal_subscription_id: datos.paypalSubscriptionId ?? null,
    paypal_payer_id: datos.paypalPayerId ?? null,
    periodo_fin: datos.periodoFin?.toISOString() ?? null,
    actualizado_en: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function guardarSuscripcionUsuario(datos: {
  usuarioId: string;
  plan: PlanSuscripcion;
  estado: EstadoSuscripcion;
  paypalSubscriptionId?: string | null;
  paypalPayerId?: string | null;
  periodoFin?: Date | null;
}) {
  const supabase = crearSupabaseAdmin();

  const { error } = await supabase.from("suscripciones").upsert(
    {
      usuario_id: datos.usuarioId,
      plan: datos.plan,
      estado: datos.estado,
      paypal_subscription_id: datos.paypalSubscriptionId ?? null,
      paypal_payer_id: datos.paypalPayerId ?? null,
      periodo_fin: datos.periodoFin?.toISOString() ?? null,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: "usuario_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function obtenerUsuarioPorSuscripcionPaypal(
  subscriptionId: string
) {
  const supabase = crearSupabaseAdmin();
  const { data, error } = await supabase
    .from("suscripciones")
    .select("usuario_id")
    .eq("paypal_subscription_id", subscriptionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.usuario_id as string | undefined;
}

export async function obtenerSuscripcionUsuarioServidor(
  usuarioId: string
): Promise<SuscripcionUsuario> {
  if (!supabaseAdminConfigurado()) {
    return { ...SUSCRIPCION_GRATIS, usuarioId };
  }

  const supabase = crearSupabaseAdmin();
  const { data, error } = await supabase
    .from("suscripciones")
    .select("*")
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  if (error || !data) {
    return { ...SUSCRIPCION_GRATIS, usuarioId };
  }

  return filaASuscripcion(data as SuscripcionFila);
}
