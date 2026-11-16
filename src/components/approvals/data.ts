import type { ApprovalKind, ApprovalProperty, ApprovalSort, ApprovalStatus } from '../../tokens/approvals'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface Approver {
  /** A waiting approver without a person yet reads “Approver #2” */
  name: string
  decision: 'approved' | 'rejected' | 'waiting'
  /** When they decided, e.g. “Sun Jun 14, 2026 · 21:00” */
  at?: string
  /** Added with Add Approval. Waiting approvers can be removed. */
  added?: boolean
}

/** A block in the detail pane: label/value rows, or a two-column hours grid. */
export type DetailSection =
  | { title: string; rows: [string, string][] }
  | { title: string; hours: [string, string][] }

export interface ApprovalRequest {
  id: string
  kind: ApprovalKind
  /** Timesheets only: in the Submitted or the Unsubmitted list */
  list: 'submitted' | 'unsubmitted'
  status: ApprovalStatus
  employee: string
  rank: string
  /** What was asked for: the pay period for timesheets, the activity or leave type for the rest */
  title: string
  /** Date and time, under the title in the list. Not used for timesheets. */
  when?: string
  /** List heading the request is grouped under */
  group: string
  /** Short form for the list, e.g. “Jun 15, 2026 · 14:08” */
  submittedOn?: string
  /** Long form for the detail pane, e.g. “Monday June 15 · 14:08” */
  submittedLong?: string
  /** Sort key */
  submittedAt: number
  branch: string
  unit: string
  location?: string
  payPeriod?: string
  timesheetId?: string
  approvers: Approver[]
  details: DetailSection[]
  alerts?: { prevent?: string[]; warnings?: string[] }
  payout?: string[]
  employeeNote?: string
  schedulerNote?: string
}

/* ------------------------------------------------------------------ */
/* Mock data                                                           */
/* ------------------------------------------------------------------ */

export const CURRENT_USER = 'John B. McLane'
const NOW = 'Tue Jun 16, 2026 · 10:30'

const PERIOD = 'Jun 1-15, 2026'
const PERIOD_GROUP = 'June 1 – June 15, 2026'

const hours = (values: [number, number, number, number, number, number, number, number, number]): DetailSection => {
  const f = (value: number) => `${String(Math.floor(value)).padStart(2, '0')}:${value % 1 ? '30' : '00'}`
  const [regular, straight, differential, overtime, premium, standby, unpaid, banked, leave] = values.map(f)
  return {
    title: 'Hours summary',
    hours: [
      ['Regular', regular], ['Straight', straight], ['Differential', differential], ['Overtime', overtime],
      ['Premium', premium], ['Standby', standby], ['Unpaid', unpaid], ['Banked', banked], ['Leave', leave],
    ],
  }
}

const waiting = (n: number): Approver => ({ name: `Approver #${n}`, decision: 'waiting' })

function timesheet(id: string, employee: string, rank: string, extra: Partial<ApprovalRequest> & { submittedAt: number; status: ApprovalStatus; approvers: Approver[] }, values: Parameters<typeof hours>[0]): ApprovalRequest {
  const timesheetId = extra.timesheetId ?? id
  return {
    id, kind: 'timesheet', list: 'submitted', employee, rank, title: PERIOD, group: PERIOD_GROUP,
    branch: 'Field Operations', unit: 'Patrol D4', payPeriod: PERIOD, timesheetId,
    details: [
      { title: 'Timesheet', rows: [['Pay Period', PERIOD], ['Timesheet ID', timesheetId]] },
      { title: 'Employee', rows: [['Name', employee], ['Rank', rank]] },
      hours(values),
    ],
    ...extra,
  }
}

