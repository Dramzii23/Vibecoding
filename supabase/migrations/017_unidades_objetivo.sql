-- ============================================================
-- 017_unidades_objetivo.sql
-- ------------------------------------------------------------
-- Agrega `objetivo` a unidades: la carta descriptiva a veces
-- declara un objetivo/propósito propio por unidad (columna Unidad
-- de la tabla, distinto del nombre/objetivo de sus temas) — la IA
-- ya lo extrae (ver lib/openai/schemas/cartaDescriptiva.js,
-- unidad_objetivo) pero antes de esta migración no había dónde
-- guardarlo. Nullable: la mayoría de unidades no lo tendrán.
-- ============================================================

alter table public.unidades
  add column if not exists objetivo text;

comment on column public.unidades.objetivo is 'Objetivo/propósito de la unidad, tomado de la carta descriptiva o capturado a mano.';
