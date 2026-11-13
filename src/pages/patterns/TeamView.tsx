import { useState } from 'react'
import { Group, Menu, Stack, Table, Text } from '@mantine/core'
import { ArrowUpDown, Check } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import Preview from '../../components/Preview'
import DoDont from '../../components/DoDont'
import CopyValue from '../../components/CopyValue'
import PropsTable from '../../components/PropsTable'
import ScheduleGrid from '../../components/schedule/ScheduleGrid'
import MobileSchedule from '../../components/schedule/MobileSchedule'
import ShiftChip from '../../components/schedule/ShiftChip'
import { BodiesValue, HoursValue, TimeOfDayBar } from '../../components/schedule/Coverage'
import { CoWorkerSearch, DesktopDemoFrame, MobileDemoFrame, PickerMenu, RangeStepper, ToolbarDivider } from '../../components/schedule/ScheduleChrome'
import { teamSections } from '../../components/schedule/sections'
import {
  MOCK_TODAY, formatFullDate, formatRange, rangeDays, scheduleUnits, sortMembers, type Chip, type ScheduleGroup, type ScheduleSort,
} from '../../components/schedule/data'
import { scheduleRanges, scheduleTokens, type ScheduleRange } from '../../tokens/schedule'
import classes from './TeamView.module.css'

const sortOptions: { key: ScheduleSort; label: string }[] = [
  { key: 'team', label: 'Team order' },
  { key: 'name', label: 'Name' },
  { key: 'rank', label: 'Rank' },
]

function filterGroups(unitKey: string, query: string, sort: ScheduleSort): ScheduleGroup[] {
  const unit = scheduleUnits.find((item) => item.key === unitKey) ?? scheduleUnits[0]
  const q = query.trim().toLowerCase()
  return unit.groups.map((group) => ({
    ...group,
    members: sortMembers(group.members.filter((member) => !q || `${member.name} ${member.initials} ${member.rank}`.toLowerCase().includes(q)), sort),
  }))
}

/* ------------------------------------------------------------------ */
/* Desktop                                                             */
/* ------------------------------------------------------------------ */

function DesktopDemo() {
  const [unit, setUnit] = useState(scheduleUnits[0].key)
  const [range, setRange] = useState<ScheduleRange>('week')
  const [anchor, setAnchor] = useState(MOCK_TODAY)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<ScheduleSort>('team')
  const [hint, setHint] = useState<string | null>(null)

  const rangeDef = scheduleRanges.find((item) => item.key === range)!
  const days = rangeDays(range, anchor)
  const reset = () => { setUnit(scheduleUnits[0].key); setRange('week'); setAnchor(MOCK_TODAY); setQuery(''); setSort('team'); setHint(null) }

  return (
    <Preview
      flush
      title="Team View, desktop"
      code={'<ScheduleGrid\n  sections={teamSections(groups)}\n  days={rangeDays(range, anchor)}\n  density={range === "week" ? "comfortable" : "compact"}\n  columnMin={range === "week" ? 120 : 56}\n  today={today}\n  corner={<CoWorkerSearch />}\n/>'}
    >
      <DesktopDemoFrame
        view="unit"
        status={hint ?? 'Preview only. “Today” is Friday, June 5, 2026 in this demo.'}
        onReset={reset}
        toolbar={
          <>
            <PickerMenu label="Team" value={unit} options={scheduleUnits.map(({ key, label }) => ({ key, label }))} onChange={setUnit} />
            <PickerMenu label="Range" value={range} options={scheduleRanges.map(({ key, label }) => ({ key, label }))} onChange={setRange} />
            <ToolbarDivider />
            <RangeStepper range={range} days={days} onAnchorChange={setAnchor} onPicker={() => setHint('The date picker is not part of this demo. Use the arrows or Today.')} />
            <div style={{ flex: 1 }} />
            <PickerMenu label="Sort" leftSection={<ArrowUpDown size={16} aria-hidden="true" />} value={sort} options={sortOptions} onChange={setSort} />
          </>
        }
      >
        <ScheduleGrid
          label="Team schedule"
          sections={teamSections(filterGroups(unit, query, sort))}
          days={days}
          density={rangeDef.density === 'comfortable' ? 'comfortable' : 'compact'}
          columnMin={rangeDef.columnMin}
          today={MOCK_TODAY}
          corner={<CoWorkerSearch value={query} onChange={setQuery} />}
          empty={<>No co-workers match “{query}”.</>}
          maxHeight="100%"
        />
      </DesktopDemoFrame>
    </Preview>
  )
}

