-- ============================================================
-- 011 · cartas_descriptivas + Storage
-- ------------------------------------------------------------
-- Reemplaza una versión anterior de este mismo archivo que nunca
-- llegó a aplicarse en producción — no hay migración a romper.
--
-- Cambio de contrato clave frente a esa versión: `materia_id` es
-- ahora NULLABLE. El flujo pasó a ser "sube el PDF primero, la IA
-- interpreta, y solo al final del wizard se crea la materia" — así
-- que al momento de subir el archivo todavía no existe ninguna
-- materia a la que ligarlo. El path de Storage por lo tanto ya no
-- incluye materia_id: {user_id}/{uuid}.pdf en vez de
-- {user_id}/{materia_id}/{uuid}.pdf. Al confirmar el wizard se
-- actualiza materia_id (solo trazabilidad histórica, no requisito
-- funcional — el flujo nunca vuelve a leer esta tabla después).
--
-- Separada de `materias` a propósito: una materia puede reintentar
-- la importación y queremos conservar el historial de intentos sin
-- sobreescribir.
--
-- `resultado_ia` guarda la propuesta cruda que devolvió la IA —
-- es "la propuesta original", no "lo que finalmente se importó";
-- eso último vive en las filas reales de temas/subtemas (010).
-- ============================================================

create table if not exists public.cartas_descriptivas (
  id                        uuid primary key default gen_random_uuid(),
  materia_id                uuid references public.materias (id) on delete cascade,
  user_id                   uuid not null references auth.users (id) on delete cascade,
  storage_path              text not null,
  nombre_archivo_original   text,
  status                    text not null default 'subido',
  error_mensaje             text,
  resultado_ia              jsonb,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  constraint cartas_descriptivas_status_check
    check (status in ('subido', 'extrayendo', 'extraido', 'error', 'importado'))
);

comment on table public.cartas_descriptivas is 'PDF de carta descriptiva subido por el docente y su estado de procesamiento con IA. materia_id es nullable: se sube antes de que la materia exista.';

create index if not exists cartas_descriptivas_materia_id_idx
  on public.cartas_descriptivas (materia_id, created_at desc);
create index if not exists cartas_descriptivas_user_id_idx
  on public.cartas_descriptivas (user_id, created_at desc);

drop trigger if exists cartas_descriptivas_set_updated_at on public.cartas_descriptivas;
create trigger cartas_descriptivas_set_updated_at
  before update on public.cartas_descriptivas
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- RLS — dueño total vía user_id directo (denormalizado a
-- propósito para evitar un join extra en la policy).
-- ------------------------------------------------------------
alter table public.cartas_descriptivas enable row level security;

drop policy if exists "cartas_descriptivas_select_own" on public.cartas_descriptivas;
create policy "cartas_descriptivas_select_own"
  on public.cartas_descriptivas for select
  using (auth.uid() = user_id);

drop policy if exists "cartas_descriptivas_insert_own" on public.cartas_descriptivas;
create policy "cartas_descriptivas_insert_own"
  on public.cartas_descriptivas for insert
  with check (auth.uid() = user_id);

drop policy if exists "cartas_descriptivas_update_own" on public.cartas_descriptivas;
create policy "cartas_descriptivas_update_own"
  on public.cartas_descriptivas for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "cartas_descriptivas_delete_own" on public.cartas_descriptivas;
create policy "cartas_descriptivas_delete_own"
  on public.cartas_descriptivas for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Storage — bucket privado "cartas-descriptivas".
-- Convención de path: {user_id}/{uuid}.pdf — así las policies
-- solo miran el primer segmento del path, sin necesitar un join
-- a `materias` para saber el dueño (y funciona igual antes o
-- después de que la materia exista).
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cartas-descriptivas', 'cartas-descriptivas', false, 15728640, array['application/pdf'])
on conflict (id) do nothing;

drop policy if exists "cartas_storage_insert_own" on storage.objects;
create policy "cartas_storage_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'cartas-descriptivas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "cartas_storage_select_own" on storage.objects;
create policy "cartas_storage_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'cartas-descriptivas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "cartas_storage_delete_own" on storage.objects;
create policy "cartas_storage_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'cartas-descriptivas'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
