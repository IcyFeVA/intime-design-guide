import { useRef, type CSSProperties, type PointerEvent } from 'react'
import { Text, Tooltip, UnstyledButton } from '@mantine/core'
import { Clock3 } from 'lucide-react'
import { shiftCodeMap } from '../../tokens/schedule'
import {
  dayNumber, formatFullDate, formatHeader, formatHour, formatMonthDay, formatWeekday, segmentHours, segmentKind, type ScheduleGroup,
} from './data'
import ShiftChip from './ShiftChip'
import { BodiesValue, HoursValue, TimeOfDayBar } from './Coverage'
import classes from './Mobile.module.css'

export interface MobileScheduleProps {
  groups: ScheduleGroup[]
  mode: 'week' | 'day'
  /** Seven day numbers in week mode; the first is used in day mode */
  days: number[]
  today?: number
  /** Called with -1 or 1 when the user swipes right or left */
  onSwipe?: (direction: 1 | -1) => void
}

/** Surname, plus initials when two members of a team share it */
const displayName = (group: ScheduleGroup, member: ScheduleGroup['members'][number]) =>
  group.members.filter((other) => other.name === member.name).length > 1 ? `${member.name} (${member.initials})` : member.name

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

function WeekView({ groups, days, today }: MobileScheduleProps) {
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
      {groups.map((group) => (
        <section key={group.id} aria-label={group.title}>
          <div className={classes.groupHeader}>{group.title}</div>
          {group.members.map((member) => {
            const chipsByDay = days.map((day) => member.chips(day))
            const rows = Math.max(1, ...chipsByDay.map((chips) => chips.length))
            return (
              <div key={member.id}>
                <div className={classes.name}>{displayName(group, member)}</div>
                {Array.from({ length: rows }, (_, row) => (
                  <div className={classes.strip} data-overflow={row > 0 || undefined} key={row}>
                    {days.map((day, index) => {
                      const chip = chipsByDay[index][row]
                      return <div className={classes.stripCell} key={day}>{chip && <ShiftChip chip={chip} density="strip" context={`${member.name}, ${formatHeader(day)}`} />}</div>
                    })}
                  </div>
                ))}
              </div>
            )
          })}
          <div className={classes.coverageHeader}>Coverage</div>
          <div className={classes.coverageGrid}>
            {days.map((day) => <BodiesValue key={day} bodies={group.coverage(day).bodies} />)}
            {days.map((day) => <HoursValue key={day} hours={group.coverage(day).hours} />)}
            {days.map((day) => <TimeOfDayBar key={day} segments={group.coverage(day).timeOfDay} />)}
          </div>
        </section>
      ))}
    </>
  )
}

function DayView({ groups, days, today }: MobileScheduleProps) {
  const day = days[0]
  return (
    <>
      <div className={classes.dayHeader}>
        <div className={classes.dayTitle} data-today={day === today || undefined}>{formatWeekday(day)} {formatMonthDay(day)}</div>
        <div className={classes.track} aria-hidden="true">
          {ticks.map((hour) => <span key={hour} className={`${classes.tick} tabular`} style={{ left: pct(hour) }}>{hour}</span>)}
        </div>
      </div>
      {groups.map((group) => {
        const coverage = group.coverage(day)
        return (
          <section key={group.id} aria-label={group.title}>
            <div className={classes.groupHeader}>{group.title}</div>
            {group.members.map((member) => (
              <div className={classes.dayRow} key={member.id}>
                <div className={classes.dayName}>{displayName(group, member)}</div>
                <div className={classes.track}>
                  {member.chips(day).flatMap((chip, chipIndex) => chip.segments.map((segment, index) => {
                    const { start, end } = segmentHours(segment)
                    const kind = segmentKind(segment)
                    const label = `${shiftCodeMap[segment.code]?.label ?? segment.code}, ${formatHour(start)}–${formatHour(end)}${segment.overtime ? ', overtime' : ''}${segment.cancelled ? ', cancelled' : ''}${chip.outOfUnit ? ', out of unit' : ''}`
                    return (
                      <Tooltip label={`${member.name}: ${label}`} key={`${chipIndex}-${index}`}>
                        <UnstyledButton
                          className={classes.bar}
                          data-out-of-unit={chip.outOfUnit || undefined}
                          data-cancelled={segment.cancelled || undefined}
                          style={{
                            left: pct(start),
                            width: `calc(${pct(end)} - ${pct(start)} - 2px)`,
                            '--chip-a': `var(--schedule-${kind})`,
                            '--chip-b': `var(--schedule-${segment.overtime ? 'overtime' : kind})`,
                          } as CSSProperties}
                          aria-label={`${member.name}: ${label}`}
                        >
                          <span className={classes.barLabel}>{shiftCodeMap[segment.code]?.label ?? segment.code}</span>
                          {segment.overtime && <Clock3 className={classes.barIcon} size={13} strokeWidth={2} aria-hidden="true" />}
                        </UnstyledButton>
                      </Tooltip>
                    )
                  }))}
                </div>
              </div>
            ))}
            <div className={classes.dayRow} data-coverage>
              <div className={classes.dayName} />
              <div className={classes.dayCoverage}>
                <Text size="sm" fw={600} tt="uppercase" lts="0.06em" c="dimmed">Coverage</Text>
                <BodiesValue bodies={coverage.bodies} />
                <HoursValue hours={coverage.hours} />
                <TimeOfDayBar segments={coverage.timeOfDay} />
              </div>
            </div>
          </section>
        )
      })}
    </>
  )
}

/** Phone layout of the schedule: a week of color strips, or one day on a 24-hour timeline. */
export default function MobileSchedule(props: MobileScheduleProps) {
  const swipe = useSwipe(props.onSwipe)
  const empty = props.groups.every((group) => !group.members.length)
  return (
    <div className={classes.root} data-mode={props.mode} {...swipe}>
      {empty ? <Text c="dimmed" ta="center" py="xl">No co-workers to show.</Text>
        : props.mode === 'week' ? <WeekView {...props} /> : <DayView {...props} />}
    </div>
  )
}
