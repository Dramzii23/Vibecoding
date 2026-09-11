-- ============================================================
-- 014 · horario por día en materias
-- ------------------------------------------------------------
-- Reemplaza dias_clase (text[]) + hora_inicio (time, de la 013) por
-- un solo campo `horario jsonb`: [{dia, hora_inicio}]. Antes, una
-- materia tenía UN solo horario aplicado a todos sus días de clase;
-- ahora cada día puede tener su propia hora (ej. lunes 9:00,
-- miércoles 11:00) — necesario para el Horario del dashboard
-- (cuadrícula día×hora de todas las materias, con drag-and-drop
-- por día individual).
--
-- duracion_sesion_minutos NO cambia: se sigue aplicando por igual a
-- todas las sesiones de una materia.
-- ============================================================

alter table public.materias
  add column if not exists horario jsonb not null default '[]'::jsonb;

comment on column public.materias.horario is 'Array [{dia, hora_inicio}] — un día puede tener una hora distinta a otro. dia en minúsculas (lunes..domingo), hora_inicio formato "HH:MM".';

-- Migra datos existentes: dias_clase + hora_inicio → horario.
update public.materias
set horario = (
  select coalesce(jsonb_agg(jsonb_build_object('dia', d, 'hora_inicio', to_char(hora_inicio, 'HH24:MI'))), '[]'::jsonb)
  from unnest(dias_clase) as d
)
where horario = '[]'::jsonb
  and dias_clase is not null
  and array_length(dias_clase, 1) > 0;

alter table public.materias drop column if exists dias_clase;
alter table public.materias drop column if exists hora_inicio;
