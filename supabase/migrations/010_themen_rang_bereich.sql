-- 010_themen_rang_bereich.sql — Themen des Tages bekommen einen Rang (1 = wichtigstes, von der KI abgewogen) und einen
-- Themenbereich aus einer festen Liste (siehe nachrichten-themen/pruefung.ts, BEREICHE). Der Rang bestimmt die drei Themen
-- auf der Startseite, der Bereich die Gruppen der Seite "Nachrichtenabfrage". Mehrfach ausfuehrbar.
alter table public.nachrichten_themen add column if not exists rang int check (rang is null or rang between 1 and 100);
alter table public.nachrichten_themen add column if not exists bereich text check (bereich is null or length(bereich) <= 40);
