-- ============================================================
-- 008 · sesiones
-- ------------------------------------------------------------
-- Entidad principal de "¿Qué toca hoy?": la sesión de clase que
-- el docente captura desde su carta descriptiva. Reemplaza al
-- CRUD genérico core_items (003) para este producto.
--
-- Cada usuario solo ve y edita sus propias sesiones (RLS abajo).
-- ============================================================

create table if not exists public.sesiones (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  unidad              text not null,
  fecha               date not null,
  tema                text not null,
  actividad_planeada  text,
  estatus             text not null default 'planeada',  -- planeada | impartida | reprogramada
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint sesiones_estatus_check
    check (estatus in ('planeada', 'impartida', 'reprogramada'))
);

comment on table public.sesiones is 'Sesiones de clase capturadas por el docente desde su carta descriptiva.';

create index if not exists sesiones_user_id_fecha_idx on public.sesiones (user_id, fecha asc);

drop trigger if exists sesiones_set_updated_at on public.sesiones;
create trigger sesiones_set_updated_at
  before update on public.sesiones
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- RLS — dueño total sobre sus filas, nadie más.
-- ------------------------------------------------------------
alter table public.sesiones enable row level security;

drop policy if exists "sesiones_select_own" on public.sesiones;
create policy "sesiones_select_own"
  on public.sesiones for select
  using (auth.uid() = user_id);

drop policy if exists "sesiones_insert_own" on public.sesiones;
create policy "sesiones_insert_own"
  on public.sesiones for insert
  with check (auth.uid() = user_id);

drop policy if exists "sesiones_update_own" on public.sesiones;
create policy "sesiones_update_own"
  on public.sesiones for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "sesiones_delete_own" on public.sesiones;
create policy "sesiones_delete_own"
  on public.sesiones for delete
  using (auth.uid() = user_id);
