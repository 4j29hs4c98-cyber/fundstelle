# CLAUDE.md — rules for working on this app

This repository is an offline-first web app (PWA) in plain JavaScript (ES modules, no build step),
hosted on GitHub Pages, with optional sync via Supabase. Read this file fully before changing anything.
The owner writes in German or English; answer in English unless asked otherwise, and explain with concrete examples.

## Architecture (keep it)

| File | Job |
|---|---|
| `index.html` | Shell: bottom tab bar, `<main id="main">`, toast, loads `app.js` as a module |
| `app.js` | Entry point: routes clicks (`data-action`), form submits (`data-form`), the URL hash, sync wiring, startup |
| `core.js` | State `S`, records (`list`, `get`, `save`, `remove`), helpers (`esc`, `uid`, `toast`, `undoable`). No screen code |
| `render.js` | Draws the current screen; keeps scroll position and focus across re-renders; language and theme |
| `views/*.js` | One file per screen. Each exports a function returning an HTML string. No side effects |
| `actions.js` | What taps and forms do (`actions[name]`, `forms[name]`) |
| `db.js` | IndexedDB storage on the device (works offline) |
| `sync.js` | Supabase sync: pull newer rows, push local changes, live updates. Newer `updated_at` wins |
| `i18n.js` | Every visible text goes through `tr('English text')`; German translations live here |
| `sw.js` | Service worker: offline cache (`SHELL`) and `VERSION` |
| `config.js` | Public Supabase URL + publishable key (empty = local-only mode) |
| `supabase/` | SQL migrations and server functions (Edge Functions) |
| `scripts/check-release.mjs` | Automatic release checks. Must pass before every release |
| `tests/*.spec.js` | Playwright tests at phone (380 px), tablet (820 px) and desktop (1280 px) |

Pattern for a new feature: data in records → screen in `views/` → behaviour in `actions.js` → texts in `i18n.js`
→ test in `tests/`. Escape all user text with `esc()` before putting it into HTML.

## Data rules (never break existing data)

- Everything is a record `{ id, kind, data, updated_at, deleted, synced }`. Use `save()`/`remove()`; never write IndexedDB directly.
- New fields inside `data` are **optional**: code must work when they are missing (old records, other devices on an older version).
- Never rename or delete fields; add new ones. If a format must change, migrate once at startup and keep reading the old format.
- Deleting = `remove()` (soft delete), so deletions sync. Prefer **delete + "Undo" toast for 5 s** (`undoable`) over `confirm()`.
  Keep a real confirmation only for irreversible actions (sign out, erase device data, delete account).
- Before a refactor: render every screen and record the saved data with the old code, then compare with the new code. They must be identical.

## UI rules

- Every new text: `tr('…')` + German translation in `i18n.js` (the release check fails otherwise).
- Text contrast must meet WCAG AA (4.5:1), including grey text, in light and dark mode. Colours only via CSS variables.
- Touch targets at least 44 px on phones. No sideways page scrolling at 360–1280 px. Respect `prefers-reduced-motion`.
- Re-rendering must not lose scroll position or focus (`render.js` handles this; keep it working).

## Security rules

- Never commit secrets. Only the Supabase **publishable** key may be in the code. Server keys live in Supabase only.
- Data protection comes from Row Level Security (every row has `user_id`, policies check `auth.uid()`). Every new table gets RLS.
- Server-only data (keys, logs): RLS on and **no** policies, read only by Edge Functions with the service role.
- Paid or restricted features must be enforced on the server (RLS / Edge Function), never only in app code.
- Sensitive content (e.g. journals) is encrypted on the device before saving: Web Crypto AES-GCM 256, random 12-byte IV per item,
  key wrapped with a PBKDF2-SHA-256 (≥ 600,000 rounds, 16-byte salt) passphrase key, plus a one-time recovery key.
  Biometric unlock via WebAuthn passkeys with the PRF extension. Keys only in memory; auto-lock.

## Release workflow (every update)

1. Work on a branch. Make the change, add or adjust tests.
2. Bump `VERSION` in `sw.js` (otherwise installed apps keep the old version) and add new files to `SHELL`.
3. Run `npm run release-check` (release check + all tests). Fix everything until it passes.
4. Take screenshots of changed screens at 380 px and 1280 px (light and dark) and show them to the owner.
5. Write a short changelog and a list of what the owner should test on Android, iPad and MacBook.
6. **Ask before** `git push`, merging to `main`, running SQL on Supabase, deploying Edge Functions, or anything that costs money.
7. After deploy: open the live URL, check the new version loads (hard reload twice), and that the sync dot turns green.

## Supabase changes

- Schema changes go into a new numbered file in `supabase/migrations/` (never edit an applied migration).
- Migrations must be backward compatible: the currently deployed app keeps working before users update.
- Edge Functions: check the user's JWT for app calls; use a shared secret header for timer (`pg_cron`) calls.

## Known pitfalls (from earlier projects)

- Uploading through the GitHub website from a phone flattens folders (`views/x.js` lands in the root) and phones rename
  repeated downloads to `x-1.js`. With git / Claude Code this can't happen; the release check catches missing files anyway.
- Free Supabase plan: auth emails are limited to ~2 per hour. For a personal app, turn off "Confirm email".
- Private GitHub repos can't use free GitHub Pages; use Netlify or Cloudflare Pages then.
- iOS: push notifications only work after "Add to Home Screen"; passkey PRF needs iOS 18+.
- Free Supabase projects pause after a week without activity; the app keeps working offline and sync resumes after unpausing.