const timesheets: ApprovalRequest[] = [
  timesheet('a2342f33', 'Hank Moody', 'Sergeant', {
    status: 'pending', submittedOn: 'Jun 15, 2026 · 14:08', submittedLong: 'Monday June 15 · 14:08', submittedAt: 15.58,
    approvers: [{ name: 'John Smith', decision: 'approved', at: 'Mon Jun 15, 2026 · 21:00' }, waiting(2)],
    alerts: { warnings: ['Timesheet conflict: start and end times overlap on June 7–8 and June 12, 2026.'] },
    payout: ['Comp Time: 25'],
    employeeNote: 'June 12 overlap is the court appearance. Subpoena is attached to the activity.',
  }, [73, 73, 1, 0, 1, 0, 0, 0, 0]),
  timesheet('b81c07d4', 'Peter Venkman', 'Sergeant', {
    status: 'approved', submittedOn: 'Jun 15, 2026 · 14:00', submittedLong: 'Monday June 15 · 14:00', submittedAt: 15.58,
    approvers: [
      { name: 'Ronald McDowell', decision: 'approved', at: 'Mon Jun 15, 2026 · 21:00' },
      { name: 'John Smith', decision: 'approved', at: 'Mon Jun 15, 2026 · 21:40' },
    ],
    schedulerNote: 'Thanks for logging the training hours separately.',
    employeeNote: 'Firearms requalification on June 4 is under Training.',
  }, [80, 80, 0, 4, 0, 0, 0, 0, 0]),
  timesheet('c4e19a02', 'Ray Stantz', 'Sergeant', {
    status: 'rejected', submittedOn: 'Jun 15, 2026 · 13:52', submittedLong: 'Monday June 15 · 13:52', submittedAt: 15.57,
    approvers: [{ name: 'John Smith', decision: 'rejected', at: 'Mon Jun 15, 2026 · 21:05' }, waiting(2)],
    alerts: {
      prevent: ['Comp Time over balance cap (34:00 hours) by 02:30 hours on 06-12-2026. Maximum hours you can bank on this is 00:00 hours.'],
      warnings: ['Daily work hours (24:00) exceed the maximum of 16:00 over the following 24-hour period.', 'Overtime (12.0 hours) for the work period.'],
    },
    schedulerNote: 'Please move the extra hours on June 12 to overtime and resubmit.',
    employeeNote: 'Stayed on the Atlantic Ave scene until relieved.',
  }, [73, 61, 1, 12, 1, 0, 0, 2.5, 0]),
  timesheet('d90b5e61', 'Maria Alvarez', 'Officer', {
    status: 'pending', submittedOn: 'Jun 15, 2026 · 11:20', submittedLong: 'Monday June 15 · 11:20', submittedAt: 15.47,
    approvers: [waiting(1), waiting(2)],
  }, [80, 80, 0, 0, 0, 0, 0, 0, 0]),
  timesheet('e17f3c88', 'James Okafor', 'Detective', {
    status: 'pending', submittedOn: 'Jun 14, 2026 · 18:45', submittedLong: 'Sunday June 14 · 18:45', submittedAt: 14.78,
    approvers: [waiting(1)],
    payout: ['Overtime: 06:00', 'Comp Time: 04:00'],
  }, [64, 64, 0, 6, 0, 2, 0, 4, 16]),
  timesheet('4535234893', 'Albert Flores', 'Lieutenant', { list: 'unsubmitted', status: 'unsubmitted', submittedAt: 0, approvers: [waiting(1)] }, [0, 0, 0, 0, 0, 0, 0, 0, 0]),
  timesheet('4535234894', 'Grace Bennett', 'Officer', { list: 'unsubmitted', status: 'unsubmitted', submittedAt: 0, approvers: [waiting(1)] }, [56, 56, 0, 0, 0, 0, 0, 0, 0]),
  timesheet('4535234895', 'Luis Ortega', 'Officer', { list: 'unsubmitted', status: 'unsubmitted', submittedAt: 0, approvers: [waiting(1)] }, [72, 72, 2, 0, 0, 0, 0, 0, 8]),
]

const base = { list: 'submitted' as const, branch: 'Field Operations', unit: 'Patrol D4' }

