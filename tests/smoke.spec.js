// tests/smoke.spec.js — die Grundlagen, die jede Freigabe bestehen muss.
import { test, expect } from '@playwright/test';

const MIETE = 'c2fcc20d-f7ff-4f12-b03a-7a4dce5ba1f8';
const RENTE = '95c54175-3b25-4055-a704-52ebec90696f';
const SPD = '32ad76bd-db22-420d-89c2-0ba593d4f289';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', e => { throw e; });            // jeder JavaScript-Fehler laesst den Test scheitern
  await page.route('**/cdn.jsdelivr.net/**', r => r.fulfill({ body: '', contentType: 'text/javascript' }));
  await page.route('**/fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
});

test('jede Seite oeffnet ohne Fehler und ohne seitliches Scrollen', async ({ page }) => {
  for (const v of ['start', 'themen', 'thema/3a18c189-c9a4-49dc-8ad9-7e49ac440fe4', `frage/${MIETE}`, 'parteien', `partei/${SPD}`, `programm/${SPD}/20`, `vergleich/${SPD}`, 'pruefen', 'settings', 'recherche']) {
    await page.goto(`/#${v}`);
    await expect(page.locator('#main h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
  }
});

test('alte Adressen aus Version 1 fuehren in die neuen Bereiche', async ({ page }) => {
  await page.goto('/#programme');
  await expect(page.locator('.tabbar a[data-nav=parteien]')).toHaveAttribute('aria-current', 'page');
  // Seit Version 2 ist #vergleich eine eigene Seite unter Parteien (Parteien nebeneinander).
  await page.goto('/#vergleich');
  await expect(page.locator('.tabbar a[data-nav=parteien]')).toHaveAttribute('aria-current', 'page');
});

test('die Frage zeigt alle elf Parteien alphabetisch, mit Argumenten und Abstimmung', async ({ page }) => {
  await page.goto(`/#frage/${MIETE}`);
  await expect(page.locator('.pos')).toHaveCount(11);
  await expect(page.locator('.pos .who').first()).toContainText('AfD');
  await expect(page.locator('.pos .who').last()).toContainText('Volt');
  await expect(page.locator('.args li')).toHaveCount(2);
  await expect(page.locator('.vote .stimmen dt')).toHaveCount(6);
  await expect(page.locator('.vote')).toContainText('in government');
});

test('Ausschussbericht in indirekter Rede steht ohne Anfuehrungszeichen und mit Hinweis', async ({ page }) => {
  await page.goto(`/#frage/${MIETE}`);
  const indirekt = page.locator('.auszug.indirekt');
  await expect(indirekt).toHaveCount(2); // CDU und CSU, Bericht des Rechtsausschusses
  await expect(indirekt.first()).toContainText('Committee report, paraphrased:');
  await expect(indirekt.first()).not.toContainText('„');
  await expect(page.locator('.auszug:not(.indirekt)').first()).toContainText('„');
});

test('die Programmstelle klappt mit woertlichem Auszug und Seite auf', async ({ page }) => {
  await page.goto(`/#frage/${MIETE}`);
  const stelle = page.locator('.pos .stelle').first();
  await expect(stelle.locator('.auszug')).toBeHidden();
  await stelle.locator('summary').click();
  await expect(stelle.locator('.auszug')).toContainText('Mietpreisbremse');
  await expect(stelle.locator('summary')).toContainText('PDF page 39');
});

test('vom Thema zur Frage und zurueck', async ({ page }) => {
  await page.goto('/#themen');
  await page.click('a[href^="#thema/"] >> nth=0');
  await page.click(`a[href="#frage/${MIETE}"]`);
  await expect(page.locator('#main h1')).toContainText('Mietpreisbremse');
  await page.click('.back');
  await expect(page.locator('#main h1')).toHaveText('Wohnen und Mieten');
});

test('Nachpruefen findet die Fundstelle oder sagt klar, dass es keine gibt', async ({ page }) => {
  await page.goto('/#pruefen');
  await page.fill('#suche-q', 'Grünen Mietpreisbremse');
  await page.press('#suche-q', 'Enter');
  await expect(page.locator('.card.paper')).toHaveCount(1);
  await expect(page.locator('.card.paper')).toContainText('PDF page 69');
  await page.fill('#suche-q', 'SSW Mietpreisbremse');
  await page.press('#suche-q', 'Enter');
  await expect(page.locator('.notice').first()).toContainText('No passage found');
});

test('Pruefen zeigt bei Abstimmungstreffern, wie die gesuchte Partei abgestimmt hat', async ({ page }) => {
  await page.goto('/#pruefen');
  await page.fill('#suche-q', 'Grünen Mietpreisbremse');
  await page.press('#suche-q', 'Enter');
  const karte = page.locator('.card.link', { hasText: 'Verlängerung der Mietpreisbremse' });
  await expect(karte.locator('.stimmen dt')).toHaveText(['GRÜNE']);
  await expect(karte.locator('.stimmen dd')).toContainText(/Yes|Ja/);
  // Ohne genannte Partei bleibt die Karte wie bisher ohne Stimmenliste.
  await page.fill('#suche-q', 'Mietpreisbremse');
  await page.press('#suche-q', 'Enter');
  await expect(page.locator('.card.link', { hasText: 'Verlängerung der Mietpreisbremse' }).locator('.stimmen')).toHaveCount(0);
});

test('Alle vier Tabs tragen am Handy ihre Beschriftung, nicht nur der aktive', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'Leiste mit Beschriftung unter dem Symbol nur am Handy');
  await page.goto('/#start');
  for (const nav of ['start', 'themen', 'parteien', 'pruefen']) await expect(page.locator(`.tabbar a[data-nav=${nav}] span`)).toBeVisible();
  const breiten = await page.locator('.tabbar').evaluate(el => [el.scrollWidth, el.clientWidth, document.documentElement.scrollWidth, innerWidth]);
  expect(breiten[0]).toBeLessThanOrEqual(breiten[1]);
  expect(breiten[2]).toBeLessThanOrEqual(breiten[3]);
});

