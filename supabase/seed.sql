-- ============================================================
-- seed.sql
-- ------------------------------------------------------------
-- Datos de ejemplo para desarrollo local (`supabase db reset`).
-- NO se corre en producción.
--
-- core_items y profiles dependen de auth.users reales, así que
-- no los sembramos aquí (se llenan al hacer login con Google).
-- Solo sembramos waitlist con un par de correos demo.
-- ============================================================

insert into public.waitlist (email, source)
values
  ('demo1@vibefast.dev', 'seed'),
  ('demo2@vibefast.dev', 'seed')
on conflict (email) do nothing;
