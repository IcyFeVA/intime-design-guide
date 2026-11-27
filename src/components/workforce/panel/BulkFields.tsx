import { useRef, useState } from 'react'
import { ActionIcon, Button, SimpleGrid, Text, Tooltip } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { Plus, X } from 'lucide-react'
import { formatHour } from '../../schedule/data'
import type { SegmentDetails, TimeBank } from '../data'
import { activities, bankAvailable, workingCodeOptions } from './options'
import { applyTimes, commonValue, type BulkSegment, type SegmentChange } from './bulk'
import { endValue, fromIso, longSpanWarning, normalizeEnd, parseTime, timeValue, toIso } from './format'
import { SegmentFields, type MixedField } from './SegmentFields'
import { TimeField } from './TimeField'
import { Hours } from './TimesCard'
import classes from '../WorkforcePanel.module.css'

type Times = { start?: number; end?: number }

const fieldLabels: Partial<Record<keyof SegmentDetails, string>> = {
  activity: 'Activity', location: 'Location', customer: 'Customer', modifier: 'Hours modifier', unit: 'Unit', acting: 'Rank (acting)',
}

/**
 * "Change fields" in the bulk panel: the single-cell form (times, shift code and the other fields) for every selected
 * working segment at once. A field shows the shared value, or "Mixed" when the cells differ; changing it saves it on all.
 */
export function BulkFields({ segments, onTimes, onMoveDay, onChange }: {
  segments: BulkSegment[]
  /** New scheduled times (start, end or both) for every selected assignment */
  onTimes: (times: Times) => void
  /** Moves every selected assignment to this day */
  onMoveDay: (day: number) => void
  /** Saves a change to every segment; `what` says what it did ("Activity set to Court") */
  onChange: (change: SegmentChange, what: string) => void
}) {
  if (!segments.length) return <Text size="sm" c="dimmed">The selected cells hold no assignments to change.</Text>

  const details = segments.map((segment) => segment.details)
  const mixed = new Set<MixedField>()
  const shared = <K extends keyof SegmentDetails>(key: K & MixedField) => {
    const value = commonValue(details.map((item) => item[key]))
    if (value === null && details.some((item) => item[key] !== details[0][key])) mixed.add(key)
    return value ?? details[0][key]
  }
  const code = commonValue(segments.map((segment) => segment.code))
  if (code === null) mixed.add('code')
  const banks = details.map((item) => item.bank)
  const allBanked = banks.every(Boolean)
  if (!allBanked && banks.some(Boolean)) mixed.add('bank')
  const bankType = allBanked ? commonValue(banks.map((bank) => bank!.bank)) : null
  const bankAmount = allBanked ? commonValue(banks.map((bank) => bank!.amount)) : null
  if (allBanked && bankType === null) mixed.add('bankType')
  if (allBanked && bankAmount === null) mixed.add('bankAmount')

  const shown: SegmentDetails = {
    ...details[0],
    activity: shared('activity'),
    location: shared('location'),
    customer: shared('customer'),
    modifier: shared('modifier'),
    unit: shared('unit'),
    acting: shared('acting'),
  }

  const setDetails = (patch: Partial<SegmentDetails>) => {
    if ('bank' in patch) return setBank(patch.bank ?? null)
    const [key, value] = Object.entries(patch)[0] as [keyof SegmentDetails, string | null]
    onChange(
      ({ details: own }) => (own[key] === value ? null : { details: { ...own, [key]: value } }),
      `${fieldLabels[key] ?? key} set to ${value ?? 'none'} on`,
    )
  }

  /** Bank this time: on gives the cells without a bank one (as for one cell), off clears all. Type and amount keep each cell's other value. */
  const setBank = (bank: SegmentDetails['bank']) => {
    if (!bank) return onChange(({ details: own }) => (own.bank ? { details: { ...own, bank: null } } : null), 'Bank this time turned off on')
    if (!allBanked) {
      return onChange(({ details: own, start, end }) => (own.bank ? null : {
        details: { ...own, bank: { bank: 'Overtime', amount: Math.min(end - start, bankAvailable.Overtime) } },
      }), 'Bank this time turned on for')
    }
    if (bank.bank !== bankType) {
      const type: TimeBank = bank.bank
      return onChange(({ details: own }) => (own.bank?.bank === type ? null : {
        details: { ...own, bank: { bank: type, amount: Math.min(own.bank?.amount ?? 0, bankAvailable[type]) } },
      }), `Time bank set to ${type} on`)
    }
    onChange(({ details: own }) => {
      const amount = Math.min(bank.amount, bankAvailable[own.bank!.bank])
      return own.bank!.amount === amount ? null : { details: { ...own, bank: { ...own.bank!, amount } } }
    }, `Bank amount set to ${bank.amount}h on`)
  }

  const timesKey = segments.map((segment) => `${segment.start}-${segment.end}`).join()
  const actualKey = segments.map((segment) => (segment.details.actual ? `${segment.details.actual.start}-${segment.details.actual.end}` : '')).join()

  return (
    <>
      <BulkTimesCard
        key={`${timesKey}|${actualKey}`}
        segments={segments}
        onTimes={onTimes}
        onMoveDay={onMoveDay}
        onActual={(change, what) => onChange(change, what)}
      />
      <SegmentFields
        code={code ?? segments[0].code}
        onCode={(next) => onChange((segment) => (segment.code === next ? null : { code: next }), `Shift code set to ${next} on`)}
        details={{ ...shown, bank: allBanked ? { bank: bankType ?? banks[0]!.bank, amount: bankAmount ?? banks[0]!.amount } : banks.find(Boolean) ?? null }}
        scheduled={segments[0]}
        onChange={setDetails}
        mixed={mixed}
        codeData={workingCodeOptions}
        activityData={activities.filter((activity) => activity !== 'Leave')}
      />
    </>
  )
}

