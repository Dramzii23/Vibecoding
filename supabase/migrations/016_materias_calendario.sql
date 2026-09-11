-- ============================================================
-- 016 · calendario del semestre en materias
-- ------------------------------------------------------------
-- El wizard de importación de carta descriptiva ahora captura el
-- rango de fechas real del semestre (paso "Calendario") para
-- calcular sesiones hábiles y prellenar fechas de subtemas —
-- información legítima de la materia (cuándo inicia/termina),
-- útil también para futuras validaciones del Horario interno, no
-- solo para el wizard. Columnas nullable: materias creadas antes
-- de este cambio, o capturadas a mano sin pasar por el wizard con
-- IA, simplemente no las tienen.
-- ============================================================

alter table public.materias
  add column if not exists fecha_inicio_semestre date,
  add column if not exists fecha_fin_semestre date;

comment on column public.materias.fecha_inicio_semestre is 'Fecha real de inicio del semestre, capturada en el paso "Calendario" del wizard de importación — nullable, materias sin este dato no calculan sesiones hábiles automáticamente.';
comment on column public.materias.fecha_fin_semestre is 'Fecha real de fin del semestre, mismo origen que fecha_inicio_semestre.';

-- Sin cambios de RLS: son columnas nuevas en una tabla existente,
-- las policies de materias (009) ya cubren select/insert/update/delete
-- por user_id sin distinguir columnas.
