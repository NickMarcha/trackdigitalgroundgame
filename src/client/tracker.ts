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

/**
 * Fills #rail with the next `lockedShown` goals, a marker for the current
 * total, and the last `unlockedShown` goals, highest amount first. Pass
 * Infinity to show every goal.
 */
export function renderRail(
  rsp: GoalsRsp,
  lockedShown: number,
  unlockedShown: number,
): void {
  const {unlocked, locked} = split(rsp)
  const rail = document.getElementById('rail') as HTMLOListElement
  rail.replaceChildren(
    ...locked
      .slice(0, lockedShown)
      .reverse()
      .map(g => goalItem(g, 'locked')),
    marker(rsp),
    ...unlocked
      .slice(-unlockedShown)
      .reverse()
      .map(g => goalItem(g, 'unlocked')),
  )
}

function goalItem(goal: Goal, state: 'locked' | 'unlocked'): HTMLLIElement {
  const li = document.createElement('li')
  li.className = state
  const amount = document.createElement('strong')
  amount.textContent = short(goal.amount)
  li.append(amount)
  for (const reward of goal.rewards) {
    const p = document.createElement('p')
    p.textContent = reward
    li.append(p)
  }
  return li
}

function marker(rsp: GoalsRsp): HTMLLIElement {
  const li = document.createElement('li')
  li.className = 'marker'

  const amount = document.createElement('strong')
  amount.textContent = money(rsp.raised)
  const label = document.createElement('p')
  label.textContent = 'raised so far'

  const bar = document.createElement('div')
  bar.className = 'bar'
  const fill = document.createElement('div')
  fill.className = 'fill'
  fill.style.width = `${Math.min(100, progress(rsp) * 100)}%`
  bar.append(fill)

  const next = document.createElement('p')
  next.className = 'next'
  const goal = split(rsp).locked[0]
  next.textContent = goal
    ? `${short(goal.amount - rsp.raised)} to go`
    : 'Every goal unlocked'

  li.append(amount, label, bar, next)
  return li
}

export function bindDonate(): void {
  for (const el of document.querySelectorAll<HTMLElement>('[data-donate]'))
    el.addEventListener('click', () => navigateTo(donateUrl))
}

/** Loads goals now and every minute after. */
export function poll(render: (rsp: GoalsRsp) => void): void {
  const load = async (): Promise<void> => {
    const rsp = await fetchGoals()
    if (rsp) {
      document.body.classList.remove('error')
      render(rsp)
    } else document.body.classList.add('error')
  }
  void load()
  setInterval(() => void load(), refreshMs)
}
