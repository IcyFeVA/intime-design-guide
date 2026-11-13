import { useState } from 'react'
import { Button, Group, Stack, Table, Text } from '@mantine/core'
import { Plus } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import Preview from '../../components/Preview'
import DoDont from '../../components/DoDont'
import CopyValue from '../../components/CopyValue'
import PropsTable from '../../components/PropsTable'
import { DesktopDemoFrame, MobileDemoBar, MobileStage, PhoneFrame, PickerMenu, ToolbarDivider } from '../../components/schedule/ScheduleChrome'
import { formatFullDate, dayOf } from '../../components/schedule/data'
import { AgendaView, CalendarLegend, EventChip, HolidayLabel, MonthView, SignUpsChip, TimeGridView, type CalendarViewProps } from '../../components/calendar/CalendarViews'
import { CalendarStepper, CalendarViewMenu, MapButton } from '../../components/calendar/CalendarToolbar'
import { EventDetailsModal, SignUpsModal, TaskFormModal } from '../../components/calendar/CalendarModals'
import { useCalendarModals } from '../../components/calendar/useCalendarModals'
import {
  MOCK_NOW, MOCK_TODAY, initialEvents, mockHolidays, mockSignUps, stepView, viewDays, viewLabel, type CalendarEvent,
} from '../../components/calendar/events'
import { calendarTokens, calendarViews, type CalendarView } from '../../tokens/calendar'
import classes from './Calendar.module.css'

const STATUS = 'Preview only. “Today” is Friday, June 5, 2026 at 10:30 in this demo.'

function CalendarBody({ view, anchor, ...props }: Omit<CalendarViewProps, 'days' | 'today'> & { view: CalendarView; anchor: number }) {
  const common = { ...props, days: viewDays(view, anchor), today: MOCK_TODAY, signUps: mockSignUps, holidays: mockHolidays }
  if (view === 'month') return <MonthView {...common} month={anchor} />
  if (view === 'agenda') return <AgendaView {...common} />
  return <TimeGridView {...common} now={MOCK_NOW} />
}

/* ------------------------------------------------------------------ */
/* Desktop                                                             */
/* ------------------------------------------------------------------ */

function DesktopDemo() {
  const [view, setView] = useState<CalendarView>('month')
  const [anchor, setAnchor] = useState(MOCK_TODAY)
  const [events, setEvents] = useState(initialEvents)
  const [hint, setHint] = useState<string | null>(null)
  const [legend, setLegend] = useState(false)
  const { openEvent, openSignUps, addTask, modals } = useCalendarModals({ setEvents, signUps: mockSignUps, onHint: setHint })
  const reset = () => { setView('month'); setAnchor(MOCK_TODAY); setEvents(initialEvents()); setHint(null); setLegend(false) }

  return (
    <Preview
      flush
      title="Calendar, desktop"
      code={'<MonthView\n  days={viewDays("month", anchor)}\n  month={anchor}\n  events={events}\n  signUps={signUps}\n  holidays={holidays}\n  today={today}\n  onOpenEvent={openEvent}\n  onOpenSignUps={openSignUps}\n  onAdd={addTask}\n/>\n{/* Week and Day: <TimeGridView now={hour} … />, Agenda: <AgendaView … /> */}'}
    >
      <DesktopDemoFrame
        title="Calendar"
        nav={{ roles: ['employee', 'scheduler'], defaultRole: 'employee', defaultActive: 'calendar' }}
        actions={<Button leftSection={<Plus size={18} />} onClick={() => addTask(MOCK_TODAY)}>Add</Button>}
        status={hint ?? STATUS}
        onReset={reset}
        toolbar={
          <>
            <PickerMenu label="View" value={view} options={calendarViews.map(({ key, label }) => ({ key, label }))} onChange={setView} />
            <ToolbarDivider />
            <CalendarStepper view={view} anchor={anchor} onAnchorChange={setAnchor} onPicker={() => setHint('The date picker is not part of this demo. Use the arrows or Today.')} />
            <div style={{ flex: 1 }} />
            <MapButton pressed={legend} label={legend ? 'Hide legend' : 'Show legend'} onClick={() => setLegend((value) => !value)} />
          </>
        }
      >
        {legend && <div className={classes.desktopLegend}><CalendarLegend /></div>}
        <CalendarBody view={view} anchor={anchor} events={events} onOpenEvent={openEvent} onOpenSignUps={openSignUps} onAdd={addTask} />
      </DesktopDemoFrame>
      {modals}
    </Preview>
  )
}

