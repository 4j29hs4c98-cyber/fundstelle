-- 007_nachrichten.sql — Nachrichten-Strom: Schlagzeilen aus festen RSS-Quellen, alle 30 Minuten gesammelt von der
-- Edge Function nachrichten-holen. Gespeichert werden nur Titel, Quelle, Link und Zeit, kein Artikeltext (Urheberrecht).
-- parteien/personen sind KI-Zuordnungen, die nur zaehlen, wenn der Name woertlich in Titel oder Anreisser steht.
-- Lesen darf jeder (auch ohne Konto), schreiben nur die Service-Rolle der Funktion. Mehrfach ausfuehrbar.
begin;

create table if not exists public.nachrichten (
  id bigint generated always as identity primary key,
  url text not null unique check (url ~ '^https://'),
  quelle text not null,
  titel text not null check (length(titel) <= 400),
  datum timestamptz not null,
  parteien uuid[] not null default '{}',
  personen text[] not null default '{}',
  getaggt boolean not null default false,
  erstellt timestamptz not null default now()
);
create index if not exists nachrichten_datum on public.nachrichten (datum desc);
create index if not exists nachrichten_parteien on public.nachrichten using gin (parteien);
alter table public.nachrichten enable row level security;
drop policy if exists "nachrichten lesen" on public.nachrichten;
create policy "nachrichten lesen" on public.nachrichten for select to anon, authenticated using (true);
revoke insert, update, delete on public.nachrichten from anon, authenticated;

-- Wann zuletzt gesammelt wurde. Die Funktion ist ohne Anmeldung erreichbar (der Zeitplan ruft sie auf); diese Sperre
-- sorgt dafuer, dass sie hoechstens alle 20 Minuten wirklich arbeitet, egal wie oft jemand sie aufruft.
create table if not exists public.nachrichten_stand (
  id int primary key check (id = 1),
  letzter_lauf timestamptz not null default 'epoch'
);
insert into public.nachrichten_stand (id) values (1) on conflict do nothing;
alter table public.nachrichten_stand enable row level security;

-- Sperre in EINEM Schritt: true nur, wenn der letzte Lauf mindestens 20 Minuten her ist.
create or replace function public.nachrichten_lauf_erlauben()
returns boolean
language sql
set search_path = public
as $$
  update public.nachrichten_stand set letzter_lauf = now()
  where id = 1 and letzter_lauf < now() - interval '20 minutes'
  returning true;
$$;
revoke execute on function public.nachrichten_lauf_erlauben() from public, anon, authenticated;

commit;

-- Zeitplan: alle 30 Minuten die Funktion aufrufen. Ausserhalb der Transaktion, weil Erweiterungen sich selbst einrichten.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule('nachrichten-holen') where exists (select 1 from cron.job where jobname = 'nachrichten-holen');
select cron.schedule('nachrichten-holen', '*/30 * * * *',
  $$ select net.http_post(url := 'https://hubdfmhzloodsujwfgkn.supabase.co/functions/v1/nachrichten-holen',
       headers := '{"Content-Type": "application/json"}'::jsonb, body := '{}'::jsonb, timeout_milliseconds := 60000) $$);
