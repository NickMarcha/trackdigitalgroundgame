import {cache} from '@devvit/web/server'
import type {GoalsRsp} from '../shared/api.ts'
import {page, rewards} from '../shared/fundraiser.ts'

/** Shape of ActBlue's goal tracker JSON. Amounts are cents. */
export type GoalTrackerData = {
  total_amount: number
  goal: {kind: string; amount: number; stretch_goals: number[]}
}

const url = `https://secure.actblue.com/pages/${page}/goal_tracker_data`

/** One fetch per minute shared across every viewer of the post. */
export function fetchGoals(): Promise<GoalsRsp> {
  return cache(
    async () => {
      const rsp = await fetch(url, {headers: {Accept: 'application/json'}})
      if (!rsp.ok) throw Error(`ActBlue HTTP ${rsp.status}`)
      return parseGoals((await rsp.json()) as GoalTrackerData)
    },
    {key: 'actblue:goals', ttl: 60},
  )
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
