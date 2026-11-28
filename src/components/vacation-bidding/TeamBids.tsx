import { useState } from 'react'
import { Button, Group, Modal, Popover, Stack, Table, Text, UnstyledButton, VisuallyHidden } from '@mantine/core'
import { Award } from 'lucide-react'
import { CalendarStepper } from '../calendar/CalendarToolbar'
import { formatShortDate, formatWeekdayLong, sameMonth, viewDays } from '../calendar/events'
import { PickerMenu } from '../schedule/ScheduleChrome'
import { dayNumber, MOCK_TODAY } from '../schedule/data'
import { teamBidStatuses, type TeamBidStatus } from '../../tokens/bidding'
import RequestStatusBadge from '../../pages/components/RequestStatusBadge'
import { formatSpan, shiftSignUpsFor, signUpsFor, teamBidsFor, type Bid, type OfferedShift, type SignUp, type TeamBid } from './data'
import classes from './VacationBidding.module.css'

type TeamView = 'month' | 'week'

/* While the “+N” list is open, Escape closes only the list, not the Team Bids dialog (data-mantine-stop-propagation). */

/** A month cell shows this many names; the rest are behind “+N”. Week view shows everyone. */
const MAX_NAMES = 3

const statusLabel = (status: TeamBidStatus) => teamBidStatuses.find((item) => item.key === status)!.label

/** One name: awarded is solid with an award icon, pending is striped with a dashed outline and a dot. */
function TeamBidChip({ entry }: { entry: TeamBid }) {
  return (
    <li className={classes.teamChip} data-status={entry.status}>
      {entry.status === 'awarded'
        ? <Award size={16} strokeWidth={1.75} aria-hidden="true" className={classes.awardIcon} />
        : <span className={classes.pendingDot} aria-hidden="true" />}
      <span className={classes.teamName}>{entry.name}</span>
      <VisuallyHidden>, {statusLabel(entry.status)}</VisuallyHidden>
    </li>
  )
}

function DayNames({ day, entries, limit }: { day: number; entries: TeamBid[]; limit: number }) {
  const [opened, setOpened] = useState(false)
  const shown = entries.length > limit ? entries.slice(0, limit) : entries
  const hidden = entries.length - shown.length
  return (
    <>
      <ul className={classes.teamChips}>
        {shown.map((entry) => <TeamBidChip key={entry.id} entry={entry} />)}
      </ul>
      {hidden > 0 && (
        <Popover opened={opened} onChange={setOpened} position="bottom-end" shadow="md" withinPortal>
          <Popover.Target>
            <UnstyledButton className={`${classes.teamMore} tabular`} aria-label={`${hidden} more on ${formatShortDate(day)}. Show all`} aria-expanded={opened} data-mantine-stop-propagation={opened || undefined} onClick={() => setOpened((value) => !value)}>
              +{hidden}
            </UnstyledButton>
          </Popover.Target>
          <Popover.Dropdown p={8}>
            <Text size="xs" fw={600} c="dimmed" pb={6}>{formatShortDate(day)}</Text>
            <Stack w={220}><ul className={classes.teamChips}>{entries.map((entry) => <TeamBidChip key={entry.id} entry={entry} />)}</ul></Stack>
          </Popover.Dropdown>
        </Popover>
      )}
    </>
  )
}

/** Awarded first, then pending, each by name. */
const order = (a: TeamBid, b: TeamBid) => (a.status === b.status ? a.name.localeCompare(b.name) : a.status === 'awarded' ? -1 : 1)

