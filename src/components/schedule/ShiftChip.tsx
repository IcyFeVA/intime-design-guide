import type { CSSProperties } from 'react'
import { UnstyledButton } from '@mantine/core'
import { ArrowUpRight, Clock3, UserX } from 'lucide-react'
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

/** `icons`: OU icon only (compact). `single`: one tag, OT first (mobile strip, hatching still shows OU). */
function ChipTags({ chip, mode = 'full' }: { chip: Chip; mode?: 'full' | 'icons' | 'single' }) {
  const overtime = chipHasOvertime(chip)
  const showOu = chip.outOfUnit && !(mode === 'single' && overtime)
  const showOt = overtime && mode !== 'icons'
  if (!showOu && !showOt) return null
  return (
    <span className={classes.tags} aria-hidden="true">
      {showOu && <span className={classes.tag}><ArrowUpRight size={mode === 'icons' ? 12 : 13} strokeWidth={2} />{mode !== 'icons' && 'OU'}</span>}
      {showOt && <span className={classes.tag}><Clock3 size={13} strokeWidth={2} />OT</span>}
    </span>
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
    'data-out-of-unit': chip.outOfUnit || undefined,
    'data-tagged': (chip.outOfUnit || overtime) || undefined,
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
      <ChipTags chip={chip} mode={density === 'compact' || density === 'mini' ? 'icons' : density === 'strip' ? 'single' : 'full'} />
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
      {density === 'comfortable' && 'Expired'}
    </span>
  )
}
