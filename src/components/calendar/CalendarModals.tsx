import { useState, type ReactNode } from 'react'
import {
  ActionIcon, Alert, Anchor, Badge, Button, Checkbox, Group, Modal, SegmentedControl, Select, SimpleGrid, Stack, Text, TextInput, Textarea, Tooltip, UnstyledButton,
} from '@mantine/core'
import { Check, ChevronRight, Clock, Info, PieChart, Plus, StickyNote, Trash2, TriangleAlert } from 'lucide-react'
import { formatFullDate } from '../schedule/data'
import {
  PROFILE_DEFAULTS, formatHours, formatShortDate, formatTime, formatTimeRange, type CalendarEvent, type SignUp, type TaskReminder,
} from './events'
import classes from './CalendarModals.module.css'

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

export function Eyebrow({ children }: { children: ReactNode }) {
  return <Text size="xs" fw={600} c="dimmed" tt="uppercase" lts="0.06em">{children}</Text>
}

/** Bordered list of label / value rows. */
export function DetailCard({ rows, title }: { rows: [string, ReactNode][]; title?: string }) {
  return (
    <div className={classes.card}>
      {title && <Eyebrow>{title}</Eyebrow>}
      <dl className={classes.rows}>
        {rows.map(([label, value]) => (
          <div key={label} className={classes.row}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export const HoursBadge = ({ hours }: { hours: number }) => <Badge size="sm" variant="light" color="intime" className="tabular">{formatHours(hours)}</Badge>

export const PendingBadge = () => <Badge className={classes.pending} leftSection={<Clock size={14} aria-hidden="true" />} tt="none" size="lg">Pending</Badge>

function Note({ text, label = 'Employee note' }: { text: string; label?: string }) {
  return (
    <Stack gap="xs">
      <Eyebrow>{label}</Eyebrow>
      <Group gap="xs" wrap="nowrap" align="flex-start">
        <StickyNote size={18} aria-hidden="true" className={classes.noteIcon} />
        <Text fs="italic">{text}</Text>
      </Group>
    </Stack>
  )
}

function TagGroup({ label, values }: { label: string; values: string[] }) {
  return (
    <Stack gap={6}>
      <Eyebrow>{label}</Eyebrow>
      <Group gap={8}>{values.map((value) => <Badge key={value} variant="default" size="lg" tt="none" fw={400} radius="xl">{value}</Badge>)}</Group>
    </Stack>
  )
}

const Footer = ({ children }: { children: ReactNode }) => <Group justify="flex-end" mt="xl" gap="sm">{children}</Group>

const modalProps = { centered: true, classNames: { title: classes.title, header: classes.header, body: classes.body } }

/* ------------------------------------------------------------------ */
/* Details                                                             */
/* ------------------------------------------------------------------ */

function AssignmentDetails({ event }: { event: CalendarEvent }) {
  const details = event.details ?? {}
  const start = event.start ?? 0
  const end = event.end ?? 24
  const rows: [string, ReactNode][] = [
    ['Hours modifier', details.hoursModifier ?? (event.kind === 'overtime' ? 'OT · Overtime' : 'Regular')],
    ...(details.timebank ? [['Timebank', details.timebank] as [string, ReactNode]] : []),
    ...(details.bankedHours ? [['Banked hours', <span className="tabular" key="b">{details.bankedHours}</span>] as [string, ReactNode]] : []),
    ...(details.location ? [['Location', <Stack gap={2} align="flex-end" key="l"><span>{details.location.name}</span>{details.location.address && <Anchor size="md" href="#" onClick={(e) => e.preventDefault()}>{details.location.address}</Anchor>}</Stack>] as [string, ReactNode]] : []),
    ['Activity', <Badge key="a" className={classes.activityBadge}>{details.activity ?? event.title}</Badge>],
    ['Unit', details.unit ?? PROFILE_DEFAULTS.unit],
    ...(event.outOfUnit ? [['Home unit', PROFILE_DEFAULTS.unit] as [string, ReactNode]] : []),
    ['Rank', details.rank ?? PROFILE_DEFAULTS.rank],
  ]
  const side = details.trackingTags || details.assets || details.additional
  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div>
          <Text fw={600}>Assignment date</Text>
          <Group gap={8} mt={4}>
            <Text size="lg" className="tabular">{formatFullDate(event.day)} · {formatTimeRange(start, end)}</Text>
            <HoursBadge hours={end - start} />
          </Group>
        </div>
        {event.pending && <PendingBadge />}
        {event.cancelled && <Badge variant="light" color="gray" size="lg" tt="none">Cancelled</Badge>}
      </Group>
      <SimpleGrid cols={{ base: 1, sm: side ? 2 : 1 }} spacing="xl">
        <DetailCard rows={rows} />
        {side && (
          <Stack gap="lg">
            <SimpleGrid cols={2}>
              {details.trackingTags && <Stack gap="sm"><Eyebrow>Tracking tags</Eyebrow>{details.trackingTags.map((tag) => <TagGroup key={tag.label} {...tag} />)}</Stack>}
              {details.assets && <Stack gap="sm"><Eyebrow>Assets</Eyebrow>{details.assets.map((asset) => <TagGroup key={asset.label} {...asset} />)}</Stack>}
            </SimpleGrid>
            {details.additional && (
              <Stack gap="xs">
                <Eyebrow>Additional information</Eyebrow>
                <dl className={classes.rows}>
                  <div className={classes.row}><dt>Hours</dt><dd className="tabular">{details.additional.hours}</dd></div>
                  <div className={classes.row}><dt>Activity</dt><dd><Badge className={classes.activityBadge} data-kind="leave">{details.additional.activity}</Badge></dd></div>
                  <div className={classes.row}><dt>Hours modifier</dt><dd>{details.additional.hoursModifier}</dd></div>
                </dl>
              </Stack>
            )}
          </Stack>
        )}
      </SimpleGrid>
      {event.note && <Note text={event.note} />}
    </Stack>
  )
}

function LeaveDetailsBody({ event }: { event: CalendarEvent }) {
  const leave = event.leave
  if (!leave) return null
  return (
    <Stack gap="lg">
      {event.pending && <Group justify="flex-end"><PendingBadge /></Group>}
      <ol className={classes.timeline} aria-label="Leave period">
        <li><span className={classes.dot} data-filled aria-hidden="true" />{formatFullDate(leave.from.day)} - {formatTime(leave.from.hour)}</li>
        <li><span className={classes.dot} aria-hidden="true" />{formatFullDate(leave.to.day)} - {formatTime(leave.to.hour)}</li>
      </ol>
      <div className={classes.card} data-tinted>
        <Eyebrow>On leave from</Eyebrow>
        <Stack gap="md" mt="md">
          {leave.replaces.map((item) => (
            <div key={item.day}>
              <Text fw={600} size="sm">Assignment date</Text>
              <Group gap={8} mt={2}>
                <Text className="tabular">{formatFullDate(item.day)} · {formatTimeRange(item.start, item.end)}</Text>
                <HoursBadge hours={item.end - item.start} />
              </Group>
            </div>
          ))}
        </Stack>
      </div>
      <DetailCard rows={[['Rank', leave.rank], ['Unit', leave.unit]]} />
    </Stack>
  )
}

function ReminderStatus({ acknowledged }: { acknowledged?: boolean }) {
  if (acknowledged === undefined) return null
  return acknowledged
    ? <Group gap={6} c="var(--text-success-default)"><Check size={16} aria-hidden="true" /><Text inherit>Acknowledged</Text></Group>
    : <Group gap={6} c="var(--text-warning-default)"><TriangleAlert size={16} aria-hidden="true" /><Text inherit>Not acknowledged</Text></Group>
}

function TaskDetailsBody({ event }: { event: CalendarEvent }) {
  return (
    <Stack gap="lg">
      <Alert variant="light" color="blue" icon={<Info size={18} />}>Read-only: {event.assignedBy ?? 'A scheduler'} assigned this task to you.</Alert>
      <dl className={classes.rows}>
        <div className={classes.row}><dt>Start date</dt><dd className="tabular">{formatFullDate(event.day)}{event.start !== undefined && ` · ${formatTime(event.start)}`}</dd></div>
        {event.activity && <div className={classes.row}><dt>Activity</dt><dd>{event.activity}</dd></div>}
      </dl>
      {event.note && <Note text={event.note} label="Note" />}
      {event.reminders?.map((reminder, index) => (
        <div className={classes.card} key={index}>
          <Group justify="space-between">
            <Eyebrow>Reminder {index + 1}</Eyebrow>
            <ReminderStatus acknowledged={reminder.acknowledged} />
          </Group>
          <dl className={classes.rows} style={{ marginTop: 12 }}>
            <div className={classes.row}><dt>Remind</dt><dd>{reminder.when}</dd></div>
            {reminder.repeats && <div className={classes.row}><dt>Repeats</dt><dd>{reminder.repeats}</dd></div>}
            {reminder.until && <div className={classes.row}><dt>Until</dt><dd>{reminder.until}</dd></div>}
          </dl>
        </div>
      ))}
    </Stack>
  )
}

/** Read-only details of an event. Leave, a scheduler’s task and assignments each get their own layout. */
export function EventDetailsModal({ event, onClose }: { event: CalendarEvent | null; onClose: () => void }) {
  const wide = !!(event?.details?.trackingTags || event?.details?.assets || event?.details?.additional)
  return (
    <Modal {...modalProps} opened={!!event} onClose={onClose} size={wide ? 880 : 520} title={event?.title ?? ''}>
      {event && (event.leave ? <LeaveDetailsBody event={event} /> : event.kind === 'task' ? <TaskDetailsBody event={event} /> : <AssignmentDetails event={event} />)}
      <Footer><Button variant="default" onClick={onClose}>Close</Button></Footer>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Sign-ups                                                            */
/* ------------------------------------------------------------------ */

export function SignUpsModal({ day, signUps, onClose, onHint }: { day: number | null; signUps: SignUp[]; onClose: () => void; onHint: (hint: string) => void }) {
  const items = signUps.filter((item) => item.day === day)
  return (
    <Modal {...modalProps} opened={day !== null} onClose={onClose} size={600} title={day !== null ? `Sign-ups for ${formatShortDate(day)}` : ''}>
      <Stack gap={4}>
        {items.map((item) => (
          <UnstyledButton key={item.id} className={classes.signUp} onClick={() => { onHint(`Opening “${item.title}” is not part of this demo.`); onClose() }}>
            <div>
              <Text fw={600} className={classes.signUpTitle}>{item.title}</Text>
              <Text mt="sm" className="tabular">{formatShortDate(item.day)} · {formatTimeRange(item.start, item.end)}</Text>
              <Group gap={8} mt={2}>
                <Text fw={600}>{item.activity}</Text>
                <Badge variant="default" radius="xl" tt="none" className={classes.tag}>{item.tag}</Badge>
              </Group>
              {item.splits && <Group gap={6} mt={4} c="var(--text-info)"><PieChart size={16} aria-hidden="true" /><Text inherit>Splits ({item.splits})</Text></Group>}
            </div>
            <Stack gap={4} align="flex-end">
              <Badge variant="light" color="green" tt="none">Available</Badge>
              {item.overtime && <Group gap={4}><Clock size={14} aria-hidden="true" /><Text size="sm">Overtime</Text></Group>}
              <Text size="sm" fw={600} className="tabular">Sign-ups: {item.signUps}</Text>
              <Text size="sm" fw={600} className="tabular">Positions: {item.positions}</Text>
              <Text size="sm" fw={600} className="tabular">Filled: {item.filled}</Text>
            </Stack>
          </UnstyledButton>
        ))}
      </Stack>
      <Footer>
        <Button variant="subtle" color="intime" className={classes.link} rightSection={<ChevronRight size={16} />} onClick={() => { onHint('The Sign-ups page is not part of this guide yet.'); onClose() }}>Go to Sign-ups</Button>
      </Footer>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Add or edit a task                                                  */
/* ------------------------------------------------------------------ */

const toIso = (day: number) => new Date(day * 86_400_000).toISOString().slice(0, 10)
const fromIso = (value: string) => Date.parse(`${value}T00:00:00Z`) / 86_400_000
const toHour = (value: string) => { const [h, m] = value.split(':').map(Number); return h + m / 60 }

const activities = ['None', 'Break', 'Paperwork', 'Training', 'Patrol']
const recurrences = ['None', 'Every day', 'Every week', 'Every two weeks', 'Every month']
const reminderWhen = ['Day of event', '1 day before', '2 days before', '1 week before']
const reminderRepeats = ['Every day', 'Every Sunday', 'Every week']
const reminderUntil = ['Until removed', 'Until the task date']
const MAX_REMINDERS = 3

interface ReminderDraft { when: string; repeats: boolean; every: string; until: string }

function TaskForm({ day, task, onClose, onSave, onDelete }: {
  day: number
  task?: CalendarEvent
  onClose: () => void
  onSave: (task: CalendarEvent, recurrence: string) => void
  onDelete: (task: CalendarEvent) => void
}) {
  const [name, setName] = useState(task?.title ?? '')
  const [date, setDate] = useState(toIso(task?.day ?? day))
  const [timeMode, setTimeMode] = useState(task?.start !== undefined ? 'set' : 'all')
  const [time, setTime] = useState(task?.start !== undefined ? formatTime(task.start) : '10:00')
  const [activity, setActivity] = useState(task?.activity ?? 'None')
  const [recurrence, setRecurrence] = useState('None')
  const [reminders, setReminders] = useState<ReminderDraft[]>(
    (task?.reminders ?? []).map((reminder) => ({ when: reminder.when, repeats: !!reminder.repeats, every: reminder.repeats ?? 'Every Sunday', until: reminder.until ?? 'Until removed' })),
  )
  const [noteOpen, setNoteOpen] = useState(!!task?.note)
  const [note, setNote] = useState(task?.note ?? '')
  const [error, setError] = useState<string | null>(null)

  const updateReminder = (index: number, patch: Partial<ReminderDraft>) => setReminders((list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)))

  const submit = () => {
    if (!name.trim()) { setError('Enter a task name.'); return }
    const saved: CalendarEvent = {
      id: task?.id ?? `task-${Date.now()}`,
      day: fromIso(date) || day,
      title: name.trim(),
      kind: 'task',
      start: timeMode === 'set' ? toHour(time) : undefined,
      activity: activity === 'None' ? undefined : activity,
      note: noteOpen && note.trim() ? note.trim() : undefined,
      reminders: reminders.map((item): TaskReminder => ({ when: item.when, repeats: item.repeats ? item.every : undefined, until: item.repeats ? item.until : undefined })),
    }
    onSave(saved, recurrence)
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit() }}>
      <Stack gap="lg">
        <TextInput label="Task name" placeholder="Fill out timesheet…" withAsterisk value={name} onChange={(e) => { setName(e.currentTarget.value); setError(null) }} error={error} data-autofocus />
        <Stack gap="sm">
          <Eyebrow>Date</Eyebrow>
          <SimpleGrid cols={{ base: 1, xs: 2 }}>
            <TextInput label="Start date" type="date" value={date} onChange={(e) => setDate(e.currentTarget.value)} />
            <Stack gap={8}>
              <Text size="sm" fw={500} id="task-time-label">Time</Text>
              <SegmentedControl fullWidth value={timeMode} onChange={setTimeMode} aria-labelledby="task-time-label" data={[{ value: 'all', label: 'All day' }, { value: 'set', label: 'Set time' }]} />
              <TextInput type="time" aria-label="Start time" value={time} onChange={(e) => setTime(e.currentTarget.value)} disabled={timeMode === 'all'} className="tabular" />
            </Stack>
          </SimpleGrid>
        </Stack>
        <Stack gap="sm">
          <Eyebrow>Details</Eyebrow>
          <SimpleGrid cols={{ base: 1, xs: 2 }}>
            <Select label="Activity" data={activities} value={activity} onChange={(value) => setActivity(value ?? 'None')} allowDeselect={false} comboboxProps={{ withinPortal: true }} />
            <Select label="Recurrence" data={recurrences} value={recurrence} onChange={(value) => setRecurrence(value ?? 'None')} allowDeselect={false} disabled={!!task} description={task ? 'Set when the task is created.' : undefined} />
          </SimpleGrid>
        </Stack>
        {reminders.map((reminder, index) => (
          <div className={classes.card} key={index}>
            <Group justify="space-between" mb="md">
              <Eyebrow>Reminder {index + 1}</Eyebrow>
              <Tooltip label="Remove reminder">
                <ActionIcon variant="light" color="red" aria-label={`Remove reminder ${index + 1}`} onClick={() => setReminders((list) => list.filter((_, i) => i !== index))}><Trash2 size={16} /></ActionIcon>
              </Tooltip>
            </Group>
            <Stack gap="md">
              <Select aria-label={`Reminder ${index + 1}: when`} data={reminderWhen} value={reminder.when} onChange={(value) => updateReminder(index, { when: value ?? reminder.when })} allowDeselect={false} />
              <SimpleGrid cols={{ base: 1, xs: 2 }}>
                <Checkbox label="Repeats" checked={reminder.repeats} onChange={(e) => updateReminder(index, { repeats: e.currentTarget.checked })} mt={8} />
                <Stack gap="sm">
                  <Select aria-label="Repeats" data={reminderRepeats} value={reminder.every} onChange={(value) => updateReminder(index, { every: value ?? reminder.every })} disabled={!reminder.repeats} allowDeselect={false} />
                  <Select aria-label="Until" data={reminderUntil} value={reminder.until} onChange={(value) => updateReminder(index, { until: value ?? reminder.until })} disabled={!reminder.repeats} allowDeselect={false} />
                </Stack>
              </SimpleGrid>
            </Stack>
          </div>
        ))}
        <Stack gap={4} align="flex-start">
          {reminders.length < MAX_REMINDERS && (
            <Button variant="subtle" leftSection={<Plus size={16} />} onClick={() => setReminders((list) => [...list, { when: 'Day of event', repeats: false, every: 'Every Sunday', until: 'Until removed' }])}>Add reminder</Button>
          )}
          {!noteOpen && <Button variant="subtle" leftSection={<Plus size={16} />} onClick={() => setNoteOpen(true)}>Add note</Button>}
        </Stack>
        {noteOpen && <Textarea label="Note" autosize minRows={2} value={note} onChange={(e) => setNote(e.currentTarget.value)} placeholder="Anything to remember for this task" />}
      </Stack>
      <Group justify="space-between" mt="xl">
        {task ? <Button variant="light" color="red" onClick={() => onDelete(task)}>Delete</Button> : <span />}
        <Group gap="sm">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button type="submit">{task ? 'Save' : 'Submit'}</Button>
        </Group>
      </Group>
    </form>
  )
}

export function TaskFormModal({ state, onClose, onSave, onDelete }: {
  state: { key: number; day: number; task?: CalendarEvent; opened: boolean }
  onClose: () => void
  onSave: (task: CalendarEvent, recurrence: string) => void
  onDelete: (task: CalendarEvent) => void
}) {
  return (
    <Modal {...modalProps} opened={state.opened} onClose={onClose} size={560} title={state.task ? 'Edit task' : 'Add task'}>
      <TaskForm key={state.key} day={state.day} task={state.task} onClose={onClose} onSave={onSave} onDelete={onDelete} />
    </Modal>
  )
}
