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

test('die Frage zeigt alle zehn Parteien alphabetisch, mit Argumenten und Abstimmung', async ({ page }) => {
  await page.goto(`/#frage/${MIETE}`);
  await expect(page.locator('.pos')).toHaveCount(10);
  await expect(page.locator('.pos .who').first()).toContainText('AfD');
  await expect(page.locator('.pos .who').last()).toContainText('SSW');
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
  await expect(stelle.locator('summary')).toContainText('Page 39');
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
  await expect(page.locator('.card.paper')).toContainText('Page 69');
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
