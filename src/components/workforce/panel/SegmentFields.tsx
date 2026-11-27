import { useState } from 'react'
import { Checkbox, Group, NumberInput, Select, SimpleGrid, Stack } from '@mantine/core'
import type { SegmentDetails, TimeBank } from '../data'
import { shiftCodeMap } from '../../../tokens/schedule'
import { actingRanks, activities, bankAvailable, codeOptions, customers, locations, modifiers, timeBanks, units } from './options'
import classes from '../WorkforcePanel.module.css'

/** Fields that differ across several selected cells (bulk): shown empty, with "Mixed" */
export type MixedField = 'code' | 'activity' | 'location' | 'customer' | 'modifier' | 'unit' | 'acting' | 'bank' | 'bankType' | 'bankAmount'

const MIXED = 'Mixed'

/**
 * The selected segment's fields, below its times. Each one saves as soon as it changes (selects, checkbox)
 * or when focus leaves it (numbers). The bulk panel shows the same fields for several cells: `mixed` lists the
 * ones whose values differ, and `codeData`/`activityData` narrow the lists.
 */
export function SegmentFields({ code, onCode, details, scheduled, onChange, readOnly = false, mixed, codeData = codeOptions, activityData = activities }: {
  code: string
  onCode: (code: string) => void
  details: SegmentDetails
  /** The segment's scheduled times: the starting point for the bank amount */
  scheduled: { start: number; end: number }
  onChange: (patch: Partial<SegmentDetails>) => void
  readOnly?: boolean
  mixed?: ReadonlySet<MixedField>
  codeData?: typeof codeOptions
  activityData?: string[]
}) {
  const isMixed = (field: MixedField) => !!mixed?.has(field)
  /** A select's value and placeholder: "Mixed" (no value) when the cells differ */
  const shown = <T,>(field: MixedField, value: T, placeholder?: string) =>
    (isMixed(field) ? { value: null, placeholder: MIXED } : { value, placeholder })
  const pick = (key: 'activity' | 'location' | 'modifier' | 'customer' | 'unit' | 'acting') => (value: string | null) => {
    if (key === 'location' || value) onChange({ [key]: value })
  }
  return (
    <Stack gap="sm">
      <SimpleGrid cols={2} spacing="sm" verticalSpacing="sm">
        <Select
          label="Shift code"
          data={codeData}
          {...shown('code', code)}
          onChange={(value) => value && value !== code && onCode(value)}
          searchable
          allowDeselect={false}
          comboboxProps={{ width: 260, position: 'bottom-start' }}
          renderOption={({ option }) => `${option.value} · ${shiftCodeMap[option.value]?.label ?? ''}`}
          readOnly={readOnly}
        />
        <Select label="Activity" data={activityData} {...shown('activity', details.activity)} onChange={pick('activity')} allowDeselect={false} readOnly={readOnly} />
        <Select label="Location" data={locations} {...shown('location', details.location, 'None')} onChange={pick('location')} clearable={!readOnly} readOnly={readOnly} />
        <Select label="Customer" data={customers} {...shown('customer', details.customer)} onChange={pick('customer')} allowDeselect={false} readOnly={readOnly} />
      </SimpleGrid>
      <Group gap="sm" align="flex-end" wrap="nowrap">
        <Select label="Hours modifier" data={modifiers} {...shown('modifier', details.modifier)} onChange={pick('modifier')} allowDeselect={false} className={classes.grow} readOnly={readOnly} />
        <Checkbox
          label="Bank this time"
          checked={!!details.bank && !isMixed('bank')}
          indeterminate={isMixed('bank')}
          disabled={readOnly}
          onChange={(event) => onChange({ bank: event.currentTarget.checked ? { bank: 'Overtime', amount: Math.min(scheduled.end - scheduled.start, bankAvailable.Overtime) } : null })}
          mb={8}
        />
      </Group>
      {details.bank && !isMixed('bank') && (
        <BankFields
          key={`${details.bank.bank}:${details.bank.amount}`}
          bank={details.bank}
          onChange={(bank) => onChange({ bank })}
          readOnly={readOnly}
          mixedType={isMixed('bankType')}
          mixedAmount={isMixed('bankAmount')}
        />
      )}
      <SimpleGrid cols={2} spacing="sm" verticalSpacing="sm">
        <Select label="Unit" data={units} {...shown('unit', details.unit)} onChange={pick('unit')} allowDeselect={false} readOnly={readOnly} />
        <Select label="Rank (acting)" data={actingRanks} {...shown('acting', details.acting)} onChange={pick('acting')} allowDeselect={false} readOnly={readOnly} />
      </SimpleGrid>
    </Stack>
  )
}

function BankFields({ bank, onChange, readOnly, mixedType = false, mixedAmount = false }: {
  bank: NonNullable<SegmentDetails['bank']>
  onChange: (bank: SegmentDetails['bank']) => void
  readOnly: boolean
  mixedType?: boolean
  mixedAmount?: boolean
}) {
  const [amount, setAmount] = useState<string | number>(mixedAmount ? '' : bank.amount)
  const available = bankAvailable[bank.bank]
  return (
    <SimpleGrid cols={2} spacing="sm">
      <Select
        label="Time bank"
        data={timeBanks}
        value={mixedType ? null : bank.bank}
        placeholder={mixedType ? MIXED : undefined}
        onChange={(value) => value && onChange({ bank: value as TimeBank, amount: Math.min(bank.amount, bankAvailable[value as TimeBank]) })}
        allowDeselect={false}
        readOnly={readOnly}
      />
      <NumberInput
        label={mixedType ? 'Amount (h)' : `Amount (h) · ${available} avail.`}
        value={amount}
        placeholder={mixedAmount ? MIXED : undefined}
        onChange={setAmount}
        min={0}
        max={available}
        step={0.5}
        decimalScale={2}
        clampBehavior="blur"
        readOnly={readOnly}
        onBlur={() => {
          const value = typeof amount === 'number' ? amount : Number.parseFloat(amount)
          if (Number.isFinite(value) && (mixedAmount || value !== bank.amount)) onChange({ ...bank, amount: Math.min(Math.max(value, 0), available) })
        }}
      />
    </SimpleGrid>
  )
}
