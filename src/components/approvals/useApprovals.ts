import { useMemo, useState } from 'react'
import { defaultApprovalProperties, defaultApprovalSort, type ApprovalKind, type ApprovalProperty, type ApprovalSort, type ApprovalStatus } from '../../tokens/approvals'
import {
  addApprover, applyAction, initialRequests, removeApprover, requestHeading, sortRequests, type ApprovalAction, type ApprovalRequest,
} from './data'
import { dayOf } from '../schedule/data'

export type ApprovalList = 'submitted' | 'unsubmitted'
export type StatusFilter = 'all' | Exclude<ApprovalStatus, 'unsubmitted'>

/** Date range button in the filters: Jun 1 – Jun 18, 2026 (days since 1970-01-01). */
const DEFAULT_DATE_RANGE: [number, number] = [dayOf(2026, 6, 1), dayOf(2026, 6, 18)]

const pastTense: Record<ApprovalAction, string> = { approve: 'Approved', reject: 'Rejected', clear: 'Cleared the status of', submit: 'Submitted' }

/**
 * State for an approvals screen: the open tab, the list, the selected request, multi-select, visibility, sort and filters.
 * `autoOpen` opens the first request when none is picked (desktop). On a phone the list shows first.
 */
export function useApprovals({ kind: initialKind = 'timesheet', autoOpen = true }: { kind?: ApprovalKind; autoOpen?: boolean } = {}) {
  const [requests, setRequests] = useState(initialRequests)
  const [kind, setKindState] = useState<ApprovalKind>(initialKind)
  const [list, setListState] = useState<ApprovalList>('submitted')
  const [opened, setOpened] = useState<Record<string, string | null>>({})
  const [selection, setSelection] = useState<string[]>([])
  const [visibleByKind, setVisibleByKind] = useState(defaultApprovalProperties)
  const [sort, setSort] = useState<ApprovalSort>(defaultApprovalSort)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [dateRange, setDateRange] = useState(DEFAULT_DATE_RANGE)
  const [hint, setHint] = useState<string | null>(null)

  const listKey = `${kind}:${kind === 'timesheet' ? list : 'submitted'}`

  const items = useMemo(() => {
    const query = search.trim().toLowerCase()
    return sortRequests(requests.filter((request) =>
      request.kind === kind
      && (kind !== 'timesheet' || request.list === list)
      && (status === 'all' || request.status === status)
      && (!query || requestHeading(request).toLowerCase().includes(query)),
    ), sort)
  }, [requests, kind, list, status, search, sort])

  const openedId = opened[listKey]
  const active = items.find((item) => item.id === openedId) ?? (autoOpen && openedId === undefined ? items[0] : undefined) ?? null
  const selected = items.filter((item) => selection.includes(item.id))

  const setKind = (value: ApprovalKind) => { setKindState(value); setSelection([]); setHint(null) }
  const setList = (value: ApprovalList) => { setListState(value); setSelection([]); setHint(null) }
  /** Opens a request (or closes with `null`) in its own tab and list. */
  const open = (id: string | null) => {
    const request = requests.find((item) => item.id === id)
    const key = request ? `${request.kind}:${request.list}` : listKey
    setOpened((value) => ({ ...value, [key]: id }))
  }
  const toggle = (id: string) => setSelection((value) => value.includes(id) ? value.filter((item) => item !== id) : [...value, id])
  const toggleAll = () => setSelection(selected.length === items.length ? [] : items.map((item) => item.id))

  const update = (ids: string[], fn: (request: ApprovalRequest) => ApprovalRequest) =>
    setRequests((value) => value.map((request) => ids.includes(request.id) ? fn(request) : request))

  /** Runs an action on the open request, or on the selection when there is one. */
  const act = (action: ApprovalAction, note?: string) => {
    const picked = selected.length ? selected : active ? [active] : []
    // Approve and reject only apply to pending requests, submit to unsubmitted ones, clear to decided ones
    const targets = picked.filter((request) =>
      action === 'submit' ? request.status === 'unsubmitted' : action === 'clear' ? request.status !== 'unsubmitted' : request.status === 'pending')
    const skipped = picked.length - targets.length
    setSelection([])
    if (!targets.length) { setHint(`Nothing to ${action}: ${picked.length === 1 ? 'it was' : 'they were all'} already decided.`); return }
    update(targets.map((target) => target.id), (request) => applyAction(request, action, note))
    const what = targets.length === 1 ? requestHeading(targets[0]) : `${targets.length} requests`
    setHint(`${pastTense[action]} ${what}.${skipped ? ` Skipped ${skipped} already decided.` : ''} Preview only.`)
  }

  const reset = () => {
    setRequests(initialRequests()); setKindState(initialKind); setListState('submitted'); setOpened({}); setSelection([])
    setVisibleByKind(defaultApprovalProperties); setSort(defaultApprovalSort); setSearch(''); setStatus('all'); setDateRange(DEFAULT_DATE_RANGE); setHint(null)
  }

  return {
    requests, kind, setKind, list, setList, items, active, open, selection: selected, toggle, toggleAll, clearSelection: () => setSelection([]),
    visible: visibleByKind[kind],
    /** Visibility is kept per tab */
    setVisible: (value: ApprovalProperty[]) => setVisibleByKind((current) => ({ ...current, [kind]: value })),
    sort, setSort, search, setSearch, status, setStatus, dateRange, setDateRange, hint, setHint, act, reset,
    addApprover: (id: string) => update([id], addApprover),
    removeApprover: (id: string, index: number) => update([id], (request) => removeApprover(request, index)),
  }
}

export type ApprovalsState = ReturnType<typeof useApprovals>
