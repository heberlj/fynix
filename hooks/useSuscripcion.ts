"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { crearClienteSupabase } from "@/lib/supabase/client";
import { SUSCRIPCION_GRATIS, filaASuscripcion } from "@/lib/suscripcion";
import type { SuscripcionFila, SuscripcionUsuario } from "@/types/suscripcion";

export function useSuscripcion() {
  const { sesion, cargado: authCargado } = useAuth();
  const [suscripcion, setSuscripcion] = useState<SuscripcionUsuario>(
    SUSCRIPCION_GRATIS
  );
  const [cargado, setCargado] = useState(false);

  const recargar = useCallback(async () => {
    if (!sesion) {
      setSuscripcion(SUSCRIPCION_GRATIS);
      setCargado(true);
      return;
    }

    try {
      const supabase = crearClienteSupabase();
      const { data, error } = await supabase
        .from("suscripciones")
        .select("*")
        .eq("usuario_id", sesion.usuarioId)
        .maybeSingle();

      if (error || !data) {
        setSuscripcion({ ...SUSCRIPCION_GRATIS, usuarioId: sesion.usuarioId });
      } else {
        setSuscripcion(
          filaASuscripcion(data as SuscripcionFila)
        );
      }
    } catch {
      setSuscripcion({ ...SUSCRIPCION_GRATIS, usuarioId: sesion.usuarioId });
    } finally {
      setCargado(true);
    }
  }, [sesion]);

  useEffect(() => {
    if (!authCargado) return;
    setCargado(false);
    void recargar();
  }, [authCargado, recargar]);

  return { suscripcion, cargado: authCargado && cargado, recargar };
}
