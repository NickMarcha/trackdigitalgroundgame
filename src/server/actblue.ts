import {cache, settings} from '@devvit/web/server'
import type {GoalsRsp} from '../shared/api.ts'
import {rewards, trackerUrl} from '../shared/fundraiser.ts'

/** Shape of ActBlue's goal tracker JSON. Amounts are cents. */
export type GoalTrackerData = {
  total_amount: number
  goal: {kind: string; amount: number; stretch_goals: number[]}
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
    const rsp = await fetch(trackerUrl, {headers: {Accept: 'application/json'}})
    if (!rsp.ok) throw Error(`ActBlue HTTP ${rsp.status}`)
    return (await rsp.json()) as GoalTrackerData
  } catch (err) {
    const json = await settings.get<string>(trackerSetting)
    if (!json) throw err
    return JSON.parse(json) as GoalTrackerData
  }
}

export function parseGoals(data: GoalTrackerData): GoalsRsp {
  const cents = [data.goal.amount, ...data.goal.stretch_goals]
  return {
    raised: Math.floor(data.total_amount / 100),
    goals: cents
      .map(c => c / 100)
      .sort((a, b) => a - b)
      .map(amount => ({amount, rewards: rewards[amount] ?? []})),
  }
}
