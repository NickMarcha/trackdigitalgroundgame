/** ActBlue page slug. */
export const page = 'midterms-finish'
export const donateUrl = `https://secure.actblue.com/donate/${page}`
export const title = 'Election Fundraiser'
export const org = 'Digital Ground Game'

/** What each goal unlocks, keyed by whole dollars. Not in the ActBlue API. */
export const rewards: {[amount: number]: string[]} = {
  25000: ['Merch Store Expanded'],
  50000: ['Rerun old T-shirt'],
  75000: ['Darius does hot chip challenge', 'Physical Pragmatic Papers run'],
  100000: ['Bonus Pennsylvania Event'],
  125000: ['Chat-determined research stream'],
  150000: ['Midterms Operations fully funded', 'Full Trump tier list'],
  175000: ['Regional Squad funding', 'Real life Whick panel'],
  200000: ['Special episode of Kick or Keep'],
  225000: [
    'IRL Midterm Stream x Digital Ground Game',
    'Darius gets Digital Ground Game tattoo',
  ],
  250000: ['Day of Action'],
  500000: ['Alaska Event (for real)'],
}
