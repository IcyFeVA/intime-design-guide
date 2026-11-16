import { Fragment, useState, type ReactNode } from 'react'
import {
  ActionIcon, Anchor, Button, Checkbox, Drawer, Group, Menu, Modal, Pill, SegmentedControl, Stack, Text, Textarea, TextInput, Tooltip, UnstyledButton,
} from '@mantine/core'
import { useElementSize } from '@mantine/hooks'
import {
  ArrowDownUp, Ban, CalendarDays, Check, ChevronLeft, Circle, CircleCheck, ExternalLink, Eye, Inbox, MapPin, Plus, Search, StickyNote, X,
} from 'lucide-react'
import RequestStatusBadge from '../../pages/components/RequestStatusBadge'
import { PickerMenu } from '../schedule/ScheduleChrome'
import {
  approvalKinds, approvalProperties, approvalSorts, approvalStatusBadge, type ApprovalKind, type ApprovalProperty, type ApprovalSort,
} from '../../tokens/approvals'
import { approvedCount, openCount, propertyLines, groupRequests, requestHeading, type ApprovalRequest, type Approver } from './data'
import type { ApprovalList, ApprovalsState, StatusFilter } from './useApprovals'
import classes from './Approvals.module.css'

function Eyebrow({ children, id }: { children: ReactNode; id?: string }) {
  return <Text id={id} size="sm" fw={600} c="dimmed" tt="uppercase" lts="0.06em" className={classes.eyebrow}>{children}</Text>
}

/* ------------------------------------------------------------------ */
/* Tabs and filters                                                    */
/* ------------------------------------------------------------------ */

/** Activity, Leave, Trade and Timesheets, with the number of open requests. */
export function ApprovalTabs({ kind, requests, onChange, size = 'md' }: {
  kind: ApprovalKind
  requests: ApprovalRequest[]
  onChange: (kind: ApprovalKind) => void
  size?: 'md' | 'sm'
}) {
  return (
    <div className={classes.tabs} role="tablist" aria-label="Approval type" data-size={size}>
      {approvalKinds.map((item) => {
        const count = openCount(requests, item.key)
        return (
          <UnstyledButton
            key={item.key}
            role="tab"
            aria-selected={item.key === kind}
            data-active={item.key === kind || undefined}
            className={classes.tab}
            onClick={() => onChange(item.key)}
          >
            {item.label}{count > 0 && <span className="tabular"> ({count})</span>}
          </UnstyledButton>
        )
      })}
    </div>
  )
}

const statusOptions: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All Statuses' }, { key: 'pending', label: 'Pending' }, { key: 'approved', label: 'Approved' }, { key: 'rejected', label: 'Rejected' },
]

