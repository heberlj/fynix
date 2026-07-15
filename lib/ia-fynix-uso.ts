import type { SupabaseClient } from "@supabase/supabase-js";
import { PERIODO_CREDITOS_MS } from "@/lib/ia-fynix-constantes";
import {
  SUSCRIPCION_GRATIS,
  filaASuscripcion,
  limiteCreditosIa,
} from "@/lib/suscripcion";
import type { CreditosIaFynix } from "@/types/ia-fynix";
import type { SuscripcionFila } from "@/types/suscripcion";

function periodoExpirado(periodoInicio: string): boolean {
  return Date.now() - new Date(periodoInicio).getTime() >= PERIODO_CREDITOS_MS;
}

export function calcularRenuevaEn(periodoInicio: string): string {
  return new Date(
    new Date(periodoInicio).getTime() + PERIODO_CREDITOS_MS
  ).toISOString();
}

export function formatoRenovacionCreditos(renuevaEn: string): string {
  const diff = new Date(renuevaEn).getTime() - Date.now();
  if (diff <= 0) return "muy pronto";
  const minutos = Math.ceil(diff / 60_000);
  if (minutos < 60) return `en ${minutos} min`;
  const horas = Math.ceil(diff / 3_600_000);
  return `en ${horas} h`;
}

export function creditosDesdeUso(
  usado: number,
  limite: number,
  plan: CreditosIaFynix["plan"],
  periodoInicio: string
): CreditosIaFynix {
  return {
    usado,
    limite,
    restante: Math.max(0, limite - usado),
    periodoInicio,
    renuevaEn: calcularRenuevaEn(periodoInicio),
    plan,
  };
}

async function obtenerSuscripcionAuth(
  supabase: SupabaseClient,
  usuarioId: string
) {
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

async function leerRegistroUso(
  supabase: SupabaseClient,
  usuarioId: string
): Promise<{ consultas: number; periodoInicio: string }> {
  const { data, error } = await supabase
    .from("ia_uso_diario")
    .select("consultas, periodo_inicio")
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const ahora = new Date().toISOString();

  if (!data) {
    return { consultas: 0, periodoInicio: ahora };
  }

  const periodoInicio = String(data.periodo_inicio);

  if (periodoExpirado(periodoInicio)) {
    const { error: resetError } = await supabase.from("ia_uso_diario").upsert({
      usuario_id: usuarioId,
      consultas: 0,
      periodo_inicio: ahora,
      actualizado_en: ahora,
    });

    if (resetError) {
      throw new Error(resetError.message);
    }

    return { consultas: 0, periodoInicio: ahora };
  }

  return {
    consultas: Number(data.consultas) || 0,
    periodoInicio,
  };
}

export async function obtenerCreditosIaUsuario(
  supabase: SupabaseClient,
  usuarioId: string
): Promise<CreditosIaFynix> {
  const suscripcion = await obtenerSuscripcionAuth(supabase, usuarioId);
  const limite = limiteCreditosIa(suscripcion);
  const { consultas, periodoInicio } = await leerRegistroUso(supabase, usuarioId);

  return creditosDesdeUso(consultas, limite, suscripcion.plan, periodoInicio);
}

export async function consumirCreditoIa(
  supabase: SupabaseClient,
  usuarioId: string
): Promise<
  { ok: true; creditos: CreditosIaFynix } | { ok: false; creditos: CreditosIaFynix }
> {
  const creditosActuales = await obtenerCreditosIaUsuario(supabase, usuarioId);

  if (creditosActuales.restante <= 0) {
    return { ok: false, creditos: creditosActuales };
  }

  const nuevoUso = creditosActuales.usado + 1;
  const ahora = new Date().toISOString();

  const { error } = await supabase.from("ia_uso_diario").upsert({
    usuario_id: usuarioId,
    consultas: nuevoUso,
    periodo_inicio: creditosActuales.periodoInicio,
    actualizado_en: ahora,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    ok: true,
    creditos: creditosDesdeUso(
      nuevoUso,
      creditosActuales.limite,
      creditosActuales.plan,
      creditosActuales.periodoInicio
    ),
  };
}
