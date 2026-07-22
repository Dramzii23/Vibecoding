-- ============================================================
-- 004 · ai_conversations + ai_messages
-- ------------------------------------------------------------
-- Historial de chat con la IA (Sem 3+). Una conversación tiene
-- muchos mensajes. Cada usuario solo ve y edita sus propias
-- conversaciones; los mensajes heredan el acceso de su
-- conversación padre (RLS más abajo).
--
-- El alumno NO modela tablas: este schema ya viene completo.
-- Para agregar un campo, añade una columna aquí y corre la migration.
-- ============================================================

create table if not exists public.ai_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.ai_conversations is 'Conversaciones de chat con la IA. 1:N con ai_messages.';

create index if not exists ai_conversations_user_id_idx
  on public.ai_conversations (user_id, created_at desc);

drop trigger if exists ai_conversations_set_updated_at on public.ai_conversations;
create trigger ai_conversations_set_updated_at
  before update on public.ai_conversations
  for each row execute function public.set_updated_at();

create table if not exists public.ai_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role            text not null check (role in ('user', 'assistant', 'system')),
  content         text not null,
  created_at      timestamptz not null default now()
);

comment on table public.ai_messages is 'Mensajes individuales de una conversación. FK a ai_conversations.';

create index if not exists ai_messages_conversation_id_idx
  on public.ai_messages (conversation_id, created_at);

-- ------------------------------------------------------------
-- RLS · ai_conversations (dueño total sobre lo suyo)
-- ------------------------------------------------------------
alter table public.ai_conversations enable row level security;

drop policy if exists "ai_conversations_select_own" on public.ai_conversations;
create policy "ai_conversations_select_own"
  on public.ai_conversations for select
  using (auth.uid() = user_id);

drop policy if exists "ai_conversations_insert_own" on public.ai_conversations;
create policy "ai_conversations_insert_own"
  on public.ai_conversations for insert
  with check (auth.uid() = user_id);

drop policy if exists "ai_conversations_update_own" on public.ai_conversations;
create policy "ai_conversations_update_own"
  on public.ai_conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "ai_conversations_delete_own" on public.ai_conversations;
create policy "ai_conversations_delete_own"
  on public.ai_conversations for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- RLS · ai_messages (acceso heredado de la conversación padre)
-- ------------------------------------------------------------
alter table public.ai_messages enable row level security;

drop policy if exists "ai_messages_select_via_conversation" on public.ai_messages;
create policy "ai_messages_select_via_conversation"
  on public.ai_messages for select
  using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "ai_messages_insert_via_conversation" on public.ai_messages;
create policy "ai_messages_insert_via_conversation"
  on public.ai_messages for insert
  with check (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "ai_messages_update_via_conversation" on public.ai_messages;
create policy "ai_messages_update_via_conversation"
  on public.ai_messages for update
  using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "ai_messages_delete_via_conversation" on public.ai_messages;
create policy "ai_messages_delete_via_conversation"
  on public.ai_messages for delete
  using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
