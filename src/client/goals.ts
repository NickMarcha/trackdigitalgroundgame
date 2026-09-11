import {bindDonate, poll, renderRail} from './tracker.ts'

bindDonate()
poll(rsp => renderRail(rsp, Infinity, Infinity))
