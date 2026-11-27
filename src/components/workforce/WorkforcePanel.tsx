import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { ActionIcon, Group, Text, Tooltip } from '@mantine/core'
import { Check, MousePointerClick, Pin, X } from 'lucide-react'
import type { PanelPlacement } from '../../tokens/workforce'
import { findWatch, formatLongDay, shortName, stillNeeded } from './data'
import type { AssignSource, PanelContent, PanelItem } from './model'
import type { EditCommit } from './useScheduleEdits'
import { DayEditor } from './panel/DayEditor'
import { OpenShiftEditor } from './panel/OpenShiftEditor'
import { BulkEditor } from './panel/BulkEditor'
import classes from './WorkforcePanel.module.css'

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

type Preview = (action: string) => void

/**
 * Docked panel beside the grid. One cell: tabs with the day's details. Several cells: one shift or field for all of
 * them. Nothing: a hint. Every change saves at once and the grid follows.
 */
export default function WorkforcePanel({ content, onEdit, onUndo, onStatus, saves, assigning = false, onAssign, placement = 'docked', onPlacementChange, onClose, onPreview, focusTick = 0, style }: {
  content: PanelContent
  /** Save a change (autosave). The grid updates from the edited schedule. */
  onEdit: (commit: EditCommit) => void
  onUndo: () => void
  /** Says what a bulk action did, in the demo's status line */
  onStatus: (text: string) => void
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
        // Escape closes the panel, unless it is closing a dropdown or a dialog (e.g. the task form), or editing a field
        if (event.key !== 'Escape' || (event.target as HTMLElement).closest('input, textarea, [aria-expanded="true"], [role="dialog"]')) return
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
          <Text size="sm" maw={300}>Shift-click or drag selects a range, Ctrl/⌘-click adds or removes cells. Right-click for more.</Text>
        </div>
      )}

      {content.mode === 'single' && content.kind === 'day' && <DayEditor item={content} onEdit={onEdit} onUndo={onUndo} onPreview={onPreview} assigning={assigning} onAssign={onAssign} key={contentKey} />}
      {content.mode === 'single' && content.kind === 'open-shift' && <OpenShiftEditor item={content} onEdit={onEdit} onPreview={onPreview} assigning={assigning} onAssign={onAssign} key={contentKey} />}

      {content.mode === 'bulk' && (
        <BulkEditor items={content.items} onEdit={onEdit} onPreview={onPreview} onStatus={onStatus} assigning={assigning} onAssign={onAssign} key={content.items.map((item) => item.key).join()} />
      )}
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
    const people = new Set(content.items.flatMap((item) => (item.kind === 'day' ? [item.member.id] : []))).size
    const who = people ? `${people} ${people === 1 ? 'person' : 'people'} · ` : ''
    return { title: `${content.items.length} cells selected`, subtitle: `${who}${filled} filled, ${empty} empty` }
  }
  const date = formatLongDay(content.day)
  if (content.kind === 'open-shift') {
    const { shift } = content
    const label = shift.status === 'live' ? 'Live post' : 'Open shift'
    return { title: `${label} · ${findWatch(shift.watch).unit}`, subtitle: `${date} · ${stillNeeded(shift)} of ${shift.needed} still needed` }
  }
  return { title: shortName(content.member), subtitle: `${date} · ${content.watch.title} watch` }
}
