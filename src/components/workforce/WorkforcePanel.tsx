import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import {
  ActionIcon, Avatar, Button, Checkbox, Group, Menu, Select, SimpleGrid, Stack, Tabs, Text, TextInput, UnstyledButton,
} from '@mantine/core'
import { DatePickerInput, TimeInput } from '@mantine/dates'
import {
  ArrowLeftRight, Ban, ChevronDown, ChevronsUpDown, Clock, Copy, Crosshair, Ellipsis, Megaphone, MousePointerClick, Paperclip, PlaneTakeoff,
  Pin, Plus, Radio, StickyNote, Trash2, UserPlus, UserSearch, X,
} from 'lucide-react'
import { navUnits } from '../../tokens/navigation'
import type { PanelPlacement } from '../../tokens/workforce'
import { shiftCodeMap, shiftCodes } from '../../tokens/schedule'
import { formatHour, formatMonthDay, segmentHours, segmentKind, type Segment } from '../schedule/data'
import { allMembers, findWatch, formatLongDay, openStatus, rankLabels, shortName, watches, type WatchId } from './data'
import type { PanelContent, PanelItem } from './model'
import classes from './WorkforcePanel.module.css'

/* ------------------------------------------------------------------ */
/* Mock options                                                        */
/* ------------------------------------------------------------------ */

const activities = ['Patrol', 'Court', 'Training', 'Special detail', 'Office duty', 'Leave']
const locations = ['Sector A', 'Sector B', 'Sector C', 'Sector D', 'Kings County Court', 'Training center', 'Station house']
const modifiers = ['None', 'Overtime 1.5×', 'Overtime 2×', 'Holiday pay', 'Comp time']
const actingRanks = ['None', 'Corporal', 'Sergeant', 'Lieutenant']
const customers = ['City of New York', 'NYC Transit', 'Barclays Center']
const units = watches.map((watch) => watch.unit)

const activityOf = (code: string) => {
  if (code.startsWith('Pat') || code === 'ExP') return 'Patrol'
  if (code.startsWith('C-') || code === 'Court') return 'Court'
  if (code === 'Train') return 'Training'
  if (code === 'Spe') return 'Special detail'
  if (shiftCodeMap[code]?.kind === 'leave') return 'Leave'
  return 'Office duty'
}

