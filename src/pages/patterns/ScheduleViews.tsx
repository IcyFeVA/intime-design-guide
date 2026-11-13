import { Fragment, useState, type CSSProperties } from 'react'
import { Alert, Avatar, Badge, Button, Divider, Group, Paper, SimpleGrid, Text } from '@mantine/core'
import { ArrowLeftRight, CalendarClock, Check, UserPlus, X } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import FigmaSlot from '../../components/FigmaSlot'
import DoDont from '../../components/DoDont'
import CodeBlock from '../../components/CodeBlock'
import { shiftStates, departments } from '../../tokens/status'
import classes from './ScheduleViews.module.css'

const stateByKey = (key: string) => shiftStates.find((state) => state.key === key)!
const days = ['Mon 4', 'Tue 5', 'Wed 6', 'Thu 7', 'Fri 8', 'Sat 9', 'Sun 10']
const members = [
  { name: 'A. Rivera', unit: 'Patrol D4', department: departments[0], shifts: ['scheduled', 'scheduled', 'training', 'off', 'scheduled', 'overtime', 'off'] },
  { name: 'J. Chen', unit: 'Engine 12', department: departments[1], shifts: ['scheduled', 'off', 'scheduled', 'scheduled', 'off', 'scheduled', 'leave'] },
  { name: 'Open assignment', unit: 'Ladder 3', department: departments[1], shifts: ['open', 'off', 'open', 'scheduled', 'off', 'open', 'off'] },
]

function Shift({ stateKey, name, compact = false }: { stateKey: string; name?: string; compact?: boolean }) {
  const state = stateByKey(stateKey)
  const Icon = state.icon
  return (
    <div className={classes.shift} style={{ '--shift-color': `var(--mantine-color-${state.color}-5)` } as CSSProperties}>
      <Group gap={4} wrap="nowrap" mb={compact ? 0 : 4}><Icon size={12} /><Text size="10px" fw={600} truncate>{state.label}</Text></Group>
      {name && <Text size="11px" fw={500} truncate>{name}</Text>}
      <Text size="10px" c="dimmed" className="tabular">{stateKey === 'training' ? '09:00–12:00' : '07:00–19:00'}</Text>
    </div>
  )
}

function Toolbar({ title, caption }: { title: string; caption: string }) {
  return <div className={classes.toolbar}><div><Text size="sm" fw={600}>{title}</Text><Text size="xs" c="dimmed">{caption}</Text></div><Badge size="xs" color="yellow" variant="light">Static example</Badge></div>
}

