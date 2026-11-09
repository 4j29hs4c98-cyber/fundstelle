-- 006_eigene_themen.sql — Grundlage fuer "Eigenes Thema": ein Agent sucht zu einer selbst gestellten Frage die
-- passenden Stellen in den Wahlprogrammen. Setzt 002_struktur.sql voraus. Mehrfach ausfuehrbar.
-- Nur die Edge Function thema-recherche liest diese Tabellen (Service-Rolle). Deshalb RLS an und KEINE Policies.
begin;

-- Volltext der Programme, eine Zeile je PDF-Seite. Befuellt von scripts/programme-text.mjs.
create table if not exists public.programm_seiten (
  partei_id uuid not null references public.parteien(id) on delete cascade,
  seite int not null check (seite > 0),
  text text not null,
  tsv tsvector generated always as (to_tsvector('german', text)) stored,
  primary key (partei_id, seite)
);
create index if not exists programm_seiten_tsv on public.programm_seiten using gin (tsv);
alter table public.programm_seiten enable row level security;

-- Jede Recherche wird gezaehlt, damit niemand die bezahlte KI-Schnittstelle ausreizen kann.
create table if not exists public.recherche_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  frage text not null,
  created_at timestamptz not null default now()
);
create index if not exists recherche_log_user_zeit on public.recherche_log (user_id, created_at desc);
alter table public.recherche_log enable row level security;

-- Die besten Seiten eines Programms zu einer Frage. Woerter werden mit ODER verknuepft, damit eine Seite nicht
-- jedes Wort der Frage enthalten muss; die Rangfolge sorgt dafuer, dass Seiten mit mehr Treffern vorne stehen.
create or replace function public.programm_suche(p_partei uuid, p_frage text, p_n int default 3)
returns table (seite int, text text, rang real)
language sql stable
set search_path = public
as $$
  with q as (
    select to_tsquery('german', string_agg(quote_literal(w) || ':*', ' | ')) as tsq
    from regexp_split_to_table(lower(p_frage), '[^[:alnum:]äöüß]+') w
    where length(w) >= 4
  )
  select s.seite, s.text, ts_rank_cd(s.tsv, q.tsq) as rang
  from public.programm_seiten s, q
  where s.partei_id = p_partei and q.tsq is not null and s.tsv @@ q.tsq
  order by rang desc
  limit least(greatest(p_n, 1), 5);
$$;
revoke execute on function public.programm_suche(uuid, text, int) from public, anon, authenticated;

-- Zaehlt und erlaubt eine Recherche in EINEM Schritt (keine Luecke fuer parallele Anfragen). Grenzen je Nutzer und
-- Stunde sowie fuer alle zusammen je Tag, damit die Kosten gedeckelt sind. Fragen werden nach 30 Tagen geloescht.
create or replace function public.recherche_erlauben(p_user uuid, p_frage text, p_je_stunde int, p_je_tag_gesamt int)
returns boolean
language plpgsql
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtext('recherche_log'));
  delete from public.recherche_log where created_at < now() - interval '30 days';
  if (select count(*) from public.recherche_log where user_id = p_user and created_at > now() - interval '1 hour') >= p_je_stunde
     or (select count(*) from public.recherche_log where created_at > now() - interval '1 day') >= p_je_tag_gesamt then
    return false;
  end if;
  insert into public.recherche_log (user_id, frage) values (p_user, left(p_frage, 200));
  return true;
end;
$$;
revoke execute on function public.recherche_erlauben(uuid, text, int, int) from public, anon, authenticated;

commit;