const leave: ApprovalRequest[] = [
  {
    ...base, id: 'lv-1', kind: 'leave', status: 'pending', employee: 'Daniel Reyes', rank: 'Officer', title: 'Vacation',
    when: 'Jun 22–26, 2026 · 5 days', group: 'June 2026',
    submittedOn: 'Jun 10, 2026 · 09:14', submittedLong: 'Wednesday June 10 · 09:14', submittedAt: 10.38,
    approvers: [waiting(1), waiting(2)],
    details: [
      { title: 'Leave', rows: [['Type', 'Vacation'], ['From', 'Mon Jun 22, 2026 · 07:00'], ['To', 'Fri Jun 26, 2026 · 15:00'], ['Hours', '40:00'], ['Balance after', '82:00']] },
      { title: 'Replaces', rows: [['Mon–Fri', 'Patrol D4 · 07:00–15:00']] },
      { title: 'Employee', rows: [['Name', 'Daniel Reyes'], ['Rank', 'Officer']] },
    ],
    alerts: { warnings: ['Two others in Patrol D4 are on leave June 24–25. Coverage drops below the minimum.'] },
    employeeNote: 'Family wedding in Albany.',
  },
  {
    ...base, id: 'lv-2', kind: 'leave', status: 'pending', employee: 'Priya Nair', rank: 'Sergeant', title: 'Compensating',
    when: 'Fri Jun 19, 2026 · 12:00–15:00', group: 'June 2026',
    submittedOn: 'Jun 9, 2026 · 16:30', submittedLong: 'Tuesday June 9 · 16:30', submittedAt: 9.69,
    approvers: [waiting(1)],
    details: [
      { title: 'Leave', rows: [['Type', 'Compensating'], ['From', 'Fri Jun 19, 2026 · 12:00'], ['To', 'Fri Jun 19, 2026 · 15:00'], ['Hours', '03:00'], ['Balance after', '21:00']] },
      { title: 'Employee', rows: [['Name', 'Priya Nair'], ['Rank', 'Sergeant']] },
    ],
  },
  {
    ...base, id: 'lv-3', kind: 'leave', status: 'approved', employee: 'Tom Bradley', rank: 'Officer', title: 'Sick',
    when: 'Wed Jun 3, 2026 · All day', group: 'June 2026',
    submittedOn: 'Jun 3, 2026 · 05:40', submittedLong: 'Wednesday June 3 · 05:40', submittedAt: 3.24,
    approvers: [{ name: 'John Smith', decision: 'approved', at: 'Wed Jun 3, 2026 · 06:10' }],
    details: [
      { title: 'Leave', rows: [['Type', 'Sick'], ['Date', 'Wed Jun 3, 2026'], ['Hours', '08:00']] },
      { title: 'Employee', rows: [['Name', 'Tom Bradley'], ['Rank', 'Officer']] },
    ],
    schedulerNote: 'Feel better.',
  },
]

const trade: ApprovalRequest[] = [
  {
    ...base, id: 'tr-1', kind: 'trade', status: 'pending', employee: 'Kevin Walsh', rank: 'Officer', title: 'Trade with Tom Bradley',
    when: 'Sat Jun 20 ⇄ Sun Jun 28, 2026', location: 'Patrol D4', group: 'June 2026',
    submittedOn: 'Jun 12, 2026 · 08:02', submittedLong: 'Friday June 12 · 08:02', submittedAt: 12.33,
    approvers: [{ name: 'Tom Bradley', decision: 'approved', at: 'Fri Jun 12, 2026 · 08:30' }, waiting(2)],
    details: [
      { title: 'Kevin Walsh gives', rows: [['Date', 'Sat Jun 20, 2026'], ['Shift', 'Day · 07:00–15:00'], ['Location', 'Patrol D4']] },
      { title: 'Tom Bradley gives', rows: [['Date', 'Sun Jun 28, 2026'], ['Shift', 'Day · 07:00–15:00'], ['Location', 'Patrol D4']] },
    ],
    employeeNote: 'Tom agreed. Same post, same hours.',
  },
  {
    ...base, id: 'tr-2', kind: 'trade', status: 'rejected', employee: 'Sara Kim', rank: 'Officer', title: 'Trade with Luis Ortega',
    when: 'Fri Jun 5 ⇄ Sat Jun 6, 2026', location: 'Gate A', group: 'June 2026',
    submittedOn: 'Jun 1, 2026 · 19:12', submittedLong: 'Monday June 1 · 19:12', submittedAt: 1.8,
    approvers: [{ name: 'John Smith', decision: 'rejected', at: 'Tue Jun 2, 2026 · 07:45' }],
    details: [
      { title: 'Sara Kim gives', rows: [['Date', 'Fri Jun 5, 2026'], ['Shift', 'Night · 23:00–07:00'], ['Location', 'Gate A']] },
      { title: 'Luis Ortega gives', rows: [['Date', 'Sat Jun 6, 2026'], ['Shift', 'Night · 23:00–07:00'], ['Location', 'Gate A']] },
    ],
    alerts: { prevent: ['Luis Ortega would work 16:00 hours without the required 08:00 rest.'] },
  },
]

