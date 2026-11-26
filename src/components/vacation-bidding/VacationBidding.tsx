import { useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react'
import {
  ActionIcon, Anchor, Badge, Button, Collapse, Group, Modal, Select, Stack, Text, Textarea, TextInput, Tooltip, UnstyledButton,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import {
  ArrowDown, ArrowUp, CalendarDays, ChevronDown, CircleCheck, Clock, GripVertical, Inbox, Plus, Search, Send, SquarePen, StickyNote, Trash2,
} from 'lucide-react'
import RequestStatusBadge from '../../pages/components/RequestStatusBadge'
import { RangePicker } from '../date-picker/DatePickers'
import { PickerMenu } from '../schedule/ScheduleChrome'
import { formatMonthDay, weekdayIndex } from '../schedule/data'
import { bidStates, leaveTypeLabel, leaveTypes, type LeaveTypeKey } from '../../tokens/bidding'
import { calendarDayLabel, formatSpan, requestWeeks, spanDays, type Bid, type BidRequest } from './data'
import type { BidStatusFilter, VacationBiddingState } from './useVacationBidding'
import classes from './VacationBidding.module.css'

const badgeFor = (bid: Bid) => bidStates.find((item) => item.key === bid.state)!.badge
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/* ------------------------------------------------------------------ */
/* Tabs and filters                                                    */
/* ------------------------------------------------------------------ */

const signUpTabs = ['Posts', 'Shift Bids', 'Vacation Bids'] as const

/** Posts, Shift Bids and Vacation Bids. Only Vacation Bids is part of this guide. */
export function SignUpTabs({ onOther }: { onOther: (tab: string) => void }) {
  return (
    <div className={classes.tabs} role="tablist" aria-label="Sign-up type">
      {signUpTabs.map((tab) => {
        const active = tab === 'Vacation Bids'
        return (
          <UnstyledButton key={tab} role="tab" aria-selected={active} data-active={active || undefined} className={classes.tab} onClick={() => !active && onOther(tab)}>
            {tab}
          </UnstyledButton>
        )
      })}
    </div>
  )
}

const longDate = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
const formatLong = (day: number) => longDate.format(new Date(day * 86_400_000))

const statusOptions: { key: BidStatusFilter; label: string }[] = [
  { key: 'all', label: 'All Statuses' }, { key: 'your-turn', label: 'Your Turn' }, { key: 'pending', label: 'Pending' }, { key: 'queued', label: 'Queued' },
]

/** Search, date range, round and status. Search and status filter the demo; the others are preview only. */
export function BidFilters({ state }: { state: VacationBiddingState }) {
  const [round, setRound] = useState('live')
  return (
    <>
      <TextInput
        value={state.search}
        onChange={(event) => state.setSearch(event.currentTarget.value)}
        placeholder="Search bids…"
        aria-label="Search bids"
        leftSection={<Search size={16} aria-hidden="true" />}
        w={240}
      />
      <RangePicker
        value={state.dateRange}
        onChange={(value) => { state.setDateRange(value); state.setHint('The date range is not filtered in this demo.') }}
        target={
          <Button variant="default" fw={400} leftSection={<CalendarDays size={18} aria-hidden="true" />} aria-label={`Date range: ${formatLong(state.dateRange[0])} – ${formatLong(state.dateRange[1])}. Pick a start and end day`}>
            <span className="tabular">{formatLong(state.dateRange[0])} – {formatLong(state.dateRange[1])}</span>
          </Button>
        }
      />
      <PickerMenu label="Bid round" value={round} onChange={(value) => { setRound(value); state.setHint('Upcoming and closed bids are not part of this demo.') }}
        options={[{ key: 'live', label: 'Live' }, { key: 'upcoming', label: 'Upcoming' }, { key: 'closed', label: 'Closed' }]} />
      <PickerMenu label="Status" value={state.status} onChange={state.setStatus} options={statusOptions} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Bid list                                                            */
/* ------------------------------------------------------------------ */

export const LiveBadge = () => <Badge variant="dot" color="intime" size="md" className={classes.live}>Live</Badge>

/** One bid in the list: title, period, time left and how many requests you picked. */
export function BidListItem({ bid, active, onOpen }: { bid: Bid; active?: boolean; onOpen: (id: string) => void }) {
  const picked = bid.requests.length
  return (
    <UnstyledButton className={classes.bidItem} data-active={active || undefined} aria-current={active ? 'true' : undefined} onClick={() => onOpen(bid.id)}>
      <Stack gap={6} className={classes.bidMain}>
        <Text fw={600} className={classes.bidTitle}>{bid.title}</Text>
        <Stack gap={2}>
          <Text size="sm" className="tabular">{formatSpan(...bid.period)}</Text>
          <Text size="sm" className={`${classes.remaining} tabular`}>{bid.remaining} remaining</Text>
        </Stack>
        {picked > 0 && bid.state !== 'queued' && (
          <Group gap={6} wrap="nowrap" className={classes.picked}>
            <CircleCheck size={16} strokeWidth={1.75} aria-hidden="true" />
            <Text size="sm" className="tabular">{bid.state === 'pending' ? 'Signed up for' : 'Selected'}: {picked}</Text>
          </Group>
        )}
      </Stack>
      <Stack gap={8} align="flex-end" className={classes.bidSide}>
        <LiveBadge />
        <RequestStatusBadge stateKey={badgeFor(bid)} size="sm" />
      </Stack>
    </UnstyledButton>
  )
}

export function BidList({ state }: { state: VacationBiddingState }) {
  const label = statusOptions.find((option) => option.key === state.status)!.label
  return (
    <nav className={classes.listPane} aria-label="Vacation bids">
      <Text size="sm" fw={600} c="dimmed" tt="uppercase" lts="0.06em" className={classes.eyebrow}>{label}</Text>
      {state.items.length ? (
        <Stack gap={6}>
          {state.items.map((bid) => <BidListItem key={bid.id} bid={bid} active={bid.id === state.active?.id} onOpen={state.open} />)}
        </Stack>
      ) : (
        <Stack align="center" gap={6} py={48} ta="center">
          <Inbox size={28} strokeWidth={1.5} aria-hidden="true" className={classes.dimIcon} />
          <Text fw={600}>No bids</Text>
          <Text size="sm" c="dimmed">Nothing matches the search and filters.</Text>
        </Stack>
      )}
    </nav>
  )
}

/* ------------------------------------------------------------------ */
/* Requests                                                            */
/* ------------------------------------------------------------------ */

/** The rank number in a tinted square. */
export function RankBadge({ rank, label }: { rank: number; label?: string }) {
  return <span className={`${classes.rank} tabular`} aria-label={label}>{rank}</span>
}

const weekdayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/** The weeks around a request, with the requested days marked. Dashed, because they are not approved yet. */
export function RequestCalendar({ request }: { request: Pick<BidRequest, 'start' | 'end'> }) {
  const weeks = requestWeeks(request)
  return (
    <div className={classes.calendar} role="img" aria-label={`Requested days: ${formatSpan(request.start, request.end)}, ${plural(spanDays(request), 'day')}`}>
      <div className={classes.calHead} aria-hidden="true">
        {weekdayNames.map((name) => <span key={name}><span className={classes.calLong}>{name}</span><span className={classes.calShort}>{name.slice(0, 3)}</span></span>)}
      </div>
      {weeks.map((week, row) => {
        const from = Math.max(request.start, week[0])
        const to = Math.min(request.end, week[6])
        return (
          <div key={week[0]} className={classes.calWeek} aria-hidden="true">
            {week.map((day, index) => (
              <span key={day} className={`${classes.calDay} tabular`} style={{ gridColumn: index + 1 }}>
                {calendarDayLabel(day, row === 0 && index === 0)}
              </span>
            ))}
            <span className={classes.calBar} style={{ gridColumn: `${weekdayIndex(from) + 1} / ${weekdayIndex(to) + 2}` }}>Leave</span>
          </div>
        )
      })}
    </div>
  )
}

/** Up, down, edit, delete and open. While locked (submitted) only delete and open show. */
function RowActions({ name, rank, count, editable, ranking, expanded, deleteDisabled, onMove, onEdit, onDelete, onToggle }: {
  name: string
  rank: number
  count: number
  editable: boolean
  ranking: boolean
  expanded: boolean
  deleteDisabled?: string
  onMove: (to: number) => void
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}) {
  return (
    <Group gap={8} wrap="nowrap" className={classes.rowActions}>
      {ranking && (
        <>
          <Tooltip label="Move up"><ActionIcon variant="default" size={36} aria-label={`Move ${name} up`} disabled={rank === 1} onClick={() => onMove(rank - 2)}><ArrowUp size={18} /></ActionIcon></Tooltip>
          <Tooltip label="Move down"><ActionIcon variant="default" size={36} aria-label={`Move ${name} down`} disabled={rank === count} onClick={() => onMove(rank)}><ArrowDown size={18} /></ActionIcon></Tooltip>
        </>
      )}
      {editable && <Tooltip label="Edit"><ActionIcon variant="default" size={36} aria-label={`Edit ${name}`} onClick={onEdit}><SquarePen size={18} /></ActionIcon></Tooltip>}
      <Tooltip label={deleteDisabled ?? 'Delete'}>
        <ActionIcon variant="default" size={36} aria-label={`Delete ${name}`} disabled={!!deleteDisabled} onClick={onDelete}><Trash2 size={18} /></ActionIcon>
      </Tooltip>
      <Tooltip label={expanded ? 'Hide details' : 'Show details'}>
        <ActionIcon variant="subtle" color="gray" size={36} aria-label={`${expanded ? 'Hide' : 'Show'} details for ${name}`} aria-expanded={expanded} onClick={onToggle}>
          <ChevronDown size={20} className={classes.chevron} data-open={expanded || undefined} />
        </ActionIcon>
      </Tooltip>
    </Group>
  )
}

/**
 * The ranked requests. `ranking` adds drag handles and arrows (your turn, or Edit on a submitted bid);
 * `editable` adds the pencil and note Edit link (your turn only).
 */
export function RequestList({ state, ranking, editable, onEdit, onDelete }: {
  state: VacationBiddingState
  ranking: boolean
  editable: boolean
  onEdit: (request: BidRequest) => void
  onDelete: (request: BidRequest) => void
}) {
  const [expanded, setExpanded] = useState<string[]>([])
  const [armed, setArmed] = useState<string | null>(null)
  const [drag, setDrag] = useState<{ from: number; over: number } | null>(null)
  const requests = state.requests
  const locked = state.active?.state === 'pending'
  const toggle = (id: string) => setExpanded((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]))

  const onHandleKey = (event: KeyboardEvent, index: number) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      state.reorder(index, index + (event.key === 'ArrowUp' ? -1 : 1))
    }
  }
  const dragProps = (index: number, id: string) => ranking ? {
    draggable: armed === id,
    onDragStart: (event: DragEvent) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', id); setDrag({ from: index, over: index }) },
    onDragOver: (event: DragEvent) => { if (!drag) return; event.preventDefault(); if (drag.over !== index) setDrag({ ...drag, over: index }) },
    onDrop: (event: DragEvent) => { event.preventDefault(); if (drag) state.reorder(drag.from, drag.over) },
    onDragEnd: () => { setDrag(null); setArmed(null) },
  } : {}

  return (
    <div className={classes.requests}>
      <div className={classes.columns} aria-hidden="true">
        <span />
        <span>Ranking</span>
        <span>Shift</span>
      </div>
      <ol className={classes.rows} aria-label="Your requests, in ranked order">
        {requests.map((request, index) => {
          const name = leaveTypeLabel(request.type)
          const open = expanded.includes(request.id)
          return (
            <li
              key={request.id}
              className={classes.row}
              data-dragging={drag?.from === index || undefined}
              data-drop={drag && drag.over === index && drag.from !== index ? (drag.from < index ? 'below' : 'above') : undefined}
              {...dragProps(index, request.id)}
            >
              <div className={classes.rowMain}>
                {ranking ? (
                  <Tooltip label="Drag, or use the arrow keys" openDelay={400}>
                    <button
                      type="button"
                      className={classes.handle}
                      aria-label={`Reorder ${name}, rank ${index + 1} of ${requests.length}. Use the up and down arrow keys`}
                      aria-keyshortcuts="ArrowUp ArrowDown"
                      onPointerDown={() => setArmed(request.id)}
                      onPointerUp={() => setArmed(null)}
                      onKeyDown={(event) => onHandleKey(event, index)}
                    >
                      <GripVertical size={18} aria-hidden="true" />
                    </button>
                  </Tooltip>
                ) : <span />}
                <RankBadge rank={index + 1} label={`Rank ${index + 1}`} />
                <div className={classes.shift}>
                  <Text fw={600}>{name}</Text>
                  {request.note && (
                    <Tooltip label="Has a note"><span className={classes.noteIcon} role="img" aria-label="Has a note"><StickyNote size={18} strokeWidth={1.75} /></span></Tooltip>
                  )}
                  <Text className="tabular">{formatSpan(request.start, request.end)}</Text>
                </div>
                <RowActions
                  name={name}
                  rank={index + 1}
                  count={requests.length}
                  editable={editable}
                  ranking={ranking}
                  expanded={open}
                  deleteDisabled={locked && requests.length === 1 ? 'A submitted bid needs at least one request' : undefined}
                  onMove={(to) => state.reorder(index, to)}
                  onEdit={() => onEdit(request)}
                  onDelete={() => onDelete(request)}
                  onToggle={() => toggle(request.id)}
                />
              </div>
              <Collapse expanded={open} transitionDuration={220} transitionTimingFunction="cubic-bezier(0.2, 0, 0, 1)">
                <div className={classes.rowDetails}>
                  {request.note ? (
                    <Group gap={10} wrap="nowrap" align="flex-start">
                      <StickyNote size={18} strokeWidth={1.75} aria-hidden="true" className={classes.dimIcon} />
                      <Text fs="italic">“{request.note}”{editable && <> <Anchor component="button" type="button" onClick={() => onEdit(request)} className={classes.inlineLink}>Edit</Anchor></>}</Text>
                    </Group>
                  ) : editable && (
                    <Button variant="subtle" size="compact-sm" leftSection={<Plus size={16} />} onClick={() => onEdit(request)} className={classes.addNote}>Add note</Button>
                  )}
                  <RequestCalendar request={request} />
                </div>
              </Collapse>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Add or edit a request                                               */
/* ------------------------------------------------------------------ */

const toIso = (day: number) => new Date(day * 86_400_000).toISOString().slice(0, 10)
const fromIso = (value: string) => Date.parse(`${value.slice(0, 10)}T00:00:00Z`) / 86_400_000
let requestCount = 0
const newRequestId = () => `request-${++requestCount}`

function RequestForm({ bid, request, onClose, onSave }: { bid: Bid; request?: BidRequest; onClose: () => void; onSave: (request: BidRequest) => void }) {
  const [type, setType] = useState<LeaveTypeKey>(request?.type ?? 'vacation')
  const [dates, setDates] = useState<[string | null, string | null]>(request ? [toIso(request.start), toIso(request.end)] : [null, null])
  const [note, setNote] = useState(request?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const span = dates[0] ? { start: fromIso(dates[0]), end: fromIso(dates[1] ?? dates[0]) } : null

  const submit = () => {
    if (!span) { setError('Pick the days you want off.'); return }
    onSave({ id: request?.id ?? newRequestId(), type, ...span, note: note.trim() || undefined })
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); submit() }}>
      <Stack gap="lg">
        <Select
          label="Leave type"
          withAsterisk
          data={leaveTypes.map((item) => ({ value: item.key, label: item.label }))}
          value={type}
          onChange={(value) => value && setType(value as LeaveTypeKey)}
          allowDeselect={false}
          data-autofocus
        />
        <DatePickerInput
          type="range"
          label="Days"
          withAsterisk
          placeholder="Pick the first and last day"
          description={`Within the bid: ${formatSpan(...bid.period)}. Click one day twice for a single day.`}
          value={dates}
          onChange={(value) => { setDates(value); setError(null) }}
          minDate={toIso(bid.period[0])}
          maxDate={toIso(bid.period[1])}
          defaultDate={toIso(request?.start ?? bid.period[0])}
          allowSingleDateInRange
          numberOfColumns={2}
          valueFormat="MMM D, YYYY"
          leftSection={<CalendarDays size={18} aria-hidden="true" />}
          error={error}
          popoverProps={{ withinPortal: true }}
        />
        {span && <Text size="sm" c="dimmed" mt={-8} className="tabular">{plural(span.end - span.start + 1, 'day')}: {formatSpan(span.start, span.end)}</Text>}
        <Textarea label="Note" description="Optional. Schedulers see it with your request." autosize minRows={2} maxLength={300} value={note} onChange={(event) => setNote(event.currentTarget.value)} placeholder="Anything the scheduler should know" />
      </Stack>
      <Group justify="flex-end" gap="sm" mt="xl">
        <Button variant="default" onClick={onClose}>Cancel</Button>
        <Button type="submit">{request ? 'Save' : 'Add request'}</Button>
      </Group>
    </form>
  )
}

export function RequestFormModal({ opened, bid, request, onClose, onSave }: {
  opened: boolean
  bid: Bid
  request?: BidRequest
  onClose: () => void
  onSave: (request: BidRequest) => void
}) {
  return (
    <Modal opened={opened} onClose={onClose} centered size={480} title={request ? 'Edit request' : 'Add request'} classNames={{ title: classes.modalTitle }}>
      <RequestForm key={`${request?.id ?? 'new'}-${String(opened)}`} bid={bid} request={request} onClose={onClose} onSave={(saved) => { onSave(saved); onClose() }} />
    </Modal>
  )
}

/** Asks before removing a request from a submitted bid: it can't be added back. */
export function RemoveRequestModal({ request, onClose, onConfirm }: { request: BidRequest | null; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal opened={!!request} onClose={onClose} centered size={440} title="Remove request?" classNames={{ title: classes.modalTitle }}>
      {request && (
        <Text size="sm">
          {leaveTypeLabel(request.type)}, {formatSpan(request.start, request.end)} is removed from your bid. While the bid is pending you can’t add requests, so you can’t get it back.
        </Text>
      )}
      <Group justify="flex-end" gap="sm" mt="xl">
        <Button variant="default" onClick={onClose} data-autofocus>Cancel</Button>
        <Button color="red" onClick={onConfirm}>Remove</Button>
      </Group>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Open bid                                                            */
/* ------------------------------------------------------------------ */

function BidHeader({ bid }: { bid: Bid }) {
  return (
    <div className={classes.detailHead}>
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="md">
        <h4 className={classes.detailTitle}>{bid.title}</h4>
        <RequestStatusBadge stateKey={badgeFor(bid)} />
      </Group>
      <Group gap={6} justify="flex-end" wrap="nowrap" className={classes.period}>
        <Text className="tabular">{formatSpan(...bid.period)}</Text>
        <Text c="dimmed" aria-hidden="true">·</Text>
        <Group gap={6} wrap="nowrap" className={classes.remaining}>
          <Clock size={18} strokeWidth={1.75} aria-hidden="true" />
          <Text className="tabular" inherit>{bid.remaining} remaining</Text>
        </Group>
      </Group>
    </div>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={classes.card} aria-label={title}>
      <Text size="xl" fw={500} className={classes.cardTitle}>{title}</Text>
      {children}
    </section>
  )
}

/** Title, status, the card for your place in the bid, and the bar at the bottom. */
export function BidDetail({ state }: { state: VacationBiddingState }) {
  const [form, setForm] = useState<{ opened: boolean; request?: BidRequest }>({ opened: false })
  const [removing, setRemoving] = useState<BidRequest | null>(null)
  const bid = state.active
  if (!bid) {
    return (
      <div className={classes.detailPane}>
        <Stack align="center" justify="center" gap={6} h="100%" ta="center" p="xl">
          <Text fw={600}>No bid open</Text>
          <Text size="sm" c="dimmed">Pick a bid on the left.</Text>
        </Stack>
      </div>
    )
  }

  const count = bid.requests.length
  const yourTurn = bid.state === 'your-turn'
  const pending = bid.state === 'pending'
  const ranking = yourTurn || state.editingRanks
  const teamBids = (
    <Button variant="subtle" color="intime" fw={600} className={classes.teamBids} rightSection={<CalendarDays size={18} aria-hidden="true" />} onClick={() => state.setHint('View Team Bids shows everyone’s requests on a calendar. Not part of this demo yet.')}>
      View Team Bids
    </Button>
  )
  const remove = (request: BidRequest) => (pending ? setRemoving(request) : state.remove(request.id))

  return (
    <div className={classes.detailPane}>
      <div className={classes.detailScroll}>
        <BidHeader bid={bid} />
        <Card title="Turn-Based Bid Submission">
          {bid.state === 'queued' && (
            <Text className={classes.lead}>
              You are currently in the queue. There {bid.ahead === 1 ? 'is' : 'are'} <RankBadge rank={bid.ahead} /> {bid.ahead === 1 ? 'employee' : 'employees'} ahead of you.<br />
              You will be notified once it is your turn.
            </Text>
          )}
          {yourTurn && (
            <>
              <Text className={classes.lead}>
                Add your leave requests, set their priority, and click <strong>Submit</strong> once you’re ready. You can make changes for as long as your requests are pending.
              </Text>
              <Group justify="flex-end" gap="lg" mt="lg">
                {teamBids}
                <Button variant={count ? 'default' : 'filled'} leftSection={<Plus size={18} aria-hidden="true" />} onClick={() => setForm({ opened: true })}>Add Request</Button>
              </Group>
            </>
          )}
          {pending && (
            <>
              <Text className={classes.lead}>
                Your selection is locked in. You picked <RankBadge rank={count} /> {count === 1 ? 'shift' : 'shifts'} in ranked order.<br />
                While the bid is pending, you can change the ranking, but you can’t add new requests.
              </Text>
              <Group justify="flex-end" mt="lg">{teamBids}</Group>
            </>
          )}
          {bid.state !== 'queued' && (count ? (
            <>
              <RequestList state={state} ranking={ranking} editable={yourTurn} onEdit={(request) => setForm({ opened: true, request })} onDelete={remove} />
              {ranking && count > 1 && <Text size="sm" className={classes.tip}>Tip: Drag and drop, or use the arrow buttons, to set your preferred priority.</Text>}
            </>
          ) : (
            <div className={classes.empty}>
              <Text c="dimmed">No requests yet.</Text>
              <Text c="dimmed">Click “+ Add Request” to get started.</Text>
            </div>
          ))}
        </Card>
      </div>
      {yourTurn && (
        <div className={classes.footer}>
          <Tooltip label="Add a request first" disabled={count > 0}>
            <Button
              data-disabled={!count || undefined}
              aria-disabled={!count || undefined}
              onClick={(event) => (count ? state.submit() : event.preventDefault())}
            >
              Submit
            </Button>
          </Tooltip>
        </div>
      )}
      {pending && (
        <div className={classes.footer}>
          {state.editingRanks ? (
            <>
              <Button variant="default" onClick={state.cancelRanks}>Cancel</Button>
              <Button onClick={state.saveRanks}>Save ranking</Button>
            </>
          ) : (
            <>
              {bid.submittedOn !== undefined && (
                <Group gap={8} wrap="nowrap" className={classes.submitted}>
                  <Send size={18} strokeWidth={1.75} aria-hidden="true" />
                  <Text className="tabular" inherit>Submitted on: {formatMonthDay(bid.submittedOn)}, {new Date(bid.submittedOn * 86_400_000).getUTCFullYear()}</Text>
                </Group>
              )}
              <Button variant="default" onClick={state.startEditRanks}>Edit</Button>
            </>
          )}
        </div>
      )}
      <RequestFormModal opened={form.opened} bid={bid} request={form.request} onClose={() => setForm((value) => ({ ...value, opened: false }))} onSave={state.save} />
      <RemoveRequestModal request={removing} onClose={() => setRemoving(null)} onConfirm={() => { if (removing) state.remove(removing.id); setRemoving(null) }} />
    </div>
  )
}

/** Desktop body below the filters: the bid list on the left, the open bid on the right. */
export default function VacationBiddingWorkspace({ state }: { state: VacationBiddingState }) {
  return (
    <div className={classes.workspace}>
      <BidList state={state} />
      <BidDetail state={state} />
    </div>
  )
}
