-- ============================================================
-- 019 · alumnos (registros, sin cuenta de auth)
-- ------------------------------------------------------------
-- Un alumno NO es una cuenta de Supabase Auth: es un registro que
-- el maestro captura para su clase (el landing describe un futuro
-- "entra con matrícula y PIN", pero eso es otra iteración). Aquí
-- solo: nombre, matrícula, email opcional, a qué maestro pertenece
-- y — opcionalmente — a qué materia.
--
-- `maestro_id` (dueño, para RLS) apunta a auth.users igual que
-- materias.user_id. `materia_id` es opcional: un alumno puede estar
-- suelto (aún sin asignar a materia) o ligado a una.
--
-- RLS: el maestro dueño tiene CRUD total sobre sus alumnos; el
-- super_admin puede leer todos (panel de gestión). El super_admin
-- NO edita/borra alumnos ajenos desde el panel en esta versión —
-- si luego se necesita, se añade la policy de update/delete.
-- ============================================================

create table if not exists public.alumnos (
  id           uuid primary key default gen_random_uuid(),
  maestro_id   uuid not null references auth.users (id) on delete cascade,
  materia_id   uuid references public.materias (id) on delete set null,
  nombre       text not null,
  matricula    text,
  email        text,
  activo       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint alumnos_matricula_por_maestro_unique unique (maestro_id, matricula)
);

comment on table public.alumnos is 'Alumno capturado por un maestro. Sin cuenta de auth propia.';
comment on column public.alumnos.matricula is 'Matrícula/ID escolar. Única por maestro cuando se especifica (NULL no colisiona).';

create index if not exists alumnos_maestro_id_idx on public.alumnos (maestro_id, created_at desc);
create index if not exists alumnos_materia_id_idx on public.alumnos (materia_id);

drop trigger if exists alumnos_set_updated_at on public.alumnos;
create trigger alumnos_set_updated_at
  before update on public.alumnos
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.alumnos enable row level security;

drop policy if exists "alumnos_select_own" on public.alumnos;
create policy "alumnos_select_own"
  on public.alumnos for select
  using (auth.uid() = maestro_id);

drop policy if exists "alumnos_insert_own" on public.alumnos;
create policy "alumnos_insert_own"
  on public.alumnos for insert
  with check (auth.uid() = maestro_id);

drop policy if exists "alumnos_update_own" on public.alumnos;
create policy "alumnos_update_own"
  on public.alumnos for update
  using (auth.uid() = maestro_id)
  with check (auth.uid() = maestro_id);

drop policy if exists "alumnos_delete_own" on public.alumnos;
create policy "alumnos_delete_own"
  on public.alumnos for delete
  using (auth.uid() = maestro_id);

-- El super_admin lee todos los alumnos (panel de gestión).
drop policy if exists "alumnos_select_super_admin" on public.alumnos;
create policy "alumnos_select_super_admin"
  on public.alumnos for select
  using (public.es_super_admin(auth.uid()));