test('eine gemerkte Frage erscheint auf dem Start und ueberlebt das Neuladen', async ({ page }) => {
  await page.goto(`/#frage/${RENTE}`);
  await page.click(`[data-action=merken][data-frage="${RENTE}"]`);
  // Erst neu laden, wenn das Speichern fertig ist (der Stern zeigt es an).
  await expect(page.locator(`[data-action=merken][data-frage="${RENTE}"]`)).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator(`[data-action=merken][data-frage="${RENTE}"]`)).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/#start');
  await expect(page.locator(`a.card[href="#frage/${RENTE}"]`)).toBeVisible();
});

test('eine Frage wieder entfernen bietet Rueckgaengig an', async ({ page }) => {
  await page.goto(`/#frage/${MIETE}`);
  const pin = page.locator(`[data-action=merken][data-frage="${MIETE}"]`);
  await pin.click();
  await pin.click();
  await expect(pin).toHaveAttribute('aria-pressed', 'false');
  await page.click('.toast-action');
  await expect(pin).toHaveAttribute('aria-pressed', 'true');
});

test('Fehler melden ohne Verbindung erklaert, was zu tun ist', async ({ page }) => {
  await page.goto(`/#frage/${MIETE}`);
  await page.click('.herkunft [data-action=melden]');
  await page.fill('#melden-text', 'Seitenzahl stimmt nicht');
  await page.click('.melden .btn.primary');
  await expect(page.locator('#toast')).toContainText('connection');
  await expect(page.locator('#melden-text')).toBeVisible();
});

test('Deutsch erscheint nach dem Umschalten der Sprache', async ({ page }) => {
  await page.goto('/#settings');
  await page.click('[data-action=lang][data-v=de]');
  await expect(page.locator('#main h1')).toHaveText('Einstellungen');
  await expect(page.locator('.tabbar a[data-nav=pruefen]')).toHaveText('Prüfen');
});

// Regel vom 09.11.2026: nur dafuer oder dagegen, nie "keine Angabe" oder "teilweise".
test('keine Frage zeigt eine unklare Haltung', async ({ page }) => {
  for (const id of [MIETE]) {
    await page.goto(`/#frage/${id}`);
    await expect(page.locator('.pos').first()).toBeVisible();
    await expect(page.locator('.stance', { hasText: /No statement|In part|Keine Angabe|Teilweise/ })).toHaveCount(0);
  }
});

test('eigenes Thema: beim Tippen meldet sich der Agent und verlangt ohne Konto eine Anmeldung', async ({ page }) => {
  await page.goto('/#themen');
  await page.locator('a[href="#eigene"]').first().click();
  const feld = page.locator('#eigen-frage');
  await feld.fill('Soll');
  await expect(page.locator('#recherche')).toContainText('12');
  await feld.fill('Soll es ein Tempolimit auf Autobahnen geben?');
  await expect(page.locator('#recherche [role=status]')).toContainText(/Sign in|anmelden|not switched on|nicht eingeschaltet/, { timeout: 8000 });
  await expect(feld).toBeFocused();
});

