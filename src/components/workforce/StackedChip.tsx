import { chipParts, type Chip } from '../schedule/data'
import classes from './Workforce.module.css'

/**
 * A cell in the Stacked view: one colored bar per assignment, in time order, with no text or icons.
 * Overtime is a bar of its own, out of unit is striped, out of branch is muted and cancelled is struck through. Each bar is
 * `--schedule-chip-height` (16px in Stacked) high, so more assignments make the row taller.
 * Not interactive: the grid cell is the click and focus target, and its accessible name lists the assignments.
 */
export default function StackedChip({ chip }: { chip: Chip }) {
  return (
    <span className={classes.stacked} aria-hidden="true">
      {chipParts(chip).map((part, index) => (
        <span
          className={classes.bar}
          data-kind={part.kind}
          data-out-of-unit={(chip.outOfUnit && !chip.branch) || undefined}
          data-branch={chip.branch ? '' : undefined}
          data-cancelled={part.cancelled || undefined}
          key={index}
        />
      ))}
    </span>
  )
}
