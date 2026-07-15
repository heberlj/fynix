import { crearSupabaseAdmin } from "@/lib/supabase/admin";
import { guardarSuscripcionUsuario } from "@/lib/suscripcion-server";

export const EVENTOS_PAGO_ENLACE = [
  "CHECKOUT.ORDER.APPROVED",
  "CHECKOUT.ORDER.COMPLETED",
  "PAYMENT.CAPTURE.COMPLETED",
  "PAYMENT.SALE.COMPLETED",
] as const;

export interface EventoPagoPaypal {
  event_type?: string;
  resource?: Record<string, unknown>;
}

function texto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() ? valor.trim() : null;
}

export function extraerEmailPagador(evento: EventoPagoPaypal): string | null {
  const resource = evento.resource;
  if (!resource) return null;

  const payer = resource.payer as Record<string, unknown> | undefined;
  const emailPayer = texto(payer?.email_address);
  if (emailPayer) return emailPayer.toLowerCase();

  const paymentSource = resource.payment_source as Record<string, unknown> | undefined;
  const paypalSource = paymentSource?.paypal as Record<string, unknown> | undefined;
  const emailSource = texto(paypalSource?.email_address);
  if (emailSource) return emailSource.toLowerCase();

  const purchaseUnits = resource.purchase_units as Record<string, unknown>[] | undefined;
  const pagador = purchaseUnits?.[0]?.payee as Record<string, unknown> | undefined;
  const emailPayee = texto(pagador?.email_address);
  if (emailPayee) return emailPayee.toLowerCase();

  return null;
}

export function extraerIdTransaccion(evento: EventoPagoPaypal): string | null {
  const resource = evento.resource;
  if (!resource) return null;

  const relatedIds = (
    resource.supplementary_data as Record<string, unknown> | undefined
  )?.related_ids as Record<string, unknown> | undefined;

  return (
    texto(resource.id) ??
    texto(resource.sale_id) ??
    texto(relatedIds?.order_id)
  );
}

export function extraerPayerId(evento: EventoPagoPaypal): string | null {
  const resource = evento.resource;
  if (!resource) return null;

  const payer = resource.payer as Record<string, unknown> | undefined;
  return texto(payer?.payer_id);
}

async function transaccionYaProcesada(transaccionId: string): Promise<boolean> {
  const supabase = crearSupabaseAdmin();
  const { data } = await supabase
    .from("paypal_pagos_pendientes")
    .select("id")
    .eq("paypal_transaccion_id", transaccionId)
    .maybeSingle();

  return Boolean(data);
}

async function buscarUsuarioIdPorEmail(email: string): Promise<string | null> {
  const supabase = crearSupabaseAdmin();
  const normalizado = email.toLowerCase();

  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    throw new Error(error.message);
  }

  const usuario = data.users.find(
    (item) => item.email?.toLowerCase() === normalizado
  );

  return usuario?.id ?? null;
}

async function resolverUsuarioId(emailPagador: string | null): Promise<string | null> {
  const supabase = crearSupabaseAdmin();
  const ahora = new Date().toISOString();

  if (emailPagador) {
    const { data: pendiente } = await supabase
      .from("paypal_pagos_pendientes")
      .select("usuario_id")
      .eq("email", emailPagador)
      .eq("estado", "pendiente")
      .gt("expira_en", ahora)
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendiente?.usuario_id) {
      return pendiente.usuario_id as string;
    }

    const porEmail = await buscarUsuarioIdPorEmail(emailPagador);
    if (porEmail) return porEmail;
  }

  const { data: ultimoPendiente } = await supabase
    .from("paypal_pagos_pendientes")
    .select("usuario_id")
    .eq("estado", "pendiente")
    .gt("expira_en", ahora)
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (ultimoPendiente?.usuario_id as string | undefined) ?? null;
}

export async function activarProPorPagoEnlace(
  evento: EventoPagoPaypal
): Promise<boolean> {
  const transaccionId = extraerIdTransaccion(evento);
  if (!transaccionId) return false;

  if (await transaccionYaProcesada(transaccionId)) {
    return true;
  }

  const emailPagador = extraerEmailPagador(evento);
  const usuarioId = await resolverUsuarioId(emailPagador);
  if (!usuarioId) return false;

  const periodoFin = new Date();
  periodoFin.setMonth(periodoFin.getMonth() + 1);

  await guardarSuscripcionUsuario({
    usuarioId,
    plan: "pro",
    estado: "activo",
    paypalSubscriptionId: transaccionId,
    paypalPayerId: extraerPayerId(evento),
    periodoFin,
  });

  const supabase = crearSupabaseAdmin();
  const ahora = new Date().toISOString();

  const { data: pendiente } = await supabase
    .from("paypal_pagos_pendientes")
    .select("id")
    .eq("usuario_id", usuarioId)
    .eq("estado", "pendiente")
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pendiente?.id) {
    await supabase
      .from("paypal_pagos_pendientes")
      .update({
        estado: "completado",
        paypal_transaccion_id: transaccionId,
        completado_en: ahora,
      })
      .eq("id", pendiente.id);
  } else {
    await supabase.from("paypal_pagos_pendientes").insert({
      usuario_id: usuarioId,
      email: emailPagador ?? "sin-email@fynix.local",
      estado: "completado",
      paypal_transaccion_id: transaccionId,
      completado_en: ahora,
      expira_en: ahora,
    });
  }

  return true;
}

export async function registrarPagoPendiente(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  usuarioId: string,
  email: string
) {
  const correo = email.trim().toLowerCase();
  const expira = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  await supabase
    .from("paypal_pagos_pendientes")
    .update({ estado: "expirado" })
    .eq("usuario_id", usuarioId)
    .eq("estado", "pendiente");

  const { error } = await supabase.from("paypal_pagos_pendientes").insert({
    usuario_id: usuarioId,
    email: correo,
    estado: "pendiente",
    expira_en: expira,
  });

  if (error) {
    throw new Error(error.message);
  }
}
