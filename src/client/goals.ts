import type {Goal, GoalsRsp} from '../shared/api.ts'
import {
  bindDonate,
  money,
  poll,
  renderSummary,
  short,
  split,
} from './tracker.ts'

const lockedShown = 3
const unlockedShown = 3

function render(rsp: GoalsRsp): void {
  renderSummary(rsp)

  const {unlocked, locked} = split(rsp)
  const rail = document.getElementById('rail') as HTMLOListElement
  rail.replaceChildren(
    ...locked
      .slice(0, lockedShown)
      .reverse()
      .map(g => goalItem(g, 'locked')),
    marker(rsp.raised),
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

function marker(raised: number): HTMLLIElement {
  const li = document.createElement('li')
  li.className = 'marker'
  const amount = document.createElement('strong')
  amount.textContent = money(raised)
  const p = document.createElement('p')
  p.textContent = 'raised so far'
  li.append(amount, p)
  return li
}

bindDonate()
poll(render)
