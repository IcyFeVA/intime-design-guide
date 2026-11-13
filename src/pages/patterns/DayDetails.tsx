import { useState } from 'react'
import { Button, Group, Stack, Table, Text } from '@mantine/core'
import { ArrowRight, Maximize2 } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import Preview from '../../components/Preview'
import DoDont from '../../components/DoDont'
import CodeBlock from '../../components/CodeBlock'
import PropsTable from '../../components/PropsTable'
import { PhoneFrame } from '../../components/schedule/ScheduleChrome'
import { eventTime, formatTimeRange } from '../../components/calendar/events'
import { DayDetailsContent, DayDetailsModal } from '../../components/day-details/DayDetails'
import {
  DAY_DETAILS_DAY, DAY_DETAILS_NOW, findScenario, resolveDay, type DayScenario, type DayScenarioKey,
} from '../../components/day-details/resolve'
import classes from './DayDetails.module.css'

const STATUS = 'Preview only. “Now” is 10:30 on Wednesday, September 23, 2026.'

/** What was scheduled, next to what the day details show. */
function ScheduledVsShown({ scenario }: { scenario: DayScenario }) {
  const shown = resolveDay(DAY_DETAILS_DAY, scenario.activities, scenario.leaves)
  const scheduled = [
    ...scenario.activities.map((activity) => ({ key: activity.id, title: activity.title, time: formatTimeRange(activity.start, activity.end) })),
    ...scenario.leaves.map((leave) => {
      const activity = scenario.activities.find((item) => item.id === leave.replaces)
      return { key: `leave-${leave.type}`, title: `${leave.type} leave`, time: activity ? `Replaces ${activity.title}` : 'All day' }
    }),
  ]
  const list = (items: { key: string; title: string; time: string; leave?: boolean }[]) => (
    <Stack gap={6}>
      {items.map((item) => (
        <div key={item.key} className={classes.line} data-leave={item.leave || undefined}>
          <span className={classes.lineTitle}>{item.title}</span>
          <span className={`${classes.lineTime} tabular`}>{item.time}</span>
        </div>
      ))}
    </Stack>
  )
  return (
    <div className={classes.compare}>
      <div>
        <Text size="xs" fw={600} c="dimmed" tt="uppercase" lts="0.06em" mb="xs">Scheduled</Text>
        {list(scheduled)}
      </div>
      <ArrowRight size={20} className={classes.compareArrow} aria-hidden="true" />
      <div>
        <Text size="xs" fw={600} c="dimmed" tt="uppercase" lts="0.06em" mb="xs">Shown</Text>
        {list(shown.map((event) => ({ key: event.id, title: event.title, time: eventTime(event), leave: event.kind === 'leave' })))}
      </div>
    </div>
  )
}

/** Desktop modal and phone side by side for one scenario, with the real modal one click away. */
function ScenarioDemo({ scenarioKey }: { scenarioKey: DayScenarioKey }) {
  const scenario = findScenario(scenarioKey)
  const events = resolveDay(DAY_DETAILS_DAY, scenario.activities, scenario.leaves)
  const [opened, setOpened] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const common = {
    name: scenario.name,
    day: DAY_DETAILS_DAY,
    events,
    now: DAY_DETAILS_NOW,
    onClose: () => setHint('Closing is preview-only here. Open the real modal to try it.'),
    onOpenEvent: () => setHint('In the product, an event opens its details. Not part of this demo.'),
  }

  return (
    <Preview flush title={scenario.label}>
      <Group justify="space-between" px="md" py="xs" className={classes.demoBar}>
        <Text size="xs" c="dimmed" role="status">{hint ?? STATUS}</Text>
        <Button variant="default" size="compact-xs" leftSection={<Maximize2 size={14} />} onClick={() => { setHint(null); setOpened(true) }}>
          Open as modal
        </Button>
      </Group>
      <div className={classes.stage}>
        <div className={classes.modalMock}>
          <DayDetailsContent {...common} />
        </div>
        <PhoneFrame bare>
          <DayDetailsContent {...common} variant="mobile" />
        </PhoneFrame>
      </div>
      <DayDetailsModal {...common} opened={opened} onClose={() => setOpened(false)} />
    </Preview>
  )
}

