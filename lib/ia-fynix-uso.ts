import type { SupabaseClient } from "@supabase/supabase-js";
import { MS_POR_SEMANA } from "@/lib/ia-fynix-constantes";
import {
  SUSCRIPCION_GRATIS,
  filaASuscripcion,
  limiteCreditosIa,
} from "@/lib/suscripcion";
import type { CreditosIaFynix } from "@/types/ia-fynix";
import type { SuscripcionFila } from "@/types/suscripcion";

function inicioSemanaUtc(fecha: Date): Date {
  const inicio = new Date(
    Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate())
  );
  const dia = inicio.getUTCDay();
  const diasDesdeLunes = (dia + 6) % 7;
  inicio.setUTCDate(inicio.getUTCDate() - diasDesdeLunes);
  return inicio;
}

/** Lunes 00:00 UTC de la semana actual (inicio del período de créditos). */
export function inicioPeriodoSemanalActual(): string {
  return inicioSemanaUtc(new Date()).toISOString();
}

function periodoExpirado(periodoInicio: string): boolean {
  const actual = inicioSemanaUtc(new Date()).getTime();
  const inicio = inicioSemanaUtc(new Date(periodoInicio)).getTime();
  return actual > inicio;
}

export function calcularRenuevaEn(periodoInicio: string): string {
  const semanaInicio = inicioSemanaUtc(new Date(periodoInicio));
  return new Date(semanaInicio.getTime() + MS_POR_SEMANA).toISOString();
}

export function formatoRenovacionCreditos(renuevaEn: string): string {
  const fecha = new Date(renuevaEn);
  const diff = fecha.getTime() - Date.now();
  if (diff <= 0) return "muy pronto";

  const dias = Math.ceil(diff / 86_400_000);
  if (dias === 1) return "mañana";

  const diaSemana = fecha.toLocaleDateString("es", { weekday: "long" });
  if (dias <= 6) return `el ${diaSemana}`;

  return fecha.toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
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

  const periodoActual = inicioPeriodoSemanalActual();
  const ahora = new Date().toISOString();

  if (!data) {
    return { consultas: 0, periodoInicio: periodoActual };
  }

  const periodoInicio = String(data.periodo_inicio);

  if (periodoExpirado(periodoInicio)) {
    const { error: resetError } = await supabase.from("ia_uso_diario").upsert({
      usuario_id: usuarioId,
      consultas: 0,
      periodo_inicio: periodoActual,
      actualizado_en: ahora,
    });

    if (resetError) {
      throw new Error(resetError.message);
    }

    return { consultas: 0, periodoInicio: periodoActual };
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
