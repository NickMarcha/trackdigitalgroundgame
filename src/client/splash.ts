import {requestExpandedMode} from '@devvit/web/client'
import {bindDonate, poll, renderRail} from './tracker.ts'

const expandBtn = document.getElementById('expand') as HTMLButtonElement
expandBtn.addEventListener('click', ev => requestExpandedMode(ev, 'goals'))

bindDonate()
poll(rsp => renderRail(rsp, 2, 3))
