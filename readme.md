# Digital Ground Game fundraiser tracker

A Reddit app (Devvit Web) that shows live progress for the [Digital Ground Game election fundraiser](https://secure.actblue.com/donate/midterms-finish) inside a post: total raised, time left, the next stretch goal, and the goals already unlocked.

Two views:

- **Compact** (`public/splash.html`): shown inline in the feed. Top goal, next goal, last three unlocked, total, progress bar, Donate button.
- **All goals** (`public/goals.html`): opened from the compact view. Every goal on one rail.

Both poll `/api/goals` every 60 seconds.

## For moderators: getting it into your subreddit

Reddit apps can only be installed by a moderator of the subreddit, and an unpublished app can only be installed by the account that owns it. So there are two ways to get this live.

### Fastest: add the app owner as a moderator

1. Add the app owner (u/Niconame) as a moderator of your subreddit. Full permissions are simplest; "Manage Settings" is the one that matters.
2. They run `npx devvit install r/<your-subreddit>` from this repo. Installing creates a tracker post automatically.
3. You can remove them as a moderator afterwards. The app and its post stay.

Every mod then gets a "Create fundraiser tracker post" entry in the subreddit menu to make more posts.

### Run it under your own account

Do this if you would rather not add an outside moderator. It takes longer because Reddit has to approve the ActBlue fetch for your copy of the app (1-2 business days).

1. Go to https://developers.reddit.com and sign in with the Reddit account that moderates your subreddit. Accept the developer terms.
2. Install Node.js 22 or newer from https://nodejs.org.
3. Clone this repo, then in the folder:
   ```
   npm install
   npx devvit login
   ```
4. Open `devvit.json` and change `"name"` to a new app name (lowercase, letters and dashes, must be unique on Reddit).
5. Run `npm run dev`. The first run creates the app under your account, creates a private test subreddit, and files the request for the `secure.actblue.com` fetch domain. Check its status at `https://developers.reddit.com/apps/<your-app-name>/developer-settings`.
6. Until the domain is approved the post shows "Could not load the total". To fill it in the meantime, run `node sync.mjs` whenever you want the number refreshed, or set up the scheduled task below.
7. Once you are happy, stop `npm run dev` and install it for real:
   ```
   npm run build
   npx devvit upload
   npx devvit install r/<your-subreddit>
   ```

### Keeping the total fresh while the fetch is not approved

`node sync.mjs` copies the current ActBlue numbers into the app. On Windows this runs it every 5 minutes (edit the path to where you cloned the repo):

```
schtasks /create /tn "trackdgroundgame sync" /sc minute /mo 5 /tr "cmd /c cd /d C:\path	o	rackdigitalgroundgame && node sync.mjs >> sync.log 2>&1"
```

Remove it with `schtasks /delete /tn "trackdgroundgame sync" /f`. On Mac or Linux use cron: `*/5 * * * * cd /path/to/trackdigitalgroundgame && node sync.mjs >> sync.log 2>&1`. Once the domain is approved the app fetches ActBlue itself and this is no longer needed.

### Changing the goal text

The reward for each goal is in `src/shared/fundraiser.ts`, keyed by the goal amount in dollars. Edit it, then upload and install again (step 7 above), or if `npm run dev` is running it updates the test subreddit on save.

## How data flows

```
Reddit post (iframe)  --/api/goals-->  Reddit-hosted Node server  --fetch-->  secure.actblue.com
                                       (cache helper, 60s TTL)         goal_tracker_data (total, goal amounts)
                                                                       donate page HTML (countdown end time)
```

The server tries ActBlue directly. If Reddit has not approved the `secure.actblue.com` fetch domain for this app yet, the fetch is denied and the server falls back to the `goalTracker` app setting, which `sync.mjs` fills from this machine (see below). Either way one fetch per minute serves every viewer.

Reward text per goal is not in the ActBlue API. It lives in `src/shared/fundraiser.ts` and is keyed by goal amount in dollars. If a goal is added on ActBlue it shows up with no text until a line is added there.

## Layout

```
devvit.json            app config: entrypoints, fetch domains, settings, menu
src/client/            tracker.ts renders both views; splash.ts and goals.ts are the entry points
src/server/            actblue.ts fetches and parses; server.ts routes /api/goals and the post-creation hooks
src/shared/            types and fundraiser constants shared by client and server
public/                HTML, CSS, fonts, logo. *.js files here are build output
sync.mjs               copies ActBlue data into the goalTracker setting
build.mjs              esbuild for client and server; --watch for dev
```

## Commands

- `npm run dev`: builds, uploads, installs on the test subreddit, and rebuilds on save. First run creates the test subreddit and files the fetch domain request.
- `npm test`: type check, lint, unit tests, build.
- `npm run format`: fix lint and formatting.
- `npm run publish`: clean build, upload, and file an app review request (needed before installing on a subreddit you do not moderate).
- `node sync.mjs`: push the current ActBlue data into the `goalTracker` setting once.

## Creating a post

In a subreddit where the app is installed, moderators get a "Create fundraiser tracker post" entry in the subreddit menu. Installing the app also creates one post automatically.

## Settings

Devvit has two kinds of settings; this app currently uses only the first.

**Global settings** (`settings.global` in `devvit.json`) are set by the developer from the terminal and shared by every installation. They do not appear in Reddit's UI.

- `goalTracker`: a copy of the ActBlue JSON plus `endsAt` and `fetchedAt`. Set it with `node sync.mjs`, or by hand with `npx devvit settings set goalTracker` (it prompts for the value). The app must have been uploaded at least once (`npm run dev`) before the setting exists.

**Subreddit settings** (`settings.subreddit`) would be editable by moderators in Reddit's UI: open the subreddit, then Mod Tools, then Apps (or go to `reddit.com/r/<subreddit>/apps/trackdgroundgame`), and each installed app has a settings form there. Changes apply on the next request with no upload. None are defined yet; adding one is a `devvit.json` entry plus a `settings.get('<key>')` call on the server.

## Keeping the fallback fresh

While the fetch domain is unapproved, a Windows scheduled task on the dev machine runs `node sync.mjs` every 5 minutes and logs to `sync.log`. It was created with:

```
schtasks /create /tn "trackdgroundgame sync" /sc minute /mo 5 /tr "cmd /c cd /d C:\Users\Nicol\Desktop\trackdigitalgroundgame && node sync.mjs >> sync.log 2>&1"
```

Remove it with `schtasks /delete /tn "trackdgroundgame sync" /f`. Once Reddit approves the domain the server fetches ActBlue itself and the task can go.

## Fetch Domains

The following domains are requested for this app:

- `secure.actblue.com` - Reads the public goal tracker JSON (`/pages/midterms-finish/goal_tracker_data`) for the total and goal amounts, and the public donate page for the countdown end time. Read only, no user data is sent.
