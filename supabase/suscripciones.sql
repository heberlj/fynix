-- Ejecuta esto en Supabase → SQL Editor

create table if not exists public.suscripciones (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'gratis' check (plan in ('gratis', 'pro')),
  estado text not null default 'activo' check (estado in ('activo', 'cancelado', 'vencido', 'pendiente')),
  paypal_subscription_id text,
  paypal_payer_id text,
  periodo_fin timestamptz,
  actualizado_en timestamptz not null default now()
);

create index if not exists suscripciones_paypal_subscription_idx
  on public.suscripciones (paypal_subscription_id);

alter table public.suscripciones enable row level security;

drop policy if exists "Usuario lee su suscripción" on public.suscripciones;
create policy "Usuario lee su suscripción"
  on public.suscripciones
  for select
  using (auth.uid() = usuario_id);

drop policy if exists "Usuario inserta su suscripción" on public.suscripciones;
create policy "Usuario inserta su suscripción"
  on public.suscripciones
  for insert
  with check (auth.uid() = usuario_id);

drop policy if exists "Usuario actualiza su suscripción" on public.suscripciones;
create policy "Usuario actualiza su suscripción"
  on public.suscripciones
  for update
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- El webhook usa SUPABASE_SERVICE_ROLE_KEY (bypasea RLS)
