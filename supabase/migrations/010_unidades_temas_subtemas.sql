-- ============================================================
-- 010 · unidades, temas, subtemas
-- ------------------------------------------------------------
-- Reemplaza una versión anterior de este mismo archivo que nunca
-- llegó a aplicarse en producción — no hay migración a romper.
--
-- Jerarquía real de una carta descriptiva, colgando de materias
-- (009): una materia tiene unidades (bloques de semanas), cada
-- unidad tiene temas grandes (con horas totales), y cada tema se
-- imparte en varios subtemas — la sesión operable día a día, con
-- su acción del docente, acción del alumno, materiales/equipo,
-- actividad y referencias.
--
-- Las tres tablas se crean juntas porque siempre nacen juntas y
-- comparten el mismo patrón de RLS heredado usado en ai_messages
-- (004): el hijo no tiene policy propia de "dueño", hereda el
-- acceso subiendo hasta materias.user_id.
--
-- Nota de diseño — catálogos: las columnas actividad_id,
-- accion_docente_id y accion_alumno_id (FK a actividades/acciones)
-- se agregan en 012_catalogos_actividades_acciones.sql, no aquí,
-- porque esas tablas nacen ahí — este archivo define el shape
-- base de subtemas sin esas columnas.
--
-- Nota de diseño — materiales/equipo: se captura a nivel subtema
-- (más específico), con fallback de LECTURA al material del tema
-- padre si el subtema no especifica nada. Ese fallback se aplica
-- en la capa de aplicación (subtema.materiales_equipo ?? tema.
-- materiales_equipo), no aquí.
--
-- Nota de diseño — texto libre vs. catálogo: accion_docente,
-- accion_alumno y actividad_preasignada siguen siendo columnas de
-- texto libre (no se eliminan): la extracción por IA del paso 1
-- del wizard no conoce los catálogos del usuario todavía, así que
-- guarda texto libre ahí. El docente decide después, desde la
-- tarjeta expandida, si lo "formaliza" seleccionando/creando una
-- entrada de catálogo (llenando el _id correspondiente). La UI
-- prioriza el catálogo si el _id existe, y cae al texto libre si
-- no — mismo patrón de fallback que materiales_equipo.
--
-- Nota de diseño — estatus: se redefine el check aquí en vez de
-- compartir el tipo/constraint con `sesiones` (008), para poder
-- deprecar `sesiones` sin arrastrar dependencias.
-- ============================================================

create table if not exists public.unidades (
  id             uuid primary key default gen_random_uuid(),
  materia_id     uuid not null references public.materias (id) on delete cascade,
  numero         integer not null,
  nombre         text,
  semana_inicio  integer not null,
  semana_fin     integer not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint unidades_materia_numero_unique unique (materia_id, numero)
);

comment on table public.unidades is 'Bloque de semanas de una materia. Editadas como lista en el wizard.';

create index if not exists unidades_materia_id_idx on public.unidades (materia_id, numero);

drop trigger if exists unidades_set_updated_at on public.unidades;
create trigger unidades_set_updated_at
  before update on public.unidades
  for each row execute function public.set_updated_at();

