import { ArrowUpRight, Clock3, Lock } from 'lucide-react'
import { chipParts, formatHours, type Chip } from '../schedule/data'
import classes from './Workforce.module.css'

function Tags({ overtime, outOfUnit, branch, locked }: { overtime: boolean; outOfUnit: boolean; branch?: string; locked?: boolean }) {
  if (locked) return <span className={classes.partTags}><span className={classes.partTag}><Lock size={12} strokeWidth={2} /></span></span>
  if (branch) return <span className={classes.partTags}><span className={classes.partTag}><ArrowUpRight size={12} strokeWidth={2} /></span></span>
  if (!overtime && !outOfUnit) return null
  return (
    <span className={classes.partTags}>
      {outOfUnit && <span className={classes.partTag}><ArrowUpRight size={12} strokeWidth={2} /><span className={classes.partTagText}>OU</span></span>}
      {overtime && <span className={classes.partTag}><Clock3 size={12} strokeWidth={2} /><span className={classes.partTagText}>OT</span></span>}
    </span>
  )
}

/**
 * A cell in the Detailed view: each assignment with its activity name and times, as in the calendar.
 * Overtime is a part of its own (red, OT tag), never a diagonal. One part has two lines; two or more stack
 * as one-line containers. Out of branch is muted, with an arrow; locked is muted with a lock. Not interactive: the grid cell is the click and focus target.
 */
export default function DetailedChip({ chip }: { chip: Chip }) {
  const parts = chipParts(chip)
  return (
    <span className={classes.detailed} data-stacked={parts.length > 1 || undefined} aria-hidden="true">
      {parts.map((part, index) => (
        <span
          className={classes.part}
          data-kind={part.kind}
          data-out-of-unit={(chip.outOfUnit && !chip.branch && !chip.locked) || undefined}
          data-branch={chip.branch || chip.locked ? '' : undefined}
          data-cancelled={part.cancelled || undefined}
          key={index}
        >
          <span className={classes.partTitle}>{part.title}</span>
          <span className={classes.partCode}>{part.code}</span>
          <span className={`${classes.partTime} tabular`}>{formatHours(part.start, part.end)}</span>
          <span className={`${classes.partTimeShort} tabular`}>{formatHours(part.start, part.end, true)}</span>
          {chip.branch || chip.locked
            ? index === 0 && <Tags overtime={false} outOfUnit={false} branch={chip.branch} locked={!!chip.locked} />
            : <Tags overtime={part.overtime} outOfUnit={!!chip.outOfUnit && index === 0} />}
        </span>
      ))}
    </span>
  )
}
