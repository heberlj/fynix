-- Ejecuta en Supabase → SQL Editor
-- Vincula pagos del enlace de PayPal con usuarios de Fynix

create table if not exists public.paypal_pagos_pendientes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'completado', 'expirado')),
  paypal_transaccion_id text unique,
  creado_en timestamptz not null default now(),
  expira_en timestamptz not null default (now() + interval '2 hours'),
  completado_en timestamptz
);

create index if not exists paypal_pagos_pendientes_usuario_idx
  on public.paypal_pagos_pendientes (usuario_id, estado);

create index if not exists paypal_pagos_pendientes_email_idx
  on public.paypal_pagos_pendientes (lower(email), estado);

alter table public.paypal_pagos_pendientes enable row level security;

drop policy if exists "Usuario registra su pago pendiente" on public.paypal_pagos_pendientes;
create policy "Usuario registra su pago pendiente"
  on public.paypal_pagos_pendientes
  for insert
  with check (auth.uid() = usuario_id);

drop policy if exists "Usuario lee su pago pendiente" on public.paypal_pagos_pendientes;
create policy "Usuario lee su pago pendiente"
  on public.paypal_pagos_pendientes
  for select
  using (auth.uid() = usuario_id);

drop policy if exists "Usuario actualiza su pago pendiente" on public.paypal_pagos_pendientes;
create policy "Usuario actualiza su pago pendiente"
  on public.paypal_pagos_pendientes
  for update
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- El webhook usa SUPABASE_SERVICE_ROLE_KEY (bypasea RLS)
