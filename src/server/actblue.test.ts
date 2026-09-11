import assert from 'node:assert/strict'
import {test} from 'node:test'
import type {GoalsRsp} from '../shared/api.ts'
import {parseEndsAt} from '../shared/fundraiser.ts'
import {parseGoals} from './actblue.ts'

test('parse countdown end from donate page', () => {
  const html =
    '{"list_banner":{"id":1,"timer_ends_at":"2026-09-14T03:00:00-04:00"}}'
  assert.equal(parseEndsAt(html), '2026-09-14T03:00:00-04:00')
  assert.equal(parseEndsAt('<html></html>'), undefined)
})

test('parse goal tracker data', () => {
  const goals = parseGoals({
    total_amount: 2398550,
    goal: {kind: 'dollars', amount: 2500000, stretch_goals: [5000000, 999]},
    fetchedAt: 1700000000000,
    endsAt: '2026-09-14T03:00:00-04:00',
  })
  assert.deepEqual<GoalsRsp>(goals, {
    raised: 23985,
    updatedAt: 1700000000000,
    endsAt: '2026-09-14T03:00:00-04:00',
    goals: [
      {amount: 9.99, rewards: []},
      {amount: 25000, rewards: ['Merch Store Expanded']},
      {amount: 50000, rewards: ['Rerun old T-shirt']},
    ],
  })
})
