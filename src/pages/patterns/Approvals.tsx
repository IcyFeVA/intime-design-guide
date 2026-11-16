import { useState } from 'react'
import { ActionIcon, Button, Checkbox, Group, SegmentedControl, Stack, Table, Text, TextInput, Tooltip } from '@mantine/core'
import { Eye, RotateCcw, Search } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import Preview from '../../components/Preview'
import DoDont from '../../components/DoDont'
import PropsTable from '../../components/PropsTable'
import { DesktopDemoFrame, MobileStage, PhoneFrame } from '../../components/schedule/ScheduleChrome'
import {
  ApprovalActions, ApprovalActionsSheet, ApprovalChain, ApprovalDetail, ApprovalFilters, ApprovalListItems, ApprovalTabs, BackToList,
  ListSwitch, SortControl, VisibilityModal,
} from '../../components/approvals/Approvals'
import ApprovalsWorkspace from '../../components/approvals/ApprovalsWorkspace'
import { useApprovals, type ApprovalsState } from '../../components/approvals/useApprovals'
import type { Approver } from '../../components/approvals/data'
import { approvalKinds, approvalPanelStates, approvalProperties } from '../../tokens/approvals'
import classes from './Approvals.module.css'

const STATUS = 'Preview only. You are John B. McLane, a scheduler. Drag the lines between the panes to resize them.'

/* ------------------------------------------------------------------ */
/* Desktop                                                             */
/* ------------------------------------------------------------------ */

function DesktopDemo() {
  const state = useApprovals()
  return (
    <Preview
      flush
      title="Approvals, desktop"
      code={'const state = useApprovals({ kind: "timesheet" })\n\n<DesktopDemoFrame\n  title="Approvals"\n  tabs={<ApprovalTabs kind={state.kind} requests={state.requests} onChange={state.setKind} />}\n  toolbar={<ApprovalFilters state={state} />}\n  …\n>\n  <ApprovalsWorkspace state={state} />\n</DesktopDemoFrame>'}
    >
      <DesktopDemoFrame
        title="Approvals"
        nav={{ roles: ['employee', 'scheduler'], defaultRole: 'scheduler', defaultActive: 'approvals' }}
        tabs={<ApprovalTabs kind={state.kind} requests={state.requests} onChange={state.setKind} />}
        status={state.hint ?? STATUS}
        onReset={state.reset}
        toolbar={<ApprovalFilters state={state} />}
      >
        <ApprovalsWorkspace state={state} />
      </DesktopDemoFrame>
    </Preview>
  )
}

/* ------------------------------------------------------------------ */
/* Action panel states                                                 */
/* ------------------------------------------------------------------ */

const panelExamples = [
  { value: 'a2342f33', label: 'Pending' },
  { value: 'b81c07d4', label: 'Approved' },
  { value: 'c4e19a02', label: 'Rejected' },
  { value: '4535234893', label: 'Unsubmitted' },
] as const

function PanelDemo() {
  const state = useApprovals()
  const [example, setExample] = useState<string>(panelExamples[0].value)
  const pick = (id: string) => {
    setExample(id)
    state.setList(id === '4535234893' ? 'unsubmitted' : 'submitted')
    state.open(id)
  }
  const reset = () => { state.reset(); setExample(panelExamples[0].value) }
  return (
    <Preview title="Action panel" align="start">
      <Stack gap="md" w="100%">
        <Group justify="space-between" gap="sm">
          <SegmentedControl value={example} onChange={pick} data={panelExamples.map((item) => ({ ...item }))} aria-label="Status" />
          <Button variant="subtle" color="gray" size="compact-xs" leftSection={<RotateCcw size={14} />} onClick={reset}>Reset demo</Button>
        </Group>
        <div className={classes.panelSpecimen}>
          <ApprovalActions key={`${state.active?.id}:${state.active?.status}`} state={state} />
        </div>
        <Text size="xs" c="dimmed" role="status">{state.hint ?? 'Try Approve, Reject, Clear, Add approval and removing a waiting approver.'}</Text>
      </Stack>
    </Preview>
  )
}

const chainExamples: { label: string; meaning: string; approvers: Approver[] }[] = [
  { label: '0 of 2', meaning: 'Nobody has decided yet.', approvers: [{ name: '', decision: 'waiting' }, { name: '', decision: 'waiting' }] },
  { label: '1 of 2', meaning: 'One approval given, one to go. Still pending.', approvers: [{ name: '', decision: 'approved' }, { name: '', decision: 'waiting' }] },
  { label: '2 of 2', meaning: 'Everyone approved. The request is approved.', approvers: [{ name: '', decision: 'approved' }, { name: '', decision: 'approved' }] },
  { label: 'Rejected', meaning: 'One rejection rejects the request. Later approvers are not asked.', approvers: [{ name: '', decision: 'rejected' }, { name: '', decision: 'waiting' }] },
]

