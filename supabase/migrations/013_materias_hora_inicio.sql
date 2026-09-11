-- ============================================================
-- 013 · hora de inicio de clase en materias
-- ------------------------------------------------------------
-- El tablero "Horario" del dashboard necesita mostrar la hora
-- real de cada sesión, no solo el día. Una sola hora por materia
-- (aplica a todos sus días de clase) — capturada en el Paso 2 del
-- wizard junto a días de clase y duración de sesión.
-- Nullable: materias creadas antes de esta migración no la
-- tienen, y el dashboard debe tolerar `null` sin romperse.
-- ============================================================

alter table public.materias
  add column if not exists hora_inicio time;

comment on column public.materias.hora_inicio is 'Hora de inicio de cada sesión de esta materia (aplica a todos los días de dias_clase). Nullable.';
