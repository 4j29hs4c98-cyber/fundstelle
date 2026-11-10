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
  for (const v of ['start', 'themen', 'thema/3a18c189-c9a4-49dc-8ad9-7e49ac440fe4', `frage/${MIETE}`, 'parteien', `partei/${SPD}`, `programm/${SPD}/20`, `vergleich/${SPD}`, 'pruefen', 'auswahl', 'settings']) {
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
