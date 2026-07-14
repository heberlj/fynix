-- Si ya creaste la tabla con columnas de Stripe, ejecuta esto:

alter table public.suscripciones
  add column if not exists paypal_subscription_id text,
  add column if not exists paypal_payer_id text;

create index if not exists suscripciones_paypal_subscription_idx
  on public.suscripciones (paypal_subscription_id);

-- Opcional: eliminar columnas viejas de Stripe
-- alter table public.suscripciones drop column if exists stripe_customer_id;
-- alter table public.suscripciones drop column if exists stripe_subscription_id;
-- drop index if exists suscripciones_stripe_customer_idx;
