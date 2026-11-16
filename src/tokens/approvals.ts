import type { TokenStatus } from './types'

/** The four approval queues. They share one layout: a list, the selected request and an action panel. */
export type ApprovalKind = 'activity' | 'leave' | 'trade' | 'timesheet'

export interface ApprovalKindDef {
  key: ApprovalKind
  label: string
  /** Link to the source, above the details */
  link: string
  meaning: string
  /** Heading for blocking alerts in the details */
  blockingLabel: 'Prevent' | 'Critical'
  /** Pending requests also offer Clear (timesheets). Leave offers Approve and Reject only. */
  clearWhilePending: boolean
  /** List items show the employee’s rank with an award icon */
  showRank: boolean
  /** List items show a warning icon when the request has alerts */
  showAlertIcon: boolean
  /** Approved or rejected: `modify` shows Modify status with Clear Status; `note` keeps the note field and offers Clear (trades) */
  decidedPanel: 'modify' | 'note'
  status: TokenStatus
}

export const approvalKinds: ApprovalKindDef[] = [
  { key: 'activity', label: 'Activity', link: 'View in Team View', meaning: 'Special events, hold overs and patrols an employee asked to work or already worked.', blockingLabel: 'Prevent', clearWhilePending: true, showRank: false, showAlertIcon: true, decidedPanel: 'modify', status: 'confirmed' },
  { key: 'leave', label: 'Leave', link: 'View in Calendar', meaning: 'Vacation, comp time, sick leave and other time off.', blockingLabel: 'Critical', clearWhilePending: false, showRank: true, showAlertIcon: false, decidedPanel: 'modify', status: 'confirmed' },
  { key: 'timesheet', label: 'Timesheets', link: 'View Timesheet', meaning: 'An employee’s hours for a pay period. Schedulers can also submit timesheets the employee has not.', blockingLabel: 'Prevent', clearWhilePending: true, showRank: false, showAlertIcon: false, decidedPanel: 'modify', status: 'confirmed' },
  { key: 'trade', label: 'Trade', link: 'View in Team View', meaning: 'Two employees swapping shifts: the sender gives one, the receiver gives one back. Both sides are shown.', blockingLabel: 'Prevent', clearWhilePending: true, showRank: false, showAlertIcon: true, decidedPanel: 'note', status: 'confirmed' },
]

export const approvalKind = (key: ApprovalKind) => approvalKinds.find((kind) => kind.key === key)!

/** Where a request is in its life. `unsubmitted` only exists for timesheets. */
export type ApprovalStatus = 'unsubmitted' | 'pending' | 'approved' | 'rejected'

/** Map to `requestStates` in status.ts for the badge. */
export const approvalStatusBadge: Record<Exclude<ApprovalStatus, 'unsubmitted'>, string> = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
}

/** What the action panel shows, by status. */
export const approvalPanelStates: { key: string; when: string; panel: string }[] = [
  { key: 'awaiting', when: 'Pending, waiting for you', panel: 'Optional scheduler note, then Approve and Reject (and Clear, except on leave). Below: the required approvals.' },
  { key: 'decided', when: 'Approved or rejected', panel: 'Clear Status to send it back to pending. Trades keep the note field and offer Clear. Below: who decided and when.' },
  { key: 'unsubmitted', when: 'Timesheet not submitted yet', panel: 'Submit, on the employee’s behalf. Disabled once submitted.' },
  { key: 'selection', when: 'Several requests selected', panel: 'The same actions with “selected”: Approve selected, Clear selected, Reject selected or Submit selected.' },
]

/** Properties the Visibility dialog can show on each list item. */
export type ApprovalProperty = 'submittedOn' | 'branch' | 'unit' | 'precedence' | 'premium' | 'timeBank' | 'location' | 'payPeriod' | 'timesheetId' | 'approvalLevel'

const all: ApprovalKind[] = ['activity', 'leave', 'timesheet', 'trade']

export const approvalProperties: { key: ApprovalProperty; label: string; kinds: ApprovalKind[] }[] = [
  { key: 'submittedOn', label: 'Submitted on', kinds: all },
  { key: 'branch', label: 'Branch', kinds: all },
  { key: 'unit', label: 'Unit', kinds: all },
  { key: 'precedence', label: 'Precedence', kinds: ['leave'] },
  { key: 'premium', label: 'Premium', kinds: ['activity'] },
  { key: 'timeBank', label: 'Time Bank', kinds: ['activity'] },
  { key: 'location', label: 'Location', kinds: ['trade'] },
  { key: 'payPeriod', label: 'Pay Period', kinds: ['timesheet'] },
  { key: 'timesheetId', label: 'Timesheet ID', kinds: ['timesheet'] },
  { key: 'approvalLevel', label: 'Approval Level', kinds: all },
]

/** On by default, per tab. Activity always shows its location; trades show both shifts instead of the submitted date. */
export const defaultApprovalProperties: Record<ApprovalKind, ApprovalProperty[]> = {
  activity: ['submittedOn', 'approvalLevel'],
  leave: ['submittedOn', 'approvalLevel'],
  timesheet: ['submittedOn', 'approvalLevel'],
  trade: ['approvalLevel'],
}

/* ---------- Sort ---------- */

export type ApprovalSortField = 'status' | 'title' | 'employee' | 'start' | 'end' | 'location' | ApprovalProperty

export interface ApprovalSort {
  field: ApprovalSortField
  direction: 'asc' | 'desc'
}

export const defaultApprovalSort: ApprovalSort = { field: 'status', direction: 'asc' }

/**
 * Fields the Sort dialog offers for a tab: the request’s own fields first, then its Visibility properties.
 * A property can only be sorted by while it is visible in the list (`property: true`).
 */
export function approvalSortFields(kind: ApprovalKind): { key: ApprovalSortField; label: string; property?: boolean }[] {
  const title = kind === 'leave' ? 'Leave Type' : kind === 'timesheet' ? 'Pay Period' : 'Activity'
  const own: { key: ApprovalSortField; label: string }[] = [
    { key: 'status', label: 'Status' }, { key: 'title', label: title }, { key: 'employee', label: 'Employee' },
    ...(kind === 'timesheet' ? [] : [{ key: 'start' as const, label: 'Start Date' }, { key: 'end' as const, label: 'End Date' }]),
    ...(kind === 'activity' || kind === 'trade' ? [{ key: 'location' as const, label: 'Location' }] : []),
  ]
  const properties = approvalProperties
    .filter((property) => property.kinds.includes(kind) && !own.some((item) => item.key === property.key) && !(kind === 'timesheet' && property.key === 'payPeriod'))
    .map((property) => ({ key: property.key, label: property.label, property: true }))
  return [...own, ...properties]
}
