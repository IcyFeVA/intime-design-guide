import { useMemo, useState } from 'react'
import { Badge, Checkbox, Group, SegmentedControl, Stack, Table, Text, UnstyledButton } from '@mantine/core'
import { ChevronDown, ChevronUp, Flame, Shield } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import Preview from '../../components/Preview'
import FigmaSlot from '../../components/FigmaSlot'
import DoDont from '../../components/DoDont'
import PropsTable from '../../components/PropsTable'
import { departments } from '../../tokens/status'
import ShiftStateBadge from './ShiftStateBadge'
import styles from './ComponentDemos.module.css'

const roster = [
  { id: '0421', name: 'Alex Morgan', rank: 'Officer', unit: 'Patrol D4', department: 'police', time: '07:00–19:00', state: 'on-duty', hours: 12 },
  { id: '0183', name: 'Jordan Lee', rank: 'Captain', unit: 'Engine 12', department: 'fire', time: '07:00–07:00 +1', state: 'scheduled', hours: 24 },
  { id: '0256', name: 'Sam Rivera', rank: 'Sergeant', unit: 'Patrol D4', department: 'police', time: '19:00–23:00', state: 'overtime', hours: 4 },
  { id: '0359', name: 'Taylor Brooks', rank: 'Firefighter', unit: 'Engine 12', department: 'fire', time: '07:00–19:00', state: 'conflict', hours: 12 },
  { id: '—', name: 'Unassigned', rank: 'Officer required', unit: 'Patrol D4', department: 'police', time: '19:00–07:00 +1', state: 'open', hours: 12 },
  { id: '0117', name: 'Casey Chen', rank: 'Paramedic', unit: 'Medic 3', department: 'fire', time: '—', state: 'off', hours: 0 },
]

