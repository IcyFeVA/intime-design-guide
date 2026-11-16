import type { ApprovalKind, ApprovalProperty, ApprovalSort, ApprovalSortField, ApprovalStatus } from '../../tokens/approvals'

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

export interface TagGroup {
  /** Shown above the values. Without one, values sit in a single row. */
  label?: string
  values: string[]
}

/** One side of a trade: the shift this person gives away. */
export interface TradeSide {
  name: string
  rank: string
  unit: string
  day: { weekday: string; date: number; month: string }
  /** e.g. “9.0” */
  hours: string
  time: string
  activity: string
  location: string
  hoursModifier: string
  tags?: TagGroup[]
  assets?: TagGroup[]
}

/** A note in a trade’s thread, from either employee or an approver. */
export interface ThreadNote {
  /** Short name, e.g. “L. Parker” */
  author: string
  /** e.g. “Approver #1” */
  role?: string
  text: string
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
  /** Leave: order in which competing requests are granted */
  precedence?: string
  /** Activity: hours modifier and time bank, for Visibility */
  premium?: string
  timeBank?: string
  /** Sort keys for Start Date and End Date (days, fractional hours) */
  startAt?: number
  endAt?: number
  /** Trades: both shifts, and the notes thread that replaces the single employee note */
  trade?: { sender: TradeSide; receiver: TradeSide }
  notes?: ThreadNote[]
  approvers: Approver[]
  details: DetailSection[]
  alerts?: { prevent?: string[]; warnings?: string[] }
  payout?: string[]
  employeeNote?: string
  schedulerNote?: string
  /** Shown as a red notice at the top of the details. Set from the scheduler note when rejecting. */
  rejectionReason?: string
  /** Tracking tags. Groups with a label show it above their values; without one the values sit in one row. */
  tags?: TagGroup[]
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

const LEAVE_GROUP = 'June 28 – July 12, 2026'

function leaveRequest(id: string, employee: string, rank: string, type: string, extra: Partial<ApprovalRequest> & { status: ApprovalStatus; approvers: Approver[]; submittedAt: number }): ApprovalRequest {
  const date = 'Wed Jul 1, 2026 · 21:00–23:00'
  return {
    ...base, id, kind: 'leave', employee, rank, title: type, when: date, group: LEAVE_GROUP, startAt: 31.875, endAt: 31.96,
    branch: '99th Precinct - Brooklyn', unit: 'Patrol D4', precedence: '0.0',
    submittedOn: 'Mon Jun 15, 2026 · 14:00', submittedLong: 'Monday June 15 · 14:00',
    details: [
      { title: 'Leave request', rows: [['Request ID', id], ['Leave Type', type], ['Date', date], ['Hours Requested', '02:00']] },
      { title: 'Employee', rows: [['Name', employee], ['Unit', 'Patrol D4'], ['Branch', '99th Precinct - Brooklyn'], ['Rank', rank], ['Precedence', '0.0']] },
    ],
    ...extra,
  }
}

const leave: ApprovalRequest[] = [
  leaveRequest('f2342a71', 'Egon Spengler', 'Sergeant', 'Comp Time', {
    status: 'pending', submittedAt: 15.6,
    approvers: [{ name: 'John Smith', decision: 'approved', at: 'Mon Jun 15, 2026 · 21:00' }, waiting(2)],
    alerts: { warnings: ['Daily work hours (24:00) exceed the maximum of 16:00 over the following 24-hour period.'] },
    employeeNote: 'Covering the late arrest paperwork from June 28.',
    tags: [{ values: ['Police File #: 984654', 'Case #: 564654'] }],
  }),
  leaveRequest('b7710c2e', 'Ray Stantz', 'Sergeant', 'Vacation', {
    status: 'approved', submittedAt: 15.59,
    approvers: [
      { name: 'Ronald McDowell', decision: 'approved', at: 'Mon Jun 15, 2026 · 21:00' },
      { name: 'John Smith', decision: 'approved', at: 'Mon Jun 15, 2026 · 21:10' },
    ],
    schedulerNote: 'Well deserved. Enjoy your vacation!',
    employeeNote: 'Family trip, back on the 6th.',
    tags: [
      { label: 'Police File #', values: ['#984654'] },
      { label: 'Overtime reason', values: ['Late Arrest', 'Paperwork'] },
      { label: 'Court related', values: ['Arraignment', 'Subpoena'] },
    ],
  }),
  leaveRequest('c90f4d18', 'Peter Venkman', 'Lieutenant', 'Vacation', {
    status: 'rejected', submittedAt: 15.58,
    approvers: [{ name: 'John Smith', decision: 'rejected', at: 'Mon Jun 15, 2026 · 21:00' }, waiting(2)],
    rejectionReason: 'Comp Time over balance cap.',
    alerts: {
      prevent: ['Comp Time over balance cap (34:00 hours) by 02:30 hours on 07-01-2026. Maximum hours you can bank on this is 00:00 hours.'],
      warnings: ['Daily work hours (24:00) exceed the maximum of 16:00 over the following 24-hour period.', 'Overtime (12.0 hours) for the work period.'],
    },
    employeeNote: 'Requested before the summer freeze.',
    tags: [{ values: ['Police File #: 984654', 'Case #: 564654'] }],
  }),
]

const PAY_GROUP = 'June 28 – July 12, 2026'

const groupedTags: TagGroup[] = [
  { label: 'Police File #', values: ['#984654'] },
  { label: 'Overtime reason', values: ['Late Arrest', 'Paperwork'] },
  { label: 'Court related', values: ['Arraignment', 'Subpoena'] },
]

const side = (name: string, rank: string, unit: string, weekday: string, date: number, extra: Partial<TradeSide> = {}): TradeSide => ({
  name, rank, unit, day: { weekday, date, month: 'Jul' }, hours: '9.0', time: '08:00–17:00',
  activity: 'Special Event', location: 'City Hall · Gate A', hoursModifier: 'OT Training', ...extra,
})

function tradeRequest(id: string, sender: TradeSide, receiver: TradeSide, extra: Partial<ApprovalRequest> & { status: ApprovalStatus; approvers: Approver[] }): ApprovalRequest {
  const line = (s: TradeSide) => `${s.day.weekday} ${s.day.month} ${s.day.date} · ${s.time}`
  return {
    ...base, id, kind: 'trade', employee: sender.name, rank: sender.rank, title: `${sender.activity} for ${receiver.activity}`,
    when: `${line(sender)}\nfor ${line(receiver)}`, location: sender.location, group: PAY_GROUP,
    submittedOn: 'Mon Jun 15, 2026 · 09:23', submittedLong: 'Monday June 15 · 09:23', submittedAt: 15.39,
    startAt: 30 + sender.day.date, endAt: 30 + receiver.day.date,
    details: [], trade: { sender, receiver },
    ...extra,
  }
}

const trade: ApprovalRequest[] = [
  tradeRequest('tr-1',
    side('Lewis Parker', 'Sergeant', 'Night Patrol', 'Fri', 3, { tags: groupedTags, assets: [{ label: 'Vehicle', values: ['Unit #4127'] }] }),
    side('Rodriga Rodriguez', 'Lieutenant', 'Day Patrol', 'Sat', 4, {
      activity: 'Security Detail', location: 'Barclays Center',
      tags: [{ label: 'Overtime reason', values: ['Late Arrest', 'Paperwork'] }], assets: [{ label: 'Vehicle', values: ['Unit #701'] }],
    }),
    {
      status: 'pending',
      approvers: [{ name: 'John Smith', decision: 'approved', at: 'Mon Jun 15, 2026 · 16:41' }, waiting(2)],
      alerts: { warnings: ['R. Rodriguez: daily work hours exceed the maximum of 16:00 over the following 24-hour period.', 'L. Parker: rank mismatch, a Sergeant covering a Lieutenant assignment.'] },
      notes: [
        { author: 'L. Parker', text: 'Family commitment that Friday. Happy to take the Saturday event instead.' },
        { author: 'R. Rodriguez', text: 'Works for me.' },
        { author: 'J. Smith', role: 'Approver #1', text: 'Thanks Rodriga for helping Lewis out!' },
      ],
    }),
  tradeRequest('tr-2',
    side('Kevin Walsh', 'Officer', 'Patrol D4', 'Mon', 6, { activity: 'Day Patrol', location: 'Patrol D4', hoursModifier: 'Regular', time: '07:00–15:00', hours: '8.0' }),
    side('Tom Bradley', 'Officer', 'Patrol D4', 'Wed', 8, { activity: 'Day Patrol', location: 'Patrol D4', hoursModifier: 'Regular', time: '07:00–15:00', hours: '8.0' }),
    {
      status: 'approved', submittedAt: 15.2,
      approvers: [
        { name: 'John Smith', decision: 'approved', at: 'Mon Jun 15, 2026 · 16:41' },
        { name: 'Madison Taylor', decision: 'approved', at: 'Mon Jun 15, 2026 · 16:55' },
      ],
      notes: [
        { author: 'K. Walsh', text: 'Same post, same hours. Tom agreed.' },
        { author: 'J. Smith', role: 'Approver #1', text: 'Fine by me.' },
      ],
    }),
  tradeRequest('tr-3',
    side('Sara Kim', 'Officer', 'Gate Security', 'Thu', 9, { activity: 'Security', location: 'Gate A', time: '23:00–07:00', hours: '8.0', hoursModifier: 'Night' }),
    side('Luis Ortega', 'Officer', 'Gate Security', 'Fri', 10, { activity: 'Security', location: 'Gate A', time: '23:00–07:00', hours: '8.0', hoursModifier: 'Night' }),
    {
      status: 'rejected', submittedAt: 15.1,
      approvers: [
        { name: 'John Smith', decision: 'approved', at: 'Mon Jun 15, 2026 · 16:41' },
        { name: 'Madison Taylor', decision: 'rejected', at: 'Mon Jun 15, 2026 · 16:55' },
      ],
      alerts: { warnings: ['L. Ortega: works 16:00 hours without the required 08:00 rest.'] },
      notes: [
        { author: 'S. Kim', text: 'Dentist appointment Thursday night.' },
        { author: 'L. Ortega', text: 'Works for me.' },
        { author: 'J. Smith', role: 'Approver #1', text: 'Approved on my side.' },
        { author: 'M. Taylor', role: 'Approver #2', text: 'Sorry Sara, we need you for the special task that day.' },
      ],
    }),
]

function activity(id: string, employee: string, rank: string, title: string, location: string, extra: Partial<ApprovalRequest> & { status: ApprovalStatus; approvers: Approver[]; submittedAt: number }): ApprovalRequest {
  const when = 'Wed Jul 1, 2026 · 21:00–23:00'
  return {
    ...base, id, kind: 'activity', employee, rank, title, when, location, group: PAY_GROUP, unit: 'Night Patrol',
    premium: 'OT - Min. Staffing', timeBank: 'Comp Time', startAt: 31.875, endAt: 31.96,
    submittedOn: 'Mon Jun 15, 2026 · 14:00', submittedLong: 'Monday June 15 · 14:00',
    details: [
      { title: 'Details', rows: [
        ['Date', when], ['Branch', '99th Precinct - Brooklyn'], ['Location', location], ['Activity', 'Hold over'],
        ['Hours Modifier', 'OT - Min. Staffing'], ['Unit', 'Night Patrol'], ['Rank', rank], ['Time Bank', 'Comp Time'], ['Banked Time', '01:00'],
      ] },
    ],
    ...extra,
  }
}

const activities: ApprovalRequest[] = [
  activity('ac-1', 'Egon Spengler', 'Sergeant', 'Special Event', 'City Hall - Gate A', {
    status: 'pending', submittedAt: 15.6,
    approvers: [{ name: 'John Smith', decision: 'approved', at: 'Mon Jun 15, 2026 · 21:00' }, waiting(2)],
    alerts: { warnings: ['Daily work hours (24:00) exceed the maximum of 16:00 over the following 24-hour period.'] },
    employeeNote: 'Happy to cover the City Hall event.',
    tags: [{ values: ['Police File #: 984654', 'Case #: 564654'] }],
  }),
  activity('ac-2', 'Ray Stantz', 'Sergeant', 'Beach Patrol', 'Coney Island Boardwalk', {
    status: 'approved', submittedAt: 15.59,
    approvers: [
      { name: CURRENT_USER, decision: 'approved', at: 'Mon Jun 15, 2026 · 21:00' },
      { name: 'John Smith', decision: 'approved', at: 'Mon Jun 15, 2026 · 21:10' },
    ],
    schedulerNote: 'Thanks for covering the boardwalk.',
    employeeNote: 'Swapped my day off to make this work.',
    tags: groupedTags,
  }),
  activity('ac-3', 'Peter Venkman', 'Lieutenant', 'Security', 'Barclays Center', {
    status: 'rejected', submittedAt: 15.58,
    approvers: [{ name: 'John Smith', decision: 'rejected', at: 'Mon Jun 15, 2026 · 21:00' }, waiting(2)],
    rejectionReason: 'The security detail is already fully staffed.',
    employeeNote: 'Available all evening.',
    tags: [{ values: ['Police File #: 984654'] }],
  }),
]

export const initialRequests = (): ApprovalRequest[] => [...activities, ...leave, ...trade, ...timesheets].map((request) => ({
  ...request, approvers: request.approvers.map((approver) => ({ ...approver })),
}))

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export const surname = (name: string) => name.split(' ').at(-1)!

/** “J. McLane” */
const shortName = (name: string) => `${name[0]}. ${surname(name)}`

/**
 * “Name · Pay period” for timesheets, “Type · Surname” for leave, “Surname · Activity” for activity
 * and “Surname ⇄ Surname” for trades.
 */
export const requestHeading = (request: ApprovalRequest) =>
  request.kind === 'timesheet' ? `${request.employee} · ${request.title}`
    : request.kind === 'leave' ? `${request.title} · ${surname(request.employee)}`
      : request.trade ? `${surname(request.trade.sender.name)} ⇄ ${surname(request.trade.receiver.name)}`
        : `${surname(request.employee)} · ${request.title}`

/** The employee wrote a note, or the trade has a thread. */
export const hasNotes = (request: ApprovalRequest) => !!request.employeeNote || !!request.notes?.length

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
  if (visible.includes('precedence') && request.precedence) lines.push(`Precedence: ${request.precedence}`)
  if (visible.includes('premium') && request.premium) lines.push(`Premium: ${request.premium}`)
  if (visible.includes('timeBank') && request.timeBank) lines.push(`Time bank: ${request.timeBank}`)
  if (visible.includes('payPeriod') && request.payPeriod && request.list === 'submitted') lines.push(`Pay period: ${request.payPeriod}`)
  if (visible.includes('timesheetId') && request.timesheetId) lines.push(`Timesheet ID: ${request.timesheetId}`)
  return lines
}

