// pruefung.test.ts — `deno test --no-config supabase/functions/behauptung-pruefen/pruefung.test.ts`
import { assertEquals } from 'jsr:@std/assert@1';
import { sichererLink, eingabe, urteilFestlegen, gesperrteSeiten, privateAdresse, stammVon, QUELLEN, type Befund } from './pruefung.ts';

const b = (seite: string, richtung: Befund['richtung'], stamm = seite): Befund => ({ aussage: 'x', auszug: 'y', url: `https://${seite}/a`, seite, stamm, titel: '', richtung });

Deno.test('Links: nur https ohne IP, Port oder lokale Namen', () => {
  assertEquals(sichererLink('https://www.instagram.com/p/abc')?.hostname, 'www.instagram.com');
  for (const l of ['http://example.com', 'https://127.0.0.1/', 'https://localhost/', 'https://[::1]/', 'https://example.com:8443/',
    'https://intern/', 'https://a:b@example.com/', 'javascript:alert(1)', 'https://db.internal/', 'https://localhost./',
    'https://metadata.google.internal./', 'https://foo.local./', 'https://2130706433/', 'https://0x7f.1/']) assertEquals(sichererLink(l), null, l);
});

Deno.test('Private Adressen nach der DNS-Aufloesung', () => {
  for (const ip of ['127.0.0.1', '10.1.2.3', '172.20.0.1', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:127.0.0.1'])
    assertEquals(privateAdresse(ip), true, ip);
  for (const ip of ['185.17.68.1', '2a00:1450:4001::1']) assertEquals(privateAdresse(ip), false, ip);
});

Deno.test('Eingabe: Link oder genug Text, Grenzen', () => {
  assertEquals('fehler' in eingabe({ text: 'zu kurz' }), true);
  assertEquals('fehler' in eingabe({ url: 'http://x.de' }), true);
  assertEquals('fehler' in eingabe({ text: 'a'.repeat(3001) }), true);
  const ok = eingabe({ url: 'https://x.de/p', text: '  Die <b>Rente</b> sinkt  ' });
  assertEquals('fehler' in ok ? null : ok.text, 'Die b Rente /b sinkt');
});

Deno.test('Urteil: "stimmt" braucht zwei Seiten ohne Gegenbeleg', () => {
  assertEquals(urteilFestlegen('stimmt', 'stimmt', [b('zdf.de', 'stuetzt'), b('bpb.de', 'stuetzt')]).urteil, 'stimmt');
  assertEquals(urteilFestlegen('stimmt', 'stimmt', [b('zdf.de', 'stuetzt'), b('zdf.de', 'stuetzt')]).urteil, 'nicht_belegbar');
  // Zwei Unterseiten derselben Stelle zaehlen als eine Seite.
  assertEquals(urteilFestlegen('stimmt', 'stimmt', [b('www.bundestag.de', 'stuetzt', 'bundestag.de'), b('dserver.bundestag.de', 'stuetzt', 'bundestag.de')]).urteil, 'nicht_belegbar');
  assertEquals(stammVon(new URL('https://bmi.bund.de/x'), QUELLEN), 'bund.de');
  assertEquals(urteilFestlegen('stimmt', null, [b('zdf.de', 'stuetzt'), b('bpb.de', 'stuetzt'), b('bund.de', 'widerlegt')]).urteil, 'teilweise');
  assertEquals(urteilFestlegen('stimmt_nicht', 'stimmt_nicht', [b('zdf.de', 'widerlegt'), b('correctiv.org', 'widerlegt')]).urteil, 'stimmt_nicht');
});

Deno.test('Urteil: ohne Belege nie mehr als "nicht belegbar"', () => {
  assertEquals(urteilFestlegen('stimmt_nicht', null, []), { urteil: 'nicht_belegbar', grund: 'keine_belege' });
  assertEquals(urteilFestlegen('nicht_belegbar', null, []), { urteil: 'nicht_belegbar', grund: null });
});

Deno.test('Urteil: Gegenprobe setzt das vorsichtigere Urteil', () => {
  const zwei = [b('zdf.de', 'stuetzt'), b('bpb.de', 'stuetzt')];
  assertEquals(urteilFestlegen('stimmt', 'teilweise', zwei), { urteil: 'teilweise', grund: 'gegenprobe' });
  assertEquals(urteilFestlegen('stimmt', 'stimmt_nicht', zwei), { urteil: 'nicht_belegbar', grund: 'gegenprobe' });
  assertEquals(urteilFestlegen('teilweise', 'stimmt', [b('zdf.de', 'stuetzt'), b('bpb.de', 'widerlegt')]).urteil, 'teilweise');
});

Deno.test('Gesperrte Seiten aus der Fehlermeldung lesen', () => {
  assertEquals(gesperrteSeiten('domain correctiv.org is not allowed', QUELLEN), ['correctiv.org']);
  assertEquals(gesperrteSeiten('irgendein Fehler', QUELLEN), []);
  assertEquals(gesperrteSeiten(`allowed_domains: ${QUELLEN.join(', ')}`, QUELLEN), []);   // Echo der ganzen Liste
  assertEquals(gesperrteSeiten('notbund.de is blocked', QUELLEN), []);
});
