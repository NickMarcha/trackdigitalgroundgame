# Handoff: Digital Ground Game fundraiser tracker

Written 2026-09-11 23:17 local time from `C:\Users\Nicol\Desktop\trackdigitalgroundgame`.

## One-paragraph state

A working Reddit app (Devvit Web) that shows live ActBlue fundraiser progress inside a post. Built and iterated in one session on 2026-09-11 during the fundraiser itself. It runs on the original author's private test subreddit and looks finished. Digital Ground Game decided not to use it for this event and said to expect a ping in about a month for "future things". The original author is stepping away and the project is being forked by someone else. Repo: https://github.com/NickMarcha/trackdigitalgroundgame, all work on `main`.

**If you are the person forking this:** the app slug, the domain approval request, the test subreddit, and the scheduled task all belong to the original author's Reddit account and machine. None of them come with the fork. Follow "Run it under your own account" in the readme: rename the app in `devvit.json`, `npm run dev` to register it and file your own domain request, and run `sync.mjs` on a schedule on your own machine until that request is approved. The original author's scheduled task will stop when their machine is off, so do not rely on it.

Read `readme.md` first. It has the architecture, the data flow, the settings model, the moderator install guide, and the Reddit approval rules. This document only covers what the readme does not: why things are the way they are, what is pending, and where the sharp edges are.

## What is deployed where

- App slug `trackdgroundgame`, owned by the user's Reddit developer account. Playtest versions only (v0.0.1.x); nothing has been `devvit upload`ed or published as a real version.
- Installed on the private test subreddit r/trackdgroundgame_dev with one post. Playtest URL: https://www.reddit.com/r/trackdgroundgame_dev/?playtest=trackdgroundgame
- A Windows scheduled task `trackdgroundgame sync` runs `node sync.mjs` every 5 minutes on the original author's machine and appends to `sync.log` (gitignored). It pushes ActBlue data into the app's `goalTracker` global setting. This is the only reason the post shows real numbers, and it only runs while that machine is on.
- The `secure.actblue.com` fetch domain request was filed with Reddit on the first playtest. As of writing it had not been confirmed as approved; the server still logged `PERMISSION_DENIED ... secure.actblue.com is not allowed` in the last playtest run I saw. Check https://developers.reddit.com/apps/trackdgroundgame/developer-settings. If approved, the server fetches directly and the scheduled task can be deleted.

## Decisions and why

- **No self-hosted backend.** The original plan was Docker plus Cloudflare tunnel. Reddit's fetch policy rejects personal domains outright, so the Reddit-hosted Node server is the backend and ActBlue is fetched from there. See `http-fetch-policy` in the reddit/devvit-docs repo.
- **Global setting as the data fallback**, filled by a script, rather than a mod-editable form. A cron job beats manual UI edits during a live event. `devvit settings set` reads the value from stdin, which is how `sync.mjs` feeds it non-interactively.
- **Countdown scraped from the donate page HTML** (`timer_ends_at` regex) because ActBlue has no JSON for it. Same hostname, so no extra approval. If the regex misses, the timer is blank, nothing breaks.
- **Reward text is hardcoded** in `src/shared/fundraiser.ts`, keyed by goal amount in dollars. The ActBlue API only has amounts.
- **Fonts are bundled** in `public/fonts/` (Roboto Condensed, Pixel Operator HB SC, VT323) because the client CSP blocks external requests. Pixel Operator is CC0, the others OFL/Apache. The logo SVG came from digitalgroundgame.org's header.
- **Inline frame height is 400px** (`devvit.json` styles.height). It is one number for every device, so the phone layout hides the top goal, the "N more goals" row, and the "updated" line to fit. Desktop shows everything. The rail stretches to fill the frame so there is no dead space.
- **`build.mjs` replaced the template's `sh`-based watch script** so it works from Windows PowerShell as well as Unix shells.
- **Design direction**: match the fundraiser poster and the DGG site. Brand blue `#1144ff`, yellow `#ffc800`. Layout was tuned in small increments with the original author (padding, logo size, line centering); the current state reflects all of it.

## Pending, in rough priority

1. **Wait for the DGG ping** (Blair, Discord link in readme Status section). Do not build speculative features before knowing what "future things" means.
2. **ActBlue domain approval.** Check the developer settings page. If approved: restart `npm run dev`, confirm the PERMISSION_DENIED lines are gone, delete the scheduled task (`schtasks /delete /tn "trackdgroundgame sync" /f`).
3. **Terms and Privacy Policy links** must be saved in the app details form on developers.reddit.com before the app can be published for a subreddit the user does not moderate. Not done.
4. **Production install** has never been exercised. The path is `npm run build`, `npx devvit upload`, `npx devvit install r/<sub>`. Whoever runs it must moderate the target subreddit. The readme explains the alternatives.
5. **Likely first change when they return**: make the fundraiser slug (and possibly reward text) a subreddit setting so mods can retarget without a redeploy. Discussed, not built. The readme's Settings section explains the two setting scopes.

## Sharp edges

- `npm run dev` re-uploads on every save. Writing several files in quick succession can trigger two overlapping uploads and an `AppVersion already exists` error; it recovers on its own, ignore it if a later `Success!` follows.
- The server caches `/api/goals` for 60s via Reddit's cache helper. After deploying a change to the response shape, the first minute can serve a stale shape (we saw `updated NaN hr ago` once). Not a bug.
- Existing posts can keep the frame height they were created with. If a height change in `devvit.json` does not show, create a new post from the mod menu.
- The unit tests cover parsing only. The cache helper uses Redis locks internally and was not worth mocking; the live fetch path is verified by playtest.
- `npm test` runs type check, lint (biome, strict on warnings), unit tests, and build. Biome complains about CSS specificity ordering; keep more specific selectors after less specific ones.
- Node 22 works despite the template asking for 24; the CLI prints a warning each upload.
- At 150% browser zoom the rail line once looked off-center from the nodes. Node and line are now anchored to a shared `--axis` with transforms, which fixed it.

## Suggested skills

- `AGENTS.md` (imported by `CLAUDE.md`): the engineering rules the code follows. No compatibility layers, simplest thing that works, grow in layers.
- `unslop` (project): applies to any prose written, including the readme and commit messages.
- `uncodixify` (project): for any UI work. The current design is the reference; it follows the fundraiser poster and the DGG site.
- `claude-in-chrome` if available: useful for checking the real post in your own test subreddit. A local preview server that proxies ActBlue and serves `public/` was used for layout checks; it is a 20-line Node script and easy to recreate from `src/server/actblue.ts`.

## People and links

- Original author: GitHub NickMarcha; their Reddit account owns the `trackdgroundgame` app and moderates r/trackdgroundgame_dev. Reachable through the repo.
- Digital Ground Game contact: Blair, via the DGG Discord (message link in readme).
- Fundraiser: https://secure.actblue.com/donate/midterms-finish. Goal data: https://secure.actblue.com/pages/midterms-finish/goal_tracker_data (cents).
- Poster the design follows: https://i.redd.it/hqgycn3k5woh1.png
- Reddit docs source: github.com/reddit/devvit-docs (developers.reddit.com is not fetchable from this tool; use `gh api` on the docs repo).
