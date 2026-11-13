import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { Text, VisuallyHidden } from '@mantine/core'
import { dayNumber, formatFullDate, formatHeader, isPeriodStart, type ScheduleGroup } from './data'
import ShiftChip from './ShiftChip'
import { BodiesValue, HoursValue, TimeOfDayBar } from './Coverage'
import classes from './Schedule.module.css'

export interface ScheduleGridProps {
  groups: ScheduleGroup[]
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
  /** Shown when no group has members, e.g. after a search */
  empty?: ReactNode
  maxHeight?: number | string
}

/** Members down the side, days across. Names and the date row stay pinned while the grid scrolls. */
export default function ScheduleGrid({
  groups, days, density = 'comfortable', columnMin = 120, today, corner, showCoverage = true, empty, maxHeight,
}: ScheduleGridProps) {
  const compact = density === 'compact'
  const visible = groups.filter((group) => group.members.length)
  const style = { gridTemplateColumns: `var(--schedule-label-width) repeat(${days.length}, minmax(${columnMin}px, 1fr))`, maxHeight } as CSSProperties

  const cellAttrs = (day: number, extra?: Record<string, unknown>) => ({
    role: 'cell',
    className: classes.cell,
    'data-density': density,
    'data-boundary': isPeriodStart(day) || undefined,
    ...extra,
  })

  return (
    <div className={classes.scroller} style={{ maxHeight }}>
      <div className={classes.grid} style={style} role="table" aria-label="Team schedule" aria-colcount={days.length + 1}>
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
            <div role="cell" className={classes.empty}>{empty ?? 'No co-workers to show.'}</div>
          </div>
        )}

        {visible.map((group) => (
          <Fragment key={group.id}>
            {showCoverage && (
              <>
                <div role="row" className={classes.row}>
                  <div role="rowheader" className={classes.groupHeader}><span className={classes.groupTitle}>Coverage display</span></div>
                </div>
                {([
                  ['Bodies', (day: number) => <BodiesValue bodies={group.coverage(day).bodies} />],
                  ['Hours', (day: number) => <HoursValue hours={group.coverage(day).hours} />],
                  ['Time of day', (day: number) => <TimeOfDayBar segments={group.coverage(day).timeOfDay} />],
                ] as const).map(([label, render]) => (
                  <div role="row" className={classes.row} key={label}>
                    <div role="rowheader" className={classes.coverageLabel}>{label}</div>
                    {days.map((day) => <div role="cell" className={classes.coverageCell} data-density={density} key={day}>{render(day)}</div>)}
                  </div>
                ))}
              </>
            )}
            <div role="row" className={classes.row}>
              <div role="rowheader" className={classes.groupHeader}><span className={classes.groupTitle}>{group.title}</span></div>
            </div>
            {group.members.map((member) => {
              const chipsByDay = days.map((day) => member.chips(day))
              const rowCount = Math.max(1, ...chipsByDay.map((chips) => chips.length))
              return Array.from({ length: rowCount }, (_, rowIndex) => (
                <div role="row" className={classes.row} key={`${member.id}-${rowIndex}`}>
                  <div role="rowheader" className={classes.label} data-overflow={rowIndex > 0 || undefined}>
                    {rowIndex === 0 ? (
                      <>
                        <span className={classes.initials} aria-hidden="true">{member.initials}</span>
                        <span className={classes.who}>
                          <Text component="span" size="md" lh={1.25} truncate>{member.name}</Text>
                          <Text component="span" size="sm" c="dimmed" lh={1.25} truncate>{member.rank}</Text>
                        </span>
                      </>
                    ) : <VisuallyHidden>{member.name}, additional assignments</VisuallyHidden>}
                  </div>
                  {days.map((day, dayIndex) => {
                    const chip = chipsByDay[dayIndex][rowIndex]
                    return (
                      <div {...cellAttrs(day, { 'data-overflow': (rowIndex > 0) || undefined })} key={day}>
                        {chip && <ShiftChip chip={chip} density={density} context={`${member.name} (${member.initials}), ${formatHeader(day)}`} />}
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
