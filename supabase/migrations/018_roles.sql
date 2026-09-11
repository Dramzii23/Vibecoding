-- ============================================================
-- 018 · roles de usuario (super_admin / maestro)
-- ------------------------------------------------------------
-- NOTA DE DISEÑO: la plantilla base (CLAUDE.md) mantiene /admin
-- como contraseña simple a propósito y evita sistemas de roles.
-- Este producto ("¿Qué toca hoy?") SÍ necesita roles: un
-- super_admin que gestiona las cuentas de los maestros que se
-- registran y los alumnos que cada maestro captura. Esta migración
-- introduce ese sistema como algo PROPIO del producto, no del
-- boilerplate — el panel de leads /admin sigue existiendo sin
-- cambios.
--
-- Modelo:
--   - profiles.rol: 'maestro' (default, todo el que se registra) o
--     'super_admin'. Un solo eje de rol, no una tabla N:N —
--     alcanza para los dos roles que hay.
--   - profiles.suspendido: el super_admin puede bloquear una cuenta
--     de maestro. La app revisa este flag en el login/layout y
--     cierra la sesión si está suspendida (auth.users no se toca).
--   - Los ALUMNOS no son cuentas de auth (ver migración 019): son
--     registros que el maestro captura. No entran en este eje de
--     rol.
--
-- Seguridad: para que el super_admin pueda LEER perfiles ajenos vía
-- RLS (el panel corre server-side con la sesión del admin, no con
-- service_role), se agrega una policy de select para super_admins.
-- La función es_super_admin() es SECURITY DEFINER y evita recursión
-- de RLS al consultar profiles desde dentro de una policy de
-- profiles.
-- ============================================================

alter table public.profiles
  add column if not exists rol text not null default 'maestro',
  add column if not exists suspendido boolean not null default false;

alter table public.profiles
  drop constraint if exists profiles_rol_check;
alter table public.profiles
  add constraint profiles_rol_check check (rol in ('maestro', 'super_admin'));

comment on column public.profiles.rol is 'maestro (default) | super_admin. El super_admin gestiona cuentas de maestros y alumnos.';
comment on column public.profiles.suspendido is 'Si true, la app cierra la sesión de este usuario al entrar. Solo el super_admin lo cambia.';

create index if not exists profiles_rol_idx on public.profiles (rol) where rol = 'super_admin';

-- ------------------------------------------------------------
-- es_super_admin(uid) — helper para usar dentro de policies sin
-- recursión infinita (SECURITY DEFINER se salta el RLS de la
-- tabla que consulta).
-- ------------------------------------------------------------
create or replace function public.es_super_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and rol = 'super_admin' and suspendido = false
  );
$$;

-- ------------------------------------------------------------
-- RLS de profiles: se AÑADE acceso del super_admin sin quitar el
-- "cada quien el suyo" de la migración 007.
-- ------------------------------------------------------------
drop policy if exists "profiles_select_super_admin" on public.profiles;
create policy "profiles_select_super_admin"
  on public.profiles for select
  using (public.es_super_admin(auth.uid()));

drop policy if exists "profiles_update_super_admin" on public.profiles;
create policy "profiles_update_super_admin"
  on public.profiles for update
  using (public.es_super_admin(auth.uid()))
  with check (public.es_super_admin(auth.uid()));

-- ------------------------------------------------------------
-- El super_admin también necesita LEER las materias de cualquier
-- maestro para el panel (contar materias por maestro, ver
-- actividad). Solo SELECT — no edita materias ajenas desde aquí.
-- ------------------------------------------------------------
drop policy if exists "materias_select_super_admin" on public.materias;
create policy "materias_select_super_admin"
  on public.materias for select
  using (public.es_super_admin(auth.uid()));
