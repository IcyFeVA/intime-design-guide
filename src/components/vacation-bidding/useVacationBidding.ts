import { useState } from 'react'
import type { BidState } from '../../tokens/bidding'
import { leaveTypeLabel } from '../../tokens/bidding'
import { dayOf } from '../schedule/data'
import { SUBMITTED_ON, formatSpan, initialBids, move, type Bid, type BidRequest } from './data'

export type BidStatusFilter = 'all' | BidState

export interface VacationBiddingOptions {
  /** Changes the starting bids, e.g. to open the demo with ranked requests or a submitted bid */
  setup?: (bids: Bid[]) => Bid[]
  /** The bid that is open at first */
  activeId?: string
}

/** State for the vacation bidding demo: the bids, the open one, filters and every action on requests. */
export function useVacationBidding({ setup = (bids) => bids, activeId: initialActive = 'summer' }: VacationBiddingOptions = {}) {
  const [bids, setBids] = useState<Bid[]>(() => setup(initialBids()))
  const [activeId, setActiveId] = useState(initialActive)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<BidStatusFilter>('all')
  const [dateRange, setDateRange] = useState<[number, number]>([dayOf(2026, 3, 1), dayOf(2027, 3, 18)])
  const [hint, setHint] = useState<string | null>(null)
  /** Ranking being changed on a submitted bid; null when not editing */
  const [rankDraft, setRankDraft] = useState<BidRequest[] | null>(null)

  const active = bids.find((bid) => bid.id === activeId) ?? null
  const items = bids.filter((bid) =>
    (status === 'all' || bid.state === status) && bid.title.toLowerCase().includes(search.trim().toLowerCase()))

  const update = (patch: (bid: Bid) => Bid) => setBids((list) => list.map((bid) => (bid.id === activeId ? patch(bid) : bid)))
  const describe = (request: BidRequest) => `${leaveTypeLabel(request.type)}, ${formatSpan(request.start, request.end)}`

  /** Requests in their current order: the draft while changing the ranking of a submitted bid */
  const requests = rankDraft ?? active?.requests ?? []

  return {
    bids, items, active, requests, search, status, dateRange, hint, editingRanks: rankDraft !== null,
    setSearch, setStatus, setDateRange, setHint,
    open(id: string) {
      setActiveId(id)
      setRankDraft(null)
      setHint(null)
    },
    save(request: BidRequest) {
      update((bid) => {
        const exists = bid.requests.some((item) => item.id === request.id)
        return { ...bid, requests: exists ? bid.requests.map((item) => (item.id === request.id ? request : item)) : [...bid.requests, request] }
      })
      setHint(`Saved: ${describe(request)}.`)
    },
    remove(id: string) {
      const request = active?.requests.find((item) => item.id === id)
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
      setHint(`${leaveTypeLabel(request.type)} moved to rank ${to + 1} of ${requests.length}.`)
    },
    submit() {
      update((bid) => ({ ...bid, state: 'pending', submittedOn: SUBMITTED_ON }))
      setHint('Submitted. Your selection is locked in; you can still change the ranking.')
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
      setBids(setup(initialBids()))
      setActiveId(initialActive)
      setSearch('')
      setStatus('all')
      setRankDraft(null)
      setHint(null)
    },
  }
}

export type VacationBiddingState = ReturnType<typeof useVacationBidding>