/* ------------------------------------------------------------------ */
/* Mobile                                                              */
/* ------------------------------------------------------------------ */

function MobileDemo() {
  const [view, setView] = useState<CalendarView>('month')
  const [anchor, setAnchor] = useState(MOCK_TODAY)
  const [events, setEvents] = useState(initialEvents)
  const [hint, setHint] = useState<string | null>(null)
  const [legend, setLegend] = useState(false)
  const { openEvent, openSignUps, addTask, modals } = useCalendarModals({ setEvents, signUps: mockSignUps, onHint: setHint })
  const reset = () => { setView('month'); setAnchor(MOCK_TODAY); setEvents(initialEvents()); setHint(null); setLegend(false) }
  const step = (direction: 1 | -1) => setAnchor((value) => stepView(view, value, direction))

  return (
    <Preview flush title="Calendar, mobile">
      <MobileDemoBar status={hint ?? viewLabel(view, anchor)} onStep={step} onReset={reset} />
      <MobileStage
        notes={
          <>
            <Text size="sm"><strong>Same four views.</strong> Month, week, day and agenda sit behind the calendar button on the left.</Text>
            <Text size="sm"><strong>Legend.</strong> The map button shows and hides a legend for the fills, in any view, as on desktop.</Text>
            <Text size="sm"><strong>Month.</strong> Cells show titles only, cut off at the edge; tap one for details.</Text>
            <Text size="sm"><strong>Week.</strong> Seven narrow columns on the timeline. Titles and times wrap inside each block.</Text>
            <Text size="sm"><strong>Day and agenda</strong> read best on a phone: full titles, times and icons.</Text>
            <Text size="sm"><strong>Swipe</strong> left or right to move by the view. The calendar-with-a-1 button jumps back to today.</Text>
          </>
        }
      >
        <PhoneFrame
          header={
            <div className={classes.phoneHead}>
              <Group justify="space-between" wrap="nowrap" className={classes.phoneTitleRow}>
                <h3 className={classes.phoneTitle}>Calendar</h3>
                <Button leftSection={<Plus size={18} />} onClick={() => addTask(MOCK_TODAY)}>Add</Button>
              </Group>
              <div className={classes.phoneToolbar}>
                <CalendarViewMenu view={view} onChange={setView} />
                <CalendarStepper compact view={view} anchor={anchor} onAnchorChange={setAnchor} onPicker={() => setHint('The date picker is not part of this demo.')} />
                <MapButton size={38} pressed={legend} label={legend ? 'Hide legend' : 'Show legend'} onClick={() => setLegend((value) => !value)} />
              </div>
              {legend && <div className={classes.phoneLegend}><CalendarLegend /></div>}
            </div>
          }
        >
          <div className={classes.phoneFill}>
            <CalendarBody compact view={view} anchor={anchor} events={events} onOpenEvent={openEvent} onOpenSignUps={openSignUps} />
          </div>
        </PhoneFrame>
      </MobileStage>
      {modals}
    </Preview>
  )
}

/* ------------------------------------------------------------------ */
/* Specimens                                                           */
/* ------------------------------------------------------------------ */

const spec = (title: string, extra: Partial<CalendarEvent>): CalendarEvent => ({ id: title, day: dayOf(2026, 6, 3), title, kind: 'activity', start: 7.5, end: 12, ...extra })

const specimens: { name: string; meaning: string; event: CalendarEvent }[] = [
  { name: 'Activity', meaning: 'A scheduled shift or assignment.', event: spec('Paperwork', {}) },
  { name: 'Overtime', meaning: 'Overtime hours, including meetings on a day off.', event: spec('Weapon Training', { kind: 'overtime', start: 8, end: 10 }) },
  { name: 'Leave', meaning: 'Time off for part of a day. A full day of leave sits in the all-day area.', event: spec('Compensating', { kind: 'leave', start: 12, end: 14 }) },
  { name: 'Task', meaning: 'A to-do. Without an end time it shows the start time only.', event: spec('Submit Timesheet', { kind: 'task', start: 16, end: undefined, assignedBy: 'Sgt. Torres', activity: 'Paperwork' }) },
  { name: 'Pending', meaning: 'Waiting for approval. Any kind can be pending.', event: spec('Court Appearance', { pending: true, start: 7, end: 10.5 }) },
  { name: 'Out of branch/unit', meaning: 'Worked for another branch or unit.', event: spec('Seawall Patrol', { outOfUnit: true, start: 7, end: 15 }) },
  { name: 'Cancelled', meaning: 'Struck through. Stays visible so the change is not missed.', event: spec('Gun Range', { cancelled: true, start: 9.5, end: 14 }) },
  { name: 'Note and reminder', meaning: 'The note and alarm icons say there is more inside.', event: spec('Office: Front Desk', { start: 9.5, end: 14.5, note: 'Bring the visitor log.', reminders: [{ when: 'Day of event' }] }) },
]

