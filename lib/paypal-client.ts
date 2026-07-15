export function paypalPublicoConfigurado(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
      process.env.NEXT_PUBLIC_PAYPAL_PAYMENT_LINK
  );
}

export function paypalEnlacePago(): string | null {
  const enlace = process.env.NEXT_PUBLIC_PAYPAL_PAYMENT_LINK?.trim();
  return enlace || null;
}

export function usaEnlacePagoPaypal(): boolean {
  return Boolean(paypalEnlacePago());
}
