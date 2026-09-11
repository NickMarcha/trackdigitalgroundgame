# Digital Ground Game fundraiser tracker

Shows live progress for the [Digital Ground Game election fundraiser](https://secure.actblue.com/donate/midterms-finish) inside a Reddit post: total raised, the next stretch goals, and the ones already unlocked.

## Fetch Domains

The following domains are requested for this app:

- `secure.actblue.com` - Reads the public goal tracker JSON for the fundraiser page (`/pages/midterms-finish/goal_tracker_data`) to show total raised and stretch goal progress. Read only, no user data is sent.

## Commands

- `npm run dev`: watches changes, builds, uploads, and installs on your test subreddit.
- `npm run build`: builds client and server.
- `npm run test`: type check, lint, unit tests, build.
- `npm run publish`: cleans, builds, uploads, and files an app review request.