export default function ScheduleViews() {
  const [decision, setDecision] = useState<'approved' | 'denied' | null>(null)
  return (
    <>
      <PageHeader />
      <Section id="day" title="Day view" description="A time-first view for supervisors scanning today's coverage. Keep the 64px time gutter fixed while unit columns scroll.">
        <div className={classes.scroll}>
          <Toolbar title="Monday, May 4" caption="Day view · District 4 & Station 3" />
          <div className={classes.day}>
            <div className={classes.dayHead} />
            {['Patrol D4', 'Engine 12', 'Ladder 3'].map((unit) => <div className={classes.dayHead} key={unit}>{unit}</div>)}
            {['07:00', '08:00', '09:00', '10:00'].map((hour, row) => <Fragment key={hour}>
              <div className={`${classes.time} tabular`}>{hour}</div>
              {[0, 1, 2].map((column) => <div className={classes.cell} key={column}>
                {row === 0 && <Shift stateKey={column === 2 ? 'open' : 'on-duty'} name={['A. Rivera', 'J. Chen', 'Needs coverage'][column]} />}
                {row === 2 && column === 0 && <Shift stateKey="training" name="C. Brooks · EVOC" />}
              </div>)}
            </Fragment>)}
          </div>
        </div>
        <Text size="xs" c="dimmed" mt="sm">Illustrative time slots only; block heights do not represent the full 12-hour duration in this cropped specimen.</Text>
      </Section>
      <Section id="week" title="Week view" description="A member-first matrix for staffing and rotations. Time range, state icon and text remain visible even in a compact cell.">
        <div className={classes.scroll}>
          <Toolbar title="May 4–10, 2026" caption="Week view · 3 assignments" />
          <div className={classes.week}>
            <div className={classes.weekLabel}><Text size="xs" c="dimmed">Member / unit</Text></div>
            {days.map((day) => <div className={classes.weekLabel} key={day}><Text size="xs" fw={600} className="tabular">{day}</Text></div>)}
            {members.map((member) => <Fragment key={member.name}>
              <div className={classes.weekLabel}><Text size="xs" fw={600}>{member.name}</Text><Text size="10px" c="dimmed" mb={6}>{member.unit}</Text><Badge size="xs" variant="light" color={member.department.color}>{member.department.label}</Badge></div>
              {member.shifts.map((key, index) => <div className={classes.weekCell} key={index}>{key === 'off' ? <Text size="10px" c="dimmed" ta="center" mt="sm">— Off</Text> : <Shift stateKey={key} compact />}</div>)}
            </Fragment>)}
          </div>
        </div>
      </Section>
      <Section id="month" title="Month view" description="An overview of staffing patterns, not a miniature week view. Limit visible assignments per date and use an overflow count rather than shrinking text.">
        <div className={classes.scroll}>
          <Toolbar title="May 2026" caption="Month view · Platoon A" />
          <div className={classes.month}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <div className={classes.monthHead} key={day}>{day}</div>)}
            {Array.from({ length: 35 }, (_, index) => {
              const date = index - 3
              const inMonth = date > 0 && date <= 31
              const day = inMonth ? date : date <= 0 ? 30 + date : date - 31
              return <div className={classes.monthCell} data-muted={!inMonth || undefined} key={index}>
                <span className={`${classes.date} tabular`} data-today={date === 4 || undefined}>{day}</span>
                {inMonth && date % 3 !== 0 && <div className={classes.monthEvent}><Group gap={3} wrap="nowrap"><CalendarClock size={10} color="var(--mantine-color-intime-4)" /><span>07:00 · Platoon A</span></Group></div>}
                {inMonth && date % 5 === 0 && <div className={classes.monthEvent}><Group gap={3} wrap="nowrap"><UserPlus size={10} color="var(--mantine-color-yellow-5)" /><span>2 open shifts</span></Group></div>}
                {inMonth && date % 4 === 0 && <Text size="10px" c="dimmed" mt={4}>+3 more</Text>}
              </div>
            })}
          </div>
        </div>
        <div style={{ marginTop: 16 }}><DoDont doItems={['Keep a stable weekday order and a clear today marker.', 'Show a count or overflow link when a date contains many shifts.']} dontItems={['Use color alone to indicate staffing risk.', 'Hide the active date range while scrolling.']} /></div>
      </Section>
      <Section id="swap-request" title="Shift swap request" description="Make the before and after explicit. Approval is a deliberate action, separate from viewing request details.">
        <Paper withBorder p="lg" style={{ background: 'var(--intime-surface)', borderColor: 'var(--intime-border)' }}>
          <Group justify="space-between" mb="lg" wrap="nowrap"><Group gap="sm"><Avatar color="police" radius="xl">AR</Avatar><div><Text size="sm" fw={600}>Alex Rivera</Text><Text size="xs" c="dimmed">Requested a shift swap · 12 minutes ago</Text></div></Group><Badge color={decision === 'approved' ? 'green' : decision === 'denied' ? 'red' : 'yellow'} variant="light">{decision ?? 'Pending'}</Badge></Group>
          <SimpleGrid cols={{ base: 1, sm: 2 }} mb="lg">
            {[['Give', 'Mon, May 4 · 07:00–19:00', 'Patrol D4 · Alex Rivera'], ['Receive', 'Wed, May 6 · 07:00–19:00', 'Patrol D4 · Sam Patel']].map(([label, date, unit]) => <Paper withBorder p="md" key={label} style={{ background: 'var(--mantine-color-body)', borderColor: 'var(--intime-border)' }}><Text size="xs" c="dimmed" mb={6}>{label}</Text><Text size="sm" fw={600} className="tabular">{date}</Text><Text size="xs" c="dimmed">{unit}</Text></Paper>)}
          </SimpleGrid>
          <Alert icon={<ArrowLeftRight size={16} />} color="cyan" variant="light" mb="lg">Both members hold the required qualifications. No rest-period conflicts detected.</Alert>
          <Divider mb="md" />
          <Group justify="space-between"><Text size="xs" c="dimmed">Demo only · no roster changes are saved</Text><Group gap="xs">{decision ? <Button variant="subtle" size="xs" onClick={() => setDecision(null)}>Reset demo</Button> : <><Button variant="default" size="sm" leftSection={<X size={14} />} onClick={() => setDecision('denied')}>Deny</Button><Button size="sm" leftSection={<Check size={14} />} onClick={() => setDecision('approved')}>Approve swap</Button></>}</Group></Group>
        </Paper>
        {decision && <Text role="status" size="sm" c={decision === 'approved' ? 'green' : 'red'} mt="sm">Request {decision} in this preview.</Text>}
        <CodeBlock title="Pattern anatomy" code={'<SwapRequest>\n  <Requester />\n  <ShiftComparison from={originalShift} to={proposedShift} />\n  <QualificationCheck />\n  <ApprovalActions />\n</SwapRequest>'} />
      </Section>
      <Section id="figma" title="Figma reference">
        <FigmaSlot title="Awaiting schedule and swap-request frames" notes="Share day/week/month views with selected, hovered, open-shift and conflict states. Include the intended density, week-start setting, time format and approval behavior." />
      </Section>
    </>
  )
}
