import { ActionIcon, Avatar, Button, Group, Menu, Select, Text, Tooltip } from '@mantine/core'
import { CalendarDays, ChevronDown, ChevronsUpDown, Clock, Crosshair, MessageSquare, Phone, UserPlus, UserRound } from 'lucide-react'
import { allMembers, rankLabels } from '../data'
import { employeeOptions } from './options'
import classes from '../WorkforcePanel.module.css'

type Preview = (action: string) => void

/** The person the activity belongs to, with their hours, a jump to their row and a menu of actions. */
export function EmployeeRow({ value, onChange, onPreview }: { value: string | null; onChange: (id: string | null) => void; onPreview: Preview }) {
  const person = allMembers.find((member) => member.id === value)
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
      <Tooltip label="Hours this week and period, overtime and time banks">
        <Button variant="default" size="xs" h={32} leftSection={<Clock size={14} aria-hidden="true" />} onClick={() => onPreview('Hours summary')} disabled={!person}>Hours</Button>
      </Tooltip>
      <Tooltip label="Find in schedule">
        <ActionIcon variant="default" size={32} aria-label="Find in schedule" onClick={() => onPreview('Find in schedule')} disabled={!person}><Crosshair size={16} /></ActionIcon>
      </Tooltip>
      <Menu position="bottom-end" disabled={!person}>
        <Menu.Target>
          <Tooltip label="Actions for this person">
            <ActionIcon variant="subtle" color="gray" size={32} aria-label="Actions for this person" disabled={!person}><ChevronDown size={16} /></ActionIcon>
          </Tooltip>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item leftSection={<MessageSquare size={16} aria-hidden="true" />} onClick={() => onPreview('Message')}>Message</Menu.Item>
          <Menu.Item leftSection={<Phone size={16} aria-hidden="true" />} onClick={() => onPreview('Call')}>Call</Menu.Item>
          <Menu.Item leftSection={<UserRound size={16} aria-hidden="true" />} onClick={() => onPreview('View profile')}>View profile</Menu.Item>
          <Menu.Item leftSection={<CalendarDays size={16} aria-hidden="true" />} onClick={() => onPreview('View schedule')}>View schedule</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </div>
  )
}
