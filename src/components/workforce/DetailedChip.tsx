import { ArrowUpRight, Clock3 } from 'lucide-react'
import { branchShort, chipParts, formatHours, type Chip } from '../schedule/data'
import classes from './Workforce.module.css'

function Tags({ overtime, outOfUnit, branch }: { overtime: boolean; outOfUnit: boolean; branch?: string }) {
  if (branch) return <span className={classes.partTags}><span className={classes.partTag}><ArrowUpRight size={12} strokeWidth={2} /><span className={classes.partTagText}>{branchShort(branch)}</span></span></span>
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
 * as one-line containers. Out of branch is muted, with the branch's short name. Not interactive: the grid cell is the click and focus target.
 */
export default function DetailedChip({ chip }: { chip: Chip }) {
  const parts = chipParts(chip)
  return (
    <span className={classes.detailed} data-stacked={parts.length > 1 || undefined} aria-hidden="true">
      {parts.map((part, index) => (
        <span
          className={classes.part}
          data-kind={part.kind}
          data-out-of-unit={(chip.outOfUnit && !chip.branch) || undefined}
          data-branch={chip.branch ? '' : undefined}
          data-cancelled={part.cancelled || undefined}
          key={index}
        >
          <span className={classes.partTitle}>{part.title}</span>
          <span className={classes.partCode}>{part.code}</span>
          <span className={`${classes.partTime} tabular`}>{formatHours(part.start, part.end)}</span>
          <span className={`${classes.partTimeShort} tabular`}>{formatHours(part.start, part.end, true)}</span>
          {chip.branch
            ? index === 0 && <Tags overtime={false} outOfUnit={false} branch={chip.branch} />
            : <Tags overtime={part.overtime} outOfUnit={!!chip.outOfUnit && index === 0} />}
        </span>
      ))}
    </span>
  )
}
