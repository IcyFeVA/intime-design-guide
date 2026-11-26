import { Button, Stack, Table, Text } from '@mantine/core'
import { UserRoundCheck } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import Preview from '../../components/Preview'
import DoDont from '../../components/DoDont'
import PropsTable from '../../components/PropsTable'
import CopyValue from '../../components/CopyValue'
import StatusBadge from '../../components/StatusBadge'
import RequestStatusBadge from '../components/RequestStatusBadge'
import { DesktopDemoFrame } from '../../components/schedule/ScheduleChrome'
import VacationBiddingWorkspace, { BidFilters, SignUpTabs } from '../../components/vacation-bidding/VacationBidding'
import { useVacationBidding } from '../../components/vacation-bidding/useVacationBidding'
import { bidModes, bidStates, biddingTokens, leaveTypes } from '../../tokens/bidding'
import classes from './VacationBidding.module.css'

const STATUS = 'Preview only. You are John B. McLane, an employee. It is your turn in the Summer Vacation Bid.'

/* ------------------------------------------------------------------ */
/* Desktop                                                             */
/* ------------------------------------------------------------------ */

function DesktopDemo() {
  const state = useVacationBidding()
  const queued = state.active?.state === 'queued'
  return (
    <Preview
      flush
      title="Vacation bidding, turn-based, desktop"
      code={'const state = useVacationBidding()\n\n<DesktopDemoFrame\n  title="Sign-Ups"\n  tabs={<SignUpTabs onOther={…} />}\n  toolbar={<BidFilters state={state} />}\n  …\n>\n  <VacationBiddingWorkspace state={state} />\n</DesktopDemoFrame>'}
    >
      <DesktopDemoFrame
        title="Sign-Ups"
        nav={{ roles: ['employee', 'scheduler'], defaultRole: 'employee', defaultActive: 'sign-ups' }}
        tabs={<SignUpTabs onOther={(tab) => state.setHint(`${tab} are not part of this guide yet.`)} />}
        status={state.hint ?? STATUS}
        controls={queued && (
          <Button variant="subtle" color="gray" size="compact-xs" leftSection={<UserRoundCheck size={14} />} onClick={state.advanceQueue}>Next employee done</Button>
        )}
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

export default function VacationBidding() {
  return (
    <>
      <PageHeader />

      <Section id="desktop" title="Turn-based bidding" description="Employees bid for time off one after another. When it is your turn, you add leave requests, rank them and submit.">
        <div className="page-wide"><DesktopDemo /></div>
        <Stack gap="xs" mt="md">
          <Text size="sm">Vacation Bids is a tab of Sign-Ups. The live bids are on the left; the open bid is on the right with its period and the time left.</Text>
          <Text size="sm">Click <strong>Add Request</strong>, pick a leave type and the days, and add an optional note. Add as many as you like, rank them, then <strong>Submit</strong>.</Text>
          <Text size="sm">Rank your requests, open a row to see its days, then Submit to see the Pending state. Edit there changes the ranking.</Text>
          <Text size="sm">Open the Spring Vacation Bid to see the queue. “Next employee done” in the demo bar moves it along until it is your turn.</Text>
        </Stack>
      </Section>

      <Section id="modes" title="Bid modes" description="A bid is either turn-based or open to everyone at once. This page covers turn-based bidding first.">
        <Table.ScrollContainer minWidth={560} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th w={140}>Mode</Table.Th><Table.Th>How it works</Table.Th><Table.Th w={140}>Status</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {bidModes.map((mode) => (
                <Table.Tr key={mode.key}>
                  <Table.Td><Text size="sm" fw={600}>{mode.label}</Text></Table.Td>
                  <Table.Td><Text size="sm">{mode.meaning}</Text></Table.Td>
                  <Table.Td><StatusBadge status={mode.status} /></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Section>

      <Section id="states" title="Your place in the bid" description="The status badge and the card change as you wait, bid and submit.">
        <Table.ScrollContainer minWidth={640} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th w={130}>Status</Table.Th><Table.Th>When</Table.Th><Table.Th>The bid shows</Table.Th><Table.Th>In the list</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {bidStates.map((item) => (
                <Table.Tr key={item.key}>
                  <Table.Td><div style={{ width: 'max-content' }}><RequestStatusBadge stateKey={item.badge} size="sm" /></div></Table.Td>
                  <Table.Td><Text size="sm">{item.when}</Text></Table.Td>
                  <Table.Td><Text size="sm">{item.panel}</Text></Table.Td>
                  <Table.Td><Text size="sm">{item.list}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Stack gap="xs" mt="md">
          <Text size="sm"><strong>Submit</strong> stays disabled until there is at least one request. After submitting, the bid is Pending and the selection is locked in.</Text>
          <Text size="sm"><strong>Pending</strong> bids can be re-ranked with Edit (then Save ranking or Cancel) and requests can be removed, after a confirmation. New requests can’t be added, so the last request can’t be removed.</Text>
          <Text size="sm">The <strong>Live</strong> badge says the bid window is open. The time left counts down to when the window closes.</Text>
        </Stack>
      </Section>

      <Section id="ranking" title="Ranking requests" description="Your first choice is rank 1. Schedulers grant requests in this order, as far as staffing allows.">
        <Stack gap="xs">
          <Text size="sm"><strong>Drag</strong> a row by its handle, or use the up and down arrows. The arrows are disabled at the top and bottom. With the handle focused, the arrow keys move the row too.</Text>
          <Text size="sm"><strong>The chevron</strong> opens a row: its note, with Edit, and the weeks around the request with the requested days marked “Leave”. They are dashed because nothing is approved yet.</Text>
          <Text size="sm"><strong>The pencil</strong> edits the leave type, days and note. Delete removes the request straight away while it is your turn.</Text>
          <Text size="sm">A note icon after the leave type says the request has a note.</Text>
        </Stack>
      </Section>

      <Section id="add-request" title="Adding a request" description="A request is a leave type, one or more days inside the bid period, and an optional note.">
        <Table.ScrollContainer minWidth={480} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th w={160}>Leave type</Table.Th><Table.Th>Meaning</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {leaveTypes.map((type) => (
                <Table.Tr key={type.key}>
                  <Table.Td><Text size="sm" fw={600}>{type.label}</Text></Table.Td>
                  <Table.Td><Text size="sm">{type.meaning}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Stack gap="xs" mt="md">
          <Text size="sm">The date picker only offers days inside the bid period. Click a day twice for a single day; the form shows how many days you picked.</Text>
          <Text size="sm">New requests go to the bottom of the list. Move them up if they matter more.</Text>
        </Stack>
      </Section>

      <Section id="component" title="Using the components" description="The demos use the real components in src/components/vacation-bidding.">
        <Text size="sm" fw={600} mb="xs">useVacationBidding</Text>
        <PropsTable rows={[
          { prop: 'setup', type: '(bids: Bid[]) => Bid[]', description: 'Changes the starting bids, e.g. to start with ranked requests or a submitted bid.' },
          { prop: 'activeId', type: 'string', default: "'summer'", description: 'The bid that is open at first.' },
        ]} />
        <Text size="sm" c="dimmed" mt="sm">
          Returns the state every other piece takes as <code>state</code>: the bids, the open bid, its requests in order, filters, a hint for preview-only messages and the actions (save, remove, reorder, submit, startEditRanks, saveRanks, cancelRanks).
        </Text>
        <Text size="sm" fw={600} mb="xs" mt="lg">Pieces</Text>
        <PropsTable rows={[
          { prop: 'VacationBiddingWorkspace', type: '{ state }', description: 'Desktop body: the bid list and the open bid.' },
          { prop: 'SignUpTabs', type: '{ onOther }', description: 'Posts, Shift Bids and Vacation Bids.' },
          { prop: 'BidFilters', type: '{ state }', description: 'Search, date range, bid round and status.' },
          { prop: 'BidList / BidListItem', type: '{ state } / { bid, active, onOpen }', description: 'The live bids with their status and how many requests you picked.' },
          { prop: 'BidDetail', type: '{ state }', description: 'Header, the card for your place in the bid, the requests and the bottom bar.' },
          { prop: 'RequestList', type: '{ state, ranking, editable, onEdit, onDelete }', description: 'Ranked rows. ranking adds the handles and arrows; editable adds the pencil.' },
          { prop: 'RequestCalendar', type: '{ request }', description: 'The weeks around a request with its days marked.' },
          { prop: 'RequestFormModal', type: '{ opened, bid, request?, onClose, onSave }', description: 'Add or edit a request.' },
        ]} />
        <Text size="sm" c="dimmed" mt="sm">Mock bids and date helpers are in src/components/vacation-bidding/data.ts. Modes, states, leave types and the --bidding-* variables are in src/tokens/bidding.ts. Status badges reuse RequestStatusBadge.</Text>
      </Section>

      <Section id="tokens" title="CSS variables" description="Aliases of theme tokens, so they follow the dark and light themes.">
        <Table.ScrollContainer minWidth={560} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th>Variable</Table.Th><Table.Th>Value</Table.Th><Table.Th>Usage</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {biddingTokens.map((token) => (
                <Table.Tr key={token.name}>
                  <Table.Td><CopyValue value={`var(${token.name})`} display={token.name} /></Table.Td>
                  <Table.Td><Text size="xs" ff="monospace" c="dimmed">{token.value}</Text></Table.Td>
                  <Table.Td><Text size="sm">{token.usage}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Section>

      <Section id="guidelines" title="Guidelines">
        <DoDont
          doItems={[
            'Show the time left in the bid wherever the bid appears.',
            'Pair every status with its badge icon: an hourglass for Queued, an arrow for Your Turn, a clock for Pending.',
            'Offer arrows next to drag and drop, so ranking works without a mouse.',
            'Say how many employees are ahead while someone is queued, and that they will be notified.',
            'Ask before removing a request from a submitted bid, because it can’t be added back.',
          ]}
          dontItems={[
            'Enable Submit with no requests.',
            'Let people add requests after submitting. They can only re-rank or remove them.',
            'Show requested days as approved. Keep them dashed until a scheduler decides.',
            'Offer days outside the bid period in the date picker.',
          ]}
        />
      </Section>

      <Section id="figma" title="Figma reference" description="Frames this page was built from.">
        <Stack gap="md">
          {([
            ['vacation-bidding-empty.png', 'Sign-Ups, Vacation Bids: Summer Vacation Bid open with Your Turn, no requests yet, Add Request highlighted and Submit disabled.'],
            ['vacation-bidding-one-request.png', 'One request: rank 1, Vacation with a note icon, Jun 15 – Jun 24, 2027, with move, edit, delete and expand buttons. The list item says Selected: 1.'],
            ['vacation-bidding-expanded.png', 'The request opened: its note with an Edit link and a two-week calendar with the requested days marked Leave in a dashed outline.'],
            ['vacation-bidding-ranked.png', 'Three ranked requests: Vacation, Banked OT and Comp Time, with a tip about drag and drop and the arrow buttons.'],
            ['vacation-bidding-pending.png', 'After Submit: Pending badge, “Your selection is locked in. You picked 3 shifts in ranked order.”, rows with delete and expand only, Submitted on and Edit at the bottom.'],
            ['vacation-bidding-queued.png', 'Queued: “You are currently in queue. There are 3 employees ahead of you. You will be notified once it is your turn.”'],
          ] as const).map(([file, alt]) => <img key={file} src={`${import.meta.env.BASE_URL}figma/${file}`} alt={alt} className={classes.figma} />)}
        </Stack>
      </Section>
    </>
  )
}
