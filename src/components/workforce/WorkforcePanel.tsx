import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { ActionIcon, Avatar, Group, Select, SimpleGrid, Text, Tooltip } from '@mantine/core'
import { Check, Megaphone, MousePointerClick, Pin, X } from 'lucide-react'
import type { PanelPlacement } from '../../tokens/workforce'
import { formatMonthDay } from '../schedule/data'
import { findWatch, formatLongDay, openStatus, shortName, stillNeeded } from './data'
import type { AssignSource, PanelContent, PanelItem } from './model'
import type { EditCommit } from './useScheduleEdits'
import { DayEditor } from './panel/DayEditor'
import { OpenShiftEditor } from './panel/OpenShiftEditor'
import { PanelFooter } from './panel/parts'
import { activities, activityOf, locations, modifiers, units } from './panel/options'
import { codeFill } from './panel/format'
import classes from './WorkforcePanel.module.css'

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

type Preview = (action: string) => void

/**
 * Docked panel beside the grid. One cell: tabs with the activity's details. Several cells: a summary
 * with fields that apply to all. Nothing: a hint. Edits stay in the panel; the grid does not change yet.
 */
export default function WorkforcePanel({ content, onEdit, onUndo, saves, assigning = false, onAssign, placement = 'docked', onPlacementChange, onClose, onPreview, focusTick = 0, style }: {
  content: PanelContent
  /** Save a change (autosave). The grid updates from the edited schedule. */
  onEdit: (commit: EditCommit) => void
  onUndo: () => void
  /** Counts saves and undos: the panel says "Saved" after one */
  saves: number
  /** Assign mode is on: the footer's Assign button ends it */
  assigning?: boolean
  /** Starts assign mode with a copy of an assignment, or ends it (null) */
  onAssign: (source: AssignSource | null) => void
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
  const contentKey = content.mode === 'single' ? itemKey(content) : content.mode

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
          {subtitle && (
            <Text size="sm" c="dimmed" lh={1.3}>
              {subtitle}
              <SavedStatus key={contentKey} saves={saves} />
            </Text>
          )}
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
          <Tooltip label="Close panel">
            <ActionIcon variant="subtle" color="gray" size={32} onClick={onClose} aria-label="Close panel"><X size={18} /></ActionIcon>
          </Tooltip>
        </Group>
      </div>

      {content.mode === 'none' && (
        <div className={classes.empty}>
          <MousePointerClick size={28} strokeWidth={1.5} aria-hidden="true" />
          <Text size="sm" fw={600} c="var(--text-default)">Select a cell to see its details.</Text>
          <Text size="sm">Shift-click or drag to select several cells.</Text>
        </div>
      )}

      {content.mode === 'single' && content.kind === 'day' && <DayEditor item={content} onEdit={onEdit} onUndo={onUndo} onPreview={onPreview} assigning={assigning} onAssign={onAssign} key={contentKey} />}
      {content.mode === 'single' && content.kind === 'open-shift' && <OpenShiftEditor item={content} onEdit={onEdit} onPreview={onPreview} assigning={assigning} onAssign={onAssign} key={contentKey} />}

      {content.mode === 'bulk' && <BulkItems items={content.items} onPreview={onPreview} onStopAssign={assigning ? () => onAssign(null) : undefined} key={content.items.map((item) => item.key).join()} />}
    </aside>
  )
}

/** One editor per person-day (or open shift), so a split that adds a grid line keeps the panel as it is */
const itemKey = (item: PanelItem) => (item.kind === 'day' ? `day:${item.member.id}@${item.day}` : `open:${item.shift.id}`)

/** "Saved" after a change made while this item is shown */
function SavedStatus({ saves }: { saves: number }) {
  const [initial] = useState(saves)
  return (
    <span role="status" className={classes.saved}>
      {saves !== initial && <> · <Check size={13} strokeWidth={2.25} aria-hidden="true" /> Saved</>}
    </span>
  )
}

function heading(content: PanelContent): { title: string; subtitle?: string } {
  if (content.mode === 'none') return { title: 'Details' }
  if (content.mode === 'bulk') {
    const filled = content.items.filter((item) => item.kind === 'open-shift' || item.chip).length
    const empty = content.items.length - filled
    return { title: `${content.items.length} cells selected`, subtitle: `${filled} ${filled === 1 ? 'activity' : 'activities'}, ${empty} empty` }
  }
  const date = formatLongDay(content.day)
  if (content.kind === 'open-shift') {
    const { shift } = content
    const label = shift.status === 'live' ? 'Live post' : 'Open shift'
    return { title: `${label} · ${findWatch(shift.watch).unit}`, subtitle: `${date} · ${stillNeeded(shift)} of ${shift.needed} still needed` }
  }
  return { title: shortName(content.member), subtitle: `${date} · ${content.watch.title} watch` }
}

/* ------------------------------------------------------------------ */
/* Several cells                                                       */
/* ------------------------------------------------------------------ */

/** The shared value of a field, or null when the cells differ */
const common = <T,>(values: T[]) => (values.every((value) => value === values[0]) ? values[0] : null)

function BulkItems({ items, onPreview, onStopAssign }: { items: PanelItem[]; onPreview: Preview; onStopAssign?: () => void }) {
  const codes = items.map((item) => (item.kind === 'open-shift' ? item.shift.code : item.chip?.segments[0].code ?? null))
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
                    ? <span className={classes.code} style={codeFill(code)}>{code}</span>
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
      <PanelFooter onPreview={onPreview} assigning={!!onStopAssign} onAssign={onStopAssign} />
    </>
  )
}
