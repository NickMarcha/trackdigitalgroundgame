import {cache, settings} from '@devvit/web/server'
import type {GoalsRsp} from '../shared/api.ts'
import {
  donateUrl,
  parseEndsAt,
  rewards,
  trackerUrl,
} from '../shared/fundraiser.ts'

/**
 * Shape of ActBlue's goal tracker JSON. Amounts are cents. `fetchedAt` and
 * `endsAt` (scraped from the donate page) are added when the data is loaded.
 */
export type GoalTrackerData = {
  total_amount: number
  goal: {kind: string; amount: number; stretch_goals: number[]}
  fetchedAt?: number
  endsAt?: string
}

/** Global setting holding a copy of the tracker JSON, pushed by sync.mjs. */
export const trackerSetting = 'goalTracker'

/** One load per minute shared across every viewer of the post. */
export function fetchGoals(): Promise<GoalsRsp> {
  return cache(async () => parseGoals(await loadTracker()), {
    key: 'actblue:goals',
    ttl: 60,
  })
}

/** ActBlue directly, or the synced copy while the domain is not allowed. */
async function loadTracker(): Promise<GoalTrackerData> {
  try {
    const [data, html] = await Promise.all([
      fetchJson<GoalTrackerData>(trackerUrl),
      fetchText(donateUrl),
    ])
    return {...data, endsAt: parseEndsAt(html), fetchedAt: Date.now()}
  } catch (err) {
    const json = await settings.get<string>(trackerSetting)
    if (!json) throw err
    return JSON.parse(json) as GoalTrackerData
  }
}

async function fetchText(url: string): Promise<string> {
  const rsp = await fetch(url)
  if (!rsp.ok) throw Error(`ActBlue HTTP ${rsp.status} for ${url}`)
  return rsp.text()
}

async function fetchJson<T>(url: string): Promise<T> {
  const rsp = await fetch(url, {headers: {Accept: 'application/json'}})
  if (!rsp.ok) throw Error(`ActBlue HTTP ${rsp.status} for ${url}`)
  return rsp.json() as Promise<T>
}

export function parseGoals(data: GoalTrackerData): GoalsRsp {
  const cents = [data.goal.amount, ...data.goal.stretch_goals]
  return {
    raised: Math.floor(data.total_amount / 100),
    updatedAt: data.fetchedAt ?? Date.now(),
    endsAt: data.endsAt,
    goals: cents
      .map(c => c / 100)
      .sort((a, b) => a - b)
      .map(amount => ({amount, rewards: rewards[amount] ?? []})),
  }
}
