// views/auswahl.js — feste Seite "Wie wir auswaehlen": Parteien, Fragen, Zuordnung der Abstimmungen, Einsatz der KI.
// Offene Regeln stehen hier ausdruecklich als offen, statt eine Regel vorzutaeuschen.
import { tr } from '../i18n.js';
import { kopf } from './teile.js';

const punkt = (titel, ...absaetze) => `<section class="panel"><h2>${titel}</h2>${absaetze.map(a => `<p>${a}</p>`).join('')}</section>`;

export function viewAuswahl() {
  return `${kopf(tr('Transparency'), tr('How we select'), tr('Every simplification is a choice. This page says who makes it and by which rule.'))}
  ${punkt(tr('Which parties appear'),
    tr('The rule is not decided yet. Until then the app only shows the invented parties A to F.'))}
  ${punkt(tr('Which questions are asked'),
    tr('Questions are chosen by the team, by topic. Every party is shown on every question, in alphabetical order, including parties whose programme says nothing about it.'))}
  ${punkt(tr('How votes are linked to questions'),
    tr('Votes come automatically from official parliament data, without AI. Which vote belongs to which question is an editorial decision: a person decides and the reason is stored with it.'),
    tr('Next to every vote you see whether the party was in government or in opposition at the time.'))}
  ${punkt(tr('How AI is used'),
    tr('AI agents read programmes and suggest positions with a literal quote and page number. Nothing they suggest is published automatically.'),
    tr('Stage 1: facts from official sources go in automatically. Stage 2: a position is only published if a check script finds the quote on the stated page. Stage 3: arguments always need a person to approve them.'))}
  ${punkt(tr('What the app does not do'),
    tr('It does not rate parties, recommend a vote or predict effects of its own. Under “What the parties say would change” you only see what a programme itself announces.'))}
  ${punkt(tr('Found a mistake?'),
    tr('Every content page has a “Report an error” button. Reports go to the team, not to the public.'))}`;
}
