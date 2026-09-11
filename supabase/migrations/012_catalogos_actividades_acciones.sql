-- ============================================================
-- 012 · catálogos de actividades y acciones
-- ------------------------------------------------------------
-- Catálogos GLOBALES del docente (por user_id, no por materia):
-- si el mismo docente da varias materias, reusa las mismas
-- entradas ("Discusión grupal", "Explica el concepto con
-- diapositivas") en todas, en vez de recrearlas por materia.
--
-- `actividades` y `acciones` son tablas separadas porque su shape
-- es distinto: una actividad es un ejercicio/dinámica asignable
-- (nombre + descripción opcional); una acción es una frase corta
-- de rol (solo nombre). `acciones` es UNA sola tabla con columna
-- `tipo` (docente|alumno) en vez de dos tablas separadas: el shape
-- es idéntico entre ambos usos, la única diferencia es el
-- contexto — un filtro `where tipo = ...` basta para segmentar sin
-- duplicar RLS/CRUD/UI. Si en el futuro necesitan campos distintos,
-- se separan entonces.
--
-- Los FKs de subtemas (actividad_id, accion_docente_id,
-- accion_alumno_id) se agregan aquí vía ALTER, no en la migración
-- 010 que define subtemas: cronológicamente estas tablas nacen en
-- este archivo, así que el ALTER va después de crearlas.
--
-- Fallback de lectura: si un subtema no tiene *_id, la UI muestra
-- las columnas de texto libre ya existentes (accion_docente,
-- accion_alumno, actividad_preasignada) que la IA llenó al
-- importar. El docente "formaliza" el dato después, seleccionando
-- o creando una entrada de catálogo desde la tarjeta expandida.
-- ============================================================

create table if not exists public.actividades (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  nombre       text not null,
  descripcion  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.actividades is 'Catálogo global del docente: ejercicios/dinámicas asignables a un subtema.';

create index if not exists actividades_user_id_idx on public.actividades (user_id, nombre);

drop trigger if exists actividades_set_updated_at on public.actividades;
create trigger actividades_set_updated_at
  before update on public.actividades
  for each row execute function public.set_updated_at();

create table if not exists public.acciones (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  tipo         text not null,
  nombre       text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint acciones_tipo_check check (tipo in ('docente', 'alumno'))
);

comment on table public.acciones is 'Catálogo global del docente: frases de rol reutilizables para acción docente/alumno.';

create index if not exists acciones_user_id_tipo_idx on public.acciones (user_id, tipo, nombre);

drop trigger if exists acciones_set_updated_at on public.acciones;
create trigger acciones_set_updated_at
  before update on public.acciones
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- RLS — dueño total directo por user_id, mismo patrón que
-- materias (sin herencia: son tablas raíz, no cuelgan de nada).
-- ------------------------------------------------------------
alter table public.actividades enable row level security;

drop policy if exists "actividades_select_own" on public.actividades;
create policy "actividades_select_own"
  on public.actividades for select
  using (auth.uid() = user_id);

drop policy if exists "actividades_insert_own" on public.actividades;
create policy "actividades_insert_own"
  on public.actividades for insert
  with check (auth.uid() = user_id);

drop policy if exists "actividades_update_own" on public.actividades;
create policy "actividades_update_own"
  on public.actividades for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "actividades_delete_own" on public.actividades;
create policy "actividades_delete_own"
  on public.actividades for delete
  using (auth.uid() = user_id);

alter table public.acciones enable row level security;

drop policy if exists "acciones_select_own" on public.acciones;
create policy "acciones_select_own"
  on public.acciones for select
  using (auth.uid() = user_id);

drop policy if exists "acciones_insert_own" on public.acciones;
create policy "acciones_insert_own"
  on public.acciones for insert
  with check (auth.uid() = user_id);

drop policy if exists "acciones_update_own" on public.acciones;
create policy "acciones_update_own"
  on public.acciones for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "acciones_delete_own" on public.acciones;
create policy "acciones_delete_own"
  on public.acciones for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- FKs de catálogo en subtemas (agregadas aquí, no en 010, porque
-- actividades/acciones nacen en este archivo).
-- ------------------------------------------------------------
alter table public.subtemas
  add column if not exists actividad_id uuid references public.actividades (id) on delete set null,
  add column if not exists accion_docente_id uuid references public.acciones (id) on delete set null,
  add column if not exists accion_alumno_id uuid references public.acciones (id) on delete set null;

create index if not exists subtemas_actividad_id_idx on public.subtemas (actividad_id);
create index if not exists subtemas_accion_docente_id_idx on public.subtemas (accion_docente_id);
create index if not exists subtemas_accion_alumno_id_idx on public.subtemas (accion_alumno_id);
