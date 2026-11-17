-- 009_nachrichten_themen.sql — "Themen des Tages": Meldungen zum selben Ereignis werden zu einem Thema mit Kurzfassung
-- zusammengefasst. Gebaut alle zwei Stunden von der Edge Function nachrichten-themen (setzt 007_nachrichten.sql voraus).
-- Die Kurzfassung entsteht aus Titel und Vorschautext der Feeds, in eigenen Worten; Zahlen muessen dort stehen, woertliche
-- Uebernahmen werden verworfen (siehe nachrichten-themen/pruefung.ts). Der Vorschautext selbst wird nie gespeichert.
-- Lesen darf jeder, schreiben nur die Service-Rolle der Funktion. Mehrfach ausfuehrbar.
begin;

create table if not exists public.nachrichten_themen (
  id bigint generated always as identity primary key,
  titel text not null check (length(titel) between 8 and 200),
  zusammenfassung text check (zusammenfassung is null or length(zusammenfassung) <= 800),
  parteien uuid[] not null default '{}',
  personen text[] not null default '{}',
  frage text check (frage is null or length(frage) <= 200),
  frage_id uuid references public.fragen(id) on delete set null,
  meldungen jsonb not null check (jsonb_typeof(meldungen) = 'array'),
  anzahl_quellen int not null check (anzahl_quellen >= 1),
  aktualisiert timestamptz not null,
  erstellt timestamptz not null default now()
);
create index if not exists nachrichten_themen_zeit on public.nachrichten_themen (aktualisiert desc);
alter table public.nachrichten_themen enable row level security;
drop policy if exists "themen lesen" on public.nachrichten_themen;
create policy "themen lesen" on public.nachrichten_themen for select to anon, authenticated using (true);
revoke insert, update, delete, truncate on public.nachrichten_themen from anon, authenticated;
revoke truncate on public.nachrichten, public.nachrichten_stand from anon, authenticated;

alter table public.nachrichten_stand add column if not exists letzter_themenlauf timestamptz not null default 'epoch';

-- Sperre in EINEM Schritt: true nur, wenn der letzte Themenlauf mindestens 80 Minuten her ist (die Funktion ist ohne
-- Anmeldung erreichbar, jeder Aufruf kostet KI-Geld).
create or replace function public.nachrichten_themen_erlauben()
returns boolean
language sql
set search_path = public
as $$
  update public.nachrichten_stand set letzter_themenlauf = now()
  where id = 1 and letzter_themenlauf < now() - interval '80 minutes'
  returning true;
$$;
revoke execute on function public.nachrichten_themen_erlauben() from public, anon, authenticated;

commit;

-- Zeitplan: alle zwei Stunden, zehn Minuten nach der vollen Stunde (nach dem Sammeln der Schlagzeilen).
select cron.unschedule('nachrichten-themen') where exists (select 1 from cron.job where jobname = 'nachrichten-themen');
select cron.schedule('nachrichten-themen', '10 */2 * * *',
  $$ select net.http_post(url := 'https://hubdfmhzloodsujwfgkn.supabase.co/functions/v1/nachrichten-themen',
       headers := '{"Content-Type": "application/json"}'::jsonb, body := '{}'::jsonb, timeout_milliseconds := 120000) $$);