const activity = (id: string, employee: string, title: string, when: string, location: string, extra: Partial<ApprovalRequest> & { status: ApprovalStatus; approvers: Approver[]; submittedAt: number; group: string }): ApprovalRequest => ({
  ...base, id, kind: 'activity', employee, rank: 'Officer', title, when, location,
  details: [
    { title: 'Activity', rows: [['Activity', title], ['Date and time', when], ['Hours', '05:00'], ['Hours modifier', 'Overtime 1.5x'], ['Location', location]] },
    { title: 'Employee', rows: [['Name', employee], ['Rank', 'Officer']] },
  ],
  ...extra,
})

const activities: ApprovalRequest[] = [
  activity('ac-1', 'Hank Moody', 'Hold Over', 'Mon Jun 15, 2026 · 14:00–19:00', 'Gate A', {
    status: 'pending', group: 'June 2026', submittedOn: 'Jun 15, 2026 · 19:20', submittedLong: 'Monday June 15 · 19:20', submittedAt: 15.8,
    approvers: [waiting(1)], employeeNote: 'Held over for the shift change at the gate.',
  }),
  activity('ac-2', 'Sara Kim', 'Extra Patrol', 'Sat Jun 13, 2026 · 14:00–19:00', 'Gate A', {
    status: 'approved', group: 'June 2026', submittedOn: 'Jun 11, 2026 · 10:00', submittedLong: 'Thursday June 11 · 10:00', submittedAt: 11.41,
    approvers: [{ name: 'John Smith', decision: 'approved', at: 'Thu Jun 11, 2026 · 12:15' }],
  }),
  activity('ac-3', 'Ray Stantz', 'Hold Over', 'Wed Jun 10, 2026 · 14:00–19:00', 'Gate A', {
    status: 'rejected', group: 'June 2026', submittedOn: 'Jun 10, 2026 · 19:30', submittedLong: 'Wednesday June 10 · 19:30', submittedAt: 10.81,
    approvers: [{ name: 'John Smith', decision: 'rejected', at: 'Thu Jun 11, 2026 · 07:30' }],
    alerts: { warnings: ['Overtime (12.0 hours) for the work period.'] },
  }),
  activity('ac-4', 'Maria Alvarez', 'Court Appearance', 'Thu May 28, 2026 · 09:00–14:00', 'City Hall', {
    status: 'approved', group: 'May 2026', submittedOn: 'May 27, 2026 · 15:10', submittedLong: 'Wednesday May 27 · 15:10', submittedAt: -4.37,
    approvers: [{ name: 'Ronald McDowell', decision: 'approved', at: 'Wed May 27, 2026 · 16:00' }],
  }),
  activity('ac-5', 'Daniel Reyes', 'Paid Duty', 'Sat May 23, 2026 · 18:00–23:00', 'Barclays Center', {
    status: 'pending', group: 'May 2026', submittedOn: 'May 20, 2026 · 08:45', submittedLong: 'Wednesday May 20 · 08:45', submittedAt: -10.63,
    approvers: [waiting(1), waiting(2)],
  }),
]

export const initialRequests = (): ApprovalRequest[] => [...activities, ...leave, ...trade, ...timesheets].map((request) => ({
  ...request, approvers: request.approvers.map((approver) => ({ ...approver })),
}))

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export const requestHeading = (request: ApprovalRequest) =>
  request.kind === 'timesheet' ? `${request.employee} · ${request.title}` : `${request.title} · ${request.employee}`

/** Waiting for a decision, from anyone. */
export const isOpen = (request: ApprovalRequest) => request.status === 'pending' || request.status === 'unsubmitted'

