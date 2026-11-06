# Playbook: building and updating an app like the Habit & Life Tracker

This describes how the Habit & Life Tracker was built, step by step, as a reusable process for new apps.
The code in this starter kit is the cleaned-up foundation; this file explains the "how" and the "why".

---

## Phase 1 — Idea and decisions

1. **Collect inspiration.** Screenshots of apps you like (here: a habit spreadsheet, a Notion dashboard, a workout planner).
2. **Decide where the app lives.** Options were: installable web app, synced web app, Obsidian, Notion.
   Decision: **offline-first web app with cloud sync**: works without internet, syncs between phone, iPad and laptop.
3. **Be honest about limits early.** Example: home screen widgets and Samsung Health need a native app; a web app can't do them.
   We chose: web app now, native later only if widgets or health data become essential.
4. **Preview before building.** For bigger features, make mockup screenshots in the app's real design first and decide
   what to change, then build. (Here: "beta preview" images for habit targets, streaks, insights.)

## Phase 2 — First version (offline only)

- Plain JavaScript, no framework, no build step: `index.html` + ES modules. Easy to host, easy to read, nothing to compile.
- Data in **IndexedDB** as generic records `{ id, kind, data, updated_at, deleted, synced }`. This one decision later made
  sync, backups and encryption easy, because every feature stores the same kind of thing.
- **Service worker** caches all files, so the app opens offline. **Manifest** + icons make it installable.
- Tested in a headless browser at phone, tablet and desktop width before every delivery.

## Phase 3 — Hosting on GitHub Pages

1. Create a public repository and upload the files (later: push with git / Claude Code).
2. Settings → Pages → deploy from `main` (or the included GitHub Actions workflow).
3. The app URL looks like `https://<user>.github.io/<repo>/`.
4. Install: Android Chrome menu → "Install app"; iPhone/iPad Safari → Share → "Add to Home Screen"; Mac/PC: install icon in the address bar.

**Lessons learned while uploading by hand in the browser:**
- Phone uploads put files from subfolders into the main folder → the app showed an empty/green screen. Fix: rename `x.js` to `views/x.js` on GitHub.
- Phones rename a second download to `x-1.js` → GitHub kept the old `x.js`. Fix: clear the Downloads folder before downloading updates.
- After every upload, compare the repository with the intended files (the release check and git make this automatic).

## Phase 4 — Sync with Supabase

1. Create a Supabase project (free plan, region close to you, e.g. Frankfurt).
2. Run `supabase/migrations/001_records.sql`: one `records` table, primary key `(user_id, id)`, Row Level Security so
   each user sees only their own rows, realtime enabled.
3. Put the project URL and the **publishable** key into `config.js` (public by design; never the secret server key).
4. Auth: email + password. Set Site URL and Redirect URL (Authentication → URL Configuration) to the app URL.
   Turn off "Confirm email" for a personal app (the free plan sends only ~2 emails per hour).
5. Sync logic (`sync.js`): after every change, push within ~0.3 s; pull rows newer than the last pull (with a 5-minute overlap
   for clock differences); **newer `updated_at` wins**; deletions are soft deletes; realtime events trigger a pull on other devices.
6. Password reset: "Forgot password" email link opens the app, which asks for a new password.

## Phase 5 — Features added over time (patterns worth reusing)

| Feature | Pattern |
|---|---|
| Push notifications | Web Push. Device subscriptions in a table; Edge Function `notify` builds messages from the user's data; `pg_cron` calls it every 15 min; `notify_log` prevents duplicates; server-only secrets in a table without RLS policies |
| Documents on tasks | Supabase Storage bucket `attachments`, path `<user id>/<owner id>/<file>`, RLS on the folder; temporary signed links to open; delete files only after the Undo window |
| Two languages | `tr('English')` everywhere + German dictionary; language synced as a setting record; notifications follow it |
| Personal areas, weekly plan, archive | New record kinds and optional fields, never breaking old data; archived periods stored as pauses so stats stay fair |
| Reviews + PDF | Statistics calculated on the device; PDF with jsPDF loaded on demand from a pinned CDN version; share sheet on phones |
| Undo instead of confirm | Delete immediately, keep a copy, show "Undo" for 5 s; irreversible steps still ask |
| Week strip, progress ring, "Perfect day" | Reusable view helpers; animations respect `prefers-reduced-motion` |
| Encrypted journal | AES-GCM 256 per entry (new IV each time); journal key wrapped by a PBKDF2 passphrase key (600k rounds) and a recovery key; auto-lock after 10 min / 2 min in background; re-encrypt on passphrase change |
| Biometric unlock | WebAuthn passkey with PRF extension → HKDF → unwraps a copy of the journal key; passphrase stays as fallback |

## Phase 6 — How every update was delivered

1. **Understand the request**, ask at most one question if something is truly open, otherwise choose sensible defaults.
2. **Build in steps** and report briefly after each step what changed.
3. **Keep data safe:** optional new fields, migrations that keep old data readable, parity checks when restructuring code.
4. **Test** (automated, in a real browser): every screen at 360/390/768/1024/1280 px, English and German, light and dark;
   no JavaScript errors; no sideways scrolling; feature-specific tests (e.g. "the server never receives readable journal text").
5. **Show screenshots** before the owner installs.
6. **Deliver** only the changed files (or a full zip), with a changelog, an upload/deploy note, and a test list for Android, iPad, MacBook.
7. **Verify after deploy:** compare the live repository with the intended files and open every screen of the live version.
8. **Server changes** (SQL, Edge Functions, storage) only after explicit approval, and always backward compatible.

## Phase 7 — With Claude Code (recommended from now on)

Claude Code works directly in the project folder with git, so the manual upload problems disappear:

```bash
git clone https://github.com/<you>/<new-app>.git && cd <new-app>
# copy this starter kit into the folder, then:
npm install
npm run serve          # open http://localhost:8080
npm run release-check  # release check + tests
```

Typical request to Claude Code:
> "Add a 'notes' screen with a list and a search field. Follow CLAUDE.md, add tests, bump the version,
> run the release check, show me screenshots, and ask before pushing."

GitHub Actions (`.github/workflows/`) then run the checks on every push and publish the app to GitHub Pages.

## Starting a new app from this kit

1. Copy the kit, rename the app in `index.html`, `manifest.webmanifest`, `config.js` (`APP_NAME`).
2. Replace `views/home.js` with your first real screen; keep the architecture.
3. New Supabase project → run `001_records.sql` → fill `config.js` (or leave empty for local-only).
4. Replace the icons in `icons/`.
5. `npm run release-check`, then push. Enable Pages (Source: GitHub Actions).