const statusOrder: Record<ApprovalStatus, number> = { pending: 0, unsubmitted: 1, rejected: 2, approved: 3 }

function sortValue(request: ApprovalRequest, field: ApprovalSortField): number | string {
  switch (field) {
    case 'status': return statusOrder[request.status]
    case 'title': return request.title
    case 'employee': return `${surname(request.employee)} ${request.employee}`
    case 'start': return request.startAt ?? request.submittedAt
    case 'end': return request.endAt ?? request.startAt ?? request.submittedAt
    case 'submittedOn': return request.submittedAt
    case 'approvalLevel': return approvedCount(request)
    default: return String(request[field] ?? '')
  }
}

/** Stable sort, so ties keep their order. */
export function sortRequests(requests: ApprovalRequest[], sort: ApprovalSort) {
  const sign = sort.direction === 'asc' ? 1 : -1
  return [...requests].sort((a, b) => {
    const x = sortValue(a, sort.field)
    const y = sortValue(b, sort.field)
    return sign * (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y)))
  })
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
  // Trades keep a thread: a note from the scheduler is added to it instead
  const thread = (slot: number) => request.trade && note?.trim()
    ? { notes: [...(request.notes ?? []), { author: shortName(CURRENT_USER), role: slot >= 0 ? `Approver #${slot + 1}` : undefined, text: note.trim() }] }
    : {}
  if (action === 'clear') {
    return {
      ...request,
      ...thread(request.approvers.findIndex((approver) => approver.name === CURRENT_USER)),
      status: 'pending',
      schedulerNote: undefined,
      rejectionReason: undefined,
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
  if (request.trade) return { ...request, status, approvers, ...thread(slot >= 0 ? slot : approvers.length - 1) }
  // A note given while rejecting is the rejection reason
  if (decision === 'rejected' && note?.trim()) return { ...request, status, approvers, rejectionReason: note.trim() }
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