/* ------------------------------------------------------------------ */
/* Mobile                                                              */
/* ------------------------------------------------------------------ */

function PhoneHeader({ state, onVisibility }: { state: ApprovalsState; onVisibility: () => void }) {
  const count = state.selection.length
  const all = count > 0 && count === state.items.length
  return (
    <div className={classes.phoneHead}>
      <h3 className={classes.phoneTitle}>Approvals</h3>
      <ApprovalTabs size="sm" kind={state.kind} requests={state.requests} onChange={state.setKind} />
      <div className={classes.phoneToolbar}>
        <Tooltip label={all ? 'Clear selection' : 'Select all'}>
          <span className={classes.phoneCheck}>
            <Checkbox size="md" checked={all} indeterminate={count > 0 && !all} onChange={state.toggleAll} aria-label={all ? 'Clear selection' : 'Select all'} />
          </span>
        </Tooltip>
        <TextInput
          value={state.search}
          onChange={(event) => state.setSearch(event.currentTarget.value)}
          placeholder="Search requests…"
          aria-label="Search requests"
          leftSection={<Search size={18} aria-hidden="true" />}
          size="md"
          className={classes.phoneSearch}
        />
        <Tooltip label="Visibility"><ActionIcon variant="default" size={42} aria-label="Visibility" onClick={onVisibility}><Eye size={20} /></ActionIcon></Tooltip>
        <SortControl size={42} state={state} contained />
      </div>
      {state.kind === 'timesheet' && <div className={classes.phoneSwitch}><ListSwitch state={state} fullWidth /></div>}
    </div>
  )
}

