// Copies ActBlue's goal tracker JSON into the app's `goalTracker` setting.
// Run on a schedule while the app is not yet allowed to fetch ActBlue itself.
import {spawn} from 'node:child_process'
import {trackerUrl} from './src/shared/fundraiser.ts'

const rsp = await fetch(trackerUrl, {headers: {Accept: 'application/json'}})
if (!rsp.ok) throw Error(`ActBlue HTTP ${rsp.status}`)
const json = JSON.stringify({...(await rsp.json()), fetchedAt: Date.now()})

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
