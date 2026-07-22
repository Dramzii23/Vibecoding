-- ============================================================
-- 003 · core_items
-- ------------------------------------------------------------
-- CRUD genérico del MVP (Sem 2). Cada usuario solo ve y edita
-- sus propios items (RLS en 007).
--
-- Tip Sem 2: renombra esta tabla a tu dominio ("leads",
-- "recipes", "projects"...) y agrega columnas. El patrón de
-- dashboard ya queda cableado para core_items.
-- ============================================================

create table if not exists public.core_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text not null,
  description text,
  status      text not null default 'active',   -- active | done | archived
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.core_items is 'CRUD genérico del MVP. El alumno lo renombra a su dominio.';

create index if not exists core_items_user_id_idx on public.core_items (user_id, created_at desc);

drop trigger if exists core_items_set_updated_at on public.core_items;
create trigger core_items_set_updated_at
  before update on public.core_items
  for each row execute function public.set_updated_at();