/** The value a time field starts on: the shared time, or empty ("Mixed") */
const sharedTime = (values: number[], end = false, start: number | null = null) => {
  const value = commonValue(values)
  if (value === null) return ''
  return end && start !== null ? endValue(start, value) : timeValue(value)
}

/** What the user typed in a start/end pair that started on `initial`: the fields they changed, or an error */
function typedTimes(typed: { start: string; end: string }, initial: { start: string; end: string }): Times | string {
  const times: Times = {}
  for (const key of ['start', 'end'] as const) {
    if (typed[key] === initial[key] || (!typed[key] && !initial[key])) continue
    const hours = parseTime(typed[key])
    if (hours === null) return 'Type times like 0800, 830 or 17:30'
    times[key] = hours
  }
  if (times.start !== undefined && times.end !== undefined && times.start === times.end) return `Starts and ends at ${formatHour(times.start)}`
  return times
}

/**
 * The times card for several cells: the scheduled date (picking one moves them all there), start and end, and actual times. A time the cells
 * share shows; others are empty ("Mixed"). Typing only a start keeps each cell's own end, and the other way round.
 */
function BulkTimesCard({ segments, onTimes, onMoveDay, onActual }: {
  segments: BulkSegment[]
  onTimes: (times: Times) => void
  onMoveDay: (day: number) => void
  onActual: (change: SegmentChange, what: string) => void
}) {
  const day = commonValue(segments.map((segment) => segment.day))
  const sharedStart = commonValue(segments.map((segment) => segment.start))
  const initial = { start: sharedTime(segments.map((segment) => segment.start)), end: sharedTime(segments.map((segment) => segment.end), true, sharedStart) }
  const [start, setStart] = useState(initial.start)
  const [end, setEnd] = useState(initial.end)
  const [error, setError] = useState<string | null>(null)

  const from = parseTime(start)
  const to = parseTime(end)
  const draft = from !== null && to !== null && from !== to ? { start: from, end: normalizeEnd(from, to) } : null
  const warning = draft && longSpanWarning(draft.start, draft.end)

  // The date picker's calendar takes focus; saving times then would remount this card and close it
  const pickingDate = useRef(false)
  const commit = () => {
    if (pickingDate.current) return
    const times = typedTimes({ start, end }, initial)
    if (typeof times === 'string') return setError(times)
    setError(null)
    if (times.start !== undefined || times.end !== undefined) onTimes(times)
  }

  const actuals = segments.map((segment) => segment.details.actual)
  const allActual = actuals.every(Boolean)

  return (
    <div className={classes.times}>
      <SimpleGrid
        cols={4}
        spacing={8}
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) commit() }}
        onKeyDown={(event) => { if (event.key === 'Enter' && (event.target as HTMLElement).tagName === 'INPUT') commit() }}
      >
        <DatePickerInput
          label="Scheduled"
          value={day === null ? null : toIso(day)}
          onChange={(value) => { if (value && (day === null || fromIso(value) !== day)) onMoveDay(fromIso(value)) }}
          placeholder="Mixed"
          valueFormat="MMM D"
          size="sm"
          popoverProps={{ onOpen: () => { pickingDate.current = true }, onClose: () => { pickingDate.current = false } }}
        />
        <TimeField label="Start" value={start} onChange={setStart} error={!!error} placeholder={initial.start ? undefined : 'Mixed'} />
        <TimeField label="End" value={end} onChange={setEnd} error={!!error} placeholder={initial.end ? undefined : 'Mixed'} />
        <div className={classes.hoursValue}><Hours span={draft} /></div>
      </SimpleGrid>
      {error && <Text size="xs" mt={6} c="var(--text-error-default)" role="alert">{error}. Not saved.</Text>}
      {!error && warning && <Text size="xs" mt={6} c="var(--text-warning-default)">{warning}</Text>}
      {allActual
        ? <BulkActualTimes segments={segments} onActual={onActual} />
        : (
          <Button
            variant="subtle"
            size="xs"
            mt={6}
            leftSection={<Plus size={14} aria-hidden="true" />}
            className={classes.linkButton}
            onClick={() => onActual(({ details, start: own, end: ownEnd }) => (details.actual ? null : { details: { ...details, actual: { start: own, end: ownEnd } } }), 'Actual times set on')}
          >
            Set actual
          </Button>
        )}
    </div>
  )
}

