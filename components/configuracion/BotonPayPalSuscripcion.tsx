"use client";

import { useEffect, useRef, useState } from "react";

interface PayPalActions {
  subscription: {
    create: (opts: {
      plan_id: string;
      custom_id?: string;
    }) => Promise<string>;
  };
}

interface PayPalApproveData {
  subscriptionID?: string;
}

interface PayPalButtonsConfig {
  style?: {
    shape?: string;
    color?: string;
    layout?: string;
    label?: string;
  };
  createSubscription: (
    data: unknown,
    actions: PayPalActions
  ) => Promise<string>;
  onApprove: (data: PayPalApproveData) => void | Promise<void>;
  onError?: (err: unknown) => void;
  onCancel?: () => void;
}

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: PayPalButtonsConfig) => {
        render: (el: HTMLElement) => Promise<void>;
      };
    };
  }
}

interface BotonPayPalSuscripcionProps {
  planId: string;
  usuarioId: string;
  deshabilitado?: boolean;
  onExito: (subscriptionId: string) => void | Promise<void>;
  onError: (mensaje: string) => void;
  onCancelar?: () => void;
}

export function BotonPayPalSuscripcion({
  planId,
  usuarioId,
  deshabilitado,
  onExito,
  onError,
  onCancelar,
}: BotonPayPalSuscripcionProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [sdkListo, setSdkListo] = useState(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    if (!clientId) return;

    const existente = document.querySelector(
      'script[data-fynix-paypal="1"]'
    ) as HTMLScriptElement | null;

    if (existente) {
      if (window.paypal) setSdkListo(true);
      else existente.addEventListener("load", () => setSdkListo(true));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription&currency=USD`;
    script.async = true;
    script.dataset.fynixPaypal = "1";
    script.onload = () => setSdkListo(true);
    script.onerror = () => onError("No se pudo cargar PayPal");
    document.body.appendChild(script);
  }, [onError]);

  useEffect(() => {
    if (!sdkListo || !contenedorRef.current || !window.paypal || !planId) {
      return;
    }

    contenedorRef.current.innerHTML = "";

    window.paypal
      .Buttons({
        style: {
          shape: "rect",
          color: "gold",
          layout: "vertical",
          label: "subscribe",
        },
        createSubscription: (_data, actions) =>
          actions.subscription.create({
            plan_id: planId,
            custom_id: usuarioId,
          }),
        onApprove: async (data) => {
          if (!data.subscriptionID) {
            onError("PayPal no devolvió ID de suscripción");
            return;
          }
          await onExito(data.subscriptionID);
        },
        onError: () => onError("Error al procesar el pago con PayPal"),
        onCancel: onCancelar,
      })
      .render(contenedorRef.current);
  }, [sdkListo, planId, usuarioId, onExito, onError, onCancelar]);

  return (
    <div
      ref={contenedorRef}
      className={`mt-4 min-h-[45px] ${deshabilitado ? "pointer-events-none opacity-60" : ""}`}
    />
  );
}