/** Month (or week) of everyone's leave in the bid, opened from View Team Bids. */
export function TeamBidsCalendar({ bid }: { bid: Bid }) {
  const [view, setView] = useState<TeamView>('month')
  const [anchor, setAnchor] = useState(bid.period[0])
  const entries = teamBidsFor(bid)
  const days = viewDays(view, anchor)
  const weeks = Array.from({ length: days.length / 7 }, (_, row) => days.slice(row * 7, row * 7 + 7))
  const on = (day: number) => entries.filter((entry) => entry.start <= day && day <= entry.end).sort(order)

  return (
    <>
      <div className={classes.teamToolbar}>
        <PickerMenu label="View" value={view} onChange={setView} options={[{ key: 'month', label: 'Month' }, { key: 'week', label: 'Week' }]} />
        <span className={classes.toolbarDivider} aria-hidden="true" />
        <CalendarStepper view={view} anchor={anchor} onAnchorChange={setAnchor} />
      </div>
      <div className={classes.teamCal}>
        <div className={classes.teamGrid} role="grid" aria-label={`Team bids, ${bid.title}`}>
          <div className={classes.teamHead} role="row">
            {weeks[0].map((day) => <div key={day} role="columnheader">{formatWeekdayLong(day)}</div>)}
          </div>
          {weeks.map((week) => (
            <div key={week[0]} className={classes.teamWeek} data-view={view} role="row">
              {week.map((day) => {
                const list = on(day)
                return (
                  <div key={day} role="gridcell" aria-label={`${formatShortDate(day)}: ${list.length ? `${list.length} on leave` : 'nobody on leave'}`} className={classes.teamDay}>
                    <span className={`${classes.teamDayNumber} tabular`} data-outside={(view === 'month' && !sameMonth(day, anchor)) || undefined} data-today={day === MOCK_TODAY || undefined}>
                      {dayNumber(day)}
                    </span>
                    {list.length > 0 && <DayNames day={day} entries={list} limit={view === 'month' ? MAX_NAMES : Infinity} />}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <div className={classes.teamLegend} aria-label="Legend">
          {teamBidStatuses.map((status) => (
            <span key={status.key} className={classes.teamLegendItem}>
              <span className={classes.teamSwatch} data-status={status.key} aria-hidden="true">
                {status.key === 'awarded' && <Award size={16} strokeWidth={1.75} className={classes.awardIcon} />}
              </span>
              {status.label}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}

export function TeamBidsModal({ bid, opened, onClose }: { bid: Bid; opened: boolean; onClose: () => void }) {
  return (
    <Modal opened={opened} onClose={onClose} centered size={1320} title="Team Bids" classNames={{ title: classes.modalTitle }}>
      {opened && <TeamBidsCalendar key={bid.id} bid={bid} />}
    </Modal>
  )
}

/** Sign-ups in the List Organizer's order with rank, and Awarded once the bid is closed. */
function SignUpsDialog({ title, intro, signUps, closed, opened, onClose }: {
  title: string
  intro?: string
  signUps: SignUp[]
  closed: boolean
  opened: boolean
  onClose: () => void
}) {
  return (
    <Modal opened={opened} onClose={onClose} centered size={600} title={title} classNames={{ title: classes.modalTitle }}>
      {intro && <Text fw={600} mb={4}>{intro}</Text>}
      <Text className={classes.confirmText}>Sign-Ups are sorted based on the List Organizer’s current order.</Text>
      {signUps.length ? (
        <Table className={classes.signUps} verticalSpacing={8} horizontalSpacing={0} mt="xl" withRowBorders={false}>
          <Table.Thead>
            <Table.Tr><Table.Th>Employee</Table.Th><Table.Th w="32%">Rank</Table.Th><Table.Th w="24%">Status</Table.Th></Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {signUps.map((signUp) => (
              <Table.Tr key={signUp.name} data-you={signUp.you || undefined}>
                <Table.Td>{signUp.name}{signUp.you && <Text span c="dimmed" inherit> (you)</Text>}</Table.Td>
                <Table.Td>{signUp.rank}</Table.Td>
                <Table.Td>{signUp.awarded && <RequestStatusBadge stateKey="awarded" size="lg" />}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Text c="dimmed" mt="xl">Nobody has signed up yet.</Text>
      )}
      {!closed && <Text size="sm" c="dimmed" mt="md">Awarded shows here once the bid closes.</Text>}
      <Group justify="flex-end" mt="xl">
        <Button variant="outline" className={classes.confirm} onClick={onClose} data-autofocus>Close</Button>
      </Group>
    </Modal>
  )
}

/**
 * All at once: who signed up, in the List Organizer's order, with their rank. Nobody knows who is awarded
 * until the bid closes, so Status stays empty until then.
 */
export function ViewSignUpsModal({ bid, opened, onClose }: { bid: Bid; opened: boolean; onClose: () => void }) {
  return <SignUpsDialog title="View Sign-Ups" signUps={signUpsFor(bid)} closed={bid.state === 'closed'} opened={opened} onClose={onClose} />
}

/** Shift bids: who signed up for one shift, opened from its “N Sign-Ups” link. */
export function ShiftSignUpsModal({ bid, shift, onClose }: { bid: Bid; shift: OfferedShift | null; onClose: () => void }) {
  const [last, setLast] = useState(shift)
  if (shift && shift !== last) setLast(shift)
  /* Keeps the last shift while the dialog closes, so its content doesn't vanish mid-transition */
  const shown = shift ?? last
  return (
    <SignUpsDialog
      title="View Sign-Ups"
      intro={shown ? `${shown.title} · ${formatSpan(shown.start, shown.end)}` : undefined}
      signUps={shown ? shiftSignUpsFor(bid, shown) : []}
      closed={bid.state === 'closed'}
      opened={!!shift}
      onClose={onClose}
    />
  )
}
