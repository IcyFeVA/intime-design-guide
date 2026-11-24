import { useState } from 'react'
import { Link } from 'react-router'
import { Anchor, Button, Group, Stack, Table, Text } from '@mantine/core'
import { ArrowUpDown } from 'lucide-react'
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
import { FilterSheet, type MobileFilters, type SortDirection } from '../../components/schedule/FilterSheet'
import { SortModal } from '../../components/sort/SortModal'
import { teamSections } from '../../components/schedule/sections'
import { CoverageDrawerSpecimen, EmployeeDetailsModal } from '../../components/schedule/ScheduleDetails'
import { useCoverageDrawer } from '../../components/schedule/useCoverageDrawer'
import { memberProfile, type EmployeeProfile } from '../../components/schedule/profiles'
import { DayDetailsModal } from '../../components/day-details/DayDetails'
import { chipDayEvents } from '../../components/day-details/resolve'
import type { CalendarEvent } from '../../components/calendar/events'
import {
  MOCK_TODAY, formatFullDate, formatRange, rangeDays, scheduleUnits, sortMembers, type Chip, type ScheduleGroup, type ScheduleMember, type ScheduleRow,
  type ScheduleSort, type DayCoverage,
} from '../../components/schedule/data'
import { scheduleRanges, scheduleTokens, type ScheduleRange } from '../../tokens/schedule'
import classes from './TeamView.module.css'

const sortOptions: { key: ScheduleSort; label: string }[] = [
  { key: 'team', label: 'Team order' },
  { key: 'name', label: 'Name' },
  { key: 'rank', label: 'Rank' },
]

function filterGroups(unitKey: string, query: string, sort: ScheduleSort, direction: SortDirection = 'asc'): ScheduleGroup[] {
  const unit = scheduleUnits.find((item) => item.key === unitKey) ?? scheduleUnits[0]
  const q = query.trim().toLowerCase()
  return unit.groups.map((group) => ({
    ...group,
    members: (direction === 'desc' ? (members: ScheduleMember[]) => [...members].reverse() : (members: ScheduleMember[]) => members)(
      sortMembers(group.members.filter((member) => !q || `${member.name} ${member.initials} ${member.rank}`.toLowerCase().includes(q)), sort)),
  }))
}

/** “Now” on the mock today, for the day details’ current-time line. */
const MOCK_NOW = 10.5

