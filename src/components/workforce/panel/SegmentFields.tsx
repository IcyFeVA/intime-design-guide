import { useState } from 'react'
import { ActionIcon, Button, Checkbox, Group, NumberInput, Select, SimpleGrid, Stack, Tooltip } from '@mantine/core'
import { TimeInput } from '@mantine/dates'
import { Plus, X } from 'lucide-react'
import type { SegmentDetails, TimeBank } from '../data'
import { actingRanks, activities, bankAvailable, customers, locations, modifiers, timeBanks, units } from './options'
import { normalizeEnd, parseTime, timeValue } from './format'
import classes from '../WorkforcePanel.module.css'

/**
 * The expanded segment's fields. Each one saves as soon as it changes (selects, checkbox) or when focus
 * leaves it (numbers, times).
 */
export function SegmentFields({ details, scheduled, onChange, readOnly = false }: {
  details: SegmentDetails
  /** The segment's scheduled times: the starting point for "Set actual" and the bank amount */
  scheduled: { start: number; end: number }
  onChange: (patch: Partial<SegmentDetails>) => void
  readOnly?: boolean
}) {
  const pick = (key: 'activity' | 'location' | 'modifier' | 'customer' | 'unit' | 'acting') => (value: string | null) => {
    if (key === 'location' || value) onChange({ [key]: value })
  }
  return (
    <Stack gap="sm" className={classes.fields}>
      <SimpleGrid cols={2} spacing="sm" verticalSpacing="sm">
        <Select label="Activity" data={activities} value={details.activity} onChange={pick('activity')} allowDeselect={false} readOnly={readOnly} />
        <Select label="Location" data={locations} value={details.location} onChange={pick('location')} placeholder="None" clearable={!readOnly} readOnly={readOnly} />
      </SimpleGrid>
      <Group gap="sm" align="flex-end" wrap="nowrap">
        <Select label="Hours modifier" data={modifiers} value={details.modifier} onChange={pick('modifier')} allowDeselect={false} className={classes.grow} readOnly={readOnly} />
        <Checkbox
          label="Bank this time"
          checked={!!details.bank}
          disabled={readOnly}
          onChange={(event) => onChange({ bank: event.currentTarget.checked ? { bank: 'Overtime', amount: Math.min(scheduled.end - scheduled.start, bankAvailable.Overtime) } : null })}
          mb={8}
        />
      </Group>
      {details.bank && <BankFields key={`${details.bank.bank}:${details.bank.amount}`} bank={details.bank} onChange={(bank) => onChange({ bank })} readOnly={readOnly} />}
      <SimpleGrid cols={2} spacing="sm" verticalSpacing="sm">
        <Select label="Unit" data={units} value={details.unit} onChange={pick('unit')} allowDeselect={false} readOnly={readOnly} />
        <Select label="Rank (acting)" data={actingRanks} value={details.acting} onChange={pick('acting')} allowDeselect={false} readOnly={readOnly} />
      </SimpleGrid>
      <Select label="Customer" data={customers} value={details.customer} onChange={pick('customer')} allowDeselect={false} readOnly={readOnly} />
      {details.actual
        ? <ActualFields key={`${details.actual.start}:${details.actual.end}`} actual={details.actual} onChange={(actual) => onChange({ actual })} readOnly={readOnly} />
        : !readOnly && (
          <Button variant="subtle" color="gray" size="xs" leftSection={<Plus size={14} aria-hidden="true" />} className={classes.linkButton} onClick={() => onChange({ actual: { ...scheduled } })}>
            Set actual
          </Button>
        )}
    </Stack>
  )
}

function BankFields({ bank, onChange, readOnly }: { bank: NonNullable<SegmentDetails['bank']>; onChange: (bank: SegmentDetails['bank']) => void; readOnly: boolean }) {
  const [amount, setAmount] = useState<string | number>(bank.amount)
  const available = bankAvailable[bank.bank]
  return (
    <SimpleGrid cols={2} spacing="sm">
      <Select
        label="Time bank"
        data={timeBanks}
        value={bank.bank}
        onChange={(value) => value && onChange({ bank: value as TimeBank, amount: Math.min(bank.amount, bankAvailable[value as TimeBank]) })}
        allowDeselect={false}
        readOnly={readOnly}
      />
      <NumberInput
        label={`Amount (h) · ${available} avail.`}
        value={amount}
        onChange={setAmount}
        min={0}
        max={available}
        step={0.5}
        decimalScale={2}
        clampBehavior="blur"
        readOnly={readOnly}
        onBlur={() => {
          const value = typeof amount === 'number' ? amount : Number.parseFloat(amount)
          if (Number.isFinite(value) && value !== bank.amount) onChange({ ...bank, amount: Math.min(Math.max(value, 0), available) })
        }}
      />
    </SimpleGrid>
  )
}

function ActualFields({ actual, onChange, readOnly }: { actual: { start: number; end: number }; onChange: (actual: SegmentDetails['actual']) => void; readOnly: boolean }) {
  const [start, setStart] = useState(timeValue(actual.start))
  const [end, setEnd] = useState(timeValue(actual.end))
  const commit = () => {
    const from = parseTime(start)
    const to = parseTime(end)
    if (from === null || to === null || from === to) return
    const next = { start: from, end: normalizeEnd(from, to) }
    if (next.start !== actual.start || next.end !== actual.end) onChange(next)
  }
  return (
    <Group
      gap="sm"
      align="flex-end"
      wrap="nowrap"
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) commit() }}
      onKeyDown={(event) => { if (event.key === 'Enter') commit() }}
    >
      <TimeInput label="Actual start" value={start} onChange={(event) => setStart(event.currentTarget.value)} className={classes.grow} readOnly={readOnly} />
      <TimeInput label="Actual end" value={end} onChange={(event) => setEnd(event.currentTarget.value)} className={classes.grow} readOnly={readOnly} />
      {!readOnly && (
        <Tooltip label="Remove actual times">
          <ActionIcon variant="subtle" color="gray" size={36} aria-label="Remove actual times" onClick={() => onChange(null)}><X size={16} /></ActionIcon>
        </Tooltip>
      )}
    </Group>
  )
}
