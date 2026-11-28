import { Button, SegmentedControl, Stack, Table, Text } from '@mantine/core'
import { UserRoundCheck } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import Preview from '../../components/Preview'
import DoDont from '../../components/DoDont'
import PropsTable from '../../components/PropsTable'
import RequestStatusBadge from '../components/RequestStatusBadge'
import { DesktopDemoFrame } from '../../components/schedule/ScheduleChrome'
import VacationBiddingWorkspace, { BidFilters, SignUpTabs } from '../../components/vacation-bidding/VacationBidding'
import { useVacationBidding } from '../../components/vacation-bidding/useVacationBidding'
import { shiftBidModes, shiftBidStates } from '../../tokens/bidding'
import classes from './ShiftBidding.module.css'

const STATUS = {
  'turn-based': 'Preview only. You are John B. McLane, an employee. It is your turn in Winter Coverage 2026.',
  'all-at-once': 'Preview only. You are John B. McLane, an employee. Winter Coverage 2026 is open for everyone.',
}

/* ------------------------------------------------------------------ */
/* Desktop                                                             */
/* ------------------------------------------------------------------ */

function DesktopDemo() {
  const state = useVacationBidding({ kind: 'shift' })
  const queued = state.active?.state === 'queued'
  return (
    <Preview
      flush
      title="Shift bidding, desktop"
      code={"const state = useVacationBidding({ kind: 'shift' })\n\n<DesktopDemoFrame\n  title=\"Sign-Ups\"\n  tabs={<SignUpTabs active=\"Shift Bids\" onOther={…} />}\n  toolbar={<BidFilters state={state} />}\n  …\n>\n  <VacationBiddingWorkspace state={state} />\n</DesktopDemoFrame>"}
    >
      <DesktopDemoFrame
        title="Sign-Ups"
        nav={{ roles: ['employee', 'scheduler'], defaultRole: 'employee', defaultActive: 'sign-ups' }}
        tabs={<SignUpTabs active="Shift Bids" onOther={(tab) => state.leave({ kind: 'tab', tab })} />}
        status={state.hint ?? STATUS[state.mode]}
        controls={
          <>
            <SegmentedControl
              size="xs"
              aria-label="Bid mode"
              value={state.mode}
              onChange={(value) => state.setMode(value as typeof state.mode)}
              data={[{ value: 'turn-based', label: 'Turn-based' }, { value: 'all-at-once', label: 'All at once' }]}
            />
            {queued && <Button variant="subtle" color="gray" size="compact-xs" leftSection={<UserRoundCheck size={14} />} onClick={state.advanceQueue}>Next employee done</Button>}
          </>
        }
        onReset={state.reset}
        toolbar={<BidFilters state={state} />}
      >
        <VacationBiddingWorkspace state={state} />
      </DesktopDemoFrame>
    </Preview>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const differences: [string, string, string][] = [
  ['What you bid for', 'Your own leave requests: dates, times and a leave type.', 'Shifts the agency offers, with set days and hours.'],
  ['Turn-based', 'Add Request opens the leave request form.', 'Select Shift on the shifts that are still open. Full ones can’t be selected.'],
  ['All at once', 'Select Shift on blocks of leave on offer.', 'The same, plus how many places are filled and who signed up for each shift.'],
  ['Who else bid', 'View Team Bids: a calendar of everyone’s leave (turn-based) or the sign-ups for the bid (all at once).', '“N Sign-Ups” on each shift lists who signed up for that shift.'],
  ['Closed before you submitted', 'Expired', 'Missed'],
]

export default function ShiftBidding() {
  return (
    <>
      <PageHeader />

      <Section id="desktop" title="Shift bidding" description="Employees bid for the shifts they want to work, one after another (turn-based) or all during the same window (all at once). Switch the mode in the demo bar.">
        <div className="page-wide"><DesktopDemo /></div>
        <Stack gap="xs" mt="md">
          <Text size="sm">Shift Bids is a tab of Sign-Ups. The bids are on the left, one for each state; the open bid is on the right with its period and the time left.</Text>
          <Text size="sm">Click <strong>Select Shift</strong> on the shifts you want. They move into the ranked list in the card, where you set their priority. Then <strong>Submit</strong>.</Text>
          <Text size="sm">Open a shift with its chevron to add a note and see the days it covers. Open a ranked shift to see the same.</Text>
          <Text size="sm">Open Spring Coverage 2027 to see the queue. “Next employee done” in the demo bar moves it along until it is your turn. The other bids show Closed (with Awarded and Denied), Missed and Taken Down.</Text>
        </Stack>
      </Section>

      <Section id="differences" title="Shift and vacation bids" description="Shift bidding works like vacation bidding. The difference: you select from shifts on offer instead of adding your own leave requests.">
        <Table.ScrollContainer minWidth={720} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th w={180} /><Table.Th>Vacation bids</Table.Th><Table.Th>Shift bids</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {differences.map(([topic, vacation, shift]) => (
                <Table.Tr key={topic}>
                  <Table.Td><Text size="sm" fw={600}>{topic}</Text></Table.Td>
                  <Table.Td><Text size="sm">{vacation}</Text></Table.Td>
                  <Table.Td><Text size="sm">{shift}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Text size="sm" mt="md">Ranking, Submit, Edit, Withdraw and the warning dialogs are the same. See Vacation Bidding for the details.</Text>
      </Section>

      <Section id="modes" title="Bid modes" description="A bid is either turn-based or open to everyone at once. The agency picks the mode per bid.">
        <Table.ScrollContainer minWidth={560} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th w={140}>Mode</Table.Th><Table.Th>How it works</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {shiftBidModes.map((mode) => (
                <Table.Tr key={mode.key}>
                  <Table.Td><Text size="sm" fw={600}>{mode.label}</Text></Table.Td>
                  <Table.Td><Text size="sm">{mode.meaning}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Section>

      <Section id="states" title="Your place in the bid" description="The status badge and the card change as you wait, bid and submit.">
        <Table.ScrollContainer minWidth={860} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th w={130}>Status</Table.Th><Table.Th w={120}>Mode</Table.Th><Table.Th>When</Table.Th><Table.Th>The bid shows</Table.Th><Table.Th>In the list</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {shiftBidStates.map((item) => (
                <Table.Tr key={item.key}>
                  <Table.Td><div style={{ width: 'max-content' }}><RequestStatusBadge stateKey={item.badge} size="sm" /></div></Table.Td>
                  <Table.Td><Text size="sm">{item.modes.map((key) => shiftBidModes.find((mode) => mode.key === key)!.label).join(', ')}</Text></Table.Td>
                  <Table.Td><Text size="sm">{item.when}</Text></Table.Td>
                  <Table.Td><Text size="sm">{item.panel}</Text></Table.Td>
                  <Table.Td><Text size="sm">{item.list}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Stack gap="xs" mt="md">
          <Text size="sm"><strong>Submit</strong> stays disabled until you select a shift, and asks for confirmation first.</Text>
          <Text size="sm"><strong>Turn-based, Pending</strong>: the selection is locked in. Select Shift is gone, so the last shift can’t be removed. Edit changes the ranking.</Text>
          <Text size="sm"><strong>All at once, Pending</strong>: you can still select shifts. Edit changes the ranking and removes shifts until the window closes.</Text>
          <Text size="sm"><strong>Missed</strong> means the window closed before you submitted. Shift bids use it where vacation bids say Expired.</Text>
        </Stack>
      </Section>

      <Section id="selecting" title="Selecting shifts" description="Every shift on offer shows whether it is still open, when it is, how many places are filled and how many people signed up.">
        <Stack gap="xs">
          <Text size="sm"><strong>Available</strong> shifts have places left and show Select Shift. <strong>Full</strong> ones show no action: every place is taken.</Text>
          <Text size="sm"><strong>Select Shift</strong> adds the shift to your ranked list as the next choice. Selected shifts say which choice they are, e.g. “2nd Choice”, and follow the ranking as you reorder.</Text>
          <Text size="sm"><strong>The chevron</strong> opens a shift: its note, and the weeks it covers with the shift’s hours on each day it is worked. Days off inside the range stay empty.</Text>
          <Text size="sm"><strong>Add a note</strong> opens a field. The note saves when you leave the field, then reads as a quote with Edit. A note icon after the shift name says it has one, here and in the ranked list.</Text>
          <Text size="sm">The places filled don’t change when you select a shift. Nothing is awarded until the bid closes.</Text>
        </Stack>
      </Section>

      <Section id="ranking" title="Ranking shifts" description="Your first choice is rank 1. Shifts are awarded in this order, as far as places and seniority allow.">
        <Stack gap="xs">
          <Text size="sm"><strong>Drag</strong> a row by its handle, or use the up and down arrows. With the handle focused, the arrow keys move the row too.</Text>
          <Text size="sm">Ranked shifts have no pencil. To change one, remove it and select another. Delete always asks first.</Text>
          <Text size="sm">Opening another bid or tab with shifts that aren’t submitted shows a warning, because they are discarded.</Text>
        </Stack>
      </Section>

      <Section id="sign-ups" title="Sign-ups" description="“N Sign-Ups” on a shift lists everyone who signed up for it, so employees can judge their chances.">
        <Stack gap="xs">
          <Text size="sm">The list is in the List Organizer’s order, with each person’s rank. You appear once your submitted bid includes the shift.</Text>
          <Text size="sm">Nobody knows who is awarded until the bid closes, so Awarded only shows after that.</Text>
        </Stack>
      </Section>

      <Section id="component" title="Using the components" description="Shift bidding uses the vacation bidding components in src/components/vacation-bidding with kind: 'shift'.">
        <PropsTable rows={[
          { prop: "useVacationBidding({ kind: 'shift' })", type: "kind?: 'vacation' | 'shift'", default: "'vacation'", description: 'Loads the shift bids (initialBids(mode, kind)) and opens Winter Coverage 2026. state.kind and state.noun (“shift”) change the copy.' },
          { prop: 'SignUpTabs', type: "{ active?: 'Shift Bids' | 'Vacation Bids', onOther }", description: 'Pass active="Shift Bids".' },
          { prop: 'OfferedShifts', type: '{ state, selectable? }', description: 'Shift bids add the Available/Full badge, places filled and the sign-ups link, and hide Select Shift on full shifts. selectable={false} hides it everywhere (turn-based, Pending).' },
          { prop: 'ShiftSignUpsModal', type: '{ bid, shift, onClose }', description: 'Who signed up for one shift (shiftSignUpsFor in data.ts). Open while shift is set.' },
          { prop: 'RequestCalendar', type: '{ request }', description: 'A request or shift with days marks only those days, one bar per run of days in a row.' },
        ]} />
        <Text size="sm" c="dimmed" mt="sm">Mock shift bids and shifts on offer (shiftPlan: places, filled, sign-ups, weekdays worked) are in data.ts. Modes and states worded for shifts are shiftBidModes and shiftBidStates in src/tokens/bidding.ts. The --bidding-* variables are listed on Vacation Bidding.</Text>
      </Section>

      <Section id="guidelines" title="Guidelines">
        <DoDont
          doItems={[
            'Show the time left in the bid wherever the bid appears.',
            'Show whether each shift is Available or Full, with its places filled, before people select it.',
            'Show the shift’s hours on the calendar, and only the days it is worked.',
            'Let people see who else signed up for a shift.',
            'Offer arrows next to drag and drop, so ranking works without a mouse.',
          ]}
          dontItems={[
            'Offer Select Shift on a full shift.',
            'Let people add shifts after submitting a turn-based bid. They can only re-rank or remove them.',
            'Show selected shifts as awarded. Keep them dashed until the bid closes.',
            'Offer an Add Request form. Shift bids only have the shifts on offer.',
          ]}
        />
      </Section>

      <Section id="figma" title="Figma reference" description="Frames this page was built from.">
        <Stack gap="md">
          {([
            ['shift-bidding-turn-based-empty.png', 'Sign-Ups, Shift Bids: Winter Coverage 2026, Your Turn. Turn-Based Bid Submission with an empty box for selected shifts, and the shifts on offer with Available or Full, dates, places filled, Sign-Ups and Select Shift. Day Patrol is open with Add a note and a two-week calendar of 08:00–17:30 shifts.'],
            ['shift-bidding-turn-based-ranked.png', 'Turn-based, three shifts selected and ranked with handles, arrows and delete; the shifts on offer show 1st, 2nd and 3rd Choice. The list item says Selected: 3.'],
            ['shift-bidding-turn-based-pending.png', 'Turn-based, Pending: “Your selection is locked in. You picked 3 shifts in ranked order.” Rows with delete and expand only, Submitted on and Edit at the bottom.'],
            ['shift-bidding-queued.png', 'Queued: “You are currently in queue. There are 3 employees ahead of you. You will be notified once it is your turn.” No shifts on offer.'],
            ['shift-bidding-all-at-once-empty.png', 'All at once, Open: All-at-once Bid Submission with an empty box, and Day Patrol open with its note shown as a quote with Edit.'],
            ['shift-bidding-all-at-once-ranked.png', 'All at once, three shifts ranked with handles, arrows and delete, and 1st, 2nd and 3rd Choice on the shifts on offer.'],
            ['shift-bidding-all-at-once-pending.png', 'All at once, Pending: the ranked shifts read-only, “you can add or remove shifts and set their rankings”, and Select Shift still on the shifts not picked.'],
          ] as const).map(([file, alt]) => <img key={file} src={`${import.meta.env.BASE_URL}figma/${file}`} alt={alt} className={classes.figma} />)}
        </Stack>
      </Section>
    </>
  )
}