export default function DayDetails() {
  return (
    <>
      <PageHeader />

      <Section
        id="back-to-back"
        title="Back-to-back activities"
        description="Tapping a shift cell in Team View opens that person’s day on a timeline. Each activity is a block at its own hours, with its code and time."
      >
        <ScenarioDemo scenarioKey="back-to-back" />
        <ScheduledVsShown scenario={findScenario('back-to-back')} />
        <Stack gap="xs" mt="md">
          <Text size="sm"><strong>One block per activity.</strong> When one ends as the next starts, the blocks sit on top of each other with a small gap.</Text>
          <Text size="sm"><strong>Same fills as Team View.</strong> Regular activities are blue, overtime red and leave yellow.</Text>
          <Text size="sm"><strong>Now.</strong> On today, a red line and time label mark the current time.</Text>
        </Stack>
      </Section>

      <Section
        id="partial-leave"
        title="Leave on one activity"
        description="Leave always takes precedence. When an activity on leave overlaps another activity, the leave keeps its full hours and the other activity is cut back."
      >
        <ScenarioDemo scenarioKey="partial-leave" />
        <ScheduledVsShown scenario={findScenario('partial-leave')} />
        <Stack gap="xs" mt="md">
          <Text size="sm"><strong>The leave replaces the activity.</strong> PatG’s hours, 03:00–08:00, show as Vacation.</Text>
          <Text size="sm"><strong>The overlap names its source.</strong> PatG and PatD were both scheduled from 07:00 to 08:00. That hour shows as “Vacation from: PatG”, so it is clear why PatD starts late.</Text>
          <Text size="sm"><strong>The other activity is cut back.</strong> PatD was scheduled from 07:00 but shows from 08:00, when the leave ends. If the leave sits in the middle of an activity, the activity shows as two blocks.</Text>
        </Stack>
      </Section>

      <Section
        id="all-day-leave"
        title="All-day leave"
        description="An all-day leave overrides every activity on the day. It sits in the all-day row, and each activity turns into leave."
      >
        <ScenarioDemo scenarioKey="all-day-leave" />
        <ScheduledVsShown scenario={findScenario('all-day-leave')} />
        <Stack gap="xs" mt="md">
          <Text size="sm"><strong>All-day row.</strong> “On Leave: Vacation” runs across the top of the day.</Text>
          <Text size="sm"><strong>Activities keep their hours.</strong> Each one stays on the timeline in the leave fill, titled “Vacation from: PatG”, so the person can still see what the leave replaced.</Text>
        </Stack>
      </Section>

      <Section id="rules" title="Precedence rules" description="How the day is worked out from what was scheduled. Apply them in this order.">
        <Table.ScrollContainer minWidth={560} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Scheduled</Table.Th>
                <Table.Th>Shown</Table.Th>
                <Table.Th>Label</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td><Text size="sm" fw={600}>All-day leave</Text></Table.Td>
                <Table.Td><Text size="sm">A bar in the all-day row, and every activity in the leave fill at its own hours.</Text></Table.Td>
                <Table.Td><Text size="sm" className="tabular">On Leave: Vacation<br />Vacation from: PatG</Text></Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td><Text size="sm" fw={600}>Leave on an activity</Text></Table.Td>
                <Table.Td><Text size="sm">The activity’s hours in the leave fill.</Text></Table.Td>
                <Table.Td><Text size="sm" className="tabular">Vacation</Text></Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td><Text size="sm" fw={600}>…overlapping another activity</Text></Table.Td>
                <Table.Td><Text size="sm">The overlap stays leave, as its own block. The other activity loses those hours.</Text></Table.Td>
                <Table.Td><Text size="sm" className="tabular">Vacation from: PatG</Text></Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td><Text size="sm" fw={600}>Activities only</Text></Table.Td>
                <Table.Td><Text size="sm">Each at its own hours. Two activities that overlap without leave sit side by side.</Text></Table.Td>
                <Table.Td><Text size="sm" className="tabular">PatD</Text></Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Section>

      <Section id="component" title="Using the component" description="The demos use the real components in src/components/day-details. Work out the day with resolveDay, then pass the events to the modal.">
        <CodeBlock code={`const events = resolveDay(day, [
  { id: 'patg', title: 'PatG', start: 3, end: 8 },
  { id: 'patd', title: 'PatD', start: 7, end: 12 },
], [{ type: 'Vacation', replaces: 'patg' }])

<DayDetailsModal
  opened={opened}
  onClose={close}
  name="Ronald Richards"
  day={day}
  events={events}
  now={nowHour}
  variant={isPhone ? 'mobile' : 'desktop'}
/>`} />
        <Text size="sm" fw={600} mb="xs" mt="lg">resolveDay(day, activities, leaves)</Text>
        <PropsTable rows={[
          { prop: 'day', type: 'number', description: 'Day number, as in the schedule data.' },
          { prop: 'activities', type: 'DayActivity[]', description: 'What was scheduled: id, title (shift code), start and end hour, optional kind.' },
          { prop: 'leaves', type: 'DayLeave[]', description: 'Leave type, and the id of the activity it replaces. Leave out replaces for an all-day leave.' },
        ]} />
        <Text size="sm" fw={600} mb="xs" mt="lg">DayDetailsModal</Text>
        <PropsTable rows={[
          { prop: 'opened', type: 'boolean', description: 'Shows the modal.' },
          { prop: 'onClose', type: '() => void', description: 'Close button, Escape or a click outside.' },
          { prop: 'name', type: 'string', description: 'Employee name, used as the title.' },
          { prop: 'day', type: 'number', description: 'The day to show.' },
          { prop: 'events', type: 'CalendarEvent[]', description: 'The output of resolveDay.' },
          { prop: 'now', type: 'number', description: 'Hour of the current-time line. Leave out on other days.' },
          { prop: 'onOpenEvent', type: '(event) => void', description: 'Called when a block is clicked.' },
          { prop: 'variant', type: "'desktop' | 'mobile'", default: "'desktop'", description: 'A 600px modal, or full screen on a phone.' },
          { prop: 'contained', type: 'boolean', default: 'false', description: 'Renders inside the nearest transformed parent, for demo frames.' },
        ]} />
      </Section>

      <Section id="guidelines" title="Guidelines">
        <DoDont
          doItems={[
            'Let leave win over any activity it overlaps, every time.',
            'Name the activity a leave came from (“Vacation from: PatG”) wherever the leave changes another block.',
            'Keep replaced activities on the timeline at their hours, in the leave fill.',
            'Put all-day leave in the all-day row, above the timeline.',
            'Show times in 24-hour format with a leading zero.',
          ]}
          dontItems={[
            'Stack leave and an activity side by side as if both happen.',
            'Hide an activity that was replaced by all-day leave. People need to see what they are off from.',
            'Show the scheduled hours of a cut-back activity. Show the hours that remain.',
            'Rely on the yellow fill alone. The title always says the leave type.',
          ]}
        />
      </Section>

      <Section id="figma" title="Figma reference" description="Frames this page was built from.">
        <Stack gap="md">
          {([
            ['back-to-back', 'Day details for Ronald Richards on Wednesday, September 23, 2026: PatG from 03:00 to 07:00 and PatD from 07:00 to 12:00, with the current time at 10:30.', 'On a phone, full screen: PatG and PatD back to back on the timeline.'],
            ['partial-leave', 'Overlapping activity: Vacation from 03:00 to 07:00, Vacation from: PatG from 07:00 to 08:00 and PatD from 08:00 to 12:00. PatD was scheduled from 07:00, but PatG overlaps it until 08:00 and is on leave, and leave always takes precedence.', 'On a phone: Vacation, Vacation from: PatG, then PatD.'],
            ['all-day-leave', 'All-day leave: On Leave: Vacation in the all-day row, and Vacation from: PatG and Vacation from: PatD on the timeline. An all-day leave always overrides all activities.', 'On a phone: On Leave: Vacation in the all-day row above both activities in the leave fill.'],
          ] as const).map(([key, alt, mobileAlt]) => (
            <div key={key} className={classes.figmaRow}>
              <img src={`${import.meta.env.BASE_URL}figma/day-details-${key}.png`} alt={alt} className={classes.figma} />
              <img src={`${import.meta.env.BASE_URL}figma/day-details-mobile-${key}.png`} alt={mobileAlt} className={classes.figma} />
            </div>
          ))}
        </Stack>
      </Section>
    </>
  )
}
