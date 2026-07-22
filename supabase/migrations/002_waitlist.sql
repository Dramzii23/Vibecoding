-- ============================================================
-- 002 · waitlist
-- ------------------------------------------------------------
-- Captura de correos pre-launch desde la landing (Sem 1).
-- El insert es público (cualquiera puede anotarse) pero la
-- lectura está bloqueada por RLS (ver 007).
-- ============================================================

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  source      text,                         -- de dónde vino (ej. 'landing')
  created_at  timestamptz not null default now()
);

comment on table public.waitlist is 'Emails capturados en la landing antes del launch.';

create index if not exists waitlist_created_at_idx on public.waitlist (created_at desc);