/* ------------------------------------------------------------------ */
/* Mobile                                                              */
/* ------------------------------------------------------------------ */

function MobileDemo() {
  const [mode, setMode] = useState<'week' | 'day'>('week')
  const [anchor, setAnchor] = useState(MOCK_TODAY)
  const [unit, setUnit] = useState(scheduleUnits[0].key)
  const [sort, setSort] = useState<ScheduleSort>('team')
  const days = mode === 'week' ? rangeDays('week', anchor) : [anchor]
  const step = (direction: 1 | -1) => setAnchor((value) => value + direction * (mode === 'week' ? 7 : 1))
  const reset = () => { setMode('week'); setAnchor(MOCK_TODAY); setUnit(scheduleUnits[0].key); setSort('team') }

  return (
    <Preview flush title="Team View, mobile">
      <MobileDemoFrame
        view="unit"
        status={mode === 'week' ? formatRange(days) : formatFullDate(anchor)}
        onReset={reset}
        onStep={step}
        mode={mode}
        onModeChange={setMode}
        filters={
          <>
            <Menu.Label>Team</Menu.Label>
            {scheduleUnits.map((item) => <Menu.Item key={item.key} onClick={() => setUnit(item.key)} rightSection={item.key === unit ? <Check size={14} /> : null}>{item.label}</Menu.Item>)}
            <Menu.Divider />
            <Menu.Label>Sort by</Menu.Label>
            {sortOptions.map((item) => <Menu.Item key={item.key} onClick={() => setSort(item.key)} rightSection={item.key === sort ? <Check size={14} /> : null}>{item.label}</Menu.Item>)}
          </>
        }
        notes={
          <>
            <Text size="sm"><strong>Two views only.</strong> Phones show a week or a single day. Longer ranges need the desktop grid.</Text>
            <Text size="sm"><strong>Week.</strong> Each member gets a name row and a strip of seven cells. Codes are left out to save space; fills, tags and the cancelled line stay. Tap a cell for details.</Text>
            <Text size="sm"><strong>Day.</strong> Assignments sit on a 0–24 hour timeline, so gaps and overlaps are easy to spot.</Text>
            <Text size="sm"><strong>Coverage per team.</strong> Bodies, hours and time of day come first, above each team’s members.</Text>
            <Text size="sm"><strong>Swipe</strong> left or right to move a week or a day. Team and sort live behind the sliders button.</Text>
          </>
        }
      >
        <MobileSchedule sections={teamSections(filterGroups(unit, '', sort))} mode={mode} days={days} today={MOCK_TODAY} onSwipe={step} />
      </MobileDemoFrame>
    </Preview>
  )
}

/* ------------------------------------------------------------------ */
/* Specimens                                                           */
/* ------------------------------------------------------------------ */

