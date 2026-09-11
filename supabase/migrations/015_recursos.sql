-- ============================================================
-- 015 · recursos (archivos) + Storage
-- ------------------------------------------------------------
-- Catálogo GLOBAL de archivos del docente (PDF, PPTX, DOCX…),
-- mismo espíritu que actividades/acciones (012): se sube un archivo
-- una vez y se reusa entre sesiones/materias, en vez de adjuntarlo
-- cada vez. A diferencia de actividad_id/accion_*_id en subtemas
-- (1:1 por subtema), un subtema puede necesitar VARIOS recursos
-- (una presentación + un PDF de lectura) y un mismo recurso puede
-- usarse en varios subtemas — por eso es una tabla puente N:N
-- (subtema_recursos), no una columna *_id.
--
-- Storage sigue el mismo patrón que cartas_descriptivas (011):
-- bucket privado, path {user_id}/{uuid}.{ext} — las policies solo
-- miran el primer segmento del path, sin join a otra tabla.
-- ============================================================

create table if not exists public.recursos (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references auth.users (id) on delete cascade,
  nombre                    text not null,
  storage_path              text not null,
  nombre_archivo_original   text,
  mime_type                 text,
  tamano_bytes              bigint,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

comment on table public.recursos is 'Catálogo global del docente: archivos (PDF, PPTX, DOCX…) reutilizables entre subtemas.';

create index if not exists recursos_user_id_idx on public.recursos (user_id, nombre);

drop trigger if exists recursos_set_updated_at on public.recursos;
create trigger recursos_set_updated_at
  before update on public.recursos
  for each row execute function public.set_updated_at();

create table if not exists public.subtema_recursos (
  subtema_id  uuid not null references public.subtemas (id) on delete cascade,
  recurso_id  uuid not null references public.recursos (id) on delete cascade,
  created_at  timestamptz not null default now(),

  primary key (subtema_id, recurso_id)
);

comment on table public.subtema_recursos is 'Tabla puente N:N — qué recursos están asignados a qué subtema.';

create index if not exists subtema_recursos_recurso_id_idx on public.subtema_recursos (recurso_id);

-- ------------------------------------------------------------
-- RLS — recursos: dueño directo por user_id, mismo patrón que
-- actividades/acciones (012).
-- ------------------------------------------------------------
alter table public.recursos enable row level security;

drop policy if exists "recursos_select_own" on public.recursos;
create policy "recursos_select_own"
  on public.recursos for select
  using (auth.uid() = user_id);

drop policy if exists "recursos_insert_own" on public.recursos;
create policy "recursos_insert_own"
  on public.recursos for insert
  with check (auth.uid() = user_id);

drop policy if exists "recursos_update_own" on public.recursos;
create policy "recursos_update_own"
  on public.recursos for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "recursos_delete_own" on public.recursos;
create policy "recursos_delete_own"
  on public.recursos for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- RLS — subtema_recursos: hereda dueño por AMBOS lados (recurso.user_id
-- Y subtema→tema→unidad→materia.user_id), mismo patrón de herencia que
-- subtemas (010).
-- ------------------------------------------------------------
alter table public.subtema_recursos enable row level security;

drop policy if exists "subtema_recursos_select_own" on public.subtema_recursos;
create policy "subtema_recursos_select_own"
  on public.subtema_recursos for select
  using (
    exists (
      select 1 from public.recursos r
      where r.id = recurso_id and r.user_id = auth.uid()
    )
  );

drop policy if exists "subtema_recursos_insert_own" on public.subtema_recursos;
create policy "subtema_recursos_insert_own"
  on public.subtema_recursos for insert
  with check (
    exists (
      select 1 from public.recursos r
      where r.id = recurso_id and r.user_id = auth.uid()
    )
    and exists (
      select 1 from public.subtemas s
      join public.temas t on t.id = s.tema_id
      join public.unidades u on u.id = t.unidad_id
      join public.materias m on m.id = u.materia_id
      where s.id = subtema_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "subtema_recursos_delete_own" on public.subtema_recursos;
create policy "subtema_recursos_delete_own"
  on public.subtema_recursos for delete
  using (
    exists (
      select 1 from public.recursos r
      where r.id = recurso_id and r.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- Storage — bucket privado "recursos". Convención de path:
-- {user_id}/{uuid}.{ext} — mismo criterio que cartas-descriptivas.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recursos', 'recursos', false, 26214400, array[
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'image/png',
  'image/jpeg'
])
on conflict (id) do nothing;

drop policy if exists "recursos_storage_insert_own" on storage.objects;
create policy "recursos_storage_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'recursos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "recursos_storage_select_own" on storage.objects;
create policy "recursos_storage_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'recursos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "recursos_storage_delete_own" on storage.objects;
create policy "recursos_storage_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'recursos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
