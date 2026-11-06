-- 002_struktur.sql — Datenmodell nach "Struktur und Aufbau" (06.11.2026).
-- Rueckwaertskompatibel: nichts wird umbenannt oder geloescht. Die bisher veroeffentlichte App liest
-- diese Tabellen nicht, sie arbeitet mit eingebauten Beispieldaten.
--
-- Was neu ist:
--   * Freigabe-Status auf jedem Inhalt (Entwurf / veroeffentlicht), wer ihn erstellt hat und wie er geprueft wurde.
--     Gelesen werden kann nur, was veroeffentlicht ist. Agenten-Vorschlaege bleiben unsichtbar, bis jemand freigibt.
--   * Wahlen, Argumente, Abstimmungen, Stimmverhalten, Zuordnung Abstimmung > Frage.
--   * Position: woertlicher Auszug und "was die Partei selbst als Aenderung ankuendigt" (Entscheidung 06.11.2026:
--     keine eigene Auswirkungs-Prognose, nur die Ankuendigung der Partei mit Seitenzahl).
--   * Fehlermeldungen: angemeldete Nutzer koennen schreiben, niemand kann lesen (nur das Team im Dashboard).

-- 1. Freigabe-Spalten fuer die bestehenden Inhaltstabellen.
--    Bestehende Zeilen werden als veroeffentlicht markiert, neue Zeilen starten als Entwurf.
do $$
declare t text;
begin
  foreach t in array array['parteien', 'themen', 'programme', 'fragen', 'positionen'] loop
    execute format('alter table public.%I add column if not exists status text not null default %L check (status in (%L, %L))',
      t, 'veroeffentlicht', 'entwurf', 'veroeffentlicht');
    execute format('alter table public.%I alter column status set default %L', t, 'entwurf');
    execute format('alter table public.%I add column if not exists erstellt_von text not null default %L check (erstellt_von in (%L, %L))',
      t, 'mensch', 'mensch', 'agent');
    execute format('alter table public.%I add column if not exists geprueft text not null default %L check (geprueft in (%L, %L, %L))',
      t, 'nein', 'nein', 'maschinell', 'mensch');
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "oeffentlich lesbar" on public.%I', t);
    execute format('create policy "oeffentlich lesbar" on public.%I for select to anon, authenticated using (status = %L)',
      t, 'veroeffentlicht');
  end loop;
end $$;

-- 2. Neue Felder an bestehenden Tabellen (alle optional).
alter table public.fragen     add column if not exists kurz text;
alter table public.positionen add column if not exists auszug text;
alter table public.positionen add column if not exists aenderung text;
-- Links nur als https, damit kein "javascript:"-Link in die App gelangt (die App prueft zusaetzlich).
alter table public.programme drop constraint if exists programme_quelle_url_https;
alter table public.programme add constraint programme_quelle_url_https check (quelle_url is null or quelle_url ~ '^https://');

-- 3. Wahlen
create table if not exists public.wahlen (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  datum date not null,
  parlament text not null,
  ist_demo boolean not null default true,
  status text not null default 'entwurf' check (status in ('entwurf', 'veroeffentlicht')),
  erstellt_am timestamptz not null default now()
);
alter table public.programme add column if not exists wahl_id uuid references public.wahlen(id) on delete set null;
create index if not exists programme_wahl_id_idx on public.programme (wahl_id);

-- 4. Argumente dafuer und dagegen, Quelle ist Pflicht
create table if not exists public.argumente (
  id uuid primary key default gen_random_uuid(),
  frage_id uuid not null references public.fragen(id) on delete cascade,
  richtung text not null check (richtung in ('dafuer', 'dagegen')),
  text text not null,
  quelle_text text not null,
  quelle_url text check (quelle_url is null or quelle_url ~ '^https://'),
  ist_demo boolean not null default true,
  status text not null default 'entwurf' check (status in ('entwurf', 'veroeffentlicht')),
  erstellt_von text not null default 'mensch' check (erstellt_von in ('mensch', 'agent')),
  geprueft text not null default 'nein' check (geprueft in ('nein', 'maschinell', 'mensch')),
  erstellt_am timestamptz not null default now()
);
create index if not exists argumente_frage_id_idx on public.argumente (frage_id);

