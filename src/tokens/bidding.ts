import type { TokenStatus } from './types'

/* ------------------------------------------------------------------ */
/* Bid modes                                                           */
/* ------------------------------------------------------------------ */

/** How employees take part in a vacation bid. */
export type BidMode = 'turn-based' | 'all-at-once'

export const bidModes: { key: BidMode; label: string; meaning: string; status: TokenStatus }[] = [
  { key: 'turn-based', label: 'Turn-based', meaning: 'Employees bid one after another, usually by seniority. You wait in a queue, then rank your requests while it is your turn.', status: 'review' },
  { key: 'all-at-once', label: 'All at once', meaning: 'Everyone bids during the same window. Coming next.', status: 'draft' },
]

/* ------------------------------------------------------------------ */
/* Your place in a bid                                                 */
/* ------------------------------------------------------------------ */

/** Where you are in a turn-based bid. Each maps to a request status badge (`requestStates` in status.ts). */
export type BidState = 'queued' | 'your-turn' | 'pending'

export const bidStates: { key: BidState; badge: string; when: string; panel: string; list: string; status: TokenStatus }[] = [
  {
    key: 'queued', badge: 'queued', when: 'Other employees bid before you',
    panel: 'How many employees are ahead of you, and that you will be notified when it is your turn. No requests yet.',
    list: 'Queued badge and the time left in the bid.', status: 'review',
  },
  {
    key: 'your-turn', badge: 'your-turn', when: 'It is your turn to bid',
    panel: 'Add Request and View Team Bids, your ranked requests, and Submit at the bottom. Submit is disabled until you add a request.',
    list: 'Your Turn badge, the time left, and “Selected: N” once you add requests.', status: 'review',
  },
  {
    key: 'pending', badge: 'pending', when: 'You submitted your requests',
    panel: 'Your selection is locked in. You can change the ranking (Edit) or remove a request, but not add one. “Submitted on” at the bottom.',
    list: 'Pending badge and “Signed up for: N”.', status: 'review',
  },
]

/* ------------------------------------------------------------------ */
/* Leave types                                                         */
/* ------------------------------------------------------------------ */

export type LeaveTypeKey = 'vacation' | 'banked-ot' | 'comp-time' | 'holiday' | 'personal'

export const leaveTypes: { key: LeaveTypeKey; label: string; meaning: string }[] = [
  { key: 'vacation', label: 'Vacation', meaning: 'Paid vacation days from the yearly allowance.' },
  { key: 'banked-ot', label: 'Banked OT', meaning: 'Overtime hours saved as time off.' },
  { key: 'comp-time', label: 'Comp Time', meaning: 'Time off given back for extra hours worked.' },
  { key: 'holiday', label: 'Holiday Time', meaning: 'Statutory holidays worked and taken later.' },
  { key: 'personal', label: 'Personal Day', meaning: 'A single personal day.' },
]

export const leaveTypeLabel = (key: LeaveTypeKey) => leaveTypes.find((type) => type.key === key)!.label

/* ------------------------------------------------------------------ */
/* CSS variables                                                       */
/* ------------------------------------------------------------------ */

export interface BiddingToken {
  name: `--bidding-${string}`
  value: string
  kind: 'size' | 'color'
  usage: string
  status: TokenStatus
}

const t = (name: BiddingToken['name'], value: string, kind: BiddingToken['kind'], usage: string): BiddingToken =>
  ({ name, value, kind, usage, status: 'review' })

/** Vacation bidding. All aliases of theme tokens, so they follow the dark and light schemes. */
export const biddingTokens: BiddingToken[] = [
  t('--bidding-list-width', '400px', 'size', 'Width of the bid list on the left.'),
  t('--bidding-row-bg', 'var(--background-default)', 'color', 'Background of a request row.'),
  t('--bidding-row-dragging-border', 'var(--border-primary-default)', 'color', 'Outline of the row being dragged and of the row it will drop on.'),
  t('--bidding-rank-bg', 'var(--background-info-light)', 'color', 'Background of the rank number.'),
  t('--bidding-rank-text', 'var(--text-info)', 'color', 'Rank number, the time left and the number of picked shifts.'),
  t('--bidding-request-bg', 'var(--background-info-light)', 'color', 'Requested days on the calendar under an open row.'),
  t('--bidding-request-border', 'var(--border-border-info)', 'color', 'Dashed outline of the requested days. Dashed, because they are not approved yet.'),
  t('--bidding-request-text', 'var(--text-info)', 'color', 'Label on the requested days.'),
  t('--bidding-picked-text', 'var(--text-success-default)', 'color', 'Selected and Signed up for, in the bid list.'),
]

export const biddingCssVariables: Record<string, string> = Object.fromEntries(biddingTokens.map((token) => [token.name, token.value]))
