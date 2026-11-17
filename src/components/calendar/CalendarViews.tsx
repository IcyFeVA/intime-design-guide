import { Fragment, useState, type CSSProperties, type ReactNode } from 'react'
import { ActionIcon, Popover, Stack, Text, Tooltip, UnstyledButton, VisuallyHidden } from '@mantine/core'
import { AlarmClock, Plus, StickyNote } from 'lucide-react'
import { dayNumber, formatMonthDay, formatWeekday } from '../schedule/data'
import { calendarEventKinds, calendarModifiers } from '../../tokens/calendar'
import {
  byStart, describeEvent, eventLabel, eventTime, formatDuration, formatShortDate, formatTime, formatTimeRange, formatWeekdayLong,
  isAllDay, isPeriodStart, isTimed, sameMonth, weekNumber, type CalendarEvent, type Holiday, type SignUp,
} from './events'
import classes from './Calendar.module.css'

/* ------------------------------------------------------------------ */
/* Event chip                                                          */
/* ------------------------------------------------------------------ */

export type EventVariant = 'month' | 'mini' | 'block' | 'agenda' | 'bar'

/** One event. The fill follows the kind; pending, out-of-unit and cancelled add stripes, outlines or a strike-through. */
export function EventChip({ event, variant = 'month', onOpen, style }: {
  event: CalendarEvent
  variant?: EventVariant
  onOpen?: (event: CalendarEvent) => void
  style?: CSSProperties
}) {
  const hasIcons = !!event.note || !!event.reminders?.length
  const icons = hasIcons && (
    <span className={classes.eventIcons}>
      {event.note && <StickyNote size={16} aria-hidden="true" />}
      {!!event.reminders?.length && <AlarmClock size={16} aria-hidden="true" />}
    </span>
  )
  const label = eventLabel(event)
  const showTime = (variant === 'month' || variant === 'block') && isTimed(event)
  const time = variant !== 'block' || event.start === undefined ? eventTime(event)
    : event.end === undefined ? formatTime(event.start)
      : <>{formatTime(event.start)}–<wbr />{formatTime(event.end)}</>
  return (
    <UnstyledButton
      className={`${classes.event} ${variant === 'bar' ? classes.allDayBar : ''}`}
      data-variant={variant}
      data-kind={event.kind}
      data-pending={event.pending || undefined}
      data-out-of-unit={event.outOfUnit || undefined}
      data-cancelled={event.cancelled || undefined}
      aria-label={`${describeEvent(event)}. Open details`}
      onClick={() => onOpen?.(event)}
      style={style}
    >
      {variant === 'agenda' ? (
        <>
          <span className={classes.eventText}><span className={classes.eventTitle}>{isTimed(event) && event.end !== undefined ? `${formatTimeRange(event.start!, event.end)} ` : ''}{label}</span></span>
          {icons}
        </>
      ) : (
        <span className={classes.eventText}>
          <span className={classes.eventTitle}>{label}</span>
          {showTime && <span className={classes.eventMeta}><span className={`${classes.eventTime} tabular`}>{time}</span>{icons}</span>}
          {!showTime && variant === 'month' && icons}
        </span>
      )}
    </UnstyledButton>
  )
}

export function HolidayLabel({ holiday }: { holiday: Holiday }) {
  return <span className={classes.holiday} title={holiday.title}>{holiday.title}</span>
}

export function SignUpsChip({ count, day, onOpen }: { count: number; day: number; onOpen: (day: number) => void }) {
  const label = `${count} sign-up${count === 1 ? '' : 's'} available`
  return (
    <UnstyledButton className={classes.signUps} onClick={() => onOpen(day)} aria-label={`${label} on ${formatShortDate(day)}. Show sign-ups`}>
      {label}
    </UnstyledButton>
  )
}

function AddButton({ day, onAdd }: { day: number; onAdd: (day: number) => void }) {
  const label = `Add task on ${formatShortDate(day)}`
  return (
    <Tooltip label={label}>
      <ActionIcon className={classes.add} size={24} variant="filled" color="intime" aria-label={label} onClick={() => onAdd(day)}>
        <Plus size={16} />
      </ActionIcon>
    </Tooltip>
  )
}