test('die Parteiseite beginnt mit einer kurzen Zusammenfassung samt Quellen', async ({ page }) => {
  await page.goto('/#partei/9823eced-6ef4-485f-a509-dd754f98f4ba');
  const profil = page.locator('section.profil');
  await expect(profil).toBeVisible();
  await expect(profil.locator('sup.fn')).toHaveCount(4);
  // Die Zusammenfassung steht vor den Themen.
  const vorThemen = await page.evaluate(() => {
    const p = document.querySelector('section.profil'), t = document.querySelector('.pos');
    return !!(p && t && (p.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING));
  });
  expect(vorThemen).toBe(true);
  await profil.locator('details summary').click();
  await expect(profil.locator('.profil-quellen li')).toHaveCount(4);
  await expect(profil.locator('.profil-quellen a[href^="https://"]')).toHaveCount(4);
  // Je Partei zwei externe Quellen und zwei Programmstellen; die Nummern sind keine Links, die vom Router wegfuehren.
  await expect(profil.locator('.profil-quellen .meta', { hasText: /Outside source|Externe Quelle/ })).toHaveCount(2);
  await expect(profil.locator('sup.fn a')).toHaveCount(0);
  await expect(page).toHaveURL(/#partei\//);
});

test('eigenes Thema: Ja/Nein-Bubble vorn, darunter das Warum; offene Fragen ohne Bubble', async ({ page }) => {
  await page.goto('/#eigene');
  await page.waitForLoadState('networkidle'); // App fertig gestartet, bevor setContent die Seite ersetzt
  const html = await page.evaluate(async () => {
    const { R } = await import('/recherche.js');
    const { ergebnisHtml } = await import('/views/eigene.js');
    const basis = { zusammenfassung: 'Zwei bis drei Saetze zur Begruendung.', auszug: 'Ein woertliches Zitat aus dem Programm.', seite: 3, quelle_url: 'https://example.org/p.pdf' };
    Object.assign(R, { status: 'fertig', typ: 'ja_nein', fertig: 2, gesamt: 2, fehlgeschlagen: 0, ergebnisse: [
      { ...basis, partei: '32ad76bd-db22-420d-89c2-0ba593d4f289', haltung: 'dafuer' },
      { ...basis, partei: '9823eced-6ef4-485f-a509-dd754f98f4ba', haltung: 'dagegen' }] });
    const jaNein = ergebnisHtml();
    Object.assign(R, { typ: 'offen', ergebnisse: [{ ...basis, partei: '32ad76bd-db22-420d-89c2-0ba593d4f289', haltung: null }] });
    return { jaNein, offen: ergebnisHtml() };
  });
  await page.setContent(`<div id="a">${html.jaNein}</div><div id="b">${html.offen}</div>`);
  await expect(page.locator('#a .bubble.ja')).toHaveCount(1);
  await expect(page.locator('#a .bubble.nein')).toHaveCount(1);
  await expect(page.locator('#a .bubble.ja')).toContainText(/Yes|Ja/);
  await expect(page.locator('#a .pos.eigen').first().locator('.warum')).toContainText('Begruendung');
  await expect(page.locator('#b .bubble')).toHaveCount(0);
  await expect(page.locator('#b .warum')).toContainText('Position');
});

test('eigenes Thema: Personenfrage zeigt drei beschriftete Quellen und verwirft unsichere Belege', async ({ page }) => {
  await page.goto('/#eigene');
  const r = await page.evaluate(async () => {
    const { R, belegPruefen } = await import('/recherche.js');
    const { ergebnisHtml } = await import('/views/eigene.js');
    const gut = [
      { quelle: 'abstimmung', titel: 'Abstimmung A', stimme: 'nein', url: 'https://www.abgeordnetenwatch.de/a', datum: '2026-03-01' },
      { quelle: 'rede', titel: 'Rede B', zusammenfassung: 'Zusammenfassung B.', auszug: 'Zitat B aus dem Protokoll.', url: 'https://dserver.bundestag.de/b.pdf', fundstelle: 'Plenarprotokoll 21/1, ab S. 1' },
      { quelle: 'web', titel: 'Artikel C', zusammenfassung: 'Zusammenfassung C.', auszug: 'Zitat C von der Seite.', url: 'https://www.tagesschau.de/c', seite_name: 'tagesschau.de' },
    ];
    const schlecht = [
      { quelle: 'web', titel: 'X', zusammenfassung: 'x', auszug: 'y', url: 'javascript:alert(1)' },
      { quelle: 'abstimmung', titel: 'Y', stimme: 'vielleicht', url: 'https://x.org/' },
      { quelle: 'erfunden', titel: 'Z', url: 'https://x.org/' },
    ];
    Object.assign(R, { status: 'fertig', typ: 'person', fertig: 3, gesamt: 3, fehlgeschlagen: 0, ergebnisse: [],
      person: { name: 'Erika Beispiel', partei: null, gefunden: false }, belege: [...gut, ...schlecht] });
    return { html: ergebnisHtml(), geprueft: [...gut, ...schlecht].map(belegPruefen).filter(Boolean).length };
  });
  expect(r.geprueft).toBe(3);
  await page.setContent(`<div id="p">${r.html}</div>`);
  await expect(page.locator('#p h3')).toHaveText([/Votes|Abstimmungen/, /Speeches|Reden/, /Web sources|Webquellen/]);
  await expect(page.locator('#p .pos.beleg')).toHaveCount(3);
  await expect(page.locator('#p .pos.beleg.web')).toHaveCount(1);
  await expect(page.locator('#p a[href^="javascript"]')).toHaveCount(0);
  await expect(page.locator('#p')).toContainText(/current Bundestag|aktuellen Bundestags/);
});

test('Vergleich: Spalten alphabetisch, egal in welcher Reihenfolge gewaehlt', async ({ page }) => {
  await page.goto('/#vergleich/');
  await page.locator('.pchip', { hasText: 'SPD' }).click();
  await page.locator('.pchip', { hasText: 'AfD' }).click();
  await page.locator('.pchip', { hasText: 'BSW' }).click();
  // Wartende Pruefung: Seit Auswahl-Wechsel ohne Seitenanimation zeichnet, darf der Test nicht vor dem letzten Neuzeichnen lesen.
  await expect(page.locator('.vfrage').first().locator('.vz-partei b')).toHaveText(['AfD', 'BSW', 'SPD']);
  await expect(page.locator('#main')).not.toContainText(/order you picked|Ihrer Reihenfolge/);
});

test('Vergleich: Halbkreis mit 630 Sitzen, Sitze und Knoepfe bleiben gleich gewaehlt', async ({ page }) => {
  await page.goto('/#vergleich/');
  await expect(page.locator('.halbkreis .seat')).toHaveCount(630);
  await expect(page.locator('.halbkreis figcaption')).toContainText(/sets this order, not this app|legt der Bundestag fest, nicht diese App/);
  // Auswahl ueber den Knopf: Sitzblock wird hervorgehoben und traegt den Buchstaben A.
  await page.locator('.pchip', { hasText: 'SPD' }).click();
  await expect(page.locator(`.halbkreis .block.an[data-id="${SPD}"]`)).toHaveCount(1);
  await expect(page.locator('.halbkreis svg')).toHaveClass(/auswahl/);
  // Auswahl ueber die Sitze: der passende Knopf wird gedrueckt.
  const afd = '9823eced-6ef4-485f-a509-dd754f98f4ba';
  await page.locator(`.halbkreis .block[data-id="${afd}"] .seat`).first().dispatchEvent('click');
  await expect(page.locator(`.pchip[data-id="${afd}"]`)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator(`.pchip[data-id="${afd}"] .slot`)).toHaveText('A');
  await expect(page.locator(`.pchip[data-id="${SPD}"] .slot`)).toHaveText('B');
  await expect(page.locator('.halbkreis .block.an')).toHaveCount(2);
  // Abwaehlen ueber die Sitze nimmt auch den Knopf zurueck.
  await page.locator(`.halbkreis .block[data-id="${SPD}"] .seat`).first().dispatchEvent('click');
  await expect(page.locator(`.pchip[data-id="${SPD}"]`)).toHaveAttribute('aria-pressed', 'false');
});

test('Startfrage recherchiert direkt auf der Startseite, auch wenn es passende Fragen in der App gibt', async ({ page }) => {
  await page.goto('/#start');
  await page.fill('#start-q', 'Welche Meinung vertritt Friedrich Merz zum Tierschutz?');
  await page.press('#start-q', 'Enter');
  await expect(page).toHaveURL(/#start$/);
  await expect(page.locator('#start-q')).toHaveValue('Welche Meinung vertritt Friedrich Merz zum Tierschutz?');
  await expect(page.locator('#recherche [role=status]')).toContainText(/Sign in|anmelden|not switched on|nicht eingeschaltet|starting|startet/, { timeout: 8000 });
  await expect(page.locator('.notice')).toHaveCount(0);
  // Mit Treffer in der App: Recherche oben, die vorhandenen Fragen darunter.
  await page.fill('#start-q', 'Soll die Mietpreisbremse verlaengert werden?');
  await page.press('#start-q', 'Enter');
  await expect(page.locator('#recherche')).toBeVisible();
  await expect(page.locator('#recherche ~ .cards .card').first()).toBeVisible();
});

test('eigenes Thema: Parteifrage zeigt Versprochen und Getan, verwirft unsichere Taten und nennt Parteien ohne Fraktion', async ({ page }) => {
  await page.goto('/#eigene');
  const r = await page.evaluate(async () => {
    const { R, tatPruefen } = await import('/recherche.js');
    const { ergebnisHtml } = await import('/views/eigene.js');
    const fr = (fraktion, mehrheit, ja, nein) => ({ fraktion, parteien: [], mehrheit, ja, nein, enthalten: 0 });
    const gut = [
      { quelle: 'fraktion_abstimmung', titel: 'Abstimmung A', url: 'https://www.abgeordnetenwatch.de/a', datum: '2026-10-16', angenommen: true,
        fraktionen: [fr('AfD', 'nein', 0, 133), fr('CDU/CSU', 'ja', 195, 0)] },
      { quelle: 'antrag', titel: 'Antrag B', art: 'Antrag', nummer: '21/5325', url: 'https://dserver.bundestag.de/btd/21/053/2105325.pdf', datum: '2026-04-14',
        fraktionen: [{ fraktion: 'BÜNDNIS 90/DIE GRÜNEN', parteien: [] }] },
      { quelle: 'web', partei: '32ad76bd-db22-420d-89c2-0ba593d4f289', titel: 'Artikel C', zusammenfassung: 'Zusammenfassung C.', auszug: 'Zitat C von der Seite.',
        url: 'https://www.zdf.de/c', seite_name: 'zdf.de' },
    ];
    const schlecht = [
      { quelle: 'antrag', titel: 'X', url: 'javascript:alert(1)', fraktionen: [{ fraktion: 'SPD' }] },
      { quelle: 'fraktion_abstimmung', titel: 'Y', url: 'https://x.org/', fraktionen: [] },
      { quelle: 'erfunden', titel: 'Z', url: 'https://x.org/' },
    ];
    Object.assign(R, { status: 'fertig', typ: 'offen', fertig: 14, gesamt: 14, fehlgeschlagen: 0, ergebnisse: [], belege: [],
      taten: [...gut, ...schlecht], ohneFraktion: ['9823eced-6ef4-485f-a509-dd754f98f4ba'] });
    return { html: ergebnisHtml(), geprueft: [...gut, ...schlecht].map(tatPruefen).filter(Boolean).length };
  });
  expect(r.geprueft).toBe(3);
  await page.setContent(`<div id="p">${r.html}</div>`);
  await expect(page.locator('#p h2')).toHaveText([/programmes promise|Programme versprechen/, /parties do|Parteien tun/]);
  await expect(page.locator('#p h3')).toHaveText([/Recorded votes|Namentliche/, /Motions|Anträge/, /news|Nachrichten/]);
  await expect(page.locator('#p .fraktionen li')).toHaveCount(2);
  await expect(page.locator('#p .fraktionen li').first()).toContainText('AfD');
  await expect(page.locator('#p .pos.beleg')).toHaveCount(3);
  await expect(page.locator('#p a[href^="javascript"]')).toHaveCount(0);
  await expect(page.locator('#p')).toContainText(/no parliamentary group|keine Fraktion/);
  await expect(page.locator('#p')).toContainText(/No programme answers|Kein Programm beantwortet/);
});

test('Vergleich: eigene Frage zeigt je gewaehlter Partei eine Spalte mit Versprochen und Getan, ohne fremde Taten', async ({ page }) => {
  const A = '32ad76bd-db22-420d-89c2-0ba593d4f289', B = '9823eced-6ef4-485f-a509-dd754f98f4ba';
  await page.goto(`/#vergleich/${A},${B}`);
  await expect(page.locator('#eigen-frage')).toBeVisible();
  const html = await page.evaluate(async ([a, b]) => {
    const { R } = await import('/recherche.js');
    const { vergleichErgebnisHtml } = await import('/views/vergleich-eigene.js');
    const alt = { ...R };
    Object.assign(R, { status: 'fertig', typ: 'ja_nein', fertig: 14, gesamt: 14, fehlgeschlagen: 0, belege: [],
      ergebnisse: [{ partei: a, haltung: 'dafuer', zusammenfassung: 'Warum A dafuer ist.', auszug: 'Ein woertliches Zitat aus dem Programm von A.', seite: 4, quelle_url: 'https://example.org/a.pdf' }],
      taten: [{ quelle: 'fraktion_abstimmung', titel: 'Abstimmung nur A', url: 'https://www.abgeordnetenwatch.de/x', datum: '2026-10-16', angenommen: true,
        fraktionen: [{ fraktion: 'X', parteien: [a], mehrheit: 'ja', ja: 10, nein: 0, enthalten: 0 }] }],
      ohneFraktion: [b] });
    const out = vergleichErgebnisHtml([a, b]); Object.assign(R, alt); return out;
  }, [A, B]);
  await page.setContent(`<div id="v">${html}</div>`);
  await expect(page.locator('#v .vz')).toHaveCount(2);
  await expect(page.locator('#v .vz').nth(0)).toContainText('Abstimmung nur A');
  await expect(page.locator('#v .vz').nth(0).locator('.bubble.ja')).toHaveCount(1);
  await expect(page.locator('#v .vz').nth(1)).not.toContainText('Abstimmung nur A');
  await expect(page.locator('#v .vz').nth(1)).toContainText(/No matching passage|Keine passende Stelle/);
  await expect(page.locator('#v .vz').nth(1)).toContainText(/No group|Keine Fraktion/);
});

test('Nachrichten: Parteiseite und Personenfrage zeigen nur ihre Schlagzeilen, die Startseite keine Schlagzeilenliste, fremdes HTML wird nicht ausgefuehrt', async ({ page }) => {
  await page.goto('/#start');
  const html = await page.evaluate(async spd => {
    const { N } = await import('/nachrichten.js');
    const v = await import('/views/nachrichten.js');
    N.liste = [
      { url: 'https://example.org/1', quelle: 'tagesschau.de', titel: 'SPD legt Entwurf vor <img src=x onerror=alert(1)>', datum: '2026-11-11T10:00:00Z', parteien: [spd], personen: ['Friedrich Merz'] },
      { url: 'https://example.org/2', quelle: 'welt.de', titel: 'Meldung ohne Partei', datum: '2026-11-11T09:00:00Z', parteien: [], personen: [] },
    ];
    return { start: v.aktuellHtml(), partei: v.parteiNachrichten(spd), andere: v.parteiNachrichten('keine'), person: v.personNachrichten('Merz') };
  }, SPD);
  expect(html.start).toBe('');   // ohne Themen zeigt die Startseite nichts, auch keine Schlagzeilenliste
  await page.setContent(`<div id="p">${html.partei}</div><div id="m">${html.person}</div>`);
  await expect(page.locator('#p img')).toHaveCount(0);
  await expect(page.locator('#p a').first()).toHaveAttribute('rel', /noopener/);
  await expect(page.locator('#p .news li')).toHaveCount(1);
  await expect(page.locator('#m .news li')).toHaveCount(1);
  expect(html.andere).toBe('');
});

test('Themen des Tages: Karten auf der Startseite, Themenseite mit Kurzfassung, Hinweisen und Programmfrage; fremdes HTML bleibt Text', async ({ page }) => {
  await page.goto('/#start');
  await page.evaluate(async spd => {
    const { N } = await import('/nachrichten.js');
    N.liste = [{ url: 'https://example.org/h1', quelle: 'welt.de', titel: 'Einzelne Schlagzeile', datum: '2026-11-17T10:00:00Z', parteien: [], personen: [] }];
    N.themen = [
      { id: 1, titel: 'Haushalt 2027 steht <img src=x onerror=alert(1)>', zusammenfassung: 'Der Ausschuss billigte den Etat. Die Stromsteuer bleibt vorerst unverändert.', parteien: [spd], personen: ['Friedrich Merz'],
        frage: 'Soll die Stromsteuer für private Haushalte gesenkt werden?', frageId: null, quellen: 2, aktualisiert: '2026-11-17T12:00:00Z',
        meldungen: [{ q: 'zdfheute.de', t: 'Ausschuss billigt Haushalt', u: 'https://example.org/1', d: '2026-11-17T12:00:00Z', a: 'meldung' },
                    { q: 'spiegel.de', t: 'Die fetten Jahre sind vorbei', u: 'https://example.org/2', d: '2026-11-17T11:00:00Z', a: 'kommentar' }] },
      { id: 2, titel: 'Thema ohne Kurzfassung', zusammenfassung: null, parteien: [], personen: [], frage: null, frageId: null, quellen: 1, aktualisiert: '2026-11-17T09:00:00Z',
        meldungen: [{ q: 'faz.net', t: 'Nur eine Meldung', u: 'https://example.org/3', d: '2026-11-17T09:00:00Z', a: 'meldung' }] },
    ];
    location.hash = '#start';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }, SPD);
  await expect(page.locator('a[href="#nachricht/1"]')).toBeVisible();
  await expect(page.locator('a[href="#nachricht/1"]')).toContainText('Der Ausschuss billigte den Etat.');
  await expect(page.locator('a[href="#nachricht/1"]')).not.toContainText('Die Stromsteuer bleibt');   // Karte zeigt nur den ersten Satz
  await expect(page.locator('main img')).toHaveCount(0);
  await page.locator('a[href="#nachricht/1"]').click();
  await expect(page).toHaveURL(/#nachricht\/1$/);
  await expect(page.locator('main')).toContainText('Die Stromsteuer bleibt vorerst unverändert.');
  await expect(page.locator('main li .tag')).toHaveCount(1);                    // der Kommentar ist markiert
  await expect(page.locator('main p .tag')).toHaveCount(1);                     // die Kurzfassung ist als KI gekennzeichnet
  await expect(page.locator('main')).toContainText(/Kommentare und Interviews zählen nicht|Comments and interviews do not count/);
  await expect(page.locator('main a[rel~=noopener]')).toHaveCount(2);
  await expect(page.locator('[data-action=nachricht-frage]')).toBeVisible();
  await expect(page.locator('#recherche')).toHaveText('');                      // ohne Klick keine Recherche, keine Kosten
  await page.goto('/#nachricht/99');
  await expect(page.locator('main')).toContainText(/wird geladen|Loading the topic/);       // noch nicht geladen ist nicht "veraltet"
  await page.evaluate(async () => { const { N } = await import('/nachrichten.js'); N.stand = Date.now(); window.dispatchEvent(new HashChangeEvent('hashchange')); });
  await expect(page.locator('main')).toContainText(/nicht mehr aktuell|no longer current/);
});

test('Startseite zeigt nur die drei wichtigsten Themen mit Kurzfassung und zwei Quellen; Nachrichtenabfrage ordnet alle nach Bereich', async ({ page }) => {
  await page.goto('/#start');
  await page.evaluate(async () => {
    const { N } = await import('/nachrichten.js');
    const t = (id, titel, bereich, zf, quellen) => ({ id, titel, rang: id, bereich, zusammenfassung: zf, parteien: [], personen: [], frage: null, frageId: null, quellen, aktualisiert: '2026-11-17T12:00:00Z',
      meldungen: [{ q: 'zdfheute.de', t: `Meldung ${id}`, u: `https://example.org/${id}`, d: '2026-11-17T12:00:00Z', a: 'meldung' }] });
    N.themen = [t(1, 'Erstes Thema', 'Innenpolitik', 'Erster Satz eins. Zweiter.', 3), t(2, 'Nur eine Quelle', 'Außenpolitik und Sicherheit', 'Satz ohne Mehrfachquelle.', 1),
      t(3, 'Drittes Thema', 'Innenpolitik', 'Satz drei ist hier.', 2), t(4, 'Viertes Thema', 'Wirtschaft und Finanzen', 'Satz vier ist hier.', 2),
      t(5, 'Fünftes Thema', 'Wirtschaft und Finanzen', 'Satz fünf ist hier.', 2), t(6, 'Ohne Kurzfassung', 'Weitere Themen', null, 3)];
    N.stand = Date.now();
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
  await expect(page.locator('main a.card.link[href^="#nachricht/"]')).toHaveCount(3);
  await expect(page.locator('main')).not.toContainText('Nur eine Quelle');
  await expect(page.locator('main')).not.toContainText('Fünftes Thema');
  await page.locator('main a[href="#nachrichten"]').click();
  await expect(page).toHaveURL(/#nachrichten$/);
  await expect(page.locator('main article.card')).toHaveCount(6);                 // alle Themen, auch mit einer Quelle
  await expect(page.locator('main h2.eyebrow')).toHaveText(['Innenpolitik', 'Außenpolitik und Sicherheit', 'Wirtschaft und Finanzen', 'Weitere Themen']);
  await page.locator('main a.qchip[href="#nachrichten/2"]').click();
  await expect(page.locator('main article.card')).toHaveCount(2);
  await expect(page.locator('main a.qchip[aria-pressed=true]')).toHaveText('Wirtschaft und Finanzen');
});

test('Vergleich ohne Thema: Gesamtbild der Parteien nebeneinander, mit Thema entfaellt es', async ({ page }) => {
  await page.goto(`/#vergleich/${SPD},9823eced-6ef4-485f-a509-dd754f98f4ba`);
  await expect(page.locator('main .vz-partei').first()).toBeVisible();
  const gesamt = page.locator('h2.eyebrow', { hasText: /Gesamtbild|Overall picture/ });
  await expect(gesamt).toBeVisible();
  await expect(page.locator('main .skala')).toHaveCount(2);
  await page.locator('.qbar .qchip').nth(1).click();
  await expect(gesamt).toHaveCount(0);
});

test('Einordnung: drei feste Zeilen je Partei mit Quelle, Skala links-rechts alphabetisch ohne Rangfolge, AfD mit Gerichtsstand', async ({ page }) => {
  await page.goto(`/#partei/${SPD}`);
  const box = page.locator('.einordnung');
  await expect(box.locator('.fakt')).toHaveCount(3);
  await expect(box).toContainText('3,47');
  await expect(box).toContainText(/Keine Einstufung durch das Bundesamt/);
  await expect(box.locator('.punkt')).toHaveCount(1);
  await expect(box.locator('.quellen a').first()).toHaveAttribute('rel', /noopener/);
  await page.goto('/#partei/9823eced-6ef4-485f-a509-dd754f98f4ba');
  await expect(page.locator('.einordnung')).toContainText('Verdachtsfall');
  await expect(page.locator('.einordnung')).toContainText('vorläufig untersagt');
  await expect(page.locator('.einordnung .fakt')).toHaveCount(3);
  await page.goto('/#parteien');
  const namen = await page.locator('.lr-liste li b').allTextContents();
  expect(namen).toEqual([...namen].sort((a, b) => a.localeCompare(b, 'de')));    // alphabetisch, nicht nach Wert
  expect(namen.length).toBeGreaterThanOrEqual(9);
  await expect(page.locator('.lr-liste li', { hasText: 'SSW' })).toContainText(/nicht erfasst|not included/);
  await expect(page.locator('.lr-liste .punkt').first()).toBeVisible();
});

test('Link pruefen: startet nur auf Knopfdruck, zeigt Urteil mit geprueften Belegen und verwirft unsichere Daten', async ({ page }) => {
  await page.goto('/#pruefen');
  await expect(page.locator('[data-form=linkpruefen]')).toBeVisible();
  await expect(page.locator('#link-pruefung')).toContainText(/about a minute|etwa eine Minute/);   // ohne Klick keine Kosten
  await page.fill('#link-text', 'Die Rente mit 70 wurde im Bundestag beschlossen.');
  await page.click('[data-form=linkpruefen] button');
  await expect(page.locator('#link-pruefung')).toContainText(/sign in|anmelden|not available|nicht verfügbar/, { timeout: 8000 });
  const html = await page.evaluate(async () => {
    const { P, ergebnisPruefen } = await import('/pruefung.js');
    const { pruefungZeichnen } = await import('/views/pruefen.js');
    const r = ergebnisPruefen({ behauptung: 'Die Rente mit 70 wurde im Bundestag beschlossen.<img src=x onerror=alert(1)>', urteil: 'stimmt_nicht',
      link_gelesen: false, grund: 'unbekannt', begruendung: 'Kein solcher Beschluss.', befunde: [
        { url: 'https://www.bundestag.de/a', richtung: 'widerlegt', aussage: 'Regelaltersgrenze 67.', auszug: 'Die Regelaltersgrenze steigt bis 2031 auf 67 Jahre.', seite: 'bundestag.de', titel: 'Rente' },
        { url: 'javascript:alert(1)', richtung: 'widerlegt', aussage: 'x', auszug: 'y', seite: 'x' },
        { url: 'https://zdf.de/b', richtung: 'erfunden', aussage: 'x', auszug: 'y', seite: 'zdf.de' }] });
    Object.assign(P, { url: 'https://example.org/post', status: 'fertig', ergebnis: r });
    pruefungZeichnen();
    return document.getElementById('link-pruefung').innerHTML;
  });
  const box = page.locator('#link-pruefung');
  await expect(box).toContainText(/False|Stimmt nicht/);
  await expect(box.locator('.befund')).toHaveCount(1);                       // unsicherer Link und unbekannte Richtung verworfen
  await expect(box).toContainText(/could not be opened|ließ sich nicht öffnen/);
  await expect(box.locator('a[rel~=noopener]')).toHaveCount(1);
  expect(html).not.toContain('<img');
});
