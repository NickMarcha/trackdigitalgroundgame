import {requestExpandedMode} from '@devvit/web/client'
import {bindDonate, poll, render} from './tracker.ts'

const expandBtn = document.getElementById('expand') as HTMLButtonElement
expandBtn.addEventListener('click', ev => requestExpandedMode(ev, 'goals'))

bindDonate()
poll(rsp => render(rsp, 2, 3))
