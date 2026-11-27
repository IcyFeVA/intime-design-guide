import { useState } from 'react'
import { ActionIcon, Avatar, Button, Group, Menu, Popover, Progress, Select, Text, Tooltip } from '@mantine/core'
import { CalendarDays, ChevronDown, ChevronsUpDown, Clock, Crosshair, MessageSquare, Phone, UserPlus, UserRound } from 'lucide-react'
import { formatDuration, formatMonthDay } from '../../schedule/data'
import { EmployeeDetailsModal } from '../../schedule/ScheduleDetails'
import type { EmployeeProfile } from '../../schedule/profiles'
import { allMembers, rankLabels, shortName, workforceProfile, type WorkforceMember } from '../data'
import { hoursSummary, type HoursTotals } from '../hours'
import { employeeOptions } from './options'
import { usePanelPeople } from './people'
import classes from '../WorkforcePanel.module.css'

type Preview = (action: string) => void

/** "Jun 1–7", or "May 26 – Jun 1" across months */
const spanLabel = ({ from, to }: HoursTotals) => {
  const [a, b] = [formatMonthDay(from), formatMonthDay(to)]
  return a.split(' ')[0] === b.split(' ')[0] ? `${a}–${b.split(' ')[1]}` : `${a} – ${b}`
}
const hours = (value: number) => (value ? formatDuration(value) : '–')

