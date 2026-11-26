import type { TokenStatus } from './types'

/* ------------------------------------------------------------------ */
/* Bid modes                                                           */
/* ------------------------------------------------------------------ */

/** How employees take part in a vacation bid. */
export type BidMode = 'turn-based' | 'all-at-once'

export const bidModes: { key: BidMode; label: string; meaning: string; status: TokenStatus }[] = [
  { key: 'turn-based', label: 'Turn-based', meaning: 'Employees bid one after another, usually by seniority. You wait in a queue, then rank your requests while it is your turn.', status: 'confirmed' },
  { key: 'all-at-once', label: 'All at once', meaning: 'Everyone bids during the same window, shown as a countdown. You pick from the shifts on offer, rank them and submit, and can still change them until the window closes. Then the agency awards the leave by its rules, usually seniority.', status: 'confirmed' },
]

/* ------------------------------------------------------------------ */
/* Your place in a bid                                                 */
/* ------------------------------------------------------------------ */

/** Where you are in a bid. Each maps to a request status badge (`requestStates` in status.ts). */
export type BidState = 'queued' | 'your-turn' | 'open' | 'pending' | 'closed' | 'expired' | 'taken-down'

export const bidStates: { key: BidState; badge: string; modes: BidMode[]; when: string; panel: string; list: string; status: TokenStatus }[] = [
  {
    key: 'queued', badge: 'queued', modes: ['turn-based'], when: 'Other employees bid before you',
    panel: 'How many employees are ahead of you, and that you will be notified when it is your turn. No requests yet.',
    list: 'Queued badge and the time left in the bid.', status: 'confirmed',
  },
  {
    key: 'your-turn', badge: 'your-turn', modes: ['turn-based'], when: 'It is your turn to bid',
    panel: 'Add Request and View Team Bids, your ranked requests, and Submit at the bottom. Submit is disabled until you add a request.',
    list: 'Your Turn badge, the time left, and “Selected: N” once you add requests.', status: 'confirmed',
  },
  {
    key: 'open', badge: 'open', modes: ['all-at-once'], when: 'The bid window is open for everyone',
    panel: 'View Team Bids with the number awarded, your ranked shifts (or an empty box), and the shifts on offer with Select Shift. Submit at the bottom.',
    list: 'Open badge, the time left, and “Requests: N” once you select shifts.', status: 'confirmed',
  },
  {
    key: 'pending', badge: 'pending', modes: ['turn-based', 'all-at-once'], when: 'You submitted your requests',
    panel: 'Turn-based: the selection is locked in; you can change the ranking (Edit) or remove a request, but not add one. All at once: you can still select more shifts, and Edit changes the ranking or removes shifts until the window closes. “Submitted on” at the bottom.',
    list: 'Pending badge and “Signed up for: N”.', status: 'confirmed',
  },
  {
    key: 'closed', badge: 'closed', modes: ['turn-based', 'all-at-once'], when: 'The window closed after you submitted',
    panel: 'How many requests you were awarded, and each ranked request with Awarded or Denied.',
    list: 'Closed badge and “Awarded: N”.', status: 'confirmed',
  },
  {
    key: 'expired', badge: 'expired', modes: ['turn-based', 'all-at-once'], when: 'The window closed before you submitted (or, turn-based, before your turn)',
    panel: 'Nothing was sent. Requests that weren’t submitted are dropped.',
    list: 'Expired badge.', status: 'confirmed',
  },
  {
    key: 'taken-down', badge: 'taken-down', modes: ['turn-based', 'all-at-once'], when: 'A scheduler withdrew the bid',
    panel: 'The bid was taken down and its requests are canceled.',
    list: 'Taken Down badge.', status: 'confirmed',
  },
]

/** “1st”, “2nd”, “3rd”, “4th”… for choices. */
export function ordinal(value: number) {
  const tens = value % 100
  const suffix = tens >= 11 && tens <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][value % 10] ?? 'th'
  return `${value}${suffix}`
}

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

/** Team Bids: leave other employees bid for. Awarded is approved; pending waits for a scheduler. */
export type TeamBidStatus = 'awarded' | 'pending'
export const teamBidStatuses: { key: TeamBidStatus; label: string; meaning: string }[] = [
  { key: 'awarded', label: 'Awarded', meaning: 'A scheduler approved the leave. Solid green with an award icon.' },
  { key: 'pending', label: 'Pending', meaning: 'Submitted and waiting for a scheduler. Striped with a dashed outline and a dot.' },
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

const t = (name: BiddingToken['name'], value: string, kind: BiddingToken['kind'], usage: string, status: TokenStatus = 'confirmed'): BiddingToken =>
  ({ name, value, kind, usage, status })

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
  t('--bidding-awarded-bg', 'var(--background-success-light)', 'color', 'Awarded leave in Team Bids.'),
  t('--bidding-awarded-icon', 'var(--text-success-default)', 'color', 'Award icon on awarded leave.'),
  t('--bidding-pending-bg', 'var(--calendar-pending-bg)', 'color', 'Pending leave in Team Bids, under the stripes. Same as a pending calendar event.'),
  t('--bidding-pending-stripe', 'var(--calendar-pending-stripe)', 'color', 'Stripes on pending leave.'),
  t('--bidding-pending-border', 'var(--calendar-pending-border)', 'color', 'Dashed outline of pending leave.'),
  t('--bidding-offer-divider', 'var(--border-default)', 'color', 'Line between the shifts on offer (all at once).'),
  t('--bidding-choice-text', 'var(--text-dimmed)', 'color', '“1st Choice” on a shift you already selected (all at once).'),
  t('--bidding-pending-dot', 'var(--text-warning-default)', 'color', 'Dot before a pending name.'),
]

export const biddingCssVariables: Record<string, string> = Object.fromEntries(biddingTokens.map((token) => [token.name, token.value]))