const specimens: { name: string; meaning: string; chip: Chip }[] = [
  { name: 'Regular', meaning: 'A scheduled shift or assignment.', chip: { segments: [{ code: 'PatD' }] } },
  { name: 'Leave', meaning: 'Sick, PTO or vacation.', chip: { segments: [{ code: 'Sick' }] } },
  { name: 'Overtime', meaning: 'The whole assignment is overtime. Tagged OT.', chip: { segments: [{ code: 'PatD', overtime: 'full' }] } },
  { name: 'Mixed day', meaning: 'Split diagonally when a day mixes kinds. Here part of the shift is overtime.', chip: { segments: [{ code: 'PatD', overtime: 'partial' }] } },
  { name: 'Two assignments', meaning: 'Codes in one cell, separated by a line. The fill follows the kinds.', chip: { segments: [{ code: 'PatD' }, { code: 'PTO' }] } },
  { name: 'Out of unit', meaning: 'Hatched and tagged OU: the member works for another unit.', chip: { segments: [{ code: 'C-AM' }], outOfUnit: true } },
  { name: 'Cancelled', meaning: 'The code is struck through. On mobile, a line replaces the code.', chip: { segments: [{ code: 'PatD', cancelled: true }] } },
]

function CellSpecimens() {
  return (
    <Table.ScrollContainer minWidth={720} className="doc-table">
      <Table verticalSpacing="sm" horizontalSpacing="md">
        <Table.Thead>
          <Table.Tr><Table.Th>State</Table.Th><Table.Th w={190}>One week</Table.Th><Table.Th w={80}>Compact</Table.Th><Table.Th w={80}>Mobile</Table.Th><Table.Th>Meaning</Table.Th></Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {specimens.map((specimen) => (
            <Table.Tr key={specimen.name}>
              <Table.Td><Text size="sm" fw={600}>{specimen.name}</Text></Table.Td>
              <Table.Td><ShiftChip chip={specimen.chip} context={specimen.name} /></Table.Td>
              <Table.Td><div style={{ width: 56 }}><ShiftChip chip={specimen.chip} density="compact" context={specimen.name} /></div></Table.Td>
              <Table.Td><div style={{ width: 54, height: 44, display: 'flex' }}><ShiftChip chip={specimen.chip} density="strip" context={specimen.name} /></div></Table.Td>
              <Table.Td><Text size="sm">{specimen.meaning}</Text></Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function TeamView() {
  return (
    <>
      <PageHeader />

      <Section id="desktop" title="Desktop" description="Members down the side, days across. Pick a team and a range, then step through time. Names and the date row stay in place while the grid scrolls.">
        <DesktopDemo />
        <Stack gap="xs" mt="md">
          <Text size="sm">Hover or focus a cell to see times, full names of the codes and any tags. Each team starts with its coverage.</Text>
          <Text size="sm">A member with more than one cell on a day gets an extra row without a name, on a lighter background.</Text>
        </Stack>
      </Section>

      <Section id="ranges" title="Date ranges" description="Desktop shows one, two or three weeks, or a month. Mobile shows a day or a week. Longer ranges switch the grid to compact cells.">
        <Table.ScrollContainer minWidth={560} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th>Range</Table.Th><Table.Th>Date row</Table.Th><Table.Th>Min. column</Table.Th><Table.Th>Cells</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {scheduleRanges.map((item) => (
                <Table.Tr key={item.key}>
                  <Table.Td><Text size="sm" fw={600}>{item.label}</Text></Table.Td>
                  <Table.Td><Text size="sm">{item.density === 'comfortable' ? 'Mon, Jun 1' : '1'}</Text></Table.Td>
                  <Table.Td><Text size="sm" className="tabular">{item.columnMin}px</Text></Table.Td>
                  <Table.Td><Text size="sm">{item.cell}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Stack gap="xs" mt="md">
          <Text size="sm"><strong>Today</strong> has a tinted column header in the info color.</Text>
          <Text size="sm"><strong>Schedule periods.</strong> A vertical line in the info color marks the first day of each period, through the member rows only.</Text>
          <Text size="sm"><strong>Arrows</strong> move by the selected range: a week, two weeks, three weeks or a calendar month. Today jumps back to the range that contains today.</Text>
        </Stack>
      </Section>

      <Section id="cells" title="Shift cells" description="A cell holds one or more assignments for one day. The fill says what kind of time it is; tags and lines add the rest. Never rely on color alone: the code, the OT and OU tags and the tooltip carry the meaning too.">
        <CellSpecimens />
      </Section>

      <Section id="coverage" title="Coverage" description="Above each team, three rows compare the schedule with what the team needs. Red is below target, amber is above, green is on target.">
        <Preview title="Coverage values" align="start">
          <div className={classes.coverageSpecimens}>
            {([
              ['Bodies', 'Staff scheduled / staff needed.', [<BodiesValue key="u" bodies={{ have: 8, need: 10 }} />, <BodiesValue key="o" bodies={{ have: 6, need: 5 }} />, <BodiesValue key="m" bodies={{ have: 6, need: 6 }} />]],
              ['Hours', 'Staff hours against the target. ▼ short, ▲ over, no arrow when on target.', [<HoursValue key="u" hours={{ value: 2.5, direction: 'down' }} />, <HoursValue key="o" hours={{ value: 4.5, direction: 'up' }} />, <HoursValue key="m" hours={{ value: 8.5 }} />]],
              ['Time of day', 'The day from 00:00 to 24:00. Outlined stretches are below or above target.', [<TimeOfDayBar key="u" segments={[{ from: 0, to: 7, level: 'under' }, { from: 7, to: 10, level: 'over' }, { from: 10, to: 13, level: 'under' }]} />, <TimeOfDayBar key="o" segments={[{ from: 7, to: 14, level: 'over' }]} />, <TimeOfDayBar key="m" segments={[]} />]],
            ] as const).map(([label, meaning, values]) => (
              <div className={classes.coverageRow} key={label}>
                <div><Text size="sm" fw={600}>{label}</Text><Text size="xs" c="dimmed">{meaning}</Text></div>
                {values.map((value, index) => <div key={index}>{value}</div>)}
              </div>
            ))}
          </div>
        </Preview>
        <Text size="sm" mt="md">The arrow and the outline repeat what the color says, and every value has an accessible name such as “2.5 hours short”.</Text>
      </Section>

      <Section id="mobile" title="Mobile" description="On a phone the same schedule becomes a week of color strips or a single day on a timeline. Switch between them with the two list icons.">
        <MobileDemo />
      </Section>

      <Section id="component" title="Using the components" description="The demos use the real components in src/components/schedule, so Location View and other pages can reuse them.">
        <Text size="sm" fw={600} mb="xs">ScheduleGrid (desktop)</Text>
        <PropsTable rows={[
          { prop: 'sections', type: 'ScheduleSection[]', description: 'Teams with their rows and coverage. Build them with teamSections(groups); filter and sort the groups first. Location View uses locationSections.' },
          { prop: 'days', type: 'number[]', description: 'Visible days. Use rangeDays(range, anchor).' },
          { prop: 'density', type: "'comfortable' | 'compact'", default: "'comfortable'", description: 'Comfortable for one week, compact for longer ranges.' },
          { prop: 'columnMin', type: 'number', default: '120', description: 'Minimum day column width in px. Narrow containers scroll sideways.' },
          { prop: 'today', type: 'number', description: 'Highlights that day’s column header.' },
          { prop: 'corner', type: 'ReactNode', description: 'Top-left cell, usually the co-worker search.' },
          { prop: 'showCoverage', type: 'boolean', default: 'true', description: 'Coverage rows before each team’s members.' },
          { prop: 'empty', type: 'ReactNode', description: 'Shown when no section has rows, e.g. after a search.' },
          { prop: 'isMuted', type: '(chip: Chip) => boolean', description: 'Dims cells that do not match, e.g. a co-worker search in Location View.' },
          { prop: 'label', type: 'string', default: "'Schedule'", description: 'Accessible name of the grid.' },
        ]} />
        <Text size="sm" fw={600} mb="xs" mt="lg">MobileSchedule</Text>
        <PropsTable rows={[
          { prop: 'sections', type: 'ScheduleSection[]', description: 'Same data as the desktop grid.' },
          { prop: 'daySections', type: 'ScheduleSection[]', description: 'Sections for day mode when they differ. Location View lists the people on duty. Defaults to sections.' },
          { prop: 'mode', type: "'week' | 'day'", description: 'Week strips or the day timeline.' },
          { prop: 'days', type: 'number[]', description: 'Seven days in week mode; the first day in day mode.' },
          { prop: 'today', type: 'number', description: 'Highlights today in the week header.' },
          { prop: 'onSwipe', type: '(direction: 1 | -1) => void', description: 'Called on a horizontal swipe. 1 means forward.' },
        ]} />
        <Text size="sm" c="dimmed" mt="sm">Shift codes, kinds, ranges and CSS variables live in src/tokens/schedule.ts. Mock members and date helpers live in src/components/schedule/data.ts, section builders in sections.tsx, and the demo shell in ScheduleChrome.tsx.</Text>
      </Section>

      <Section id="tokens" title="CSS variables" description="Shift fills are their own colors per scheme. Everything else points at theme tokens, so it follows dark and light.">
        <Table.ScrollContainer minWidth={640} className="doc-table">
          <Table verticalSpacing="xs" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th>Variable</Table.Th><Table.Th>Value</Table.Th><Table.Th>Usage</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {scheduleTokens.map((token) => (
                <Table.Tr key={token.name}>
                  <Table.Td><CopyValue value={`var(${token.name})`} display={token.name} /></Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      {token.kind === 'color' && <span className={classes.swatch} style={{ background: `var(${token.name})` }} aria-hidden="true" />}
                      <Text size="xs" ff="monospace" c="dimmed">{token.light ? `${token.value} / ${token.light}` : token.value}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td><Text size="sm">{token.usage}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Text size="xs" c="dimmed" mt="xs">Two values are dark / light.</Text>
      </Section>

      <Section id="guidelines" title="Guidelines">
        <DoDont
          doItems={[
            'Keep names and the date row pinned while the grid scrolls.',
            'Show initials next to names, so two people with the same surname can be told apart.',
            'Pair every fill with a code or a tag, and give each cell a tooltip and an accessible name.',
            'Put coverage directly above the team it describes.',
            'Move a second assignment that does not fit into an overflow row instead of shrinking the cell.',
          ]}
          dontItems={[
            'Shrink text to fit a month. Switch to compact cells and let the grid scroll.',
            'Use the shift fills for anything other than regular, leave and overtime.',
            'Show color alone for coverage. Keep the numbers, arrows and outlines.',
            'Offer ranges longer than a week on a phone.',
          ]}
        />
      </Section>

      <Section id="figma" title="Figma reference" description="Frames this page was built from.">
        <Stack gap="md">
          <img src={`${import.meta.env.BASE_URL}figma/team-view-week.png`} alt="Team View on desktop, one week: Patrol Alpha with shift cells for Richards, Torres, Marino, Petrov, Dijkstra, two Haddads and Tanaka, followed by coverage rows." className={classes.figma} />
          <img src={`${import.meta.env.BASE_URL}figma/team-view-month.png`} alt="Team View on desktop, one month: compact cells with codes only, period lines every seven days and coverage per day." className={classes.figma} />
          <div className={classes.figmaPair}>
            <img src={`${import.meta.env.BASE_URL}figma/team-view-mobile-week.png`} alt="Team View on a phone, week view: names above strips of seven colored cells with OT and OU tags, coverage after each team." className={classes.figma} />
            <img src={`${import.meta.env.BASE_URL}figma/team-view-mobile-day.png`} alt="Team View on a phone, day view: names on the left and assignments on a 0 to 24 hour timeline, with coverage below the team." className={classes.figma} />
          </div>
        </Stack>
      </Section>
    </>
  )
}
