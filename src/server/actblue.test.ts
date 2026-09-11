import assert from 'node:assert/strict'
import {test} from 'node:test'
import type {GoalsRsp} from '../shared/api.ts'
import {parseGoals} from './actblue.ts'

test('parse goal tracker data', () => {
  const goals = parseGoals({
    total_amount: 2398550,
    goal: {kind: 'dollars', amount: 2500000, stretch_goals: [5000000, 999]},
  })
  assert.deepEqual<GoalsRsp>(goals, {
    raised: 23985,
    goals: [
      {amount: 9.99, rewards: []},
      {amount: 25000, rewards: ['Merch Store Expanded']},
      {amount: 50000, rewards: ['Rerun old T-shirt']},
    ],
  })
})