/** Search, date range and filter menus above the list. Status and search filter the demo; the rest are preview only. */
export function ApprovalFilters({ state }: { state: ApprovalsState }) {
  const [employeeFilter, setEmployeeFilter] = useState('none')
  const [unit, setUnit] = useState('all')
  const [employees, setEmployees] = useState('all')
  const previewOnly = (what: string) => state.setHint(`${what} is not filtered in this demo.`)
  return (
    <>
      <TextInput
        value={state.search}
        onChange={(event) => state.setSearch(event.currentTarget.value)}
        placeholder="Search requests…"
        aria-label="Search requests"
        leftSection={<Search size={16} aria-hidden="true" />}
        w={240}
      />
      <Button variant="default" fw={400} leftSection={<CalendarDays size={18} aria-hidden="true" />} onClick={() => state.setHint('The date picker is not part of this demo.')}>
        <span className="tabular">June 1 – June 18, 2026</span>
      </Button>
      <PickerMenu label="Employee filter" value={employeeFilter} onChange={(value) => { setEmployeeFilter(value); previewOnly('The employee filter') }}
        options={[{ key: 'none', label: 'Employee Filter' }, { key: 'reports', label: 'My direct reports' }, { key: 'overtime', label: 'Over 40 hours' }]} />
      <PickerMenu label="Status" value={state.status} onChange={state.setStatus} options={statusOptions} />
      <PickerMenu label="Unit" value={unit} onChange={(value) => { setUnit(value); previewOnly('Unit') }}
        options={[{ key: 'all', label: 'All Units' }, { key: 'd4', label: 'Patrol D4' }, { key: 'gate', label: 'Gate Security' }]} />
      <PickerMenu label="Employees" value={employees} onChange={(value) => { setEmployees(value); previewOnly('Employees') }}
        options={[{ key: 'all', label: 'All Employees' }, { key: 'officers', label: 'Officers' }, { key: 'sergeants', label: 'Sergeants' }]} />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* List                                                                */
/* ------------------------------------------------------------------ */

const approverIcon = (approver: Approver, size: number) =>
  approver.decision === 'approved' ? <CircleCheck size={size} aria-hidden="true" />
    : approver.decision === 'rejected' ? <Ban size={size} aria-hidden="true" />
      : <Circle size={size} aria-hidden="true" />

/** Approval level: one circle per required approval, checked when given. */
export function ApprovalChain({ approvers }: { approvers: Approver[] }) {
  const label = `${approvedCount({ approvers } as ApprovalRequest)} of ${approvers.length} approvals`
  return (
    <Tooltip label={label}>
      <span className={classes.chain} role="img" aria-label={label}>
        {approvers.map((approver, index) => (
          <Fragment key={index}>
            {index > 0 && <span className={classes.chainLink} />}
            <span className={classes.chainStep} data-decision={approver.decision}>{approverIcon(approver, 15)}</span>
          </Fragment>
        ))}
      </span>
    </Tooltip>
  )
}

function NoteIcon() {
  return (
    <Tooltip label="Has an employee note">
      <span className={classes.noteIcon} role="img" aria-label="Has an employee note"><StickyNote size={16} strokeWidth={1.75} /></span>
    </Tooltip>
  )
}

/** One request in the list. The whole row opens it; in selection mode it toggles the checkbox instead. */
export function ApprovalItem({ request, visible, active, checked, selecting, card, onOpen, onToggle }: {
  request: ApprovalRequest
  visible: ApprovalProperty[]
  active?: boolean
  checked?: boolean
  /** Shows the checkbox and makes a click toggle it */
  selecting?: boolean
  /** Filled card, used on a phone and while selecting */
  card?: boolean
  onOpen: (id: string) => void
  onToggle: (id: string) => void
}) {
  const unsubmitted = request.list === 'unsubmitted'
  const heading = unsubmitted ? request.employee : requestHeading(request)
  const subtitle = unsubmitted ? request.title : request.when
  const lines = propertyLines(request, visible)
  return (
    <div className={classes.item} data-active={active || undefined} data-checked={checked || undefined} data-card={card || undefined}>
      {selecting && (
        <Checkbox checked={!!checked} onChange={() => onToggle(request.id)} aria-label={`Select ${heading}`} className={classes.itemCheck} />
      )}
      <UnstyledButton
        className={classes.itemMain}
        onClick={() => selecting ? onToggle(request.id) : onOpen(request.id)}
        aria-current={active ? 'true' : undefined}
        tabIndex={selecting ? -1 : 0}
      >
        <Text fw={600} className={classes.itemHeading}>{heading}</Text>
        {subtitle && <Text size="sm" className="tabular">{subtitle}</Text>}
        {request.location && visible.includes('location') && (
          <Group gap={6} wrap="nowrap"><MapPin size={16} strokeWidth={1.75} aria-hidden="true" className={classes.dimIcon} /><Text size="sm">{request.location}</Text></Group>
        )}
        {lines.map((line) => <Text key={line} size="sm" className="tabular">{line}</Text>)}
      </UnstyledButton>
      <div className={classes.itemSide}>
        {request.status !== 'unsubmitted' && <RequestStatusBadge stateKey={approvalStatusBadge[request.status]} size="sm" />}
        {request.status !== 'unsubmitted' && request.list === 'submitted' && visible.includes('approvalLevel') && <ApprovalChain approvers={request.approvers} />}
        {request.employeeNote && <NoteIcon />}
      </div>
    </div>
  )
}

/** Select-all, the Submitted/Unsubmitted switch for timesheets, Visibility and Sort. Buttons get labels when the list is wide. */
export function ApprovalListToolbar({ state, wide, compact, onVisibility }: {
  state: ApprovalsState
  wide?: boolean
  /** Phone: no switch here, it moves below */
  compact?: boolean
  onVisibility: () => void
}) {
  const count = state.selection.length
  const all = count > 0 && count === state.items.length
  return (
    <div className={classes.listToolbar} data-wide={wide || undefined}>
      <Group gap={10} wrap="nowrap" className={classes.selectAll}>
        <Checkbox
          checked={all}
          indeterminate={count > 0 && !all}
          onChange={state.toggleAll}
          disabled={!state.items.length}
          aria-label={all ? 'Clear selection' : 'Select all'}
        />
        {count > 0 && <Text size="sm" className="tabular">{count} selected</Text>}
      </Group>
      {state.kind === 'timesheet' && !compact && <ListSwitch state={state} />}
      <Group gap={8} wrap="nowrap" className={classes.listTools}>
        {wide ? (
          <Button variant="default" size="xs" fw={400} leftSection={<Eye size={16} aria-hidden="true" />} onClick={onVisibility}>Visibility</Button>
        ) : (
          <Tooltip label="Visibility"><ActionIcon variant="default" size={30} aria-label="Visibility" onClick={onVisibility}><Eye size={16} /></ActionIcon></Tooltip>
        )}
        <SortMenu sort={state.sort} onChange={state.setSort} wide={wide} />
      </Group>
    </div>
  )
}

/** Submitted / Unsubmitted, timesheets only. */
export function ListSwitch({ state, fullWidth }: { state: ApprovalsState; fullWidth?: boolean }) {
  return (
    <SegmentedControl
      size="xs"
      value={state.list}
      onChange={(value) => state.setList(value as ApprovalList)}
      aria-label="Timesheets"
      fullWidth={fullWidth}
      classNames={{ root: classes.switch, label: classes.switchLabel }}
      data={[{ value: 'submitted', label: 'Submitted' }, { value: 'unsubmitted', label: 'Unsubmitted' }]}
    />
  )
}

export function SortMenu({ sort, onChange, wide, size = 30 }: { sort: ApprovalSort; onChange: (sort: ApprovalSort) => void; wide?: boolean; size?: number }) {
  return (
    <Menu position="bottom-end" offset={4}>
      <Menu.Target>
        {wide ? (
          <Button variant="default" size="xs" fw={400} leftSection={<ArrowDownUp size={16} aria-hidden="true" />}>Sort</Button>
        ) : (
          <Tooltip label="Sort"><ActionIcon variant="default" size={size} aria-label="Sort"><ArrowDownUp size={size > 30 ? 20 : 16} /></ActionIcon></Tooltip>
        )}
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Sort by</Menu.Label>
        {approvalSorts.map((option) => (
          <Menu.Item key={option.key} onClick={() => onChange(option.key)} rightSection={option.key === sort ? <Check size={14} aria-hidden="true" /> : null}>
            {option.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}

/** The grouped list. */
export function ApprovalListItems({ state, card, autoActive = true }: { state: ApprovalsState; card?: boolean; autoActive?: boolean }) {
  const selecting = state.selection.length > 0
  if (!state.items.length) {
    return (
      <Stack align="center" gap={6} py={48} px="md" ta="center">
        <Inbox size={28} strokeWidth={1.5} aria-hidden="true" className={classes.dimIcon} />
        <Text fw={600}>No requests</Text>
        <Text size="sm" c="dimmed">Nothing matches the search and filters.</Text>
      </Stack>
    )
  }
  return (
    <div className={classes.groups}>
      {groupRequests(state.items).map((group) => (
        <section key={group.label} aria-label={group.label}>
          <Eyebrow>{group.label}</Eyebrow>
          <div className={classes.items}>
            {group.items.map((request) => (
              <ApprovalItem
                key={request.id}
                request={request}
                visible={state.visible}
                active={autoActive && !selecting && state.active?.id === request.id}
                checked={state.selection.some((item) => item.id === request.id)}
                selecting={selecting}
                card={card || selecting}
                onOpen={state.open}
                onToggle={state.toggle}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/** Toolbar and grouped list for desktop. */
export function ApprovalListPane({ state, onVisibility }: { state: ApprovalsState; onVisibility: () => void }) {
  const { ref, width } = useElementSize()
  return (
    <div ref={ref} className={classes.pane}>
      <ApprovalListToolbar state={state} wide={width >= 640} onVisibility={onVisibility} />
      <div className={classes.paneScroll}><ApprovalListItems state={state} /></div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Detail                                                              */
/* ------------------------------------------------------------------ */

const statusText = (request: ApprovalRequest) =>
  request.status === 'unsubmitted' ? 'Unsubmitted'
    : request.list === 'unsubmitted' ? 'Submitted'
      : request.status === 'pending' ? 'Pending approval'
        : request.status === 'approved' ? 'Approved' : 'Rejected'

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={classes.block}>
      <Eyebrow>{title}</Eyebrow>
      {children}
    </section>
  )
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className={classes.rows}>
      {rows.map(([label, value]) => <Fragment key={label}><dt>{label}</dt><dd className="tabular">{value}</dd></Fragment>)}
    </dl>
  )
}

function Note({ text }: { text: string }) {
  return (
    <Group gap={10} wrap="nowrap" align="flex-start">
      <StickyNote size={18} strokeWidth={1.75} aria-hidden="true" className={classes.noteGlyph} />
      <Text fs="italic">“{text}”</Text>
    </Group>
  )
}

/** Everything about one request, top to bottom. */
export function ApprovalDetail({ request, onLink, compact }: { request: ApprovalRequest; onLink: (label: string) => void; compact?: boolean }) {
  const link = approvalKinds.find((item) => item.key === request.kind)!.link
  const [first, ...rest] = request.details
  const sections = 'rows' in first ? [{ ...first, rows: [['Status', statusText(request)] as [string, string], ...first.rows] }, ...rest] : request.details
  return (
    <article className={classes.detail} data-compact={compact || undefined} aria-label={requestHeading(request)}>
      <div className={classes.detailHead}>
        <h4 className={classes.detailTitle}>{request.kind === 'timesheet' ? request.title : `${request.title} · ${request.employee}`}</h4>
        {request.status !== 'unsubmitted' && request.list === 'submitted' && <RequestStatusBadge stateKey={approvalStatusBadge[request.status]} />}
      </div>
      <Anchor component="button" type="button" className={classes.detailLink} onClick={() => onLink(link)} fw={600}>
        {link} <ExternalLink size={18} aria-hidden="true" />
      </Anchor>

      {request.submittedLong && request.list === 'submitted' && (
        <Block title="Submitted on"><Text size="lg" className="tabular">{request.submittedLong}</Text></Block>
      )}
      {sections.map((section) => (
        <Block key={section.title} title={section.title}>
          {'rows' in section ? <Rows rows={section.rows} /> : (
            <dl className={classes.hours}>
              {section.hours.map(([label, value]) => <Fragment key={label}><dt>{label}</dt><dd className="tabular">{value}</dd></Fragment>)}
            </dl>
          )}
        </Block>
      ))}
      {request.alerts && (
        <section className={classes.block}>
          <h5 className={classes.alertsTitle}>Alerts</h5>
          {request.alerts.prevent && (
            <div>
              <Eyebrow>Prevent</Eyebrow>
              <ul className={classes.alertList} data-tone="error">{request.alerts.prevent.map((alert) => <li key={alert}>{alert}</li>)}</ul>
            </div>
          )}
          {request.alerts.warnings && (
            <div>
              <Eyebrow>Warnings</Eyebrow>
              <ul className={classes.alertList} data-tone="warning">{request.alerts.warnings.map((alert) => <li key={alert}>{alert}</li>)}</ul>
            </div>
          )}
        </section>
      )}
      {request.payout && (
        <Block title="Payout"><Group gap={8}>{request.payout.map((item) => <Pill key={item} size="lg" className={classes.payout}>{item}</Pill>)}</Group></Block>
      )}
      {request.schedulerNote && <Block title="Scheduler note"><Note text={request.schedulerNote} /></Block>}
      {request.employeeNote && <Block title="Employee note"><Note text={request.employeeNote} /></Block>}
    </article>
  )
}

/** Detail pane for desktop, with an empty state. */
export function ApprovalDetailPane({ state }: { state: ApprovalsState }) {
  return (
    <div className={classes.pane}>
      <div className={classes.paneScroll}>
        {state.active
          ? <ApprovalDetail request={state.active} onLink={(label) => state.setHint(`“${label}” opens in a new tab in the app. Preview only.`)} />
          : (
            <Stack align="center" gap={6} py={80} ta="center">
              <Inbox size={28} strokeWidth={1.5} aria-hidden="true" className={classes.dimIcon} />
              <Text fw={600}>No request open</Text>
              <Text size="sm" c="dimmed">Pick one from the list.</Text>
            </Stack>
          )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

/** Who has to approve, who did and when. Waiting approvers can be removed and more added while it is pending. */
export function RequiredApprovals({ request, onAdd, onRemove }: { request: ApprovalRequest; onAdd?: () => void; onRemove?: (index: number) => void }) {
  const editable = request.status === 'pending' && !!onAdd
  return (
    <section className={classes.required} aria-labelledby={`required-${request.id}`}>
      <Eyebrow id={`required-${request.id}`}>Required approvals <span className="tabular">({approvedCount(request)}/{request.approvers.length})</span></Eyebrow>
      <ul className={classes.approvers}>
        {request.approvers.map((approver, index) => (
          <li key={index} className={classes.approver} data-decision={approver.decision}>
            <span className={classes.approverIcon}>{approverIcon(approver, 18)}</span>
            <div className={classes.approverText}>
              <Text size="lg">{approver.name}</Text>
              {approver.at && <Text size="sm" c="dimmed" className="tabular">{approver.decision === 'rejected' ? 'Rejected ' : ''}{approver.at}</Text>}
            </div>
            {editable && approver.decision === 'waiting' && request.approvers.length > 1 && (
              <Tooltip label="Remove approver">
                <ActionIcon variant="subtle" color="gray" aria-label={`Remove ${approver.name}`} onClick={() => onRemove?.(index)}><X size={18} /></ActionIcon>
              </Tooltip>
            )}
          </li>
        ))}
      </ul>
      {editable && (
        <Button variant="subtle" size="xs" leftSection={<Plus size={16} aria-hidden="true" />} onClick={onAdd} className={classes.addApproval}>Add approval</Button>
      )}
    </section>
  )
}

/**
 * The action panel. What it shows depends on the open request or the selection:
 * awaiting approval, decided (Clear Status), unsubmitted (Submit) or several selected.
 */
export function ApprovalActions({ state, withApprovers = true }: { state: ApprovalsState; withApprovers?: boolean }) {
  const [note, setNote] = useState('')
  const selected = state.selection
  const request = state.active
  const multiple = selected.length > 0
  const unsubmittedList = state.kind === 'timesheet' && state.list === 'unsubmitted'
  const run = (action: Parameters<ApprovalsState['act']>[0]) => { state.act(action, note); setNote('') }

  if (!multiple && !request) return <Text size="sm" c="dimmed">Open a request to act on it.</Text>

  if (unsubmittedList) {
    const done = !multiple && request!.status !== 'unsubmitted'
    return (
      <Stack gap="md">
        <Eyebrow>Awaiting your submission</Eyebrow>
        <Button variant="default" fullWidth className={classes.action} disabled={done} onClick={() => run('submit')}>
          {multiple ? 'Submit selected' : 'Submit'}
        </Button>
        {done && <Text size="sm" c="dimmed">Submitted on {request!.employee}’s behalf. It now waits for approval.</Text>}
      </Stack>
    )
  }

  if (!multiple && request!.status !== 'pending') {
    return (
      <Stack gap="xl">
        <Stack gap="md">
          <Eyebrow>Modify status</Eyebrow>
          <Button variant="default" fullWidth className={classes.action} onClick={() => run('clear')}>Clear Status</Button>
        </Stack>
        {withApprovers && <RequiredApprovals request={request!} />}
      </Stack>
    )
  }

  const suffix = multiple ? ' selected' : ''
  return (
    <Stack gap="xl">
      <Stack gap="md">
        <Eyebrow>Awaiting your approval</Eyebrow>
        <Textarea
          label="Scheduler note"
          placeholder="Leave an optional note to the employee…"
          value={note}
          onChange={(event) => setNote(event.currentTarget.value)}
          autosize
          minRows={2}
          classNames={{ label: classes.noteLabel }}
        />
        <Stack gap={10}>
          <Button variant="default" fullWidth className={classes.action} onClick={() => run('approve')}>Approve{suffix}</Button>
          <Button variant="default" fullWidth className={classes.action} onClick={() => run('clear')}>Clear{suffix}</Button>
          <Button fullWidth className={classes.reject} onClick={() => run('reject')}>Reject{suffix}</Button>
        </Stack>
      </Stack>
      {withApprovers && !multiple && (
        <RequiredApprovals request={request!} onAdd={() => state.addApprover(request!.id)} onRemove={(index) => state.removeApprover(request!.id, index)} />
      )}
    </Stack>
  )
}

/** Action panel for desktop. Remounts per request so a half-written note does not carry over. */
export function ApprovalActionsPane({ state }: { state: ApprovalsState }) {
  const key = state.selection.length ? `multi:${state.list}` : state.active?.id ?? 'none'
  return (
    <div className={classes.pane}>
      <div className={classes.paneScroll} data-padded>
        <ApprovalActions key={key} state={state} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Visibility and the phone sheet                                      */
/* ------------------------------------------------------------------ */

/** Pick which properties each list item shows. Changes apply on Apply. */
export function VisibilityModal({ opened, kind, visible, onClose, onApply, contained }: {
  opened: boolean
  kind: ApprovalKind
  visible: ApprovalProperty[]
  onClose: () => void
  onApply: (visible: ApprovalProperty[]) => void
  /** Render inside the demo frame instead of a portal */
  contained?: boolean
}) {
  const [draft, setDraft] = useState(visible)
  const options = approvalProperties.filter((property) => property.kinds.includes(kind))
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Configure visibility"
      centered
      size={400}
      withinPortal={!contained}
      lockScroll={!contained}
      overlayProps={{ backgroundOpacity: 0.45, blur: 3 }}
      classNames={{ inner: classes.inner, title: classes.modalTitle }}
    >
      <Checkbox.Group value={draft} onChange={(value) => setDraft(value as ApprovalProperty[])} label={<Eyebrow>Properties</Eyebrow>}>
        <Stack gap="sm" mt="sm">
          {options.map((option) => <Checkbox key={option.key} value={option.key} label={option.label} />)}
        </Stack>
      </Checkbox.Group>
      <Group justify="flex-end" gap="sm" mt="xl">
        <Button variant="default" onClick={onClose}>Cancel</Button>
        <Button variant="default" onClick={() => { onApply(draft); onClose() }}>Apply</Button>
      </Group>
    </Modal>
  )
}

/** Bottom sheet with the action panel, on a phone. */
export function ApprovalActionsSheet({ state, opened, onClose }: { state: ApprovalsState; opened: boolean; onClose: () => void }) {
  const key = state.selection.length ? `multi:${state.list}` : state.active?.id ?? 'none'
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="bottom"
      size="auto"
      withinPortal={false}
      lockScroll={false}
      withCloseButton={false}
      overlayProps={{ backgroundOpacity: 0.45, blur: 3 }}
      classNames={{ inner: classes.inner, content: classes.sheet, body: classes.sheetBody }}
      aria-label="Approval actions"
    >
      <UnstyledButton className={classes.handle} onClick={onClose} aria-label="Close" />
      <ApprovalActions key={key} state={state} />
    </Drawer>
  )
}

/** Back to the list, on a phone. */
export function BackToList({ onBack }: { onBack: () => void }) {
  return (
    <Button variant="subtle" color="gray" size="sm" leftSection={<ChevronLeft size={18} aria-hidden="true" />} onClick={onBack} className={classes.back}>
      Approvals
    </Button>
  )
}