/** Coverage drawer, employee details and day details, shared by both demos. */
function useScheduleDetails(variant: 'desktop' | 'mobile') {
  const coverage = useCoverageDrawer(variant)
  const [profile, setProfile] = useState<EmployeeProfile | null>(null)
  const [dayDetails, setDayDetails] = useState<{ name: string; day: number; events: CalendarEvent[] } | null>(null)
  const closeDay = () => setDayDetails(null)
  return {
    onCoverageClick: coverage.onCoverageClick,
    onRowClick: (row: ScheduleRow) => setProfile(memberProfile(row.id)),
    onChipClick: (row: ScheduleRow, day: number, chip: Chip) => setDayDetails({ name: row.name, day, events: chipDayEvents(chip, day) }),
    close: () => { coverage.close(); setProfile(null); closeDay() },
    overlays: (
      <>
        {coverage.drawer}
        <EmployeeDetailsModal profile={profile} onClose={() => setProfile(null)} variant={variant} contained />
        <DayDetailsModal
          opened={!!dayDetails}
          name={dayDetails?.name ?? ''}
          day={dayDetails?.day ?? MOCK_TODAY}
          events={dayDetails?.events ?? []}
          now={dayDetails?.day === MOCK_TODAY ? MOCK_NOW : undefined}
          onClose={closeDay}
          variant={variant}
          scrollToFirst
          contained
        />
      </>
    ),
  }
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
  const [direction, setDirection] = useState<SortDirection>('asc')
  const [sortOpen, setSortOpen] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const details = useScheduleDetails('desktop')

  const rangeDef = scheduleRanges.find((item) => item.key === range)!
  const days = rangeDays(range, anchor)
  const reset = () => { setUnit(scheduleUnits[0].key); setRange('week'); setAnchor(MOCK_TODAY); setQuery(''); setSort('team'); setDirection('asc'); setSortOpen(false); setHint(null); details.close() }

  return (
    <Preview
      flush
      title="Team View, desktop"
      code={'<ScheduleGrid\n  sections={teamSections(groups)}\n  days={rangeDays(range, anchor)}\n  density={range === "week" ? "comfortable" : "compact"}\n  columnMin={range === "week" ? 120 : 56}\n  today={today}\n  corner={<CoWorkerSearch />}\n/>'}
    >
      <DesktopDemoFrame
        view="unit"
        nav={{ withTooltips: false }}
        status={hint ?? 'Preview only. “Today” is Friday, June 5, 2026 in this demo.'}
        onReset={reset}
        toolbar={
          <>
            <PickerMenu label="Team" value={unit} options={scheduleUnits.map(({ key, label }) => ({ key, label }))} onChange={setUnit} />
            <PickerMenu label="Range" value={range} options={scheduleRanges.map(({ key, label }) => ({ key, label }))} onChange={setRange} />
            <ToolbarDivider />
            <RangeStepper range={range} days={days} anchor={anchor} onAnchorChange={setAnchor} />
            <div style={{ flex: 1 }} />
            <Button variant="default" size="sm" fw={400} leftSection={<ArrowUpDown size={16} aria-hidden="true" />} onClick={() => setSortOpen(true)}>Sort</Button>
          </>
        }
      >
        <ScheduleGrid
          label="Team schedule"
          sections={teamSections(filterGroups(unit, query, sort, direction))}
          days={days}
          density={rangeDef.density === 'comfortable' ? 'comfortable' : 'compact'}
          columnMin={rangeDef.columnMin}
          today={MOCK_TODAY}
          corner={<CoWorkerSearch value={query} onChange={setQuery} />}
          empty={<>No co-workers match “{query}”.</>}
          maxHeight="100%"
          onRowClick={details.onRowClick}
          onCoverageClick={details.onCoverageClick}
          onChipClick={details.onChipClick}
        />
        {details.overlays}
        <SortModal
          opened={sortOpen}
          value={{ field: sort, direction }}
          fields={sortOptions}
          onClose={() => setSortOpen(false)}
          onApply={(value) => { setSort(value.field); setDirection(value.direction) }}
          contained
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
  const [direction, setDirection] = useState<SortDirection>('asc')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const days = mode === 'week' ? rangeDays('week', anchor) : [anchor]
  const step = (direction: 1 | -1) => setAnchor((value) => value + direction * (mode === 'week' ? 7 : 1))
  const details = useScheduleDetails('mobile')
  const reset = () => { setMode('week'); setAnchor(MOCK_TODAY); setUnit(scheduleUnits[0].key); setSort('team'); setDirection('asc'); setFiltersOpen(false); details.close() }
  const applyFilters = (value: MobileFilters<ScheduleSort>) => {
    setAnchor(value.anchor); setUnit(value.scope); setSort(value.sort ?? 'team'); setDirection(value.direction ?? 'asc')
  }

  return (
    <Preview flush title="Team View, mobile">
      <MobileDemoFrame
        view="unit"
        status={mode === 'week' ? formatRange(days) : formatFullDate(anchor)}
        onReset={reset}
        onStep={step}
        mode={mode}
        onModeChange={setMode}
        onFilters={() => setFiltersOpen(true)}
        notes={
          <>
            <Text size="sm"><strong>Two views only.</strong> Phones show a week or a single day. Longer ranges need the desktop grid.</Text>
            <Text size="sm"><strong>Week.</strong> Each member gets a name row and a strip of seven cells. Codes are left out to save space; fills, tags and the cancelled line stay. Tap a cell to open that day’s details.</Text>
            <Text size="sm"><strong>Day.</strong> Assignments sit on a 0–24 hour timeline, so gaps and overlaps are easy to spot.</Text>
            <Text size="sm"><strong>Coverage per team.</strong> Bodies, hours and time of day come first, above each team’s members.</Text>
            <Text size="sm"><strong>Swipe</strong> left or right to move a week or a day. The sliders button opens a sheet with the start date, team and sort.</Text>
          </>
        }
      >
        <MobileSchedule
          sections={teamSections(filterGroups(unit, '', sort, direction))}
          mode={mode}
          days={days}
          today={MOCK_TODAY}
          onSwipe={step}
          onRowClick={details.onRowClick}
          onCoverageClick={details.onCoverageClick}
          onChipClick={details.onChipClick}
        />
        {details.overlays}
        <FilterSheet
          opened={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          value={{ anchor, scope: unit, sort, direction }}
          onApply={applyFilters}
          mode={mode}
          scopeLabel="Team"
          scopeOptions={scheduleUnits}
          sortOptions={sortOptions}
        />
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

/** Officer Dijkstra alone, for the extra-row example. */
const extraRowGroups: ScheduleGroup[] = scheduleUnits[0].groups.slice(0, 1).map((group) => ({ ...group, members: group.members.filter((member) => member.id === 'fd') }))

const extraRowCases = [
  { day: 'Mon, Jun 1', what: 'Day patrol, 07:00–17:00', shows: 'The block on its own.' },
  { day: 'Tue, Jun 2', what: 'Day patrol until 12:00, then Court, morning (C-AM) until 16:00', shows: 'Both fall inside the block’s hours, so they split the one cell.' },
  { day: 'Wed, Jun 3', what: 'Training, 08:00–16:00. Then PTO 16:00–18:00 and Court 18:00–21:00, partly overtime', shows: 'Training stays in the main row. PTO and Court fall after the block ends, so they go to the extra row, split in time order.' },
]

function ExtraRowDemo() {
  return (
    <Preview flush title="Extra row, Officer Dijkstra">
      <div className={classes.extraRowFrame}>
        <ScheduleGrid
          label="Officer Dijkstra’s week"
          sections={teamSections(extraRowGroups)}
          days={rangeDays('week', MOCK_TODAY)}
          today={MOCK_TODAY}
          showCoverage={false}
        />
      </div>
    </Preview>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

/** A day that is short in the evening and over in the early morning. */
const drawerExample: DayCoverage = { bodies: { have: 5, need: 6 }, hours: { value: 3, direction: 'down' }, timeOfDay: [{ from: 6, to: 8, level: 'over' }, { from: 17, to: 22, level: 'under' }] }

export default function TeamView() {
  return (
    <>
      <PageHeader />

      <Section id="desktop" title="Desktop" description="Members down the side, days across. Pick a team and a range, then step through time. Names and the date row stay in place while the grid scrolls.">
        <div className="page-wide"><DesktopDemo /></div>
        <Stack gap="xs" mt="md">
          <Text size="sm">Select a cell to see the day’s details: times, full names of the codes and any tags. Each team starts with its coverage.</Text>
          <Text size="sm">Some members have an extra row without a name, on a lighter background. It holds assignments outside their block’s hours. See <Anchor component={Link} to="/patterns/team-view?section=extra-rows" size="sm">Extra rows</Anchor>.</Text>
          <Text size="sm">Select a time-of-day cell for that day’s coverage hour by hour, or a name for the employee’s details.</Text>
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

      <Section id="cells" title="Shift cells" description="A cell holds one or more assignments for one day. The fill says what kind of time it is; tags and lines add the rest. Never rely on color alone: the code, the OT and OU tags and the accessible name carry the meaning too.">
        <CellSpecimens />
      </Section>

      <Section id="extra-rows" title="Extra rows" description="Each member works a block, such as Day patrol from 07:00 to 17:00. When the scheduler adds an assignment outside the block’s hours, it goes to an extra row under the member, so the block stays readable.">
        <ExtraRowDemo />
        <Table.ScrollContainer minWidth={560} className="doc-table" mt="md">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th w={110}>Day</Table.Th><Table.Th>Assignments</Table.Th><Table.Th>How it shows</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {extraRowCases.map((item) => (
                <Table.Tr key={item.day}>
                  <Table.Td><Text size="sm" fw={600}>{item.day}</Text></Table.Td>
                  <Table.Td><Text size="sm">{item.what}</Text></Table.Td>
                  <Table.Td><Text size="sm">{item.shows}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Stack gap="xs" mt="md">
          <Text size="sm"><strong>Inside the block’s hours,</strong> assignments share the main cell, split in time order.</Text>
          <Text size="sm"><strong>Outside the block’s hours,</strong> assignments go to the extra row. A member has one extra row at most: several assignments on the same day share its cell, split in time order.</Text>
          <Text size="sm"><strong>Any kind of time</strong> can go there: regular, leave or overtime. The fill, code and OT tag say which, as in any other cell.</Text>
          <Text size="sm"><strong>The row appears</strong> only when a day in the visible range needs it. It has no name, so it reads as part of the member above. Screen readers announce it as the member’s additional assignments.</Text>
          <Text size="sm"><strong>On mobile,</strong> the extra assignments show as a second, lighter strip under the member’s row.</Text>
        </Stack>
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
        <Stack gap="xs" mt="md">
          <Text size="sm">The arrow and the outline repeat what the color says, and every value has an accessible name such as “2.5 hours short”.</Text>
          <Text size="sm">Select a time-of-day cell to open a drawer with that day’s coverage hour by hour. See <Anchor component={Link} to="/patterns/team-view?section=coverage-drawer" size="sm">Coverage drawer</Anchor>.</Text>
        </Stack>
      </Section>

      <Section id="coverage-drawer" title="Coverage drawer" description="The time-of-day row only shows where a day is off target. Selecting a cell opens that day’s coverage hour by hour, so a scheduler can see which hours need people and how many.">
        <Preview title="Patrol Alpha, one day" align="center">
          <CoverageDrawerSpecimen title="Patrol Alpha" day={MOCK_TODAY} coverage={drawerExample} />
        </Preview>
        <Stack gap="xs" mt="md">
          <Text size="sm"><strong>Header.</strong> The team and the date, so the user knows which cell they opened.</Text>
          <Text size="sm"><strong>Legend.</strong> Names the three colors: under, met and over target.</Text>
          <Text size="sm"><strong>As scheduled.</strong> One block per hour from 00 to 24. It shows at a glance when in the day the team is short or over.</Text>
          <Text size="sm"><strong>Time table.</strong> The day split into stretches wherever coverage changes. Each row shows the staff required (Req), the staff scheduled (Act) and the difference. A dash means on target.</Text>
        </Stack>
        <Stack gap="xs" mt="lg">
          <Text size="sm" fw={600}>Behavior</Text>
          <Text size="sm"><strong>Opening.</strong> Click or tap a time-of-day cell, or focus it and press Enter. Try it in the Desktop and Mobile demos.</Text>
          <Text size="sm"><strong>Desktop</strong> slides a 440px drawer in from the right. <strong>Mobile</strong> opens it as a bottom sheet. Both dim and blur the schedule behind them, so the user keeps their place.</Text>
          <Text size="sm"><strong>Closing.</strong> The close button, Escape or a click outside. On a phone, tap the handle or outside the sheet. To see another day, close the drawer and select its cell.</Text>
          <Text size="sm"><strong>Read only.</strong> The drawer explains the numbers. Changes to the schedule happen in the grid.</Text>
          <Text size="sm"><strong>Not by color alone.</strong> The Diff column repeats the color as −2, +1 or a dash, and screen readers hear the bar as a list of stretches, such as “13:00–18:00 below target”.</Text>
        </Stack>
      </Section>

      <Section id="details" title="Employee details" description="Selecting a name opens the employee’s details on top of the schedule, so the user keeps their place.">
        <Table.ScrollContainer minWidth={560} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th>Select</Table.Th><Table.Th>Desktop</Table.Th><Table.Th>Mobile</Table.Th><Table.Th>Shows</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td><Text size="sm" fw={600}>Name</Text></Table.Td>
                <Table.Td><Text size="sm">Modal, 480px</Text></Table.Td>
                <Table.Td><Text size="sm">Bottom sheet</Text></Table.Td>
                <Table.Td><Text size="sm">Photo or initials, full name, rank, team, first day of employment, work email, mobile number and employee ID.</Text></Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Stack gap="xs" mt="md">
          <Text size="sm"><strong>Try it</strong> in the Desktop and Mobile demos. The overlay dims and blurs the schedule behind it.</Text>
          <Text size="sm"><strong>Closing.</strong> The close button, Escape or a click outside. On a phone, tap the handle or outside the sheet.</Text>
          <Text size="sm"><strong>Contact links.</strong> The email opens a new message and the mobile number starts a call on a phone.</Text>
        </Stack>
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
          { prop: 'onRowClick', type: '(row, section) => void', description: 'Makes row headers buttons. Team View opens the employee details.' },
          { prop: 'onCoverageClick', type: '(section, day) => void', description: 'Makes time-of-day cells buttons. Team View opens the coverage drawer.' },
          { prop: 'onChipClick', type: '(row, day, chip) => void', description: 'Makes shift cells buttons. Team View opens the day details for that person and day.' },
        ]} />
        <Text size="sm" fw={600} mb="xs" mt="lg">MobileSchedule</Text>
        <PropsTable rows={[
          { prop: 'sections', type: 'ScheduleSection[]', description: 'Same data as the desktop grid.' },
          { prop: 'daySections', type: 'ScheduleSection[]', description: 'Sections for day mode when they differ. Location View lists the people on duty. Defaults to sections.' },
          { prop: 'mode', type: "'week' | 'day'", description: 'Week strips or the day timeline.' },
          { prop: 'days', type: 'number[]', description: 'Seven days in week mode; the first day in day mode.' },
          { prop: 'today', type: 'number', description: 'Highlights today in the week header.' },
          { prop: 'onSwipe', type: '(direction: 1 | -1) => void', description: 'Called on a horizontal swipe. 1 means forward.' },
          { prop: 'onRowClick', type: '(row, section) => void', description: 'Makes names buttons, as on desktop.' },
          { prop: 'onCoverageClick', type: '(section, day) => void', description: 'Makes time-of-day bars buttons, as on desktop.' },
          { prop: 'onChipClick', type: '(row, day, chip) => void', description: 'Makes week cells and day bars buttons, as on desktop.' },
        ]} />
        <Text size="sm" fw={600} mb="xs" mt="lg">CoverageDrawer and EmployeeDetailsModal</Text>
        <PropsTable rows={[
          { prop: 'selection / profile', type: 'CoverageSelection | EmployeeProfile | null', description: 'What to show. null closes it. Build a profile with memberProfile(id).' },
          { prop: 'onClose', type: '() => void', description: 'Called on the close button, Escape or a click outside.' },
          { prop: 'variant', type: "'desktop' | 'mobile'", default: "'desktop'", description: 'Drawer or modal on desktop, a bottom sheet on mobile.' },
          { prop: 'contained', type: 'boolean', default: 'false', description: 'Renders inside the demo frame instead of over the window. The frame needs transform: translateZ(0).' },
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
            'Pair every fill with a code or a tag, and give each cell an accessible name.',
            'Put coverage directly above the team it describes.',
            'Put assignments outside the block’s hours in the extra row, and keep the block on its own in the main row.',
            'Open details over the schedule, so closing them returns the user to the same place.',
          ]}
          dontItems={[
            'Shrink text to fit a month. Switch to compact cells and let the grid scroll.',
            'Use the shift fills for anything other than regular, leave and overtime.',
            'Show color alone for coverage. Keep the numbers, arrows and outlines.',
            'Offer ranges longer than a week on a phone.',
            'Navigate away from the schedule to show coverage or a profile.',
          ]}
        />
      </Section>

      <Section id="figma" title="Figma reference" description="Frames this page was built from.">
        <Stack gap="md">
          <img src={`${import.meta.env.BASE_URL}figma/team-view-week.png`} alt="Team View on desktop, one week: Patrol Alpha with shift cells for Richards, Torres, Marino, Petrov, Dijkstra, two Haddads and Tanaka, followed by coverage rows." className={classes.figma} />
          <img src={`${import.meta.env.BASE_URL}figma/team-view-month.png`} alt="Team View on desktop, one month: compact cells with codes only, period lines every seven days and coverage per day." className={classes.figma} />
          <img src={`${import.meta.env.BASE_URL}figma/team-view-coverage-drawer.png`} alt="Coverage drawer for Communication A on Sat, Sep 26: a legend, 24 hour blocks colored under, met and over, and a table of time ranges with required, scheduled and difference." className={classes.figma} />
          <img src={`${import.meta.env.BASE_URL}figma/team-view-employee-details.png`} alt="Employee details modal for Christine Harris, Sergeant: photo, first employed date, work email, mobile number, employee ID and a Close button." className={classes.figma} />
          <div className={classes.figmaPair}>
            <img src={`${import.meta.env.BASE_URL}figma/team-view-mobile-week.png`} alt="Team View on a phone, week view: names above strips of seven colored cells with OT and OU tags, coverage after each team." className={classes.figma} />
            <img src={`${import.meta.env.BASE_URL}figma/team-view-mobile-day.png`} alt="Team View on a phone, day view: names on the left and assignments on a 0 to 24 hour timeline, with coverage below the team." className={classes.figma} />
            <img src={`${import.meta.env.BASE_URL}figma/team-view-mobile-coverage.png`} alt="Coverage details as a bottom sheet on a phone, over a blurred Team View week." className={classes.figma} />
          </div>
        </Stack>
      </Section>
    </>
  )
}
