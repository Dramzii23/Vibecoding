-- ============================================================
-- 006 · events (analytics fallback)
-- ------------------------------------------------------------
-- Tabla de eventos para tracking propio cuando no se usa PostHog
-- (opcional). Permite eventos anónimos (user_id nullable): si el
-- usuario aún no inició sesión, el evento se guarda sin dueño.
--
-- El alumno NO modela tablas: este schema ya viene completo.
-- ============================================================

create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete set null,
  name        text not null,
  properties  jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

comment on table public.events is 'Eventos de analytics (fallback si no se usa PostHog). user_id nullable para eventos anónimos.';

create index if not exists events_name_idx on public.events (name);
create index if not exists events_created_at_idx on public.events (created_at desc);

-- ------------------------------------------------------------
-- RLS · events
--   - insert: cualquier autenticado; anónimo solo si user_id is null.
--   - select: cada quien solo ve sus propios eventos.
-- ------------------------------------------------------------
alter table public.events enable row level security;

drop policy if exists "events_insert_authenticated" on public.events;
create policy "events_insert_authenticated"
  on public.events for insert
  to authenticated
  with check (true);

drop policy if exists "events_insert_anon" on public.events;
create policy "events_insert_anon"
  on public.events for insert
  to anon
  with check (user_id is null);

drop policy if exists "events_select_own" on public.events;
create policy "events_select_own"
  on public.events for select
  to authenticated
  using (auth.uid() = user_id);
