import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { VisuallyHidden } from '@mantine/core'
import { dayNumber, formatFullDate, formatHeader, isPeriodStart, rowLines, type Chip, type ScheduleSection } from './data'
import ShiftChip from './ShiftChip'
import { BodiesValue, HoursValue, TimeOfDayBar } from './Coverage'
import classes from './Schedule.module.css'

export interface ScheduleGridProps {
  /** Teams (Team View) or locations (Location View). Build them with `teamSections` or `locationSections`. */
  sections: ScheduleSection[]
  /** Visible day numbers (see `rangeDays`) */
  days: number[]
  /** `comfortable` for one week, `compact` for longer ranges */
  density?: 'comfortable' | 'compact'
  /** Minimum column width in px. Narrower containers scroll sideways. */
  columnMin?: number
  today?: number
  /** Content of the top-left corner, usually the co-worker search */
  corner?: ReactNode
  showCoverage?: boolean
  /** Shown when no section has rows, e.g. after a search */
  empty?: ReactNode
  /** Dims cells that do not match, e.g. a co-worker search in Location View */
  isMuted?: (chip: Chip) => boolean
  /** Accessible name of the grid */
  label?: string
  maxHeight?: number | string
}

/** Rows down the side, days across. Row headers and the date row stay pinned while the grid scrolls. */
export default function ScheduleGrid({
  sections, days, density = 'comfortable', columnMin = 120, today, corner, showCoverage = true, empty, isMuted, label = 'Schedule', maxHeight,
}: ScheduleGridProps) {
  const compact = density === 'compact'
  const visible = sections.filter((section) => section.rows.length)
  const style = { gridTemplateColumns: `var(--schedule-label-width) repeat(${days.length}, minmax(${columnMin}px, 1fr))`, maxHeight } as CSSProperties

  return (
    <div className={classes.scroller} style={{ maxHeight }}>
      <div className={classes.grid} style={style} role="table" aria-label={label} aria-colcount={days.length + 1}>
        <div role="row" className={classes.row}>
          <div role="columnheader" className={classes.corner}>{corner}</div>
          {days.map((day) => (
            <div
              role="columnheader"
              key={day}
              className={classes.dayHeader}
              data-today={day === today || undefined}
              aria-label={`${formatFullDate(day)}${day === today ? ', today' : ''}`}
              title={compact ? formatFullDate(day) : undefined}
            >
              <span aria-hidden="true" className="tabular">{compact ? dayNumber(day) : formatHeader(day)}</span>
            </div>
          ))}
        </div>

        {visible.length === 0 && (
          <div role="row" className={classes.row}>
            <div role="cell" className={classes.empty}>{empty ?? 'Nothing to show.'}</div>
          </div>
        )}

        {visible.map((section) => (
          <Fragment key={section.id}>
            {showCoverage && section.coverage && (
              <>
                <div role="row" className={classes.row}>
                  <div role="rowheader" className={classes.groupHeader}>
                    <span className={classes.groupTitle}>Coverage display<VisuallyHidden>, {section.name}</VisuallyHidden></span>
                  </div>
                </div>
                {([
                  ['Bodies', (day: number) => <BodiesValue bodies={section.coverage!(day).bodies} />],
                  ['Hours', (day: number) => <HoursValue hours={section.coverage!(day).hours} />],
                  ['Time of day', (day: number) => <TimeOfDayBar segments={section.coverage!(day).timeOfDay} />],
                ] as const).map(([rowLabel, render]) => (
                  <div role="row" className={classes.row} key={rowLabel}>
                    <div role="rowheader" className={classes.coverageLabel}>{rowLabel}</div>
                    {days.map((day) => <div role="cell" className={classes.coverageCell} data-density={density} key={day}>{render(day)}</div>)}
                  </div>
                ))}
              </>
            )}
            <div role="row" className={classes.row}>
              <div role="rowheader" className={classes.groupHeader} aria-label={section.name}><span className={classes.groupTitle}>{section.title}</span></div>
            </div>
            {section.rows.map((row) => {
              const chipsByDay = days.map((day) => row.chips(day))
              const lines = rowLines(row, chipsByDay)
              const overflow = (row.extraLines ?? 'overflow') === 'overflow'
              return Array.from({ length: lines }, (_, line) => (
                <div role="row" className={classes.row} key={`${row.id}-${line}`}>
                  <div role="rowheader" className={classes.label} data-overflow={(overflow && line > 0) || undefined}>
                    {line === 0 ? row.label ?? row.name : (
                      <VisuallyHidden>{row.name}, {overflow ? 'additional assignments' : `position ${line + 1}`}</VisuallyHidden>
                    )}
                  </div>
                  {days.map((day, dayIndex) => {
                    const chip = chipsByDay[dayIndex][line]
                    return (
                      <div
                        role="cell"
                        className={classes.cell}
                        data-density={density}
                        data-boundary={isPeriodStart(day) || undefined}
                        data-overflow={(overflow && line > 0) || undefined}
                        data-muted={(chip && isMuted?.(chip)) || undefined}
                        key={day}
                      >
                        {chip && <ShiftChip chip={chip} density={density} context={`${row.name}, ${formatHeader(day)}`} />}
                      </div>
                    )
                  })}
                </div>
              ))
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
