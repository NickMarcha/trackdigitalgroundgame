/** Generic error detail for all responses. */
export type ErrorRsp = {error: string; status: number}

/** One fundraiser goal. Amounts are whole dollars. */
export type Goal = {amount: number; rewards: string[]}

/** Live fundraiser state. */
export type GoalsRsp = {raised: number; goals: Goal[]}

export type Endpoint = (typeof Endpoint)[keyof typeof Endpoint]
export const Endpoint = {
  GetGoals: 'api/goals',
  OnAppInstall: 'internal/on/app/install',
  OnMenuNewPost: 'internal/on/menu/new-post',
} as const

export const EndpointMethod = {
  [Endpoint.GetGoals]: 'GET',
  [Endpoint.OnAppInstall]: 'POST',
  [Endpoint.OnMenuNewPost]: 'POST',
} as const satisfies {[endpoint: string]: 'GET' | 'POST'}
