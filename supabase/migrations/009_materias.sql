-- ============================================================
-- 009 · materias
-- ------------------------------------------------------------
-- Reemplaza una versión anterior de este mismo archivo que
-- nunca llegó a aplicarse en producción (el proyecto nunca corrió
-- `supabase db push` para ella) — no hay migración a romper, así
-- que se reescribe en vez de encadenar un ALTER.
--
-- Entidad raíz de "¿Qué toca hoy?": una materia que el docente
-- confirma al final del wizard (subir carta descriptiva → revisar
-- datos generales → evaluación → unidades → temas/subtemas). De
-- aquí cuelgan unidades → temas → subtemas (010) y las cartas
-- descriptivas importadas (011).
--
-- Reemplaza conceptualmente a `sesiones` (008) como el punto de
-- entrada del dashboard. `sesiones` no se borra ni se migra —
-- queda en el schema sin uso desde la UI.
-- ============================================================

create table if not exists public.materias (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references auth.users (id) on delete cascade,
  nombre                    text not null,
  dias_clase                text[] not null default '{}',
  duracion_sesion_minutos   integer not null default 120,
  formato_semestre          text not null default 'semestral',
  tipo_evaluacion           text,
  criterios_evaluacion      jsonb not null default '[]'::jsonb,
  numero_unidades           integer not null default 3,
  semanas_por_unidad        integer not null default 4,
  estatus_config            text not null default 'wizard_pendiente',
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  constraint materias_formato_semestre_check
    check (formato_semestre in ('semestral', 'cuatrimestral', 'trimestral')),
  constraint materias_estatus_config_check
    check (estatus_config in ('wizard_pendiente', 'configurada'))
);

comment on table public.materias is 'Materia configurada por el docente vía el wizard. Raíz de unidades/temas/subtemas.';
comment on column public.materias.criterios_evaluacion is 'Array [{criterio, porcentaje}] capturado como barras interactivas en el wizard. Validación de que sume 100% vive en la app, no aquí.';

create index if not exists materias_user_id_idx on public.materias (user_id, created_at desc);

drop trigger if exists materias_set_updated_at on public.materias;
create trigger materias_set_updated_at
  before update on public.materias
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- RLS — dueño total sobre sus filas, nadie más.
-- ------------------------------------------------------------
alter table public.materias enable row level security;

drop policy if exists "materias_select_own" on public.materias;
create policy "materias_select_own"
  on public.materias for select
  using (auth.uid() = user_id);

drop policy if exists "materias_insert_own" on public.materias;
create policy "materias_insert_own"
  on public.materias for insert
  with check (auth.uid() = user_id);

drop policy if exists "materias_update_own" on public.materias;
create policy "materias_update_own"
  on public.materias for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "materias_delete_own" on public.materias;
create policy "materias_delete_own"
  on public.materias for delete
  using (auth.uid() = user_id);
