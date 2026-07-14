import type { PlanSuscripcion, EstadoSuscripcion } from "@/types/suscripcion";
import { crearSupabaseAdmin } from "@/lib/supabase/admin";

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
