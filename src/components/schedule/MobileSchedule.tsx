import { useRef, type CSSProperties, type PointerEvent } from 'react'
import { Text, Tooltip, UnstyledButton } from '@mantine/core'
import { Clock3 } from 'lucide-react'
import { shiftCodeMap } from '../../tokens/schedule'
import {
  dayNumber, formatFullDate, formatHeader, formatHour, formatMonthDay, formatWeekday, rowLines, segmentHours, segmentKind, type ScheduleSection,
} from './data'
import ShiftChip from './ShiftChip'
import { BodiesValue, HoursValue, TimeOfDayBar } from './Coverage'
import classes from './Mobile.module.css'

export interface MobileScheduleProps {
  /** Teams or locations, as for ScheduleGrid */
  sections: ScheduleSection[]
  /** Sections for day mode when they differ (Location View lists the people on duty). Defaults to `sections`. */
  daySections?: ScheduleSection[]
  mode: 'week' | 'day'
  /** Seven day numbers in week mode; the first is used in day mode */
  days: number[]
  today?: number
  /** Called with -1 or 1 when the user swipes right or left */
  onSwipe?: (direction: 1 | -1) => void
}

const ticks = [0, 3, 6, 9, 12, 15, 18, 21, 24]
const pct = (hour: number) => `${(Math.min(Math.max(hour, 0), 24) / 24) * 100}%`

function useSwipe(onSwipe?: (direction: 1 | -1) => void) {
  const start = useRef<number | null>(null)
  return {
    onPointerDown: (event: PointerEvent) => { if (event.pointerType !== 'mouse') start.current = event.clientX },
    onPointerUp: (event: PointerEvent) => {
      if (start.current === null) return
      const dx = event.clientX - start.current
      start.current = null
      if (Math.abs(dx) > 60) onSwipe?.(dx < 0 ? 1 : -1)
    },
  }
}

function WeekView({ sections, days, today }: MobileScheduleProps) {
  return (
    <>
      <div className={classes.weekHeader}>
        {days.map((day) => (
          <div key={day} className={classes.weekDay} data-today={day === today || undefined} aria-label={`${formatFullDate(day)}${day === today ? ', today' : ''}`}>
            <span aria-hidden="true">{formatWeekday(day)}</span>
            <span aria-hidden="true" className="tabular">{dayNumber(day)}</span>
          </div>
        ))}
      </div>
      {sections.map((section) => (
        <section key={section.id} aria-label={section.name}>
          {section.rows.length > 0 && section.coverage && (
            <>
              <div className={classes.coverageHeader}>Coverage</div>
              <div className={classes.coverageGrid}>
                {days.map((day) => <BodiesValue key={day} bodies={section.coverage!(day).bodies} />)}
                {days.map((day) => <HoursValue key={day} hours={section.coverage!(day).hours} />)}
                {days.map((day) => <TimeOfDayBar key={day} segments={section.coverage!(day).timeOfDay} />)}
              </div>
            </>
          )}
          <div className={classes.groupHeader}>{section.title}</div>
          {section.rows.map((row) => {
            const chipsByDay = days.map((day) => row.chips(day))
            const lines = rowLines(row, chipsByDay)
            const overflow = (row.extraLines ?? 'overflow') === 'overflow'
            return (
              <div key={row.id}>
                <div className={classes.name}>{row.name}</div>
                {Array.from({ length: lines }, (_, line) => (
                  <div className={classes.strip} data-overflow={(overflow && line > 0) || undefined} data-positions={!overflow || undefined} key={line}>
                    {days.map((day, index) => {
                      const chip = chipsByDay[index][line]
                      return <div className={classes.stripCell} key={day}>{chip && <ShiftChip chip={chip} density="strip" context={`${row.name}, ${formatHeader(day)}`} />}</div>
                    })}
                  </div>
                ))}
              </div>
            )
          })}
        </section>
      ))}
    </>
  )
}

function DayView({ sections, daySections, days, today }: MobileScheduleProps) {
  const day = days[0]
  return (
    <>
      <div className={classes.dayHeader}>
        <div className={classes.dayTitle} data-today={day === today || undefined}>{formatWeekday(day)} {formatMonthDay(day)}</div>
        <div className={classes.track} aria-hidden="true">
          {ticks.map((hour) => <span key={hour} className={`${classes.tick} tabular`} style={{ left: pct(hour) }}>{hour}</span>)}
        </div>
      </div>
      {(daySections ?? sections).map((section) => {
        const coverage = section.coverage?.(day)
        return (
          <section key={section.id} aria-label={section.name}>
            {section.rows.length > 0 && coverage && (
              <div className={classes.dayRow} data-coverage>
                <div className={classes.dayName} />
                <div className={classes.dayCoverage}>
                  <Text size="sm" fw={600} tt="uppercase" lts="0.06em" c="dimmed">Coverage</Text>
                  <BodiesValue bodies={coverage.bodies} />
                  <HoursValue hours={coverage.hours} />
                  <TimeOfDayBar segments={coverage.timeOfDay} />
                </div>
              </div>
            )}
            <div className={classes.groupHeader}>{section.title}</div>
            {section.rows.map((row) => (
              <div className={classes.dayRow} key={row.id}>
                <div className={classes.dayName}>{row.name}</div>
                <div className={classes.track}>
                  {row.chips(day).flatMap((chip, chipIndex) => !chip ? [] : chip.segments.map((segment, index) => {
                    const { start, end } = segmentHours(segment)
                    const kind = segmentKind(segment)
                    const name = shiftCodeMap[segment.code]?.label ?? segment.code
                    const label = `${name}, ${formatHour(start)}–${formatHour(end)}${segment.overtime ? ', overtime' : ''}${chip.partialKind ? `, partly ${chip.partialKind}` : ''}${segment.cancelled ? ', cancelled' : ''}${chip.outOfUnit ? ', out of unit' : ''}`
                    return (
                      <Tooltip label={`${row.name}: ${label}`} key={`${chipIndex}-${index}`}>
                        <UnstyledButton
                          className={classes.bar}
                          data-out-of-unit={chip.outOfUnit || undefined}
                          data-cancelled={segment.cancelled || undefined}
                          style={{
                            left: pct(start),
                            width: `calc(${pct(end)} - ${pct(start)} - 2px)`,
                            '--chip-a': `var(--schedule-${kind})`,
                            '--chip-b': `var(--schedule-${segment.overtime ? 'overtime' : chip.partialKind ?? kind})`,
                          } as CSSProperties}
                          aria-label={`${row.name}: ${label}`}
                        >
                          <span className={classes.barLabel}>{name}</span>
                          {segment.overtime && <Clock3 className={classes.barIcon} size={13} strokeWidth={2} aria-hidden="true" />}
                        </UnstyledButton>
                      </Tooltip>
                    )
                  }))}
                </div>
              </div>
            ))}
          </section>
        )
      })}
    </>
  )
}

/** Phone layout of the schedule: a week of color strips, or one day on a 24-hour timeline. */
export default function MobileSchedule(props: MobileScheduleProps) {
  const swipe = useSwipe(props.onSwipe)
  return (
    <div className={classes.root} data-mode={props.mode} {...swipe}>
      {props.sections.length === 0 ? <Text c="dimmed" ta="center" py="xl">Nothing to show.</Text>
        : props.mode === 'week' ? <WeekView {...props} /> : <DayView {...props} />}
    </div>
  )
}