const locationOf = (activity: string, seed: string) => {
  if (activity === 'Court') return 'Kings County Court'
  if (activity === 'Training') return 'Training center'
  if (activity === 'Office duty') return 'Station house'
  if (activity === 'Leave') return null
  return locations[[...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4]
}

const employeeOptions = watches.map((watch) => ({
  group: `${watch.title} watch`,
  items: watch.members.map((member) => ({ value: member.id, label: shortName(member) })),
}))

const DAY_MS = 86_400_000
const toIso = (day: number) => new Date(day * DAY_MS).toISOString().slice(0, 10)
const toTime = (hour: number) => formatHour(hour)
const toHours = (time: string) => { const [h, m] = time.split(':').map(Number); return (h || 0) + (m || 0) / 60 }
/** "10:00" for a 10-hour segment; past midnight wraps around */
const duration = (start: string, end: string) => {
  const span = ((toHours(end) - toHours(start)) % 24 + 24) % 24 || 24
  return `${Math.floor(span)}:${String(Math.round((span % 1) * 60)).padStart(2, '0')}`
}

const fillStyle = (code: string) => ({ '--code-fill': `var(--schedule-${segmentKind({ code })})` }) as CSSProperties

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

type Preview = (action: string) => void

/**
 * Docked panel beside the grid. One cell: tabs with the activity's details. Several cells: a summary
 * with fields that apply to all. Nothing: a hint. Edits stay in the panel; the grid does not change yet.
 */
export default function WorkforcePanel({ content, placement = 'docked', onPlacementChange, onClose, onPreview, focusTick = 0, style }: {
  content: PanelContent
  /** `docked`: beside the grid, which gets narrower. `drawer`: over the grid's right edge, which keeps its width. */
  placement?: PanelPlacement
  onPlacementChange?: (placement: PanelPlacement) => void
  onClose: () => void
  /** A control that is not built yet was used. Show it in the demo's status line. */
  onPreview: Preview
  /** Changes when the panel should take focus, e.g. after Enter on a cell */
  focusTick?: number
  style?: CSSProperties
}) {
  const headingId = useId()
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (focusTick > 0) headingRef.current?.focus({ preventScroll: true })
  }, [focusTick])

  const { title, subtitle } = heading(content)

  return (
    <aside
      className={classes.panel}
      data-placement={placement}
      style={style}
      aria-labelledby={headingId}
      onKeyDown={(event) => {
        // Escape closes the panel, unless it is closing a dropdown or editing a field
        if (event.key !== 'Escape' || (event.target as HTMLElement).closest('input, textarea, [aria-expanded="true"]')) return
        event.stopPropagation()
        onClose()
      }}
    >
      <div className={classes.header}>
        <div className={classes.heading}>
          <h4 className={classes.title} id={headingId} ref={headingRef} tabIndex={-1}>{title}</h4>
          {subtitle && <Text size="sm" c="dimmed" lh={1.3}>{subtitle}</Text>}
        </div>
        <Group gap={2} wrap="nowrap">
          {onPlacementChange && (
            <ActionIcon
              variant="subtle"
              color="gray"
              size={32}
              aria-label="Pin panel beside the grid"
              aria-pressed={placement === 'docked'}
              onClick={() => onPlacementChange(placement === 'docked' ? 'drawer' : 'docked')}
            >
              <Pin size={17} strokeWidth={1.75} fill={placement === 'docked' ? 'currentColor' : 'none'} />
            </ActionIcon>
          )}
          <ActionIcon variant="subtle" color="gray" size={32} onClick={onClose} aria-label="Close panel"><X size={18} /></ActionIcon>
        </Group>
      </div>

      {content.mode === 'none' && (
        <div className={classes.empty}>
          <MousePointerClick size={28} strokeWidth={1.5} aria-hidden="true" />
          <Text size="sm" fw={600} c="var(--text-default)">Select a cell to see its details.</Text>
          <Text size="sm">Shift-click or drag to select several cells.</Text>
        </div>
      )}

      {content.mode === 'single' && <SingleItem item={content} onPreview={onPreview} key={content.key} />}

      {content.mode === 'bulk' && <BulkItems items={content.items} onPreview={onPreview} key={content.items.map((item) => item.key).join()} />}
    </aside>
  )
}

function heading(content: PanelContent): { title: string; subtitle?: string } {
  if (content.mode === 'none') return { title: 'Details' }
  if (content.mode === 'bulk') {
    const activities = content.items.filter((item) => item.kind !== 'new').length
    const empty = content.items.length - activities
    return { title: `${content.items.length} cells selected`, subtitle: `${activities} ${activities === 1 ? 'activity' : 'activities'}, ${empty} empty` }
  }
  const date = formatLongDay(content.day)
  if (content.kind === 'open-shift') {
    const { shift } = content
    return { title: `Editing: ${date} · ${findWatch(shift.watch).unit}`, subtitle: `${openStatus[shift.status].label} shift · ${shift.needed} of ${shift.needed} still needed` }
  }
  if (content.kind === 'assigned') {
    return { title: `Editing: ${date} · ${shortName(content.member)}`, subtitle: `${activityOf(content.chip.segments[0].code)} · ${content.watch.unit}` }
  }
  return { title: `New activity: ${date} · ${shortName(content.member)}`, subtitle: `No activity on this day · ${content.watch.unit}` }
}

/* ------------------------------------------------------------------ */
/* One cell                                                            */
/* ------------------------------------------------------------------ */

interface Draft { code: string; start: string; end: string }

function initialSegments(item: PanelItem): Draft[] {
  const toDraft = (segment: Segment): Draft => {
    const { start, end } = segmentHours(segment)
    return { code: segment.code, start: toTime(start), end: toTime(end) }
  }
  if (item.kind === 'open-shift') return [{ code: item.shift.code, start: toTime(item.shift.start), end: toTime(item.shift.end) }]
  if (item.kind === 'assigned') return item.chip.segments.map(toDraft)
  const watch = item.watch
  return [{ code: watch.code, start: toTime(watch.start), end: toTime(watch.end) }]
}

