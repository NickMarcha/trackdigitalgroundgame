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
 * Fills the summary panel and the rail. Compact shows the top goal, the next
 * goal, and the last three unlocked; otherwise every goal is shown.
 */
export function render(rsp: GoalsRsp, compact: boolean): void {
  renderSummary(rsp)
  renderRail(rsp, compact)
}

function renderSummary(rsp: GoalsRsp): void {
  const raised = document.getElementById('raised') as HTMLElement
  const fill = document.getElementById('fill') as HTMLElement
  const next = document.getElementById('next') as HTMLElement
  raised.textContent = money(rsp.raised)
  fill.style.width = `${Math.min(100, progress(rsp) * 100)}%`
  const goal = split(rsp).locked[0]
  next.textContent = goal
    ? `${short(goal.amount - rsp.raised)} to next goal`
    : 'Every goal unlocked'
}

/** Highest amount first. The segment below each node shows progress. */
function renderRail(rsp: GoalsRsp, compact: boolean): void {
  const {unlocked, locked} = split(rsp)
  const items: HTMLLIElement[] = []

  const shownLocked = compact ? locked.slice(0, 1) : locked
  const top = locked.at(-1)
  if (compact && top && top !== shownLocked[0]) {
    const li = goalItem(top, 'locked', 0)
    li.classList.add('skip')
    items.push(li)
  }
  for (const g of [...shownLocked].reverse()) {
    const isNext = g === locked[0]
    const li = goalItem(g, 'locked', isNext ? progress(rsp) : 0)
    if (isNext) li.classList.add('next')
    items.push(li)
  }
  const shownUnlocked = compact ? unlocked.slice(-3) : unlocked
  for (const g of [...shownUnlocked].reverse())
    items.push(goalItem(g, 'unlocked', 1))

  const rail = document.getElementById('rail') as HTMLOListElement
  rail.replaceChildren(...items)
}

function goalItem(
  goal: Goal,
  state: 'locked' | 'unlocked',
  fill: number,
): HTMLLIElement {
  const li = document.createElement('li')
  li.className = state
  li.style.setProperty('--fill', `${Math.min(100, fill * 100)}%`)
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
