-- Tabla de estado financiero por usuario (JSON completo de la app)
create table if not exists public.estado_finanzas (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  datos jsonb not null default '{}'::jsonb,
  actualizado_en timestamptz not null default now()
);

alter table public.estado_finanzas enable row level security;

drop policy if exists "estado_finanzas_select_own" on public.estado_finanzas;
create policy "estado_finanzas_select_own"
  on public.estado_finanzas
  for select
  using (auth.uid() = usuario_id);

drop policy if exists "estado_finanzas_insert_own" on public.estado_finanzas;
create policy "estado_finanzas_insert_own"
  on public.estado_finanzas
  for insert
  with check (auth.uid() = usuario_id);

drop policy if exists "estado_finanzas_update_own" on public.estado_finanzas;
create policy "estado_finanzas_update_own"
  on public.estado_finanzas
  for update
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);
