-- Ejecuta esto en Supabase → SQL Editor
-- Créditos IA de Fynix: período semanal (lunes 00:00 UTC) por usuario
-- Gratis: 20 créditos · Pro: 100 créditos (límite en app según plan)

-- Si ya tenías la tabla antigua (por fecha UTC), la recreamos:
drop table if exists public.ia_uso_diario;

create table public.ia_uso_diario (
  usuario_id uuid primary key references auth.users (id) on delete cascade,
  consultas integer not null default 0 check (consultas >= 0),
  periodo_inicio timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists ia_uso_diario_periodo_idx
  on public.ia_uso_diario (periodo_inicio);

alter table public.ia_uso_diario enable row level security;

drop policy if exists "Usuario lee su uso IA" on public.ia_uso_diario;
create policy "Usuario lee su uso IA"
  on public.ia_uso_diario
  for select
  using (auth.uid() = usuario_id);

drop policy if exists "Usuario inserta su uso IA" on public.ia_uso_diario;
create policy "Usuario inserta su uso IA"
  on public.ia_uso_diario
  for insert
  with check (auth.uid() = usuario_id);

drop policy if exists "Usuario actualiza su uso IA" on public.ia_uso_diario;
create policy "Usuario actualiza su uso IA"
  on public.ia_uso_diario
  for update
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);