-- 5. Abstimmungen und Stimmverhalten (Stufe 1: Tatsachen aus offiziellen Quellen, ohne KI)
create table if not exists public.abstimmungen (
  id uuid primary key default gen_random_uuid(),
  parlament text not null,
  datum date not null,
  titel text not null,
  quelle_text text not null,
  quelle_url text check (quelle_url is null or quelle_url ~ '^https://'),
  ist_demo boolean not null default true,
  status text not null default 'entwurf' check (status in ('entwurf', 'veroeffentlicht')),
  erstellt_am timestamptz not null default now()
);
create table if not exists public.stimmverhalten (
  abstimmung_id uuid not null references public.abstimmungen(id) on delete cascade,
  partei_id uuid not null references public.parteien(id) on delete cascade,
  stimme text not null check (stimme in ('ja', 'nein', 'enthaltung')),
  -- Koalition oder Opposition zum Zeitpunkt der Abstimmung, damit "gesagt und abgestimmt" nicht wie gebrochenes Versprechen wirkt
  rolle text check (rolle in ('koalition', 'opposition')),
  primary key (abstimmung_id, partei_id)
);
create index if not exists stimmverhalten_partei_id_idx on public.stimmverhalten (partei_id);

-- 6. Zuordnung Abstimmung > Frage (n:m, redaktionelle Entscheidung, deshalb mit Begruendung und Freigabe)
create table if not exists public.abstimmung_frage (
  abstimmung_id uuid not null references public.abstimmungen(id) on delete cascade,
  frage_id uuid not null references public.fragen(id) on delete cascade,
  begruendung text,
  status text not null default 'entwurf' check (status in ('entwurf', 'veroeffentlicht')),
  erstellt_von text not null default 'mensch' check (erstellt_von in ('mensch', 'agent')),
  primary key (abstimmung_id, frage_id)
);
create index if not exists abstimmung_frage_frage_id_idx on public.abstimmung_frage (frage_id);

-- 7. Lesen: nur Veroeffentlichtes. Schreiben: keine Richtlinie, also niemand ueber die App.
alter table public.wahlen enable row level security;
alter table public.argumente enable row level security;
alter table public.abstimmungen enable row level security;
alter table public.stimmverhalten enable row level security;
alter table public.abstimmung_frage enable row level security;
do $$
declare t text;
begin
  foreach t in array array['wahlen', 'argumente', 'abstimmungen', 'stimmverhalten', 'abstimmung_frage'] loop
    execute format('drop policy if exists "oeffentlich lesbar" on public.%I', t);
  end loop;
end $$;
create policy "oeffentlich lesbar" on public.wahlen for select to anon, authenticated using (status = 'veroeffentlicht');
create policy "oeffentlich lesbar" on public.argumente for select to anon, authenticated using (status = 'veroeffentlicht');
create policy "oeffentlich lesbar" on public.abstimmungen for select to anon, authenticated using (status = 'veroeffentlicht');
create policy "oeffentlich lesbar" on public.stimmverhalten for select to anon, authenticated
  using (exists (select 1 from public.abstimmungen a where a.id = abstimmung_id and a.status = 'veroeffentlicht'));
create policy "oeffentlich lesbar" on public.abstimmung_frage for select to anon, authenticated using (status = 'veroeffentlicht');
grant select on public.wahlen, public.argumente, public.abstimmungen, public.stimmverhalten, public.abstimmung_frage to anon, authenticated;

-- 8. Fehler melden: nur angemeldet (bremst Spam), nur eigene Zeilen anlegen, lesen kann niemand ueber die App.
create table if not exists public.fehlermeldungen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  bezug text not null check (char_length(bezug) <= 200),
  text text not null check (char_length(text) between 3 and 1000),
  erstellt_am timestamptz not null default now()
);
create index if not exists fehlermeldungen_user_id_idx on public.fehlermeldungen (user_id);
alter table public.fehlermeldungen enable row level security;
drop policy if exists "eigene Meldung anlegen" on public.fehlermeldungen;
create policy "eigene Meldung anlegen" on public.fehlermeldungen for insert to authenticated
  with check ((select auth.uid()) = user_id);
grant insert on public.fehlermeldungen to authenticated;
