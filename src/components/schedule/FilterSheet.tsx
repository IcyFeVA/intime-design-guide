import { useState } from 'react'
import { Button, Drawer, Group, Radio, SegmentedControl, Select, Stack, Text, UnstyledButton } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { CalendarDays, ChevronDown, ChevronsDown, ChevronsUp } from 'lucide-react'
import { startOfWeek } from './data'
import classes from './FilterSheet.module.css'

export type SortDirection = 'asc' | 'desc'

/** What the sheet edits. `sort` and `direction` are left out when the view has no sorting. */
export interface MobileFilters<S extends string = string> {
  /** Any day in the shown week, or the shown day */
  anchor: number
  scope: string
  sort?: S
  direction?: SortDirection
}

const DAY_MS = 86_400_000
const toDate = (day: number) => new Date(day * DAY_MS).toISOString().slice(0, 10)
const toDay = (value: string) => Date.parse(`${value.slice(0, 10)}T00:00:00Z`) / DAY_MS

function Eyebrow({ children }: { children: string }) {
  return <Text size="sm" fw={600} c="dimmed" tt="uppercase" lts="0.06em">{children}</Text>
}

/**
 * Bottom sheet behind the phone's sliders button: start date, team or location and, when given, sort.
 * Changes apply on Done; Cancel, the handle and the backdrop keep the previous filters.
 * Renders inside the phone frame (its `transform` holds the fixed-position sheet).
 */
export function FilterSheet<S extends string>({ opened, onClose, value, onApply, mode, scopeLabel, scopeOptions, sortOptions }: {
  opened: boolean
  onClose: () => void
  value: MobileFilters<S>
  onApply: (value: MobileFilters<S>) => void
  /** Week snaps the start date to a Monday and highlights the week */
  mode: 'week' | 'day'
  scopeLabel: string
  scopeOptions: { key: string; label: string }[]
  /** Leave out to hide the Sort section */
  sortOptions?: { key: S; label: string }[]
}) {
  const [draft, setDraft] = useState(value)
  const [lastOpened, setLastOpened] = useState(opened)
  // Start from the applied filters every time the sheet opens
  if (opened !== lastOpened) {
    setLastOpened(opened)
    if (opened) setDraft(value)
  }
  const set = (patch: Partial<MobileFilters<S>>) => setDraft((current) => ({ ...current, ...patch }))
  const start = mode === 'week' ? startOfWeek(draft.anchor) : draft.anchor

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="bottom"
      size="auto"
      withinPortal={false}
      lockScroll={false}
      withCloseButton={false}
      overlayProps={{ backgroundOpacity: 0.45, blur: 3 }}
      classNames={{ inner: classes.inner, content: classes.content, header: classes.header, body: classes.body, title: classes.title }}
      title={<><UnstyledButton className={classes.handle} onClick={onClose} aria-label="Close" /><Eyebrow>Filter</Eyebrow></>}
    >
      <Stack gap="lg">
        <DatePickerInput
          label={mode === 'week' ? 'Start date' : 'Date'}
          value={toDate(start)}
          onChange={(date) => date && set({ anchor: toDay(date) })}
          valueFormat="ddd MMM D, YYYY"
          rightSection={<CalendarDays size={20} aria-hidden="true" />}
          rightSectionPointerEvents="none"
          size="md"
          highlightToday={false}
          popoverProps={{ position: 'top' }}
          classNames={{ label: classes.label }}
          getDayProps={mode === 'week' ? (date) => {
            const day = toDay(date)
            const inWeek = day >= start && day < start + 7
            return { selected: inWeek, inRange: inWeek, firstInRange: day === start, lastInRange: day === start + 6 }
          } : undefined}
        />
        <Select
          label={scopeLabel}
          data={scopeOptions.map(({ key, label }) => ({ value: key, label }))}
          value={draft.scope}
          onChange={(scope) => scope && set({ scope })}
          allowDeselect={false}
          size="md"
          rightSection={<ChevronDown size={20} aria-hidden="true" />}
          rightSectionPointerEvents="none"
          classNames={{ label: classes.label }}
        />
        {sortOptions && (
          <>
            <Stack gap="xs" mt="xs">
              <Eyebrow>Sort</Eyebrow>
              <SegmentedControl
                fullWidth
                size="md"
                value={draft.direction ?? 'asc'}
                onChange={(direction) => set({ direction: direction as SortDirection })}
                aria-label="Sort direction"
                data={[
                  { value: 'asc', label: <Group gap={8} justify="center" wrap="nowrap"><ChevronsUp size={16} aria-hidden="true" />Ascending</Group> },
                  { value: 'desc', label: <Group gap={8} justify="center" wrap="nowrap"><ChevronsDown size={16} aria-hidden="true" />Descending</Group> },
                ]}
              />
            </Stack>
            <Radio.Group value={draft.sort} onChange={(sort) => set({ sort: sort as S })} label={<Eyebrow>By</Eyebrow>} classNames={{ label: classes.groupLabel }}>
              <Stack gap="sm">
                {sortOptions.map((option) => (
                  <Radio.Card key={option.key} value={option.key} className={classes.card}>
                    <Group gap="md" wrap="nowrap">
                      <Radio.Indicator />
                      <Text fw={500}>{option.label}</Text>
                    </Group>
                  </Radio.Card>
                ))}
              </Stack>
            </Radio.Group>
          </>
        )}
        <Group grow gap="md" mt="xs">
          <Button variant="default" size="md" onClick={onClose}>Cancel</Button>
          <Button variant="outline" size="md" onClick={() => { onApply(draft); onClose() }}>Done</Button>
        </Group>
      </Stack>
    </Drawer>
  )
}