/** Actual times of several cells: shared values or "Mixed". Picking a date sets it on all (and saves typed times). */
function BulkActualTimes({ segments, onActual }: { segments: BulkSegment[]; onActual: (change: SegmentChange, what: string) => void }) {
  const actuals = segments.map((segment) => segment.details.actual!)
  const day = commonValue(segments.map((segment, index) => actuals[index].day ?? segment.day))
  const sharedStart = commonValue(actuals.map((actual) => actual.start))
  const initial = { start: sharedTime(actuals.map((actual) => actual.start)), end: sharedTime(actuals.map((actual) => actual.end), true, sharedStart) }
  const [start, setStart] = useState(initial.start)
  const [end, setEnd] = useState(initial.end)
  const from = parseTime(start)
  const to = parseTime(end)
  const draft = from !== null && to !== null && from !== to ? { start: from, end: normalizeEnd(from, to) } : null

  const pickingDate = useRef(false)
  /** Typed times, if any, and a new actual date, if given, on every cell */
  const save = (date?: number) => {
    const typed = typedTimes({ start, end }, initial)
    const times = typeof typed === 'string' ? {} : typed
    if (times.start === undefined && times.end === undefined && date === undefined) return
    onActual(({ details, day: scheduled }) => {
      const actual = details.actual!
      const span = applyTimes(actual, times) ?? actual
      const { day: ownDay, ...rest } = { ...actual, ...span }
      const nextDay = date === undefined ? ownDay : date === scheduled ? undefined : date
      const next = { ...rest, ...(nextDay === undefined ? {} : { day: nextDay }) }
      return next.start === actual.start && next.end === actual.end && next.day === actual.day ? null : { details: { ...details, actual: next } }
    }, date === undefined ? 'Actual times set on' : 'Actual date set on')
  }
  const commit = () => { if (!pickingDate.current) save() }

  return (
    <SimpleGrid
      cols={4}
      spacing={8}
      mt={10}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) commit() }}
      onKeyDown={(event) => { if (event.key === 'Enter' && (event.target as HTMLElement).tagName === 'INPUT') commit() }}
    >
      <DatePickerInput
        label="Actual"
        aria-label="Actual date"
        value={day === null ? null : toIso(day)}
        onChange={(value) => { if (value) save(fromIso(value)) }}
        placeholder="Mixed"
        valueFormat="MMM D"
        size="sm"
        popoverProps={{ onOpen: () => { pickingDate.current = true }, onClose: () => { pickingDate.current = false } }}
      />
      <TimeField label="Start" aria-label="Actual start" value={start} onChange={setStart} placeholder={initial.start ? undefined : 'Mixed'} />
      <TimeField label="End" aria-label="Actual end" value={end} onChange={setEnd} placeholder={initial.end ? undefined : 'Mixed'} />
      <div className={classes.hoursValue}>
        <Hours span={draft} />
        <Tooltip label="Remove actual times">
          <ActionIcon
            variant="subtle"
            color="gray"
            size={28}
            aria-label="Remove actual times"
            onClick={() => onActual(({ details }) => (details.actual ? { details: { ...details, actual: null } } : null), 'Actual times removed from')}
          >
            <X size={16} />
          </ActionIcon>
        </Tooltip>
      </div>
    </SimpleGrid>
  )
}