/** The Hours popover: this week and this period, the weekly cap, and the time banks */
function HoursCard({ member, day }: { member: WorkforceMember; day: number }) {
  const { week, period, cap, banks } = hoursSummary(member, day)
  const over = week.scheduled > cap
  const rows: [string, keyof Pick<HoursTotals, 'scheduled' | 'overtime' | 'leave'>][] = [['Scheduled', 'scheduled'], ['Overtime', 'overtime'], ['Leave', 'leave']]
  return (
    <div className={classes.hours}>
      <Text fw={600} size="sm">Hours · {shortName(member)}</Text>
      <table className={`${classes.hoursTable} tabular`}>
        <thead>
          <tr>
            <td />
            <th scope="col">This week<span>{spanLabel(week)}</span></th>
            <th scope="col">This period<span>{spanLabel(period)}</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, key]) => (
            <tr key={key}>
              <th scope="row">{label}</th>
              <td>{hours(week[key])}</td>
              <td>{hours(period[key])}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={classes.hoursCap}>
        <Progress
          value={Math.min(100, (week.scheduled / cap) * 100)}
          color={over ? 'var(--background-warning-filled)' : 'intime'}
          size="sm"
          aria-label={`Weekly hours: ${formatDuration(week.scheduled)} of ${cap}h`}
        />
        <Text size="xs" c={over ? 'var(--text-warning-default)' : 'dimmed'} className="tabular">
          {formatDuration(week.scheduled)} of {cap}h weekly cap{over ? ` · ${formatDuration(week.scheduled - cap)} over` : ''}
        </Text>
      </div>
      <table className={`${classes.hoursTable} tabular`}>
        <thead>
          <tr>
            <th scope="col" className={classes.hoursGroup}>Time banks</th>
            <th scope="col">Balance</th>
            <th scope="col">Can bank</th>
          </tr>
        </thead>
        <tbody>
          {banks.map((bank) => (
            <tr key={bank.bank}>
              <th scope="row">{bank.bank}</th>
              <td>{formatDuration(bank.balance)}</td>
              <td>{formatDuration(bank.available)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** The person the activity belongs to, with their hours, a jump to their row and a menu of actions. */
export function EmployeeRow({ value, day, onChange, onPreview }: {
  value: string | null
  /** The day being edited: Hours shows its week and period */
  day: number
  onChange: (id: string | null) => void
  onPreview: Preview
}) {
  const people = usePanelPeople()
  const person = value ? people.member(value) : undefined
  const [hoursOpen, setHoursOpen] = useState(false)
  const [profile, setProfile] = useState<EmployeeProfile | null>(null)
  const contact = person ? workforceProfile(person.id) : null
  const name = person ? shortName(person) : ''

  return (
    <div className={classes.employeeRow}>
      <Select
        aria-label="Employee"
        placeholder="Select employee"
        data={employeeOptions}
        value={value}
        onChange={onChange}
        searchable
        allowDeselect={false}
        nothingFoundMessage="Nobody matches"
        variant="unstyled"
        size="sm"
        className={classes.employee}
        classNames={{ input: classes.employeeInput }}
        leftSectionWidth={40}
        rightSectionWidth={24}
        leftSection={person
          ? <Avatar size={30} radius="xl" color="intime" variant="light" alt="">{person.initials}</Avatar>
          : <span className={classes.noEmployee}><UserPlus size={16} strokeWidth={1.75} aria-hidden="true" /></span>}
        rightSection={<ChevronsUpDown size={16} aria-hidden="true" />}
        rightSectionPointerEvents="none"
        renderOption={({ option }) => {
          const member = allMembers.find((m) => m.id === option.value)
          return (
            <Group gap={8} wrap="nowrap">
              <Text size="sm">{option.label}</Text>
              {member && <Text size="xs" c="dimmed">{rankLabels[member.rank]}</Text>}
            </Group>
          )
        }}
      />
      <Popover opened={hoursOpen && !!person} onChange={setHoursOpen} position="bottom-end" width={300} shadow="md" disabled={!person}>
        <Popover.Target>
          <Tooltip label="Hours this week and period, overtime and time banks" disabled={hoursOpen}>
            <Button
              variant="default"
              size="xs"
              h={32}
              leftSection={<Clock size={14} aria-hidden="true" />}
              onClick={() => setHoursOpen((open) => !open)}
              onKeyDown={(event) => {
                if (event.key !== 'Escape' || !hoursOpen) return
                event.stopPropagation()
                setHoursOpen(false)
              }}
              disabled={!person}
              aria-haspopup="dialog"
              aria-expanded={hoursOpen}
            >
              Hours
            </Button>
          </Tooltip>
        </Popover.Target>
        <Popover.Dropdown aria-label={`Hours for ${name}`}>
          {person && <HoursCard member={person} day={day} />}
        </Popover.Dropdown>
      </Popover>
      <Tooltip label="Find in schedule">
        <ActionIcon
          variant="default"
          size={32}
          aria-label="Find in schedule"
          onClick={() => person && (people.onFind ? people.onFind(person.id) : onPreview('Find in schedule'))}
          disabled={!person}
        >
          <Crosshair size={16} />
        </ActionIcon>
      </Tooltip>
      <Menu position="bottom-end" disabled={!person}>
        <Menu.Target>
          <Tooltip label="Actions for this person">
            <ActionIcon variant="subtle" color="gray" size={32} aria-label="Actions for this person" disabled={!person}><ChevronDown size={16} /></ActionIcon>
          </Tooltip>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>{name}</Menu.Label>
          <Menu.Item leftSection={<MessageSquare size={16} aria-hidden="true" />} onClick={() => onPreview(`Message ${name}`)}>Message</Menu.Item>
          <Menu.Item leftSection={<Phone size={16} aria-hidden="true" />} onClick={() => onPreview(`Call ${name}`)}>
            Call<Text span size="xs" c="dimmed" ml={8} className="tabular">{contact?.mobile}</Text>
          </Menu.Item>
          <Menu.Item leftSection={<UserRound size={16} aria-hidden="true" />} onClick={() => setProfile(contact)}>View profile</Menu.Item>
          <Menu.Item leftSection={<CalendarDays size={16} aria-hidden="true" />} onClick={() => onPreview(`View schedule for ${name}`)}>View schedule</Menu.Item>
        </Menu.Dropdown>
      </Menu>
      <EmployeeDetailsModal profile={profile} onClose={() => setProfile(null)} contained />
    </div>
  )
}
