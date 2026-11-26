import { useState } from 'react'
import type { BidMode, BidState } from '../../tokens/bidding'
import { leaveTypeLabel, ordinal } from '../../tokens/bidding'
import { dayOf } from '../schedule/data'
import {
  SUBMITTED_ON, formatSpan, initialBids, move, offeredShiftsFor, plural, requestForShift, type Bid, type BidRequest, type OfferedShift,
} from './data'

export type BidStatusFilter = 'all' | BidState

/** Where the employee is going when they leave the open bid: another bid, or another Sign-Ups tab */
export type LeaveTarget = { kind: 'bid'; id: string } | { kind: 'tab'; tab: string }

export interface VacationBiddingOptions {
  /** Changes the starting bids, e.g. to open the demo with ranked requests or a submitted bid */
  setup?: (bids: Bid[]) => Bid[]
  /** The bid that is open at first */
  activeId?: string
  /** Turn-based (default) or all at once */
  mode?: BidMode
}

/** Bids you can still change before submitting */
const isDraft = (bid: Bid | null) => bid?.state === 'your-turn' || bid?.state === 'open'

/** State for the vacation bidding demo: the bids, the open one, filters and every action on requests. */
export function useVacationBidding({ setup = (bids) => bids, activeId: initialActive = 'summer', mode: initialMode = 'turn-based' }: VacationBiddingOptions = {}) {
  const [mode, setModeState] = useState<BidMode>(initialMode)
  const [bids, setBids] = useState<Bid[]>(() => setup(initialBids(initialMode)))
  const [activeId, setActiveId] = useState(initialActive)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<BidStatusFilter>('all')
  const [dateRange, setDateRange] = useState<[number, number]>([dayOf(2026, 3, 1), dayOf(2027, 3, 18)])
  const [hint, setHint] = useState<string | null>(null)
  /** Ranking being changed on a submitted bid; null when not editing */
  const [rankDraft, setRankDraft] = useState<BidRequest[] | null>(null)
  /** Leaving a bid with unsubmitted requests waits for the Warning dialog */
  const [leaving, setLeaving] = useState<LeaveTarget | null>(null)
  /** All at once: notes on shifts on offer, by shift id. A selected shift's request shows the same note. */
  const [shiftNotes, setShiftNotes] = useState<Record<string, string>>({})

  const active = bids.find((bid) => bid.id === activeId) ?? null
  const items = bids.filter((bid) =>
    (status === 'all' || bid.state === status) && bid.title.toLowerCase().includes(search.trim().toLowerCase()))

  const update = (patch: (bid: Bid) => Bid) => setBids((list) => list.map((bid) => (bid.id === activeId ? patch(bid) : bid)))
  const nameOf = (request: BidRequest) => request.title ?? leaveTypeLabel(request.type)
  const describe = (request: BidRequest) => `${nameOf(request)}, ${formatSpan(request.start, request.end)}`
  const withNote = (request: BidRequest) => (request.shiftId && shiftNotes[request.shiftId] !== undefined ? { ...request, note: shiftNotes[request.shiftId] || undefined } : request)

  /** Requests in their current order: the draft while changing the ranking of a submitted bid */
  const requests = (rankDraft ?? active?.requests ?? []).map(withNote)
  /** Requests added that are not submitted yet */
  const unsubmitted = isDraft(active) ? active!.requests.length : 0
  /** All at once: the shifts on offer in the open bid */
  const offered: OfferedShift[] = active?.mode === 'all-at-once' ? offeredShiftsFor(active) : []

  const open = (id: string) => {
    setActiveId(id)
    setRankDraft(null)
    setHint(null)
  }
  const go = (target: LeaveTarget) => (target.kind === 'bid' ? open(target.id) : setHint(`${target.tab} are not part of this guide yet.`))
  const reset = (nextMode: BidMode) => {
    setBids(setup(initialBids(nextMode)))
    setActiveId(initialActive)
    setSearch('')
    setStatus('all')
    setRankDraft(null)
    setLeaving(null)
    setShiftNotes({})
    setHint(null)
  }

  return {
    mode, bids, items, active, requests, offered, search, status, dateRange, hint, editingRanks: rankDraft !== null, unsubmitted, leaving,
    setSearch, setStatus, setDateRange, setHint,
    /** Switches the demo between turn-based and all at once, starting over */
    setMode(next: BidMode) {
      setModeState(next)
      reset(next)
    },
    open,
    /** Opens another bid or tab, but asks first when the open bid has unsubmitted requests */
    leave(target: LeaveTarget) {
      if (target.kind === 'bid' && target.id === activeId) return
      if (unsubmitted) setLeaving(target)
      else go(target)
    },
    /** Warning confirmed: discards the unsubmitted requests and goes on */
    confirmLeave() {
      if (!leaving) return
      update((bid) => ({ ...bid, requests: [] }))
      go(leaving)
      setLeaving(null)
      if (leaving.kind === 'bid') setHint(`${plural(unsubmitted, 'request')} discarded.`)
    },
    cancelLeave() {
      setLeaving(null)
    },
    save(request: BidRequest) {
      update((bid) => {
        const exists = bid.requests.some((item) => item.id === request.id)
        return { ...bid, requests: exists ? bid.requests.map((item) => (item.id === request.id ? request : item)) : [...bid.requests, request] }
      })
      setHint(`Saved: ${describe(request)}.`)
    },
    /** All at once: adds a shift on offer as the next choice (to the draft while editing the ranking) */
    select(shift: OfferedShift) {
      const request = requestForShift(shift)
      const count = requests.length + 1
      if (rankDraft) setRankDraft([...rankDraft, request])
      else update((bid) => ({ ...bid, requests: [...bid.requests, request] }))
      setHint(`${shift.title} added as your ${ordinal(count)} choice.`)
    },
    shiftNotes,
    setShiftNote(shiftId: string, note: string) {
      setShiftNotes((notes) => ({ ...notes, [shiftId]: note }))
    },
    remove(id: string) {
      const request = requests.find((item) => item.id === id)
      update((bid) => ({ ...bid, requests: bid.requests.filter((item) => item.id !== id) }))
      setRankDraft((draft) => draft?.filter((item) => item.id !== id) ?? null)
      if (request) setHint(`Removed: ${describe(request)}.`)
    },
    /** Moves a request from one rank to another and says where it went */
    reorder(from: number, to: number) {
      if (to < 0 || to >= requests.length || from === to) return
      const request = requests[from]
      if (rankDraft) setRankDraft(move(rankDraft, from, to))
      else update((bid) => ({ ...bid, requests: move(bid.requests, from, to) }))
      setHint(`${nameOf(request)} moved to rank ${to + 1} of ${requests.length}.`)
    },
    submit() {
      update((bid) => ({ ...bid, state: 'pending', submittedOn: SUBMITTED_ON }))
      setHint(active?.mode === 'all-at-once'
        ? 'Submitted. Until the window closes you can still add shifts, remove them and change the ranking.'
        : 'Submitted. Your selection is locked in; you can still change the ranking.')
    },
    startEditRanks() {
      setRankDraft(active?.requests ?? [])
      setHint('Drag the rows or use the arrows, then save.')
    },
    saveRanks() {
      if (rankDraft) update((bid) => ({ ...bid, requests: rankDraft }))
      setRankDraft(null)
      setHint('Ranking saved.')
    },
    cancelRanks() {
      setRankDraft(null)
      setHint(null)
    },
    /** Demo only: the employee ahead of you finishes bidding */
    advanceQueue() {
      update((bid) => {
        const ahead = Math.max(0, bid.ahead - 1)
        return { ...bid, ahead, state: ahead === 0 ? 'your-turn' : bid.state }
      })
      setHint(active && active.ahead <= 1 ? 'It’s your turn. In the app you get a notification now.' : 'One employee finished bidding.')
    },
    reset() {
      reset(mode)
    },
  }
}

export type VacationBiddingState = ReturnType<typeof useVacationBidding>
