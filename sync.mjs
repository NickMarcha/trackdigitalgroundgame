// Copies ActBlue's goal tracker JSON into the app's `goalTracker` setting.
// Run on a schedule while the app is not yet allowed to fetch ActBlue itself.
import {spawn} from 'node:child_process'
import {donateUrl, parseEndsAt, trackerUrl} from './src/shared/fundraiser.ts'

const [data, page] = await Promise.all([
  fetch(trackerUrl, {headers: {Accept: 'application/json'}}),
  fetch(donateUrl),
])
if (!data.ok) throw Error(`ActBlue HTTP ${data.status}`)
if (!page.ok) throw Error(`ActBlue HTTP ${page.status}`)
const json = JSON.stringify({
  ...(await data.json()),
  endsAt: parseEndsAt(await page.text()),
  fetchedAt: Date.now(),
})

// `devvit settings set` prompts for the value on stdin.
const cli = spawn('npx', ['devvit', 'settings', 'set', 'goalTracker'], {
  cwd: import.meta.dirname,
  shell: true,
  stdio: ['pipe', 'inherit', 'inherit'],
})
cli.stdin.end(`${json}\n`)
cli.on('exit', code => {
  if (code === 0) console.log(`synced ${json}`)
  process.exit(code ?? 1)
})
