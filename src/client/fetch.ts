import {Endpoint, type GoalsRsp} from '../shared/api.ts'

export async function fetchGoals(): Promise<GoalsRsp | undefined> {
  let rsp
  try {
    rsp = await fetch(Endpoint.GetGoals, {
      headers: {Accept: 'application/json'},
    })
  } catch (err) {
    console.error(`HTTP error: ${err instanceof Error ? err.message : err}`)
    return
  }

  if (!rsp.ok) {
    const text = await rsp.text().catch(() => '')
    console.error(`HTTP status ${rsp.status}: ${rsp.statusText}; ${text}`)
    return
  }

  return (await rsp.json()) as GoalsRsp
}