function EventSpecimens({ onOpen }: { onOpen: (event: CalendarEvent) => void }) {
  return (
    <Table.ScrollContainer minWidth={760} className="doc-table">
      <Table verticalSpacing="sm" horizontalSpacing="md">
        <Table.Thead>
          <Table.Tr><Table.Th>State</Table.Th><Table.Th w={190}>Month</Table.Th><Table.Th w={280}>Agenda</Table.Th><Table.Th>Meaning</Table.Th></Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {specimens.map((specimen) => (
            <Table.Tr key={specimen.name}>
              <Table.Td><Text size="sm" fw={600}>{specimen.name}</Text></Table.Td>
              <Table.Td><EventChip event={specimen.event} onOpen={onOpen} /></Table.Td>
              <Table.Td><EventChip event={specimen.event} variant="agenda" onOpen={onOpen} /></Table.Td>
              <Table.Td><Text size="sm">{specimen.meaning}</Text></Table.Td>
            </Table.Tr>
          ))}
          <Table.Tr>
            <Table.Td><Text size="sm" fw={600}>Holiday</Text></Table.Td>
            <Table.Td><HolidayLabel holiday={mockHolidays[1]} /></Table.Td>
            <Table.Td><HolidayLabel holiday={mockHolidays[1]} /></Table.Td>
            <Table.Td><Text size="sm">A statutory holiday. Always at the top of the day, never clickable.</Text></Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Td><Text size="sm" fw={600}>Sign-ups</Text></Table.Td>
            <Table.Td colSpan={2}><Text size="sm" c="dimmed">See below.</Text></Table.Td>
            <Table.Td><Text size="sm">Open shifts you can sign up for that day. Opens the list of sign-ups.</Text></Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}

/* ------------------------------------------------------------------ */
/* Details demo                                                        */
/* ------------------------------------------------------------------ */

const allEvents = initialEvents()
const find = (title: string, pending = false) => allEvents.find((event) => event.title === title && !!event.pending === pending && (event.details || event.leave || event.assignedBy))!

function DetailsDemo() {
  const [event, setEvent] = useState<CalendarEvent | null>(null)
  const [signUpsDay, setSignUpsDay] = useState<number | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const examples: [string, string, () => void][] = [
    ['Assignment', 'Security, overtime, with tags, assets and a lunch', () => setEvent(find('Security'))],
    ['Leave', 'Vacation over three days', () => setEvent(find('Vacation'))],
    ['Pending leave', 'Vacation waiting for approval', () => setEvent(find('Vacation', true))],
    ['Scheduler’s task', 'Read-only, with reminders', () => setEvent(find('Clean Desk'))],
    ['Sign-ups', 'Two open shifts on Saturday', () => setSignUpsDay(mockSignUps[0].day)],
  ]
  return (
    <Preview title="Details" align="start">
      <Stack gap="sm" w="100%">
        <Group gap="sm">
          {examples.map(([label, description, open]) => (
            <Button key={label} variant="default" onClick={open} title={description}>{label}</Button>
          ))}
        </Group>
        <Text size="xs" c="dimmed" role="status">{hint ?? 'Each button opens the dialog for that kind of item.'}</Text>
      </Stack>
      <EventDetailsModal event={event} onClose={() => setEvent(null)} />
      <SignUpsModal day={signUpsDay} signUps={mockSignUps} onClose={() => setSignUpsDay(null)} onHint={setHint} />
    </Preview>
  )
}

function AddTaskDemo() {
  const [state, setState] = useState<{ key: number; day: number; task?: CalendarEvent; opened: boolean }>({ key: 0, day: MOCK_TODAY, opened: false })
  const [hint, setHint] = useState<string | null>(null)
  const own = allEvents.find((event) => event.title === 'Renew Firearms Permit')!
  return (
    <Preview title="Add and edit" align="start">
      <Stack gap="sm" w="100%">
        <Group gap="sm">
          <Button leftSection={<Plus size={18} />} onClick={() => setState((value) => ({ key: value.key + 1, day: MOCK_TODAY, opened: true }))}>Add</Button>
          <Button variant="default" onClick={() => setState((value) => ({ key: value.key + 1, day: own.day, task: own, opened: true }))}>Edit your own task</Button>
        </Group>
        <Text size="xs" c="dimmed" role="status">{hint ?? 'Try submitting without a name, adding a reminder or turning on Repeats.'}</Text>
      </Stack>
      <TaskFormModal
        state={state}
        onClose={() => setState((value) => ({ ...value, opened: false }))}
        onSave={(task) => { setHint(`Saved “${task.title}” on ${formatFullDate(task.day)}. Preview only.`); setState((value) => ({ ...value, opened: false })) }}
        onDelete={(task) => { setHint(`Deleted “${task.title}”. Preview only.`); setState((value) => ({ ...value, opened: false })) }}
      />
    </Preview>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Calendar() {
  const [specimen, setSpecimen] = useState<CalendarEvent | null>(null)
  const [specimenSignUps, setSpecimenSignUps] = useState<number | null>(null)
  return (
    <>
      <PageHeader />

      <Section id="desktop" title="Desktop" description="An employee’s own calendar: shifts, overtime, leave, tasks, holidays and open sign-ups. Pick a view, then step through time.">
        <DesktopDemo />
        <Stack gap="xs" mt="md">
          <Text size="sm">Click any item to open its details. Point at a day and press + to add a task there, or use Add for today.</Text>
          <Text size="sm">Tasks you added yourself open in the edit form. Everything else opens read-only.</Text>
        </Stack>
      </Section>

      <Section id="views" title="Views" description="Month, week, day and agenda on desktop and on a phone. The arrows move by the view.">
        <Table.ScrollContainer minWidth={560} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th>View</Table.Th><Table.Th>Arrows move by</Table.Th><Table.Th>Shows</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {calendarViews.map((item) => (
                <Table.Tr key={item.key}>
                  <Table.Td><Text size="sm" fw={600}>{item.label}</Text></Table.Td>
                  <Table.Td><Text size="sm">{item.step}</Text></Table.Td>
                  <Table.Td><Text size="sm">{item.shows}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Stack gap="xs" mt="md">
          <Text size="sm"><strong>Today</strong> gets a tinted day number in month view, a tinted column header in week and day view, and “Today” and “Tomorrow” labels in the agenda.</Text>
          <Text size="sm"><strong>Now.</strong> A red line with the time crosses the timeline when today is in view.</Text>
          <Text size="sm"><strong>Pay periods.</strong> A vertical line in the info color marks the first day of each period, as in Team View.</Text>
          <Text size="sm"><strong>Weeks</strong> start on Monday. Week and day view show the ISO week number in the corner.</Text>
        </Stack>
      </Section>

      <Section id="events" title="Event types" description="The fill says what kind of time it is. Pending, out-of-unit and cancelled add stripes, outlines or a strike-through, and the text and dialog say the same thing, so color is never the only signal.">
        <Preview title="Legend" align="start"><CalendarLegend /></Preview>
        <div className={classes.spacer} />
        <EventSpecimens onOpen={setSpecimen} />
        <div className={classes.spacer} />
        <Preview title="Sign-ups" align="start">
          <div className={classes.signUpSpecimen}><SignUpsChip count={2} day={mockSignUps[0].day} onOpen={setSpecimenSignUps} /></div>
        </Preview>
        <Text size="sm" mt="md">Three or more tasks on one day collapse into “Tasks (×3)” in month view, which opens a list.</Text>
        <EventDetailsModal event={specimen} onClose={() => setSpecimen(null)} />
        <SignUpsModal day={specimenSignUps} signUps={mockSignUps} onClose={() => setSpecimenSignUps(null)} onHint={() => {}} />
      </Section>

      <Section id="details" title="Event details" description="Details open in a dialog. The layout depends on what was clicked: an assignment, leave, a task from a scheduler or the day’s sign-ups.">
        <DetailsDemo />
        <Stack gap="xs" mt="md">
          <Text size="sm"><strong>Assignments</strong> show the date, time and hours first, then a card of facts (hours modifier, timebank, location, activity, unit, rank). Tracking tags, assets and extra activities go in a second column when they exist.</Text>
          <Text size="sm"><strong>Leave</strong> shows the period as two points on a line, then the assignments it replaces, with their hours.</Text>
          <Text size="sm"><strong>Pending</strong> items carry a Pending badge with a clock in the top-right corner.</Text>
          <Text size="sm"><strong>Tasks from a scheduler</strong> start with a read-only notice and show whether each reminder was acknowledged.</Text>
        </Stack>
      </Section>

      <Section id="add-task" title="Adding a task" description="Employees add their own tasks with Add or the + on a day. A task has a name, a date, an optional time, an activity, recurrence, reminders and a note.">
        <AddTaskDemo />
        <Stack gap="xs" mt="md">
          <Text size="sm"><strong>All day or a set time.</strong> The time field stays visible but disabled until Set time is picked.</Text>
          <Text size="sm"><strong>Reminders</strong> appear as cards, up to three. Turn on Repeats to choose how often and until when.</Text>
          <Text size="sm"><strong>Delete</strong> only appears when editing an existing task.</Text>
        </Stack>
      </Section>

      <Section id="mobile" title="Mobile" description="On a phone the title, Add and the toolbar stay at the top. The calendar scrolls underneath.">
        <MobileDemo />
      </Section>

      <Section id="component" title="Using the components" description="The demos use the real components in src/components/calendar.">
        <Text size="sm" fw={600} mb="xs">MonthView, TimeGridView, AgendaView</Text>
        <PropsTable rows={[
          { prop: 'days', type: 'number[]', description: 'Visible days. Use viewDays(view, anchor): whole weeks for month, seven days for week and agenda, one for day.' },
          { prop: 'events', type: 'CalendarEvent[]', description: 'Events with a day, a kind, and start and end hours. Leave both out for all-day.' },
          { prop: 'signUps', type: 'SignUp[]', description: 'Open shifts. Shown as one “n sign-ups available” item per day.' },
          { prop: 'holidays', type: 'Holiday[]', description: 'Shown at the top of the day.' },
          { prop: 'today', type: 'number', description: 'Highlights today.' },
          { prop: 'compact', type: 'boolean', default: 'false', description: 'Phone layout: narrow columns, titles only in month view, no + buttons.' },
          { prop: 'onOpenEvent', type: '(event: CalendarEvent) => void', description: 'Called when an event is clicked.' },
          { prop: 'onOpenSignUps', type: '(day: number) => void', description: 'Called when the sign-ups item is clicked.' },
          { prop: 'onAdd', type: '(day: number) => void', description: 'Shows a + on the day under the pointer.' },
          { prop: 'month', type: 'number', description: 'MonthView only. A day in the month, so leading and trailing days are dimmed.' },
          { prop: 'now', type: 'number', description: 'TimeGridView only. Hour of the current-time line, e.g. 10.5.' },
        ]} />
        <Text size="sm" fw={600} mb="xs" mt="lg">useCalendarModals</Text>
        <PropsTable rows={[
          { prop: 'setEvents', type: 'Dispatch<SetStateAction<CalendarEvent[]>>', description: 'Adding, editing and deleting a task updates the list.' },
          { prop: 'signUps', type: 'SignUp[]', description: 'Listed in the sign-ups dialog.' },
          { prop: 'onHint', type: '(hint: string) => void', description: 'Preview-only messages, e.g. after saving.' },
        ]} />
        <Text size="sm" c="dimmed" mt="sm">It returns openEvent, openSignUps and addTask for the views, and the modals to render. EventChip, CalendarLegend, CalendarStepper and the dialogs are exported too. Kinds, views and CSS variables live in src/tokens/calendar.ts, mock data and date helpers in src/components/calendar/events.ts. The app frame is shared with Team View (ScheduleChrome.tsx).</Text>
      </Section>

      <Section id="tokens" title="CSS variables" description="Activity, overtime and leave reuse the schedule fills (--schedule-regular, --schedule-overtime, --schedule-leave) and the out-of-unit stripes (--schedule-hatch). These are new for the calendar.">
        <Table.ScrollContainer minWidth={640} className="doc-table">
          <Table verticalSpacing="xs" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th>Variable</Table.Th><Table.Th>Value</Table.Th><Table.Th>Usage</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {calendarTokens.map((token) => (
                <Table.Tr key={token.name}>
                  <Table.Td><CopyValue value={`var(${token.name})`} display={token.name} /></Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      {token.kind === 'color' && <span className={classes.swatch} style={{ background: `var(${token.name})` }} aria-hidden="true" />}
                      <Text size="xs" ff="monospace" c="dimmed">{token.light ? `${token.value} / ${token.light}` : token.value}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td><Text size="sm">{token.usage}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Text size="xs" c="dimmed" mt="xs">Two values are dark / light.</Text>
      </Section>

      <Section id="guidelines" title="Guidelines">
        <DoDont
          doItems={[
            'Use the same fills as Team View, so a shift looks the same in both places.',
            'Prefix pending items with “Pending:” and tasks with “Task:”, as well as styling them.',
            'Keep cancelled items on the calendar, struck through.',
            'Put holidays, sign-ups and all-day leave above timed events.',
            'Show times in 24-hour format with a leading zero, in Cousine on the timeline.',
          ]}
          dontItems={[
            'Shrink text to fit a busy day. Let the month cell grow or collapse tasks into a group.',
            'Make holidays clickable or style them like events.',
            'Let employees edit items a scheduler gave them. Open them read-only.',
            'Hide the + button from keyboard users. It appears on focus too.',
          ]}
        />
      </Section>

      <Section id="figma" title="Figma reference" description="Frames this page was built from.">
        <Stack gap="md">
          {([
            ['calendar-month.png', 'Calendar on desktop, month view of June 2026: events per day in their fills, a pending item with amber stripes, a holiday, a struck-through Gun Range, Tasks (x3) and sign-ups.'],
            ['calendar-week.png', 'Calendar on desktop, week view: all-day row with vacation, a holiday and sign-ups, then a 24-hour timeline with patrol blocks, a task and a red current-time line at 10:30.'],
            ['calendar-day.png', 'Calendar on desktop, day view: one centered column with sign-ups in the all-day row and two patrol blocks.'],
            ['calendar-agenda.png', 'Calendar on desktop, agenda view: days as headings with Today and Tomorrow labels, start times with durations, event bars and “No plans yet” for empty days.'],
          ] as const).map(([file, alt]) => <img key={file} src={`${import.meta.env.BASE_URL}figma/${file}`} alt={alt} className={classes.figma} />)}
          <div className={classes.figmaQuad}>
            {([
              ['calendar-mobile-month.png', 'Calendar on a phone, month view: legend under the toolbar and truncated event titles in seven narrow columns.'],
              ['calendar-mobile-week.png', 'Calendar on a phone, week view: seven narrow columns on the timeline with the current-time line.'],
              ['calendar-mobile-day.png', 'Calendar on a phone, day view: sign-ups and vacation in the all-day row above the timeline.'],
              ['calendar-mobile-agenda.png', 'Calendar on a phone, agenda view: days with times, durations and event bars.'],
            ] as const).map(([file, alt]) => <img key={file} src={`${import.meta.env.BASE_URL}figma/${file}`} alt={alt} className={classes.figma} />)}
          </div>
          <div className={classes.figmaPair}>
            {([
              ['calendar-assignment.png', 'Assignment details for Security: date, time and hours, a card of facts, tracking tags, assets, an unpaid lunch and an employee note.'],
              ['calendar-leave.png', 'Vacation details: the leave period on a two-point line, the assignment it replaces and rank and unit.'],
              ['calendar-leave-pending.png', 'Vacation details with a Pending badge.'],
              ['calendar-task.png', 'Read-only task from a scheduler: info notice, start date, activity, note and two reminders, one acknowledged and one not.'],
              ['calendar-sign-ups.png', 'Sign-ups for a day: two Long Weekend Coverage shifts with status, overtime, counts and a Go to Sign-ups link.'],
            ] as const).map(([file, alt]) => <img key={file} src={`${import.meta.env.BASE_URL}figma/${file}`} alt={alt} className={classes.figma} />)}
          </div>
          <img src={`${import.meta.env.BASE_URL}figma/calendar-add-task.png`} alt="Add Task dialog, empty and with one reminder: task name, start date, all day or set time, activity, recurrence, reminder card with Repeats, Add note, and Delete, Cancel and Submit." className={classes.figma} />
        </Stack>
      </Section>
    </>
  )
}
