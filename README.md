# App Starter Kit

Offline-first web app template (plain JavaScript, no build step) with optional Supabase sync,
English/German, Undo, light/dark mode, automatic release checks and browser tests.
Built from the experience of the Habit & Life Tracker.

- **CLAUDE.md** — rules for Claude Code (architecture, data, UI, security, release workflow). Claude Code reads it automatically.
- **PLAYBOOK.md** — the full process step by step: from idea to hosting, sync, notifications, encryption and updates.

## Quick start

```bash
npm install
npm run serve          # http://localhost:8080
npm run release-check  # release check + tests (phone, tablet, desktop)
```

Sync is off until you add your Supabase URL and publishable key to `config.js`
and run `supabase/migrations/001_records.sql` in your Supabase project.

## Deploy

Push to GitHub, then Settings → Pages → Source: **GitHub Actions**.
`.github/workflows/pages.yml` runs the release check and publishes the app; `ci.yml` runs all tests on every push.

## Update checklist

1. Change code + tests
2. Bump `VERSION` in `sw.js`, add new files to `SHELL`
3. `npm run release-check`
4. Screenshots, changelog, test list
5. Push (Claude Code asks first)
