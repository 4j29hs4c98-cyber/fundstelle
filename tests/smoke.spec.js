// tests/smoke.spec.js — die Grundlagen, die jede Freigabe bestehen muss.
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', e => { throw e; });            // jeder JavaScript-Fehler laesst den Test scheitern
  await page.route('**/cdn.jsdelivr.net/**', r => r.fulfill({ body: '', contentType: 'text/javascript' }));
  await page.route('**/fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
});

test('jeder Bereich oeffnet ohne Fehler und ohne seitliches Scrollen', async ({ page }) => {
  for (const v of ['ueberblick', 'vergleich', 'kontext', 'programme', 'settings']) {
    await page.goto(`/#${v}`);
    await expect(page.locator('#main h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
  }
});

test('der Vergleich zeigt sechs Positionen mit Quelle', async ({ page }) => {
  await page.goto('/#vergleich');
  await expect(page.locator('.pos')).toHaveCount(6);
  await expect(page.locator('.pos .src').first()).toContainText('Beispielprogramm');
});

test('eine andere Frage waehlen tauscht die Positionen aus', async ({ page }) => {
  await page.goto('/#vergleich');
  await page.click('[data-action=frage][data-id=renteneintritt]');
  await expect(page.locator('.question')).toContainText('Renteneintrittsalter');
  await expect(page.locator('.pos')).toHaveCount(6);
});

test('der Ausschnitt klappt zur vollstaendigen Aussage auf', async ({ page }) => {
  await page.goto('/#kontext');
  await expect(page.locator('.quote .wrap').first()).toBeHidden();
  await page.click('[data-action=aussage-aufklappen]');
  await expect(page.locator('.quote .wrap').first()).toBeVisible();
});

test('ein gemerktes Thema wird auf dem Geraet gespeichert und ueberlebt das Neuladen', async ({ page }) => {
  await page.goto('/#ueberblick');
  await page.click('[data-action=merken][data-thema=wohnen]');
  await page.reload();
  await expect(page.locator('[data-action=merken][data-thema=wohnen]')).toHaveAttribute('aria-pressed', 'true');
});

test('ein Thema wieder entfernen bietet Rueckgaengig an', async ({ page }) => {
  await page.goto('/#ueberblick');
  await page.click('[data-action=merken][data-thema=klima]');
  await page.click('[data-action=merken][data-thema=klima]');
  await expect(page.locator('[data-action=merken][data-thema=klima]')).toHaveAttribute('aria-pressed', 'false');
  await page.click('.toast-action');
  await expect(page.locator('[data-action=merken][data-thema=klima]')).toHaveAttribute('aria-pressed', 'true');
});

test('Deutsch erscheint nach dem Umschalten der Sprache', async ({ page }) => {
  await page.goto('/#settings');
  await page.click('[data-action=lang][data-v=de]');
  await expect(page.locator('#main h1')).toHaveText('Einstellungen');
  await expect(page.locator('.tabbar a[data-nav=ueberblick]')).toHaveText('Überblick');
});
