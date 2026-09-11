# Digital Ground Game fundraiser tracker

A Reddit app (Devvit Web) that shows live progress for the [Digital Ground Game election fundraiser](https://secure.actblue.com/donate/midterms-finish) inside a post: total raised, time left, the next stretch goal, and the goals already unlocked.

Two views:

- **Compact** (`public/splash.html`): shown inline in the feed. Top goal, next goal, last three unlocked, total, progress bar, Donate button.
- **All goals** (`public/goals.html`): opened from the compact view. Every goal on one rail.

Both poll `/api/goals` every 60 seconds.

## For moderators: getting it into your subreddit

Reddit apps are installed by a moderator of the subreddit, from the moderator's own developer account. Running it under your own account keeps everything in your hands; there is no need to give anyone outside your mod team access.

The app cannot call ActBlue directly until Reddit approves that for your copy of the app, which takes longer than a fundraiser weekend. So the numbers come from a small script, `sync.mjs`, that you run on a schedule on any computer. It reads ActBlue and pushes the total, goals, and countdown into the app. Set that up as part of the steps below.

### Run it under your own account

1. Go to https://developers.reddit.com and sign in with the Reddit account that moderates your subreddit. Accept the developer terms.
2. Install Node.js 22 or newer from https://nodejs.org.
3. Clone this repo, then in the folder:
   ```
   npm install
   npx devvit login
   ```
4. Open `devvit.json` and change `"name"` to a new app name (lowercase, letters and dashes, must be unique on Reddit).
5. Run `npm run dev` once. It creates the app under your account and a private test subreddit so you can look at it. Stop it with Ctrl+C when you have seen it.
6. Push the numbers in for the first time:
   ```
   node sync.mjs
   ```
   Then keep them fresh with a scheduled task. On Windows this runs the script every 5 minutes (edit the path to where you cloned the repo):
   ```
   schtasks /create /tn "trackdgroundgame sync" /sc minute /mo 5 /tr "cmd /c cd /d C:\path\to\trackdigitalgroundgame && node sync.mjs >> sync.log 2>&1"
   ```
   On Mac or Linux use cron: `*/5 * * * * cd /path/to/trackdigitalgroundgame && node sync.mjs >> sync.log 2>&1`. The computer has to be on and logged in for it to run. Remove the Windows task afterwards with `schtasks /delete /tn "trackdgroundgame sync" /f`.
7. Install it on your subreddit:
   ```
   npm run build
   npx devvit upload
   npx devvit install r/<your-subreddit>
   ```

Installing creates a tracker post automatically. Every mod also gets a "Create fundraiser tracker post" entry in the subreddit menu to make more. The post shows "updated N min ago" so you can tell the sync is running.

Like every Reddit app, the installed app gets an app account on your subreddit; Reddit currently grants those full mod permissions. This app only uses it to submit the tracker post. The code is all in this repo if you want to check.

The first `npm run dev` also files a request with Reddit to let the app fetch ActBlue itself. If that gets approved (check `https://developers.reddit.com/apps/<your-app-name>/developer-settings`), the app switches over on its own and the scheduled task can be removed.

### Or have the app owner install the existing app

If you would rather not set up a developer account, the owner of the existing app can install it, but only if they moderate your subreddit. Add them with just the **Manage Settings** permission (that is the one that covers installing apps), they run `npx devvit install r/<your-subreddit>`, and you remove them as a moderator afterwards. The app and its post stay installed. The sync script then runs on their machine instead of yours.

### Changing the goal text

The reward for each goal is in `src/shared/fundraiser.ts`, keyed by the goal amount in dollars. Edit it, then upload and install again (step 7 above).

## How data flows

```
Reddit post (iframe)  --/api/goals-->  Reddit-hosted Node server  --fetch-->  secure.actblue.com
                                       (cache helper, 60s TTL)         goal_tracker_data (total, goal amounts)
                                                                       donate page HTML (countdown end time)
```

The server tries ActBlue directly. Until Reddit approves the `secure.actblue.com` fetch domain for the app, the fetch is denied and the server reads the `goalTracker` app setting instead, which `sync.mjs` fills on a schedule. Either way one read per minute serves every viewer.

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

## Keeping the total fresh

A Windows scheduled task on the dev machine runs `node sync.mjs` every 5 minutes and logs to `sync.log`. It was created with:

```
schtasks /create /tn "trackdgroundgame sync" /sc minute /mo 5 /tr "cmd /c cd /d C:\Users\Nicol\Desktop\trackdigitalgroundgame && node sync.mjs >> sync.log 2>&1"
```

Remove it with `schtasks /delete /tn "trackdgroundgame sync" /f`. Once Reddit approves the domain the server fetches ActBlue itself and the task can go.

## Fetch Domains

The following domains are requested for this app:

- `secure.actblue.com` - Reads the public goal tracker JSON (`/pages/midterms-finish/goal_tracker_data`) for the total and goal amounts, and the public donate page for the countdown end time. Read only, no user data is sent.