function SingleItem({ item, onPreview }: { item: PanelItem; onPreview: Preview }) {
  const [tab, setTab] = useState<string | null>('details')
  const isNew = item.kind === 'new'
  const watchId: WatchId = item.kind === 'open-shift' ? item.shift.watch : item.watch.id
  const [segments, setSegments] = useState(() => initialSegments(item))
  const [current, setCurrent] = useState(0)
  const segment = segments[current]
  const firstActivity = activityOf(segments[0].code)

  const [employee, setEmployee] = useState<string | null>(item.kind === 'open-shift' ? null : item.member.id)
  const [branch, setBranch] = useState<string | null>(navUnits[0])
  const [date, setDate] = useState<string | null>(toIso(item.day))
  const [activity, setActivity] = useState<string | null>(firstActivity)
  const [location, setLocation] = useState<string | null>(item.kind === 'open-shift' ? item.shift.location : locationOf(firstActivity, item.key))
  const [modifier, setModifier] = useState<string | null>(item.kind === 'assigned' && item.chip.segments.some((s) => s.overtime) ? 'Overtime 1.5×' : 'None')
  const [bank, setBank] = useState(false)
  const [unit, setUnit] = useState<string | null>(findWatch(watchId).unit)
  const [acting, setActing] = useState<string | null>(segments.some((s) => s.code === 'Act Sup') ? 'Sergeant' : 'None')
  const [customer, setCustomer] = useState<string | null>(customers[0])

  const person = allMembers.find((member) => member.id === employee)
  const update = (patch: Partial<Draft>) => setSegments((list) => list.map((draft, index) => (index === current ? { ...draft, ...patch } : draft)))

  return (
    <>
      <Tabs value={tab} onChange={setTab} classNames={{ root: classes.tabs, list: classes.tabList, panel: classes.tabPanel }}>
        <Tabs.List>
          <Tabs.Tab value="details">Details</Tabs.Tab>
          <Tabs.Tab value="attachments">Attachments <Text span c="dimmed" inherit>(0)</Text></Tabs.Tab>
          <Tabs.Tab value="notes">Notes</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="details">
          <div className={classes.body}>
            <div className={classes.employeeRow}>
              <Select
                aria-label="Employee"
                placeholder="Select employee"
                data={employeeOptions}
                value={employee}
                onChange={setEmployee}
                searchable
                clearable={!isNew && item.kind !== 'assigned'}
                nothingFoundMessage="Nobody matches"
                variant="unstyled"
                size="sm"
                className={classes.employee}
                classNames={{ input: classes.employeeInput }}
                leftSectionWidth={40}
                rightSectionWidth={24}
                leftSection={person
                  ? <Avatar size={30} radius="xl" color="intime" variant="light" alt="">{person.initials}</Avatar>
                  : <span className={classes.noEmployee}><UserPlus size={16} strokeWidth={1.75} aria-hidden="true" /></span>}
                rightSection={<ChevronsUpDown size={16} aria-hidden="true" />}
                rightSectionPointerEvents="none"
                renderOption={({ option }) => {
                  const member = allMembers.find((m) => m.id === option.value)
                  return (
                    <Group gap={8} wrap="nowrap">
                      <Text size="sm">{option.label}</Text>
                      {member && <Text size="xs" c="dimmed">{rankLabels[member.rank]}</Text>}
                    </Group>
                  )
                }}
              />
              <Button variant="default" size="xs" h={32} leftSection={<Clock size={14} aria-hidden="true" />} onClick={() => onPreview('Hours')}>Hours</Button>
              <ActionIcon variant="default" size={32} aria-label="Show in schedule" onClick={() => onPreview('Show in schedule')}><Crosshair size={16} /></ActionIcon>
              <ActionIcon variant="subtle" color="gray" size={32} aria-label="More about this employee" onClick={() => onPreview('More about this employee')}><ChevronDown size={16} /></ActionIcon>
            </div>

            <Group gap="sm" wrap="nowrap">
              <Text size="sm" c="dimmed" w={56} component="label" htmlFor={`branch-${item.key}`}>Branch</Text>
              <Select id={`branch-${item.key}`} data={navUnits} value={branch} onChange={setBranch} allowDeselect={false} className={classes.grow} />
            </Group>

            {isNew ? (
              <Select
                label="Shift code"
                data={shiftCodes.map((code) => ({ value: code.code, label: `${code.code} · ${code.label}` }))}
                value={segment.code}
                searchable
                allowDeselect={false}
                onChange={(code) => {
                  const def = code ? shiftCodeMap[code] : undefined
                  if (!def) return
                  update({ code: def.code, start: toTime(def.start), end: toTime(def.end) })
                  setActivity(activityOf(def.code))
                  setLocation(locationOf(activityOf(def.code), item.key))
                }}
              />
            ) : (
              <Stack gap={6}>
                {segments.map((draft, index) => (
                  <div className={classes.segment} data-active={index === current || undefined} key={index}>
                    <UnstyledButton className={classes.segmentMain} onClick={() => setCurrent(index)} aria-pressed={index === current} aria-label={`Segment ${index + 1}: ${shiftCodeMap[draft.code]?.label ?? draft.code}, ${draft.start} to ${draft.end}`}>
                      <span className={classes.code} style={fillStyle(draft.code)}>{draft.code}</span>
                      <span className={classes.time}>{draft.start}–{draft.end}</span>
                    </UnstyledButton>
                    {([
                      ['Post as live', Radio],
                      ['Find an employee', UserSearch],
                      ['Cancel segment', Ban],
                      ['More segment actions', Ellipsis],
                    ] as const).map(([label, Icon]) => (
                      <ActionIcon variant="subtle" color="gray" size={30} aria-label={label} onClick={() => onPreview(label)}><Icon size={16} /></ActionIcon>
                    ))}
                  </div>
                ))}
                <Button variant="subtle" color="gray" size="xs" leftSection={<Plus size={14} aria-hidden="true" />} className={classes.linkButton} onClick={() => onPreview('Add segment')}>Add segment</Button>
              </Stack>
            )}

            <div className={classes.times}>
              <SimpleGrid cols={4} spacing={8}>
                <DatePickerInput label="Scheduled" value={date} onChange={setDate} valueFormat="MMM D" size="sm" popoverProps={{ withinPortal: true }} />
                <TimeInput label="Start" value={segment.start} onChange={(event) => update({ start: event.currentTarget.value })} size="sm" />
                <TimeInput label="End" value={segment.end} onChange={(event) => update({ end: event.currentTarget.value })} size="sm" />
                <TextInput label="Hours" value={duration(segment.start, segment.end)} readOnly size="sm" classNames={{ input: classes.readOnly }} />
              </SimpleGrid>
              <Button variant="subtle" color="gray" size="xs" mt={6} leftSection={<Plus size={14} aria-hidden="true" />} className={classes.linkButton} onClick={() => onPreview('Set actual')}>Set actual</Button>
            </div>

            <SimpleGrid cols={2} spacing="sm" verticalSpacing="sm">
              <Select label="Activity" data={activities} value={activity} onChange={setActivity} allowDeselect={false} />
              <Select label="Location" data={locations} value={location} onChange={setLocation} placeholder="None" clearable />
            </SimpleGrid>
            <Group gap="sm" align="flex-end" wrap="nowrap">
              <Select label="Hours modifier" data={modifiers} value={modifier} onChange={setModifier} allowDeselect={false} className={classes.grow} />
              <Checkbox label="Bank this time" checked={bank} onChange={(event) => setBank(event.currentTarget.checked)} mb={8} />
            </Group>
            <SimpleGrid cols={2} spacing="sm" verticalSpacing="sm">
              <Select label="Unit" data={units} value={unit} onChange={setUnit} allowDeselect={false} />
              <Select label="Rank (acting)" data={actingRanks} value={acting} onChange={setActing} allowDeselect={false} />
            </SimpleGrid>
            <Select label="Customer" data={customers} value={customer} onChange={setCustomer} allowDeselect={false} />
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="attachments">
          <div className={classes.empty}>
            <Paperclip size={28} strokeWidth={1.5} aria-hidden="true" />
            <Text size="sm" fw={600} c="var(--text-default)">No attachments</Text>
            <Text size="sm">Adding files to an activity is coming.</Text>
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="notes">
          <div className={classes.empty}>
            <StickyNote size={28} strokeWidth={1.5} aria-hidden="true" />
            <Text size="sm" fw={600} c="var(--text-default)">No notes</Text>
            <Text size="sm">Notes on an activity are coming.</Text>
          </div>
        </Tabs.Panel>
      </Tabs>

      <Footer onPreview={onPreview} leave={item.kind === 'assigned'} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Several cells                                                       */
/* ------------------------------------------------------------------ */

/** The shared value of a field, or null when the cells differ */
const common = <T,>(values: T[]) => (values.every((value) => value === values[0]) ? values[0] : null)

function BulkItems({ items, onPreview }: { items: PanelItem[]; onPreview: Preview }) {
  const codes = items.map((item) => (item.kind === 'open-shift' ? item.shift.code : item.kind === 'assigned' ? item.chip.segments[0].code : null))
  const activityValues = codes.map((code) => (code ? activityOf(code) : null))
  const [activity, setActivity] = useState<string | null>(common(activityValues))
  const [location, setLocation] = useState<string | null>(common(items.map((item) => (item.kind === 'open-shift' ? item.shift.location : null))))
  const [modifier, setModifier] = useState<string | null>(null)
  const [unit, setUnit] = useState<string | null>(common(items.map((item) => findWatch(item.kind === 'open-shift' ? item.shift.watch : item.watch.id).unit)))

  return (
    <>
      <div className={classes.scroll}>
        <div className={classes.body}>
          <ul className={classes.bulkList} aria-label="Selected cells">
            {items.map((item, index) => {
              const code = codes[index]
              return (
                <li className={classes.bulkItem} key={item.key}>
                  {item.kind === 'open-shift'
                    ? <span className={classes.noEmployee} aria-hidden="true"><Megaphone size={14} strokeWidth={1.75} /></span>
                    : <Avatar size={28} radius="xl" color="intime" variant="light" alt="">{item.member.initials}</Avatar>}
                  <div className={classes.bulkWho}>
                    <Text size="sm" fw={600} truncate>{item.kind === 'open-shift' ? `${openStatus[item.shift.status].label} shift` : shortName(item.member)}</Text>
                    <Text size="xs" c="dimmed">{formatMonthDay(item.day)}</Text>
                  </div>
                  {code
                    ? <span className={classes.code} style={fillStyle(code)}>{code}</span>
                    : <Text size="xs" c="dimmed">Empty</Text>}
                </li>
              )
            })}
          </ul>
          <Text size="sm" fw={600} c="var(--text-default)">Apply to all</Text>
          <SimpleGrid cols={2} spacing="sm" verticalSpacing="sm">
            <Select label="Activity" data={activities} value={activity} onChange={setActivity} placeholder="Mixed" />
            <Select label="Location" data={locations} value={location} onChange={setLocation} placeholder="Mixed" />
            <Select label="Hours modifier" data={modifiers} value={modifier} onChange={setModifier} placeholder="Mixed" />
            <Select label="Unit" data={units} value={unit} onChange={setUnit} placeholder="Mixed" />
          </SimpleGrid>
        </div>
      </div>
      <Footer onPreview={onPreview} leave />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

function Footer({ onPreview, leave }: { onPreview: Preview; leave: boolean }) {
  return (
    <div className={classes.footer}>
      <Button color="intime" className={classes.grow} leftSection={<Plus size={16} aria-hidden="true" />} onClick={() => onPreview('Assign')}>Assign</Button>
      {leave && <Button variant="default" leftSection={<PlaneTakeoff size={16} aria-hidden="true" />} onClick={() => onPreview('Leave')}>Leave</Button>}
      <Menu position="top-end" offset={6}>
        <Menu.Target>
          <ActionIcon variant="default" size={36} aria-label="More actions"><Ellipsis size={18} /></ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<Copy size={16} aria-hidden="true" />} onClick={() => onPreview('Copy')}>Copy</Menu.Item>
          <Menu.Item leftSection={<ArrowLeftRight size={16} aria-hidden="true" />} onClick={() => onPreview('Swap with…')}>Swap with…</Menu.Item>
          <Menu.Divider />
          <Menu.Item color="red" leftSection={<Trash2 size={16} aria-hidden="true" />} onClick={() => onPreview('Delete')}>Delete</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </div>
  )
}
