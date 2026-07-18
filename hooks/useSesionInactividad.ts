"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  SESION_AVISO_MS,
  SESION_INACTIVIDAD_MS,
  SESION_REINICIO_MIN_MS,
} from "@/lib/sesion-inactividad-constantes";

const EVENTOS_ACTIVIDAD = [
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "click",
] as const;

interface OpcionesSesionInactividad {
  activo: boolean;
  onExpirar: () => void;
}

export function useSesionInactividad({
  activo,
  onExpirar,
}: OpcionesSesionInactividad) {
  const [mostrarAviso, setMostrarAviso] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(
    Math.ceil(SESION_AVISO_MS / 1000)
  );

  const timerInactividadRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const timerAvisoRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervaloAvisoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ultimoReinicioRef = useRef(0);
  const onExpirarRef = useRef(onExpirar);
  const mostrarAvisoRef = useRef(false);

  onExpirarRef.current = onExpirar;
  mostrarAvisoRef.current = mostrarAviso;

  const limpiarTimers = useCallback(() => {
    if (timerInactividadRef.current) {
      clearTimeout(timerInactividadRef.current);
      timerInactividadRef.current = null;
    }
    if (timerAvisoRef.current) {
      clearTimeout(timerAvisoRef.current);
      timerAvisoRef.current = null;
    }
    if (intervaloAvisoRef.current) {
      clearInterval(intervaloAvisoRef.current);
      intervaloAvisoRef.current = null;
    }
  }, []);

  const iniciarCuentaAtras = useCallback(() => {
    const totalSegundos = Math.ceil(SESION_AVISO_MS / 1000);
    setSegundosRestantes(totalSegundos);

    intervaloAvisoRef.current = setInterval(() => {
      setSegundosRestantes((prev) => Math.max(0, prev - 1));
    }, 1000);

    timerAvisoRef.current = setTimeout(() => {
      limpiarTimers();
      setMostrarAviso(false);
      onExpirarRef.current();
    }, SESION_AVISO_MS);
  }, [limpiarTimers]);

  const mostrarAvisoExpiracion = useCallback(() => {
    setMostrarAviso(true);
    iniciarCuentaAtras();
  }, [iniciarCuentaAtras]);

  const reiniciarTemporizador = useCallback(() => {
    limpiarTimers();
    setMostrarAviso(false);
    setSegundosRestantes(Math.ceil(SESION_AVISO_MS / 1000));

    timerInactividadRef.current = setTimeout(
      mostrarAvisoExpiracion,
      SESION_INACTIVIDAD_MS
    );
  }, [limpiarTimers, mostrarAvisoExpiracion]);

  const extenderSesion = useCallback(() => {
    ultimoReinicioRef.current = Date.now();
    reiniciarTemporizador();
  }, [reiniciarTemporizador]);

  const registrarActividad = useCallback(() => {
    if (!activo || mostrarAvisoRef.current) return;

    const ahora = Date.now();
    if (ahora - ultimoReinicioRef.current < SESION_REINICIO_MIN_MS) return;

    ultimoReinicioRef.current = ahora;
    reiniciarTemporizador();
  }, [activo, reiniciarTemporizador]);

  useEffect(() => {
    if (!activo) {
      limpiarTimers();
      setMostrarAviso(false);
      return;
    }

    ultimoReinicioRef.current = Date.now();
    reiniciarTemporizador();

    for (const evento of EVENTOS_ACTIVIDAD) {
      window.addEventListener(evento, registrarActividad, { passive: true });
    }

    return () => {
      limpiarTimers();
      for (const evento of EVENTOS_ACTIVIDAD) {
        window.removeEventListener(evento, registrarActividad);
      }
    };
  }, [activo, limpiarTimers, registrarActividad, reiniciarTemporizador]);

  return {
    mostrarAviso,
    segundosRestantes,
    extenderSesion,
  };
}
