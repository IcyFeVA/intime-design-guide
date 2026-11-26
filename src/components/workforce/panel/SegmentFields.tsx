import { useState } from 'react'
import { Checkbox, Group, NumberInput, Select, SimpleGrid, Stack } from '@mantine/core'
import type { SegmentDetails, TimeBank } from '../data'
import { shiftCodeMap } from '../../../tokens/schedule'
import { actingRanks, activities, bankAvailable, codeOptions, customers, locations, modifiers, timeBanks, units } from './options'
import classes from '../WorkforcePanel.module.css'

/**
 * The selected segment's fields, below its times. Each one saves as soon as it changes (selects, checkbox)
 * or when focus leaves it (numbers).
 */
export function SegmentFields({ code, onCode, details, scheduled, onChange, readOnly = false }: {
  code: string
  onCode: (code: string) => void
  details: SegmentDetails
  /** The segment's scheduled times: the starting point for the bank amount */
  scheduled: { start: number; end: number }
  onChange: (patch: Partial<SegmentDetails>) => void
  readOnly?: boolean
}) {
  const pick = (key: 'activity' | 'location' | 'modifier' | 'customer' | 'unit' | 'acting') => (value: string | null) => {
    if (key === 'location' || value) onChange({ [key]: value })
  }
  return (
    <Stack gap="sm">
      <SimpleGrid cols={2} spacing="sm" verticalSpacing="sm">
        <Select
          label="Shift code"
          data={codeOptions}
          value={code}
          onChange={(value) => value && value !== code && onCode(value)}
          searchable
          allowDeselect={false}
          comboboxProps={{ width: 260, position: 'bottom-start' }}
          renderOption={({ option }) => `${option.value} · ${shiftCodeMap[option.value]?.label ?? ''}`}
          readOnly={readOnly}
        />
        <Select label="Activity" data={activities} value={details.activity} onChange={pick('activity')} allowDeselect={false} readOnly={readOnly} />
        <Select label="Location" data={locations} value={details.location} onChange={pick('location')} placeholder="None" clearable={!readOnly} readOnly={readOnly} />
        <Select label="Customer" data={customers} value={details.customer} onChange={pick('customer')} allowDeselect={false} readOnly={readOnly} />
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
