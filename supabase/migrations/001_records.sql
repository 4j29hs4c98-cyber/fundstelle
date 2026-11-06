-- 001_records.sql — one table holds every synced record of every user.
-- Run once in Supabase (SQL editor, or let Claude apply it with the Supabase connector after you approve).
create table if not exists public.records (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null,                 -- e.g. 'item', 'setting' (no CHECK constraint: new kinds need no migration)
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  deleted boolean not null default false,  -- soft delete, so deletions sync to other devices
  primary key (user_id, id)
);
create index if not exists records_user_updated_idx on public.records (user_id, updated_at);

-- Row Level Security: every user can only see and change their own rows.
alter table public.records enable row level security;
create policy "own rows: read"   on public.records for select to authenticated using ((select auth.uid()) = user_id);
create policy "own rows: insert" on public.records for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own rows: update" on public.records for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own rows: delete" on public.records for delete to authenticated using ((select auth.uid()) = user_id);

-- Live updates to other devices
alter publication supabase_realtime add table public.records;
