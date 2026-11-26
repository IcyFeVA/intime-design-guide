import type { CSSProperties } from 'react'
import { UnstyledButton } from '@mantine/core'
import { ArrowUpRight, Clock3, Lock, UserX } from 'lucide-react'
import { chipFills, chipHasOvertime, describeChip, type Chip } from './data'
import classes from './Schedule.module.css'

export type ChipDensity = 'comfortable' | 'compact' | 'mini' | 'strip'

export interface ShiftChipProps {
  chip: Chip
  /**
   * `comfortable`: one week. `compact`: two weeks and longer. `mini`: very narrow desktop columns, no codes (fill, OU stripes
   * and arrow, cancelled bar). `strip`: mobile week, tags only.
   */
  density?: ChipDensity
  /** Who and when, for the accessible name, e.g. "Marino, Thu, Jun 4" */
  context?: string
  /** Makes the cell open something, e.g. the day details */
  onClick?: () => void
  /** `false` renders a plain, hidden-from-screen-readers chip for grids where the cell itself is focusable (Workforce Scheduling). Default `true`. */
  interactive?: boolean
}

const fillStyle = (chip: Chip) => {
  const [a, b] = chipFills(chip)
  return { '--chip-a': `var(--schedule-${a})`, '--chip-b': `var(--schedule-${b})` } as CSSProperties
}

/**
 * Out of branch: an arrow ("↗"), and no OU or OT tag, as the muted cell belongs to
 * that branch. Locked (e.g. a court date): the same muted cell with a lock. `icons`: OU icon only (compact). `mini`: OU icon in the corner and the OT clock in the middle, since a mini cell has
 * no code and color alone can't tell overtime apart. `single`: one tag, OT first (mobile strip, hatching still shows OU).
 */
function ChipTags({ chip, mode = 'full' }: { chip: Chip; mode?: 'full' | 'icons' | 'mini' | 'single' }) {
  const overtime = chipHasOvertime(chip)
  const iconOnly = mode === 'icons' || mode === 'mini'
  if (chip.locked) {
    return (
      <span className={classes.tags} aria-hidden="true">
        <span className={classes.tag}><Lock size={iconOnly ? 12 : 13} strokeWidth={2} /></span>
      </span>
    )
  }
  if (chip.branch) {
    return (
      <span className={classes.tags} aria-hidden="true">
        <span className={classes.tag}><ArrowUpRight size={iconOnly ? 12 : 13} strokeWidth={2} /></span>
      </span>
    )
  }
  const showOu = chip.outOfUnit && !(mode === 'single' && overtime)
  const showOt = overtime && mode !== 'icons'
  if (!showOu && !showOt) return null
  return (
    <>
      {(showOu || (showOt && mode !== 'mini')) && (
        <span className={classes.tags} aria-hidden="true">
          {showOu && <span className={classes.tag}><ArrowUpRight size={iconOnly ? 12 : 13} strokeWidth={2} />{!iconOnly && 'OU'}</span>}
          {showOt && mode !== 'mini' && <span className={classes.tag}><Clock3 size={13} strokeWidth={2} />OT</span>}
        </span>
      )}
      {showOt && mode === 'mini' && <Clock3 className={classes.miniOt} size={14} strokeWidth={2.25} aria-hidden="true" />}
    </>
  )
}

/** One cell in the schedule grid: one or more assignments, filled by kind, with OT and OU tags. */
export default function ShiftChip({ chip, density = 'comfortable', context, onClick, interactive = true }: ShiftChipProps) {
  const overtime = chipHasOvertime(chip)
  const visible = density === 'compact' ? chip.segments.slice(0, 2) : chip.segments
  const cancelled = chip.segments.every((segment) => segment.cancelled)
  const shared = {
    className: classes.chip,
    'data-density': density,
    'data-out-of-unit': (chip.outOfUnit && !chip.branch && !chip.locked) || undefined,
    'data-branch': chip.branch || chip.locked ? '' : undefined,
    'data-tagged': (chip.outOfUnit || overtime || chip.branch || chip.locked) || undefined,
    'data-cancelled': ((density === 'strip' || density === 'mini') && cancelled) || undefined,
    style: fillStyle(chip),
  }
  const content = (
    <>
      {density !== 'strip' && density !== 'mini' && visible.map((segment, index) => (
        <span className={classes.segment} data-cancelled={segment.cancelled || undefined} data-last={index === visible.length - 1 || undefined} key={index}>
          <span className={classes.code}>{segment.label ?? segment.code}</span>
        </span>
      ))}
      {density === 'compact' && chip.segments.length > 2 && <span className={classes.more} aria-hidden="true">…</span>}
      <ChipTags chip={chip} mode={density === 'compact' ? 'icons' : density === 'mini' ? 'mini' : density === 'strip' ? 'single' : 'full'} />
    </>
  )
  return (
    interactive ? (
      <UnstyledButton
        {...shared}
        aria-label={`${context ? `${context}: ` : ''}${describeChip(chip)}${onClick ? '. Show day details' : ''}`}
        aria-haspopup={onClick ? 'dialog' : undefined}
        onClick={onClick}
      >
        {content}
      </UnstyledButton>
    ) : (
      <span {...shared} aria-hidden="true">{content}</span>
    )
  )
}

/**
 * Marks where a row's expired stretch starts: the expiry day, or the first visible day.
 * Later expired days show only the hatch. Decorative: the cell carries the accessible text.
 */
export function ExpiredMark({ density = 'comfortable' }: { density?: ChipDensity }) {
  return (
    <span className={classes.expired} data-density={density} aria-hidden="true">
      <UserX size={14} strokeWidth={1.75} />
      {density === 'comfortable' && 'Inactive'}
    </span>
  )
}
