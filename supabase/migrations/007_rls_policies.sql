-- ============================================================
-- 007 · Row Level Security
-- ------------------------------------------------------------
-- RLS estricto en todas las tablas. El alumno no modela
-- seguridad, pero ve el patrón correcto desde el día 1:
--   - profiles:   cada quien lee/edita el suyo.
--   - waitlist:   insert público, lectura solo service_role.
--   - core_items: dueño total sobre sus filas, nadie más.
--
-- Importante: con RLS activo, una tabla sin policies niega
-- TODO por default. Por eso cada tabla define sus policies.
-- ============================================================

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- El insert lo hace el trigger handle_new_user (security definer),
-- así que no necesitamos policy de insert para el usuario.

-- ------------------------------------------------------------
-- waitlist
-- ------------------------------------------------------------
alter table public.waitlist enable row level security;

-- Cualquiera (anon incluido) puede anotarse.
drop policy if exists "waitlist_insert_public" on public.waitlist;
create policy "waitlist_insert_public"
  on public.waitlist for insert
  to anon, authenticated
  with check (true);

-- Nadie puede leer la lista desde el cliente. Solo service_role
-- (que ignora RLS) la consulta — ej. un panel de admin server-side.

-- ------------------------------------------------------------
-- core_items
-- ------------------------------------------------------------
alter table public.core_items enable row level security;

drop policy if exists "core_items_select_own" on public.core_items;
create policy "core_items_select_own"
  on public.core_items for select
  using (auth.uid() = user_id);

drop policy if exists "core_items_insert_own" on public.core_items;
create policy "core_items_insert_own"
  on public.core_items for insert
  with check (auth.uid() = user_id);

drop policy if exists "core_items_update_own" on public.core_items;
create policy "core_items_update_own"
  on public.core_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "core_items_delete_own" on public.core_items;
create policy "core_items_delete_own"
  on public.core_items for delete
  using (auth.uid() = user_id);