export default function DataTables() {
  const [density, setDensity] = useState('comfortable')
  const [sortKey, setSortKey] = useState<'name' | 'hours'>('name')
  const [ascending, setAscending] = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  const rows = useMemo(() => [...roster].sort((a, b) => {
    const comparison = sortKey === 'hours' ? a.hours - b.hours : a.name.localeCompare(b.name)
    return ascending ? comparison : -comparison
  }), [ascending, sortKey])
  const sort = (key: 'name' | 'hours') => { setSortKey(key); setAscending(key === sortKey ? !ascending : true) }
  const toggle = (id: string) => setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])
  const sortLabel = (label: string, key: 'name' | 'hours') => (
    <UnstyledButton onClick={() => sort(key)} aria-label={`Sort by ${label}`}><Group gap={4} wrap="nowrap"><Text inherit>{label}</Text>{sortKey === key && (ascending ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}</Group></UnstyledButton>
  )

  return (
    <>
      <PageHeader />
      <Section id="roster" title="Roster table" description="Keep identity, assignment and status visible at a glance. This demo supports selection and sorting by member or hours.">
        <Stack gap="lg">
          <Preview title={`${selected.length} selected · ${roster.length} members`} flush code={'<Table stickyHeader highlightOnHover verticalSpacing="sm">\n  <Table.Thead>…</Table.Thead>\n  <Table.Tbody>{rows}</Table.Tbody>\n</Table>'}>
            <Table.ScrollContainer minWidth={640} h={340}>
              <Table stickyHeader stickyHeaderOffset={0} highlightOnHover verticalSpacing={density === 'compact' ? 7 : 13} horizontalSpacing="md" className={styles.roster}>
                <Table.Thead><Table.Tr>
                  <Table.Th w={42}><Checkbox aria-label="Select all members" checked={selected.length === roster.length} indeterminate={selected.length > 0 && selected.length < roster.length} onChange={() => setSelected(selected.length === roster.length ? [] : roster.map((row) => row.id))} /></Table.Th>
                  <Table.Th aria-sort={sortKey === 'name' ? (ascending ? 'ascending' : 'descending') : 'none'}>{sortLabel('Member', 'name')}</Table.Th>
                  <Table.Th>Assignment</Table.Th><Table.Th>Shift</Table.Th><Table.Th>Status</Table.Th>
                  <Table.Th aria-sort={sortKey === 'hours' ? (ascending ? 'ascending' : 'descending') : 'none'}>{sortLabel('Hours', 'hours')}</Table.Th>
                </Table.Tr></Table.Thead>
                <Table.Tbody>{rows.map((row) => (
                  <Table.Tr key={row.id} className={selected.includes(row.id) ? styles.rowSelected : row.state === 'conflict' ? styles.rowConflict : row.state === 'off' ? styles.rowOff : undefined}>
                    <Table.Td><Checkbox aria-label={`Select ${row.name}`} checked={selected.includes(row.id)} onChange={() => toggle(row.id)} /></Table.Td>
                    <Table.Td><Text size="sm" fw={500}>{row.name}</Text><Text size="xs" c="dimmed">{row.rank} · #{row.id}</Text></Table.Td>
                    <Table.Td><Text size="sm">{row.unit}</Text><Badge size="xs" variant="light" color={departments.find((item) => item.key === row.department)?.color} leftSection={row.department === 'police' ? <Shield size={10} /> : <Flame size={10} />}>{departments.find((item) => item.key === row.department)?.label}</Badge></Table.Td>
                    <Table.Td><Text size="xs" className="tabular" style={{ whiteSpace: 'nowrap' }}>{row.time}</Text></Table.Td>
                    <Table.Td><ShiftStateBadge stateKey={row.state} /></Table.Td>
                    <Table.Td><Text size="sm" className="tabular" ta="right">{row.hours}h</Text></Table.Td>
                  </Table.Tr>
                ))}</Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Preview>
          <PropsTable rows={[
            { prop: 'stickyHeader', type: 'boolean', default: 'false', description: 'Keep column labels visible in long roster lists.' },
            { prop: 'verticalSpacing', type: 'MantineSpacing | number', default: 'sm', description: 'Use 7px for compact, 13px for comfortable rows.' },
            { prop: 'highlightOnHover', type: 'boolean', default: 'false', description: 'A subtle row highlight helps scanning, without hiding status.' },
          ]} />
        </Stack>
      </Section>
      <Section id="density" title="Density" description="Compact density is appropriate for supervisor desktops. Comfortable spacing is preferred for tablet and field use.">
        <Preview title="Changes the roster above" code={'<SegmentedControl value={density} onChange={setDensity}\n  data={[{ value: "compact", label: "Compact" }, { value: "comfortable", label: "Comfortable" }]} />'}>
          <Stack align="center"><SegmentedControl value={density} onChange={setDensity} data={[{ value: 'compact', label: 'Compact' }, { value: 'comfortable', label: 'Comfortable' }]} /><Text size="xs" c="dimmed">Current roster row padding: {density === 'compact' ? '7px' : '13px'}</Text></Stack>
        </Preview>
      </Section>
      <Section id="row-states" title="Row states" description="Selection is a temporary interaction state; scheduling status remains visible in its own column.">
        <Preview align="start" code={'<Table.Tr data-selected={selected}>\n  <Table.Td><Checkbox checked={selected} /></Table.Td>\n  <Table.Td><ShiftStateBadge stateKey="conflict" /></Table.Td>\n</Table.Tr>'}>
          <Stack w="100%" gap="sm">
            {[
              { key: 'conflict', title: 'Conflict', note: 'Tint the row gently; include the rule violation in details.' },
              { key: 'open', title: 'Open shift', note: 'Use “Unassigned”, not an empty member cell.' },
              { key: 'off', title: 'Off duty', note: 'De-emphasize secondary text; retain legibility.' },
            ].map((row) => <Group key={row.key} className={styles.stateCard} justify="space-between"><Stack gap={4}><Text size="sm" fw={500}>{row.title}</Text><Text size="xs" c="dimmed">{row.note}</Text></Stack><ShiftStateBadge stateKey={row.key} /></Group>)}
          </Stack>
        </Preview>
      </Section>
      <Section id="guidelines" title="Guidelines"><DoDont doItems={['Left-align names and labels; right-align numeric totals.', 'Keep column headers sticky and make sortable headers keyboard-operable.', 'Show a count and clear selection action for bulk operations.']} dontItems={['Make an entire row the only path to an essential action.', 'Use row color as the only way to signal a conflict.', 'Force all columns to shrink; scroll horizontally on small screens.']} /></Section>
      <Section id="figma" title="Figma reference"><FigmaSlot title="Roster table — columns, density & states" notes="Share default, selected, hover, conflict, empty, loading and mobile frames, including sticky columns and bulk-action behavior." /></Section>
    </>
  )
}
