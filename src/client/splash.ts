import {requestExpandedMode} from '@devvit/web/client'
import {bindDonate, poll, renderSummary} from './tracker.ts'

const expandBtn = document.getElementById('expand') as HTMLButtonElement
expandBtn.addEventListener('click', ev => requestExpandedMode(ev, 'goals'))

bindDonate()
poll(renderSummary)
