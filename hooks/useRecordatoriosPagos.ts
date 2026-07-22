"use client";

import { useEffect } from "react";
import { useFinanzas } from "@/context/FinanzasContext";
import {
  fechaHoyRecordatorio,
  listarProximosPagos,
  pagosUrgentes,
} from "@/lib/proximos-pagos";
import {
  marcarRecordatorioNotificado,
  obtenerRecordatoriosPagos,
  recordatorioYaNotificadoHoy,
} from "@/lib/recordatorios-pagos";
import { formatearMoneda } from "@/lib/quincenas";

const INTERVALO_MS = 60 * 60 * 1000;

export function useRecordatoriosPagos() {
  const { cargado, tarjetas, prestamos, cuotasPopular, gastosFijos, transacciones, configuracion } =
    useFinanzas();

  useEffect(() => {
    if (!cargado) return;

    const recordatorios = obtenerRecordatoriosPagos(configuracion);
    if (!recordatorios.activo || !recordatorios.notificacionesNavegador) {
      return;
    }

    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (Notification.permission !== "granted") {
      return;
    }

    function enviarRecordatorios() {
      const hoy = fechaHoyRecordatorio();
      const pagos = listarProximosPagos(
        {
          tarjetas,
          prestamos,
          cuotasPopular,
          gastosFijos,
          transacciones,
          configuracion,
        },
        new Date()
      );

      const urgentes = pagosUrgentes(pagos, recordatorios.diasAntes);

      for (const pago of urgentes) {
        if (recordatorioYaNotificadoHoy(pago.id, hoy)) continue;

        const titulo = pago.esHoy
          ? `Pago hoy: ${pago.nombre}`
          : `Pago próximo: ${pago.nombre}`;

        const cuerpo = pago.esHoy
          ? `${formatearMoneda(pago.monto, pago.moneda)} vence hoy (día ${pago.diaPago})`
          : `${formatearMoneda(pago.monto, pago.moneda)} en ${pago.diasRestantes} día${pago.diasRestantes !== 1 ? "s" : ""} (día ${pago.diaPago})`;

        try {
          new Notification(titulo, {
            body: cuerpo,
            tag: pago.id,
            icon: "/icon.png",
          });
          marcarRecordatorioNotificado(pago.id, hoy);
        } catch {
          // Ignorar si el navegador bloquea la notificación
        }
      }
    }

    enviarRecordatorios();
    const intervalo = window.setInterval(enviarRecordatorios, INTERVALO_MS);
    window.addEventListener("focus", enviarRecordatorios);

    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener("focus", enviarRecordatorios);
    };
  }, [
    cargado,
    tarjetas,
    prestamos,
    cuotasPopular,
    gastosFijos,
    transacciones,
    configuracion,
  ]);
}