/** Three or more tasks on a day collapse into one item that lists them. */
function TaskGroup({ tasks, onOpen, compact }: { tasks: CalendarEvent[]; onOpen: (event: CalendarEvent) => void; compact?: boolean }) {
  return (
    <Popover position="bottom-start" shadow="md" withArrow>
      <Popover.Target>
        <UnstyledButton className={classes.event} data-kind="task" data-variant={compact ? 'mini' : 'month'} aria-label={`${tasks.length} tasks. Show the list`}>
          <span className={classes.eventText}><span className={classes.eventTitle}>Tasks (×{tasks.length})</span></span>
          {!compact && <span className={classes.eventIcons}><AlarmClock size={16} aria-hidden="true" /></span>}
        </UnstyledButton>
      </Popover.Target>
      <Popover.Dropdown p={6}>
        <Stack gap={4} w={240}>
          {tasks.map((task) => <EventChip key={task.id} event={task} onOpen={onOpen} />)}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}

/* ------------------------------------------------------------------ */
/* Shared                                                              */
/* ------------------------------------------------------------------ */

export interface CalendarViewProps {
  days: number[]
  events: CalendarEvent[]
  signUps?: SignUp[]
  holidays?: Holiday[]
  today: number
  /** Phone layout */
  compact?: boolean
  onOpenEvent: (event: CalendarEvent) => void
  onOpenSignUps: (day: number) => void
  /** Shows a + on the day under the pointer */
  onAdd?: (day: number) => void
}

function useDayIndex({ days, events, signUps = [], holidays = [] }: Pick<CalendarViewProps, 'days' | 'events' | 'signUps' | 'holidays'>) {
  const set = new Set(days)
  const eventsByDay = new Map<number, CalendarEvent[]>()
  for (const event of events) {
    if (!set.has(event.day)) continue
    eventsByDay.set(event.day, [...(eventsByDay.get(event.day) ?? []), event])
  }
  for (const list of eventsByDay.values()) list.sort(byStart)
  const signUpCount = (day: number) => signUps.filter((item) => item.day === day).length
  const holidayOn = (day: number) => holidays.find((item) => item.day === day)
  return { eventsOn: (day: number) => eventsByDay.get(day) ?? [], signUpCount, holidayOn }
}

/** Holiday, sign-ups and all-day events for a day, in that order. */
function AllDayItems({ day, index, onOpenEvent, onOpenSignUps, compact }: {
  day: number
  index: ReturnType<typeof useDayIndex>
  onOpenEvent: (event: CalendarEvent) => void
  onOpenSignUps: (day: number) => void
  compact?: boolean
}) {
  const holiday = index.holidayOn(day)
  const signUps = index.signUpCount(day)
  return (
    <>
      {holiday && <HolidayLabel holiday={holiday} />}
      {signUps > 0 && <SignUpsChip count={signUps} day={day} onOpen={onOpenSignUps} />}
      {index.eventsOn(day).filter(isAllDay).map((event) => <EventChip key={event.id} event={event} variant={compact ? 'mini' : 'bar'} onOpen={onOpenEvent} />)}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Month                                                               */
/* ------------------------------------------------------------------ */

/** A month cell shows up to this many items. More than that shows the first ones and a “+N more” button. */
const MONTH_MAX_ITEMS = 3

/** Everything in a month cell, in order: holiday, sign-ups, all-day, timed events, then grouped tasks. */
function MonthDayItems({ day, index, onOpenEvent, onOpenSignUps, compact }: {
  day: number
  index: ReturnType<typeof useDayIndex>
  onOpenEvent: (event: CalendarEvent) => void
  onOpenSignUps: (day: number) => void
  compact?: boolean
}) {
  const [opened, setOpened] = useState(false)
  const holiday = index.holidayOn(day)
  const signUps = index.signUpCount(day)
  const allDay = index.eventsOn(day).filter(isAllDay)
  const timed = index.eventsOn(day).filter(isTimed)
  const tasks = timed.filter((event) => event.kind === 'task')
  const grouped = tasks.length > 2
  const open = (event: CalendarEvent) => { setOpened(false); onOpenEvent(event) }
  const openSignUps = (target: number) => { setOpened(false); onOpenSignUps(target) }

  const items = (inList: boolean): { key: string; node: ReactNode }[] => [
    ...(holiday ? [{ key: 'holiday', node: <HolidayLabel holiday={holiday} /> }] : []),
    ...(signUps > 0 ? [{ key: 'sign-ups', node: <SignUpsChip count={signUps} day={day} onOpen={inList ? openSignUps : onOpenSignUps} /> }] : []),
    ...allDay.map((event) => ({ key: event.id, node: <EventChip event={event} variant={compact && !inList ? 'mini' : 'bar'} onOpen={inList ? open : onOpenEvent} /> })),
    ...timed.filter((event) => inList || !grouped || event.kind !== 'task').map((event) => ({
      key: event.id, node: <EventChip event={event} variant={compact && !inList ? 'mini' : 'month'} onOpen={inList ? open : onOpenEvent} />,
    })),
    ...(grouped && !inList ? [{ key: 'tasks', node: <TaskGroup tasks={tasks} onOpen={onOpenEvent} compact={compact} /> }] : []),
  ]

  const cell = items(false)
  if (cell.length <= MONTH_MAX_ITEMS) return <>{cell.map((item) => <Fragment key={item.key}>{item.node}</Fragment>)}</>

  const shown = cell.slice(0, MONTH_MAX_ITEMS - 1)
  const hidden = cell.length - shown.length
  return (
    <>
      {shown.map((item) => <Fragment key={item.key}>{item.node}</Fragment>)}
      <Popover opened={opened} onChange={setOpened} position="bottom-start" shadow="md" withinPortal>
        <Popover.Target>
          <UnstyledButton
            className={classes.more}
            data-compact={compact || undefined}
            aria-label={`${hidden} more on ${formatShortDate(day)}. Show all`}
            aria-expanded={opened}
            onClick={() => setOpened((value) => !value)}
          >
            {compact ? `+${hidden}` : `+${hidden} more`}
          </UnstyledButton>
        </Popover.Target>
        <Popover.Dropdown p={6} className={classes.moreDropdown}>
          <Text size="xs" fw={600} c="dimmed" px={4} pb={6}>{formatShortDate(day)}</Text>
          <Stack gap={4} w={240}>
            {items(true).map((item) => <Fragment key={item.key}>{item.node}</Fragment>)}
          </Stack>
        </Popover.Dropdown>
      </Popover>
    </>
  )
}

export function MonthView(props: CalendarViewProps & { month: number }) {
  const { days, today, compact, onOpenEvent, onOpenSignUps, onAdd, month } = props
  const index = useDayIndex(props)
  const [hover, setHover] = useState<number | null>(null)
  const weeks = Array.from({ length: days.length / 7 }, (_, row) => days.slice(row * 7, row * 7 + 7))

  return (
    <div className={classes.month} data-compact={compact || undefined} role="grid" aria-label="Month">
      <div className={classes.monthHead} role="row">
        {weeks[0].map((day) => <div key={day} role="columnheader">{compact ? formatWeekday(day) : formatWeekdayLong(day)}</div>)}
      </div>
      {weeks.map((week) => (
        <div className={classes.monthWeek} key={week[0]} role="row">
          {week.map((day) => {
            return (
              <div
                key={day}
                role="gridcell"
                aria-label={formatShortDate(day)}
                className={classes.monthDay}
                data-hover={(onAdd && hover === day) || undefined}
                data-period={isPeriodStart(day) || undefined}
                onMouseEnter={() => setHover(day)}
                onMouseLeave={() => setHover(null)}
              >
                <div className={classes.dayTop}>
                  <span className={`${classes.dayNumber} tabular`} data-today={day === today || undefined} data-outside={!sameMonth(day, month) || undefined} aria-current={day === today ? 'date' : undefined}>
                    {dayNumber(day)}
                  </span>
                  {onAdd && !compact && <AddButton day={day} onAdd={onAdd} />}
                </div>
                <MonthDayItems day={day} index={index} onOpenEvent={onOpenEvent} onOpenSignUps={onOpenSignUps} compact={compact} />
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Week and day: 24-hour timeline                                      */
/* ------------------------------------------------------------------ */

/** Side-by-side columns for overlapping events. */
function layoutDay(events: CalendarEvent[]) {
  const timed = events.filter(isTimed).map((event) => ({ event, start: event.start!, end: event.end ?? event.start! + 0.75 }))
  timed.sort((a, b) => a.start - b.start || b.end - a.end)
  const placed: { event: CalendarEvent; start: number; end: number; column: number; columns: number }[] = []
  let cluster: typeof placed = []
  let clusterEnd = -1
  const close = () => { const columns = Math.max(0, ...cluster.map((item) => item.column)) + 1; cluster.forEach((item) => { item.columns = columns }) }
  for (const item of timed) {
    if (item.start >= clusterEnd) { close(); cluster = []; clusterEnd = -1 }
    const used = cluster.filter((other) => other.end > item.start).map((other) => other.column)
    let column = 0
    while (used.includes(column)) column++
    const entry = { ...item, column, columns: 1 }
    cluster.push(entry)
    placed.push(entry)
    clusterEnd = Math.max(clusterEnd, item.end)
  }
  close()
  return placed
}

export function TimeGridView(props: CalendarViewProps & { now?: number }) {
  const { days, today, compact, onOpenEvent, onOpenSignUps, onAdd, now } = props
  const index = useDayIndex(props)
  const [hover, setHover] = useState<number | null>(null)
  const single = days.length === 1
  const showNow = now !== undefined && days.includes(today)
  const hoverProps = (day: number) => (onAdd ? { 'data-hover': hover === day || undefined, onMouseEnter: () => setHover(day), onMouseLeave: () => setHover(null) } : {})

  return (
    <div className={classes.timeGrid} data-compact={compact || undefined} data-single={single || undefined} style={{ '--cols': days.length } as CSSProperties} role="region" aria-label={single ? 'Day' : 'Week'}>
      <div className={classes.tgInner}>
        <div className={classes.tgSticky}>
          <div className={classes.tgHead}>
            <div className={`${classes.tgCorner} tabular`}>Week {weekNumber(days[0])}</div>
            {days.map((day) => (
              <div key={day} className={`${classes.tgDayHead} tabular`} data-today={day === today || undefined} aria-current={day === today ? 'date' : undefined}>
                {compact && !single ? <>{formatWeekday(day)}<br />{dayNumber(day)}</> : `${formatWeekday(day)} ${formatMonthDay(day)}`}
              </div>
            ))}
          </div>
          <div className={classes.tgAllDay}>
            <div className={classes.tgAllDayLabel}>All-day</div>
            {days.map((day) => (
              <div key={day} className={classes.tgAllDayCell} {...hoverProps(day)}>
                <AllDayItems day={day} index={index} onOpenEvent={onOpenEvent} onOpenSignUps={onOpenSignUps} compact={compact && !single} />
                {onAdd && !compact && <AddButton day={day} onAdd={onAdd} />}
              </div>
            ))}
          </div>
        </div>
        <div className={classes.tgBody}>
          <div className={classes.tgGutter} aria-hidden="true">
            {Array.from({ length: 24 }, (_, hour) => (
              <span key={hour} className={classes.tgHour} style={{ top: `calc(var(--hour) * ${hour})` }}>{formatTime(hour)}</span>
            ))}
          </div>
          {days.map((day) => (
            <div key={day} className={classes.tgColumn} data-period={isPeriodStart(day) || undefined} aria-label={formatShortDate(day)} role="group" {...hoverProps(day)}>
              {layoutDay(index.eventsOn(day)).map(({ event, start, end, column, columns }) => (
                <EventChip
                  key={event.id}
                  event={event}
                  variant="block"
                  onOpen={onOpenEvent}
                  style={{
                    top: `calc(var(--hour) * ${start} + 1px)`,
                    height: `calc(var(--hour) * ${end - start} - 2px)`,
                    ...(compact && !single
                      ? { left: `${2 + column * 8}px`, right: '2px', zIndex: column + 1 }
                      : { left: `calc(${(column / columns) * 100}% + 3px)`, width: `calc(${100 / columns}% - 6px)` }),
                  }}
                />
              ))}
            </div>
          ))}
          {showNow && (
            <>
              <div className={classes.nowLine} style={{ top: `calc(var(--hour) * ${now})` }} aria-hidden="true" />
              <span className={`${classes.nowLabel} tabular`} style={{ top: `calc(var(--hour) * ${now})` }}>
                <VisuallyHidden>Now, </VisuallyHidden>{formatTime(now)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Agenda                                                              */
/* ------------------------------------------------------------------ */

export function AgendaView(props: CalendarViewProps) {
  const { days, today, compact, onOpenEvent, onOpenSignUps, onAdd } = props
  const index = useDayIndex(props)
  const [hover, setHover] = useState<number | null>(null)

  return (
    <div className={classes.agenda} data-compact={compact || undefined}>
      <div className={classes.agendaInner}>
        {days.map((day) => {
          const events = index.eventsOn(day)
          const allDay = !!index.holidayOn(day) || index.signUpCount(day) > 0 || events.some(isAllDay)
          const timed = events.filter(isTimed)
          const relative = day === today ? 'Today' : day === today + 1 ? 'Tomorrow' : null
          return (
            <section
              key={day}
              className={classes.agendaDay}
              data-today={relative ? true : undefined}
              data-hover={(onAdd && hover === day) || undefined}
              onMouseEnter={() => setHover(day)}
              onMouseLeave={() => setHover(null)}
              aria-label={formatShortDate(day)}
            >
              <div className={classes.agendaHead}>
                <h4 className={classes.agendaTitle}><span className="tabular">{dayNumber(day)}</span> {formatWeekdayLong(day)}</h4>
                {relative && <span className={classes.agendaRelative}>{relative}</span>}
                {onAdd && !compact && <AddButton day={day} onAdd={onAdd} />}
              </div>
              {!allDay && !timed.length ? (
                <Text className={classes.agendaEmpty}>No plans yet</Text>
              ) : (
                <div className={classes.agendaList}>
                  {allDay && <Stack gap={8} className={classes.agendaAllDay}><AllDayItems day={day} index={index} onOpenEvent={onOpenEvent} onOpenSignUps={onOpenSignUps} /></Stack>}
                  {timed.map((event) => (
                    <div key={event.id} className={classes.agendaRow}>
                      <div>
                        <div className={`${classes.agendaTime} tabular`}>{formatTime(event.start!)}</div>
                        {event.end !== undefined && <Text size="sm" c="dimmed">{formatDuration(event.end - event.start!)}</Text>}
                      </div>
                      <EventChip event={event} variant="agenda" onOpen={onOpenEvent} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Legend                                                              */
/* ------------------------------------------------------------------ */

const swatchEvent = (extra: Partial<CalendarEvent>): CalendarEvent => ({ id: 'swatch', day: 0, title: '', kind: 'activity', ...extra })

/** Kinds and modifiers with a small swatch each. */
export function CalendarLegend({ children }: { children?: ReactNode }) {
  const items: [string, CalendarEvent][] = [
    ...calendarEventKinds.map((kind) => [kind.label, swatchEvent({ kind: kind.key })] as [string, CalendarEvent]),
    ...calendarModifiers.filter((item) => item.key !== 'cancelled').map((item) => [item.label, swatchEvent({ [item.key]: true })] as [string, CalendarEvent]),
  ]
  return (
    <div className={classes.legend} aria-label="Legend">
      {items.map(([label, event]) => (
        <span key={label} className={classes.legendItem}>
          <span
            className={`${classes.event} ${classes.legendSwatch}`}
            data-kind={event.kind}
            data-pending={event.pending || undefined}
            data-out-of-unit={event.outOfUnit || undefined}
            aria-hidden="true"
          />
          {label}
        </span>
      ))}
      {children}
    </div>
  )
}
