import type { TokenStatus } from './types'

/** The four approval queues. They share one layout: a list, the selected request and an action panel. */
export type ApprovalKind = 'activity' | 'leave' | 'trade' | 'timesheet'

export const approvalKinds: { key: ApprovalKind; label: string; link: string; meaning: string; status: TokenStatus }[] = [
  { key: 'activity', label: 'Activity', link: 'View in Team View', meaning: 'Overtime, hold overs and extra patrols an employee asked to work or already worked.', status: 'review' },
  { key: 'leave', label: 'Leave', link: 'View in Calendar', meaning: 'Vacation, sick leave and other time off.', status: 'review' },
  { key: 'trade', label: 'Trade', link: 'View in Team View', meaning: 'Two employees swapping shifts. Both sides are shown.', status: 'review' },
  { key: 'timesheet', label: 'Timesheets', link: 'View Timesheet', meaning: 'An employee’s hours for a pay period. Schedulers can also submit timesheets the employee has not.', status: 'review' },
]

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
  { key: 'awaiting', when: 'Pending, waiting for you', panel: 'Optional scheduler note, then Approve, Clear and Reject. Below: the required approvals.' },
  { key: 'decided', when: 'Approved or rejected', panel: 'Clear Status to send it back to pending. Below: who decided and when.' },
  { key: 'unsubmitted', when: 'Timesheet not submitted yet', panel: 'Submit, on the employee’s behalf. Disabled once submitted.' },
  { key: 'selection', when: 'Several requests selected', panel: 'The same actions with “selected”: Approve selected, Clear selected, Reject selected or Submit selected.' },
]

/** Properties the Visibility dialog can show on each list item. */
export type ApprovalProperty = 'submittedOn' | 'branch' | 'unit' | 'location' | 'payPeriod' | 'timesheetId' | 'approvalLevel'

export const approvalProperties: { key: ApprovalProperty; label: string; kinds: ApprovalKind[] }[] = [
  { key: 'submittedOn', label: 'Submitted on', kinds: ['activity', 'leave', 'trade', 'timesheet'] },
  { key: 'branch', label: 'Branch', kinds: ['activity', 'leave', 'trade', 'timesheet'] },
  { key: 'unit', label: 'Unit', kinds: ['activity', 'leave', 'trade', 'timesheet'] },
  { key: 'location', label: 'Location', kinds: ['activity', 'trade'] },
  { key: 'payPeriod', label: 'Pay Period', kinds: ['timesheet'] },
  { key: 'timesheetId', label: 'Timesheet ID', kinds: ['timesheet'] },
  { key: 'approvalLevel', label: 'Approval Level', kinds: ['activity', 'leave', 'trade', 'timesheet'] },
]

export const defaultApprovalProperties: ApprovalProperty[] = ['submittedOn', 'location', 'approvalLevel']

export type ApprovalSort = 'newest' | 'oldest' | 'name' | 'status'

export const approvalSorts: { key: ApprovalSort; label: string }[] = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'name', label: 'Name, A to Z' },
  { key: 'status', label: 'Status' },
]
