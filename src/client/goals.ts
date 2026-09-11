import {bindDonate, poll, render} from './tracker.ts'

bindDonate()
poll(rsp => render(rsp, false))
