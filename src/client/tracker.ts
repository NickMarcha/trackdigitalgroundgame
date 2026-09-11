import {navigateTo} from '@devvit/web/client'
import type {Goal, GoalsRsp} from '../shared/api.ts'
import {donateUrl} from '../shared/fundraiser.ts'
import {fetchGoals} from './fetch.ts'

const refreshMs = 60_000

/** "$23,985" */
export function money(dollars: number): string {
  return `$${Math.floor(dollars).toLocaleString('en-US')}`
}

/** "$25k", "$1.5M" */
export function short(dollars: number): string {
  if (dollars >= 1_000_000) return `$${trim(dollars / 1_000_000)}M`
  if (dollars >= 1_000) return `$${trim(dollars / 1_000)}k`
  return money(dollars)
}

function trim(n: number): string {
  return n.toFixed(1).replace(/\.0$/, '')
}

/** Goals split around the current total, both in ascending order. */
export function split(rsp: GoalsRsp): {unlocked: Goal[]; locked: Goal[]} {
  return {
    unlocked: rsp.goals.filter(g => g.amount <= rsp.raised),
    locked: rsp.goals.filter(g => g.amount > rsp.raised),
  }
}

/** Fill ratio (0 to 1) from the last unlocked goal to the next one. */
export function progress(rsp: GoalsRsp): number {
  const {unlocked, locked} = split(rsp)
  const next = locked[0]
  if (!next) return 1
  const from = unlocked.at(-1)?.amount ?? 0
  return (rsp.raised - from) / (next.amount - from)
}

/** Fills raised, bar, and next-goal elements present on the page. */
export function renderSummary(rsp: GoalsRsp): void {
  const raised = document.getElementById('raised')
  const fill = document.getElementById('fill')
  const next = document.getElementById('next')
  if (raised) raised.textContent = money(rsp.raised)
  if (fill) fill.style.width = `${Math.min(100, progress(rsp) * 100)}%`
  if (!next) return

  const goal = split(rsp).locked[0]
  next.textContent = goal
    ? `${short(goal.amount)} unlocks ${goal.rewards.join(' + ')}`
    : 'Every goal unlocked'
}

export function bindDonate(): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-donate]'))
    el.addEventListener('click', () => navigateTo(donateUrl))
}

/** Loads goals now and every minute after. */
export function poll(render: (rsp: GoalsRsp) => void): void {
  const load = async (): Promise<void> => {
    const rsp = await fetchGoals()
    if (rsp) render(rsp)
    else document.body.classList.add('error')
  }
  void load()
  setInterval(() => void load(), refreshMs)
}
