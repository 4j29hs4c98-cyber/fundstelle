// i18n.js — every visible text goes through tr(). English text is the key; German is looked up.
// Rule: whenever you add a tr('…') somewhere, add its German translation here (scripts/check-release.mjs checks this).
const DE = {
  'Politics is complicated enough.': 'Politik ist kompliziert genug.',
  'The information about it is not.': 'Die Information darüber nicht.',
  'Saved for later': 'Für später gemerkt', 'More topics': 'Weitere Themen',
  'You have saved every topic.': 'Sie haben alle Themen gemerkt.',
  'Overview': 'Überblick', 'Compare': 'Vergleich', 'Context': 'Kontext', 'Programmes': 'Programme',
  'Today': 'Heute', 'In context': 'Im Zusammenhang', 'What is going on': 'Worum es gerade geht',
  'Taken out of context': 'Aus dem Zusammenhang gerissen', 'Questions': 'Fragen',
  'These are example data': 'Das hier sind Beispieldaten',
  'The parties are called A to F and every position is invented. That keeps the prototype neutral and stops anyone reading it as a real statement about a real party.': 'Die Parteien heißen A bis F und alle Positionen sind erfunden. So bleibt der Prototyp neutral und niemand hält ihn für eine echte Aussage über eine echte Partei.',
  'Swipe sideways to change section.': 'Seitlich wischen wechselt den Bereich.',
  'Example election date': 'Beispiel-Wahltermin',
  'Before an election the app shows what matters for the decision.': 'Vor Wahlen zeigt die App, was für die Entscheidung zählt.',
  'Remember topic': 'Thema merken', 'Topic remembered': 'Thema gemerkt', 'Topic removed': 'Thema entfernt',
  '{n} positions': '{n} Positionen', 'checked': 'geprüft',
  'One statement, two impressions': 'Eine Aussage, zwei Eindrücke',
  'A sentence that is going around as a short clip, next to what was said before and after it.': 'Ein Satz, der gerade als kurzer Ausschnitt kursiert, und daneben das, was davor und danach gesagt wurde.',
  'With source and date': 'Mit Quelle und Datum',
  'The same question, all programmes side by side.': 'Dieselbe Frage, alle Programme nebeneinander.',
  'Party {p}': 'Partei {p}', 'Source': 'Quelle', 'Date': 'Datum',
  'In favour': 'Dafür', 'Against': 'Dagegen', 'In part': 'Teilweise', 'No statement': 'Keine Angabe',
  'How this is sorted': 'Wie sortiert wird',
  'All parties appear in alphabetical order. There is no ranking and no recommendation.': 'Alle Parteien stehen in alphabetischer Reihenfolge. Es gibt keine Rangliste und keine Empfehlung.',
  'Every card is the same size and the same design. No party gets more room or more colour.': 'Jede Karte ist gleich groß und gleich gestaltet. Keine Partei bekommt mehr Platz oder mehr Farbe.',
  'The labels are deliberately all one colour. Green and red would mean good and bad, and deciding that is not the job of this app.': 'Die Einordnung ist absichtlich einfarbig. Grün und Rot würden gut und schlecht bedeuten, und das zu entscheiden ist nicht die Aufgabe der App.',
  'Under every position you can see which document it comes from and which page.': 'Unter jeder Position steht, aus welchem Dokument und von welcher Seite sie stammt.',
  'If a programme says nothing about it, nothing is shown. Gaps are not filled in.': 'Sagt ein Programm nichts dazu, steht dort auch nichts. Lücken werden nicht gefüllt.',
  'A clip often says something different from the whole sentence.': 'Ein Ausschnitt sagt oft etwas anderes als der ganze Satz.',
  'This is how the sentence is going around. Tap to see what was said before and after.': 'So kursiert der Satz gerade. Tippen Sie, um zu sehen, was davor und danach gesagt wurde.',
  'How it is going around': 'So kursiert es', 'Show the full statement': 'Vollständige Aussage zeigen',
  'The clip shows': 'Der Ausschnitt zeigt', '{a} of {b} seconds': '{a} von {b} Sekunden',
  'Invented example': 'Erfundenes Beispiel',
  'This statement never happened. It is here to show how the app would handle a clip.': 'Diese Aussage hat es nie gegeben. Sie steht hier, um zu zeigen, wie die App mit Ausschnitten umgehen würde.',
  'Every election programme, sorted once.': 'Jedes Wahlprogramm, einmal geordnet.',
  'On the left the reading time of the original, on the right in the app. Nothing important is left out, it is only ordered differently.': 'Links die Lesezeit des Originals, rechts die Lesezeit in der App. Nichts Wichtiges fällt weg, es ist nur anders sortiert.',
  '{n} pages': '{n} Seiten', '{n} topics': '{n} Themen', 'Original': 'Original', 'In the app': 'In der App',
  'Invented programmes': 'Erfundene Programme',
  'Parties A to F do not exist. Page counts and positions are example values.': 'Partei A bis F gibt es nicht. Seitenzahlen und Positionen sind Beispielwerte.',
  'Settings': 'Einstellungen', 'Add': 'Hinzufügen', 'Undo': 'Rückgängig', 'Restored': 'Wiederhergestellt',
  'Delete': 'Löschen', 'Appearance': 'Darstellung', 'System': 'System', 'Light': 'Hell', 'Dark': 'Dunkel', 'Language': 'Sprache',
  'Sync': 'Synchronisierung', 'Local only: add your Supabase keys in config.js to sync between devices.': 'Nur lokal: Trage deine Supabase-Schlüssel in config.js ein, um zwischen Geräten zu synchronisieren.',
  'Email': 'E-Mail', 'Password': 'Passwort', 'Sign in': 'Anmelden', 'Create account': 'Konto erstellen', 'Sign out': 'Abmelden',
  'Signed in as {email}': 'Angemeldet als {email}', 'Synced {ago}': 'Synchronisiert {ago}', 'Syncing…': 'Wird synchronisiert…',
  'Offline. Changes sync when you are back online.': 'Offline. Änderungen werden synchronisiert, sobald du wieder online bist.',
  'Sync failed: {msg}': 'Synchronisierung fehlgeschlagen: {msg}', 'just now': 'gerade eben', '{n} min ago': 'vor {n} Min.',
  'Your data': 'Deine Daten', 'Export backup': 'Backup exportieren', 'Import backup': 'Backup importieren', 'Imported {n} items': '{n} Einträge importiert',
  'That file is not a valid backup.': 'Diese Datei ist kein gültiges Backup.', 'Sign out? Your data stays on this device.': 'Abmelden? Deine Daten bleiben auf diesem Gerät.',
  'Check your email and confirm, then sign in here.': 'Bestätige die E-Mail in deinem Postfach und melde dich dann hier an.',
  'Something went wrong. Try again.': 'Etwas ist schiefgelaufen. Versuch es nochmal.', 'Signed in': 'Angemeldet',
};
let lang = 'en';
export const setLang = l => { lang = l === 'de' ? 'de' : 'en'; };
export const getLang = () => lang;
export const LOC = () => (lang === 'de' ? 'de-DE' : 'en-GB');
export function tr(text, vars) {
  let out = (lang === 'de' && DE[text]) || text;
  if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
  return out;
}
export const missingGerman = keys => keys.filter(k => !DE[k]);