create table if not exists public.temas (
  id                  uuid primary key default gen_random_uuid(),
  unidad_id           uuid not null references public.unidades (id) on delete cascade,
  nombre              text not null,
  horas_totales       numeric,
  materiales_equipo   text,
  orden               integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.temas is 'Tema grande dentro de una unidad, con sus horas totales indicadas.';

create index if not exists temas_unidad_id_idx on public.temas (unidad_id, orden);

drop trigger if exists temas_set_updated_at on public.temas;
create trigger temas_set_updated_at
  before update on public.temas
  for each row execute function public.set_updated_at();

create table if not exists public.subtemas (
  id                      uuid primary key default gen_random_uuid(),
  tema_id                 uuid not null references public.temas (id) on delete cascade,
  nombre                  text not null,
  fecha                   date,
  semana                  integer,
  accion_docente          text,
  accion_alumno           text,
  actividad_preasignada   text,
  materiales_equipo       text,
  referencias             text,
  estatus                 text not null default 'planeada',
  orden                   integer not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  constraint subtemas_estatus_check
    check (estatus in ('planeada', 'impartida', 'reprogramada'))
);

comment on table public.subtemas is 'Sesión operable: subtema de un tema, con acción docente/alumno, materiales y referencias.';
comment on column public.subtemas.referencias is 'Texto libre multilínea (bibliografía, enlaces). Un-a-uno con el subtema, sin tabla aparte.';

create index if not exists subtemas_tema_id_idx on public.subtemas (tema_id, orden);
create index if not exists subtemas_fecha_idx on public.subtemas (fecha);

drop trigger if exists subtemas_set_updated_at on public.subtemas;
create trigger subtemas_set_updated_at
  before update on public.subtemas
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- RLS — heredada desde materias.user_id, mismo patrón que
-- ai_messages (004_ai_conversations.sql).
-- ------------------------------------------------------------
alter table public.unidades enable row level security;

drop policy if exists "unidades_select_via_materia" on public.unidades;
create policy "unidades_select_via_materia"
  on public.unidades for select
  using (
    exists (
      select 1 from public.materias m
      where m.id = materia_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "unidades_insert_via_materia" on public.unidades;
create policy "unidades_insert_via_materia"
  on public.unidades for insert
  with check (
    exists (
      select 1 from public.materias m
      where m.id = materia_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "unidades_update_via_materia" on public.unidades;
create policy "unidades_update_via_materia"
  on public.unidades for update
  using (
    exists (
      select 1 from public.materias m
      where m.id = materia_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.materias m
      where m.id = materia_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "unidades_delete_via_materia" on public.unidades;
create policy "unidades_delete_via_materia"
  on public.unidades for delete
  using (
    exists (
      select 1 from public.materias m
      where m.id = materia_id and m.user_id = auth.uid()
    )
  );

alter table public.temas enable row level security;

drop policy if exists "temas_select_via_unidad" on public.temas;
create policy "temas_select_via_unidad"
  on public.temas for select
  using (
    exists (
      select 1 from public.unidades u
      join public.materias m on m.id = u.materia_id
      where u.id = unidad_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "temas_insert_via_unidad" on public.temas;
create policy "temas_insert_via_unidad"
  on public.temas for insert
  with check (
    exists (
      select 1 from public.unidades u
      join public.materias m on m.id = u.materia_id
      where u.id = unidad_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "temas_update_via_unidad" on public.temas;
create policy "temas_update_via_unidad"
  on public.temas for update
  using (
    exists (
      select 1 from public.unidades u
      join public.materias m on m.id = u.materia_id
      where u.id = unidad_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.unidades u
      join public.materias m on m.id = u.materia_id
      where u.id = unidad_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "temas_delete_via_unidad" on public.temas;
create policy "temas_delete_via_unidad"
  on public.temas for delete
  using (
    exists (
      select 1 from public.unidades u
      join public.materias m on m.id = u.materia_id
      where u.id = unidad_id and m.user_id = auth.uid()
    )
  );

alter table public.subtemas enable row level security;

drop policy if exists "subtemas_select_via_tema" on public.subtemas;
create policy "subtemas_select_via_tema"
  on public.subtemas for select
  using (
    exists (
      select 1 from public.temas t
      join public.unidades u on u.id = t.unidad_id
      join public.materias m on m.id = u.materia_id
      where t.id = tema_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "subtemas_insert_via_tema" on public.subtemas;
create policy "subtemas_insert_via_tema"
  on public.subtemas for insert
  with check (
    exists (
      select 1 from public.temas t
      join public.unidades u on u.id = t.unidad_id
      join public.materias m on m.id = u.materia_id
      where t.id = tema_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "subtemas_update_via_tema" on public.subtemas;
create policy "subtemas_update_via_tema"
  on public.subtemas for update
  using (
    exists (
      select 1 from public.temas t
      join public.unidades u on u.id = t.unidad_id
      join public.materias m on m.id = u.materia_id
      where t.id = tema_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.temas t
      join public.unidades u on u.id = t.unidad_id
      join public.materias m on m.id = u.materia_id
      where t.id = tema_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "subtemas_delete_via_tema" on public.subtemas;
create policy "subtemas_delete_via_tema"
  on public.subtemas for delete
  using (
    exists (
      select 1 from public.temas t
      join public.unidades u on u.id = t.unidad_id
      join public.materias m on m.id = u.materia_id
      where t.id = tema_id and m.user_id = auth.uid()
    )
  );