/** Count for the tab label: requests that still need someone to act. */
export const openCount = (requests: ApprovalRequest[], kind: ApprovalKind) => requests.filter((request) => request.kind === kind && isOpen(request)).length

export const approvedCount = (request: ApprovalRequest) => request.approvers.filter((approver) => approver.decision === 'approved').length

/** One line of the list item per visible property. */
export function propertyLines(request: ApprovalRequest, visible: ApprovalProperty[]): string[] {
  const lines: string[] = []
  if (visible.includes('submittedOn') && request.submittedOn) lines.push(`Submitted: ${request.submittedOn}`)
  if (visible.includes('branch')) lines.push(`Branch: ${request.branch}`)
  if (visible.includes('unit')) lines.push(`Unit: ${request.unit}`)
  if (visible.includes('payPeriod') && request.payPeriod && request.list === 'submitted') lines.push(`Pay period: ${request.payPeriod}`)
  if (visible.includes('timesheetId') && request.timesheetId) lines.push(`Timesheet ID: ${request.timesheetId}`)
  return lines
}

const statusOrder: Record<ApprovalStatus, number> = { pending: 0, unsubmitted: 1, rejected: 2, approved: 3 }

export function sortRequests(requests: ApprovalRequest[], sort: ApprovalSort) {
  const sorted = [...requests]
  if (sort === 'newest') sorted.sort((a, b) => b.submittedAt - a.submittedAt)
  if (sort === 'oldest') sorted.sort((a, b) => a.submittedAt - b.submittedAt)
  if (sort === 'name') sorted.sort((a, b) => a.employee.localeCompare(b.employee))
  if (sort === 'status') sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
  return sorted
}

/** Keeps list order, splits into the headings. */
export function groupRequests(requests: ApprovalRequest[]) {
  const groups: { label: string; items: ApprovalRequest[] }[] = []
  for (const request of requests) {
    const group = groups.find((item) => item.label === request.group)
    if (group) group.items.push(request)
    else groups.push({ label: request.group, items: [request] })
  }
  return groups
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export type ApprovalAction = 'approve' | 'reject' | 'clear' | 'submit'

/** Applies an action. Preview only: nothing is saved. */
export function applyAction(request: ApprovalRequest, action: ApprovalAction, note?: string): ApprovalRequest {
  const schedulerNote = note?.trim() || request.schedulerNote
  if (action === 'submit') {
    return { ...request, status: 'pending', submittedOn: 'Jun 16, 2026 · 10:30', submittedLong: 'Tuesday June 16 · 10:30', submittedAt: 16.44 }
  }
  if (action === 'clear') {
    return {
      ...request,
      status: 'pending',
      schedulerNote: undefined,
      approvers: request.approvers.map((approver, index) => approver.added ? { ...approver, decision: 'waiting', at: undefined } : waiting(index + 1)),
    }
  }
  const decision = action === 'approve' ? 'approved' : 'rejected'
  const mine: Approver = { name: CURRENT_USER, decision, at: NOW }
  const approvers = [...request.approvers]
  const slot = approvers.findIndex((approver) => approver.decision === 'waiting')
  if (slot >= 0) approvers[slot] = mine
  else approvers.push(mine)
  const status: ApprovalStatus = decision === 'rejected' ? 'rejected' : approvers.every((approver) => approver.decision === 'approved') ? 'approved' : 'pending'
  return { ...request, status, approvers, schedulerNote }
}

export function addApprover(request: ApprovalRequest): ApprovalRequest {
  return { ...request, approvers: [...request.approvers, { name: `Approver #${request.approvers.length + 1}`, decision: 'waiting', added: true }] }
}

export function removeApprover(request: ApprovalRequest, index: number): ApprovalRequest {
  const approvers = request.approvers.filter((_, i) => i !== index)
    .map((approver, i) => approver.decision === 'waiting' && approver.name.startsWith('Approver #') ? { ...approver, name: `Approver #${i + 1}` } : approver)
  const status: ApprovalStatus = request.status === 'pending' && approvers.length > 0 && approvers.every((approver) => approver.decision === 'approved') ? 'approved' : request.status
  return { ...request, approvers, status }
}
