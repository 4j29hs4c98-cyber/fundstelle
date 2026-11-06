# Server functions (optional)

Pattern used for push notifications in the Habit & Life Tracker:

1. Edge function `notify` (Deno, `npm:web-push`): reads the user's records, builds the message, sends Web Push.
2. A database timer (`pg_cron` + `pg_net`) calls the function every 15 minutes with a secret header.
3. Secrets (VAPID private key, cron secret) live in a table with RLS on and NO policies, so only the server can read them.
4. `notify_log` (user, kind, date) prevents sending the same reminder twice.

Rules: server functions never trust the client; check the user's JWT (`admin.auth.getUser(jwt)`) for app calls,
and a shared secret header for timer calls. Paid features must be enforced here, not in the app code.