function MobileDemo() {
  const raw = useApprovals({ kind: 'activity', autoOpen: false })
  const [sheet, setSheet] = useState(false)
  const [visibility, setVisibility] = useState(false)
  // Close the sheet after an action, so the result shows in the list
  const state: ApprovalsState = { ...raw, act: (action, note) => { raw.act(action, note); setSheet(false) } }
  const selecting = state.selection.length > 0
  const detail = !selecting ? state.active : null
  const reset = () => { raw.reset(); setSheet(false); setVisibility(false) }
  const status = state.hint ?? (selecting ? `${state.selection.length} selected` : detail ? 'Tap Show approval actions to decide.' : 'Tap a request to open it, or the checkbox to select all.')

  return (
    <Preview flush title="Approvals, mobile">
      <Group justify="space-between" px="md" py="xs" className={classes.demoBar} wrap="nowrap">
        <Text size="xs" c="dimmed" role="status">{status}</Text>
        <Button variant="subtle" color="gray" size="compact-xs" leftSection={<RotateCcw size={14} />} onClick={reset}>Reset demo</Button>
      </Group>
      <MobileStage
        notes={
          <>
            <Text size="sm"><strong>One column.</strong> The list fills the screen. Tap a request to open its details on a screen of their own, with a back button.</Text>
            <Text size="sm"><strong>Actions in a sheet.</strong> “Show approval actions” stays at the bottom while a request is open or several are selected. It opens the action panel as a bottom sheet.</Text>
            <Text size="sm"><strong>Select all</strong> sits left of the search. While selecting, each card gets a checkbox and a tap toggles it.</Text>
            <Text size="sm"><strong>Same tabs.</strong> Activity, Leave, Trade and Timesheets scroll sideways if they do not fit. Timesheets add the Submitted and Unsubmitted switch under the search.</Text>
            <Text size="sm"><strong>Filters</strong> other than search are left out on a phone. The list is grouped by month.</Text>
          </>
        }
      >
        <PhoneFrame
          header={detail ? <div className={classes.phoneBack}><BackToList onBack={() => state.open(null)} /></div> : <PhoneHeader state={state} onVisibility={() => setVisibility(true)} />}
          overlay={(selecting || detail) && !sheet ? (
            <Button fullWidth size="md" variant="default" className={classes.sheetButton} onClick={() => setSheet(true)}>Show approval actions</Button>
          ) : undefined}
        >
          {detail
            ? <ApprovalDetail compact request={detail} onLink={(label) => state.setHint(`“${label}” opens in the app. Preview only.`)} />
            : <div className={classes.phoneList}><ApprovalListItems state={state} card autoActive={false} /></div>}
          <ApprovalActionsSheet state={state} opened={sheet} onClose={() => setSheet(false)} />
          <VisibilityModal key={String(visibility)} opened={visibility} kind={state.kind} visible={state.visible} onClose={() => setVisibility(false)} onApply={state.setVisible} contained />
        </PhoneFrame>
      </MobileStage>
    </Preview>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Approvals() {
  return (
    <>
      <PageHeader />

      <Section id="desktop" title="Desktop" description="Timesheets waiting for a scheduler. The list is on the left, the open request in the middle and the actions on the right.">
        <div className="page-wide"><DesktopDemo /></div>
        <Stack gap="xs" mt="md">
          <Text size="sm">Click a request to open it. Approve, Clear or Reject it on the right, with an optional note to the employee.</Text>
          <Text size="sm">Check the box above the list to select everything, then use the checkboxes to narrow it down. The middle pane closes and the actions apply to all selected requests.</Text>
          <Text size="sm">Drag the lines between the panes to make them wider or narrower. With a handle focused, the arrow keys move it; double-click resets it.</Text>
        </Stack>
      </Section>

      <Section id="types" title="Request types" description="Activity, leave, trade and timesheet approvals look and work the same way. Only the details in the middle change.">
        <Table.ScrollContainer minWidth={560} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th>Tab</Table.Th><Table.Th>Holds</Table.Th><Table.Th>Link</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {approvalKinds.map((kind) => (
                <Table.Tr key={kind.key}>
                  <Table.Td><Text size="sm" fw={600}>{kind.label}</Text></Table.Td>
                  <Table.Td><Text size="sm">{kind.meaning}</Text></Table.Td>
                  <Table.Td><Text size="sm">{kind.link}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Stack gap="xs" mt="md">
          <Text size="sm"><strong>Tab counts</strong> show how many requests still need someone to act. Approved and rejected requests do not count.</Text>
          <Text size="sm"><strong>List items</strong> read “Name · Pay period” for timesheets, “Type · Surname” for leave, “Surname · Activity” for activity and “Surname ⇄ Surname” for trades.</Text>
          <Text size="sm"><strong>Activity</strong> items always show the location. The details are one list: date, branch, location, activity, hours modifier, unit, rank, time bank and banked time.</Text>
          <Text size="sm"><strong>Trades</strong> show both shifts in the list (“… for …”). The details put the sender’s and the receiver’s shift side by side, each with its own tracking tags and assets. Notes from both employees and the approvers form one thread, alternating left and right. A note written while approving, rejecting or clearing a trade is added to it.</Text>
          <Text size="sm"><strong>A warning icon</strong> marks activity and trade requests that have alerts.</Text>
          <Text size="sm"><strong>Leave</strong> list items also show the employee’s rank. The details list the request (ID, type, date, hours), the employee (unit, branch, rank, precedence) and any tracking tags. Pending leave has Approve and Reject only, no Clear.</Text>
          <Text size="sm"><strong>Unsubmitted</strong> exists for timesheets only. A scheduler can submit a timesheet the employee has not.</Text>
        </Stack>
      </Section>

      <Section id="statuses" title="Statuses and actions" description="The action panel changes with the open request: waiting for you, already decided, not submitted, or several selected.">
        <PanelDemo />
        <Table.ScrollContainer minWidth={560} className="doc-table" mt="md">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th>When</Table.Th><Table.Th>The panel shows</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {approvalPanelStates.map((item) => (
                <Table.Tr key={item.key}>
                  <Table.Td><Text size="sm" fw={600}>{item.when}</Text></Table.Td>
                  <Table.Td><Text size="sm">{item.panel}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Stack gap="xs" mt="md">
          <Text size="sm"><strong>Approve</strong> fills the next waiting approval with your name and the time. The request is approved once every approval is given.</Text>
          <Text size="sm"><strong>Reject</strong> rejects the request straight away. A note written while rejecting becomes the rejection reason, shown in red at the top of the details. <strong>Clear</strong> removes every decision and sends it back to pending.</Text>
          <Text size="sm"><strong>Reject</strong> is the only colored button, so it is hard to press by mistake.</Text>
          <Text size="sm"><strong>Alerts</strong> in the details come in two kinds. Prevent (red, “Critical” on leave) breaks a rule the system enforces; Warnings (amber) are worth a look but do not block approval.</Text>
        </Stack>
      </Section>

      <Section id="required-approvals" title="Required approvals" description="Some requests need more than one approval. The circles in the list show how far along a request is.">
        <Table.ScrollContainer minWidth={480} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th w={140}>Approval level</Table.Th><Table.Th w={120}>State</Table.Th><Table.Th>Meaning</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {chainExamples.map((example) => (
                <Table.Tr key={example.label}>
                  <Table.Td><ApprovalChain approvers={example.approvers} /></Table.Td>
                  <Table.Td><Text size="sm" fw={600}>{example.label}</Text></Table.Td>
                  <Table.Td><Text size="sm">{example.meaning}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Stack gap="xs" mt="md">
          <Text size="sm">The panel lists each approver with the date and time they decided. Approvers still waiting read “Approver #2” until someone decides.</Text>
          <Text size="sm">While a request is pending, <strong>Add approval</strong> asks for one more, and the × removes a waiting one. People who already decided cannot be removed; use Clear instead.</Text>
        </Stack>
      </Section>

      <Section id="visibility" title="Visibility and sort" description="The eye button chooses what each list item shows. Sort sets the order.">
        <Table.ScrollContainer minWidth={480} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th>Property</Table.Th><Table.Th>Available on</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {approvalProperties.map((property) => (
                <Table.Tr key={property.key}>
                  <Table.Td><Text size="sm" fw={600}>{property.label}</Text></Table.Td>
                  <Table.Td><Text size="sm">{property.kinds.length === 4 ? 'All tabs' : property.kinds.map((kind) => approvalKinds.find((item) => item.key === kind)!.label).join(', ')}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Stack gap="xs" mt="md">
          <Text size="sm">Each tab keeps its own choice. Submitted on and Approval level are on by default (trades show only the approval level). Leave adds Precedence; activity adds Premium and Time Bank. Changes apply when you press Apply, and stay for every tab.</Text>
          <Text size="sm"><strong>Sort</strong> opens a dialog: ascending or descending, then one field. The request’s own fields (status, activity, employee, dates, location) always work. Properties can only be sorted by while they are visible in the list; the others are disabled. The default is status, ascending, so pending requests come first.</Text>
          <Text size="sm">The status badge and the note icon always show. When the list is wide, Visibility and Sort get text labels next to their icons.</Text>
        </Stack>
      </Section>

      <Section id="mobile" title="Mobile" description="On a phone the list, the details and the actions take turns on the screen.">
        <MobileDemo />
      </Section>

      <Section id="component" title="Using the components" description="The demos use the real components in src/components/approvals.">
        <Text size="sm" fw={600} mb="xs">useApprovals</Text>
        <PropsTable rows={[
          { prop: 'kind', type: "'activity' | 'leave' | 'trade' | 'timesheet'", default: "'timesheet'", description: 'The tab to start on.' },
          { prop: 'autoOpen', type: 'boolean', default: 'true', description: 'Open the first request when none is picked. Turn off on a phone, where the list shows first.' },
        ]} />
        <Text size="sm" c="dimmed" mt="sm">
          Returns the state every other piece takes as <code>state</code>: the tab, list, open request, selection, visibility, sort, filters, a hint for preview-only messages and act(action, note).
        </Text>
        <Text size="sm" fw={600} mb="xs" mt="lg">Pieces</Text>
        <PropsTable rows={[
          { prop: 'ApprovalsWorkspace', type: '{ state }', description: 'Desktop body: list, details and actions in a Mantine Splitter. Hides the details while selecting.' },
          { prop: 'ApprovalTabs', type: '{ kind, requests, onChange, size? }', description: 'Activity, Leave, Trade and Timesheets with open counts.' },
          { prop: 'ApprovalFilters', type: '{ state }', description: 'Search, date range and filter menus for the toolbar.' },
          { prop: 'ApprovalListItems', type: '{ state, card?, autoActive? }', description: 'The grouped list. card gives each item a fill, as on a phone.' },
          { prop: 'ApprovalDetail', type: '{ request, onLink, compact? }', description: 'Submitted on, the request’s details, alerts, payout and notes.' },
          { prop: 'ApprovalActions', type: '{ state, withApprovers? }', description: 'The action panel for the open request or the selection.' },
          { prop: 'ApprovalActionsSheet', type: '{ state, opened, onClose }', description: 'The action panel as a bottom sheet, inside a phone frame.' },
          { prop: 'VisibilityModal', type: '{ opened, kind, visible, onClose, onApply, contained? }', description: 'Pick the properties each item shows.' },
        ]} />
        <Text size="sm" c="dimmed" mt="sm">Mock requests and the approve, reject, clear and submit logic are in src/components/approvals/data.ts. Tabs, properties, sort options and panel states are in src/tokens/approvals.ts. Status badges reuse RequestStatusBadge.</Text>
      </Section>

      <Section id="guidelines" title="Guidelines">
        <DoDont
          doItems={[
            'Use this layout for every approval type, so schedulers learn it once.',
            'Show the approval level and who decided when, so nobody approves twice.',
            'Keep alerts in the details, red for Prevent and amber for Warnings, with a heading for each.',
            'Pair each status with its icon in the details header and the badge color in the list.',
            'Keep the action panel resizable, with sensible minimum and maximum widths.',
          ]}
          dontItems={[
            'Approve or reject on a single click in the list. Decisions happen in the action panel.',
            'Hide rejected or approved requests from the list. Filter by status instead.',
            'Color Approve green. Only Reject gets a color, so the destructive action stands out.',
            'Let the action panel shrink below 280px; the buttons and approver names stop fitting.',
          ]}
        />
      </Section>

      <Section id="figma" title="Figma reference" description="Frames this page was built from.">
        <Stack gap="md">
          {([
            ['approvals-pending.png', 'Timesheet approvals on desktop: list of three timesheets, Hank Moody’s pending timesheet open with hours summary, a warning and comp time payout, and the action panel with scheduler note, Approve, Clear and Reject and required approvals 1 of 2.'],
            ['approvals-approved.png', 'Peter Venkman’s approved timesheet: Modify status with Clear Status, two approvers who approved, and scheduler and employee notes.'],
            ['approvals-rejected.png', 'Ray Stantz’s rejected timesheet: John Smith rejected it, a Prevent alert in red and two warnings in amber.'],
            ['approvals-multi-select.png', 'Three timesheets selected: the list fills the space, the details are hidden and the panel shows Approve selected, Clear selected and Reject selected.'],
            ['approvals-unsubmitted.png', 'Unsubmitted timesheets: Albert Flores open with zero hours and a Submit button.'],
            ['approvals-unsubmitted-submitted.png', 'After submitting: Albert Flores shows Pending in the list, status Submitted, and Submit is disabled.'],
            ['approvals-leave-pending.png', 'Leave approvals: Comp Time · Spengler pending, with the leave request, employee details, a warning, an employee note and tracking tags, and Approve and Reject only.'],
            ['approvals-leave-approved.png', 'Vacation · Stantz approved: Clear Status, two approvers, scheduler and employee notes and tracking tags grouped by label.'],
            ['approvals-leave-rejected.png', 'Vacation · Venkman rejected: a red rejection reason above the details, critical and warning alerts and tracking tags.'],
            ['approvals-activity-pending.png', 'Activity approvals: Spengler · Special Event pending, details list, a warning, employee note and tracking tags.'],
            ['approvals-activity-approved.png', 'Stantz · Beach Patrol approved: Clear Status, approvals including “(you)”, scheduler and employee notes and grouped tracking tags.'],
            ['approvals-trade-pending.png', 'Trade approvals: Parker ⇄ Rodriguez pending, sender and receiver cards with tracking tags and assets, warnings and a notes thread.'],
            ['approvals-trade-approved.png', 'The same trade approved by two approvers, with a note field and Clear.'],
            ['approvals-trade-rejected.png', 'The same trade rejected by the second approver, whose note closes the thread.'],
            ['approvals-unsubmitted-multi-select.png', 'Three unsubmitted timesheets selected with Submit selected.'],
          ] as const).map(([file, alt]) => <img key={file} src={`${import.meta.env.BASE_URL}figma/${file}`} alt={alt} className={classes.figma} />)}
          <div className={classes.figmaTrio}>
            {([
              ['approvals-activity-visibility.png', 'Configure Visibility for activity: Submitted on, Branch, Unit, Premium, Time Bank and Approval Level.'],
              ['approvals-activity-sort.png', 'Sort dialog: Ascending or Descending, then Status, Activity, Employee, Start Date, End Date and Location, with hidden properties disabled.'],
              ['approvals-leave-visibility.png', 'Configure Visibility for leave: Submitted on, Branch, Unit, Precedence and Approval Level.'],
              ['approvals-visibility.png', 'Configure Visibility dialog with checkboxes for Submitted on, Branch, Unit, Pay Period, Timesheet ID and Approval Level, and Cancel and Apply.'],
              ['approvals-mobile.png', 'Activity approvals on a phone: select-all checkbox, search, visibility and sort, cards grouped by month, and Show Approval Actions at the bottom.'],
              ['approvals-mobile-actions.png', 'The approval actions as a bottom sheet on a phone: scheduler note, Approve selected, Clear selected and Reject selected.'],
            ] as const).map(([file, alt]) => <img key={file} src={`${import.meta.env.BASE_URL}figma/${file}`} alt={alt} className={classes.figma} />)}
          </div>
        </Stack>
      </Section>
    </>
  )
}
