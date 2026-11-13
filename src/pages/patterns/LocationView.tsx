import { useState } from 'react'
import { Anchor, Menu, Notification, Stack, Table, Text } from '@mantine/core'
import { Check } from 'lucide-react'
import { Link } from 'react-router'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import Preview from '../../components/Preview'
import DoDont from '../../components/DoDont'
import PropsTable from '../../components/PropsTable'
import ScheduleGrid from '../../components/schedule/ScheduleGrid'
import MobileSchedule from '../../components/schedule/MobileSchedule'
import ShiftChip from '../../components/schedule/ShiftChip'
import LocationPath from '../../components/schedule/LocationPath'
import { CoWorkerSearch, DesktopDemoFrame, MobileDemoFrame, PickerMenu, RangeStepper, ToolbarDivider } from '../../components/schedule/ScheduleChrome'
import { locationPeopleSections, locationSections, postTime } from '../../components/schedule/sections'
import { MOCK_TODAY, formatFullDate, formatRange, rangeDays, type Chip } from '../../components/schedule/data'
import { fullName, locationSites, personForChip, scheduleLocations, type ScheduleLocation } from '../../components/schedule/locations'
import { scheduleRanges, type ScheduleRange } from '../../tokens/schedule'
import classes from './LocationView.module.css'

const locationsForSite = (site: string) => scheduleLocations.filter((location) => site === 'all' || location.site === site)

const chipMatches = (chip: Chip, q: string) => {
  const person = personForChip(chip)
  return !!person && fullName(person).toLowerCase().includes(q)
}

/** Keeps posts that have a matching person in the visible days. */
function searchLocations(locations: ScheduleLocation[], query: string, days: number[]): ScheduleLocation[] {
  const q = query.trim().toLowerCase()
  if (!q) return locations
  return locations.map((location) => ({
    ...location,
    posts: location.posts.filter((post) => days.some((day) => post.assignments(day).some((chip) => chip && chipMatches(chip, q)))),
  }))
}

/* ------------------------------------------------------------------ */
/* Desktop                                                             */
/* ------------------------------------------------------------------ */

function DesktopDemo() {
  const [site, setSite] = useState('all')
  const [range, setRange] = useState<ScheduleRange>('week')
  const [anchor, setAnchor] = useState(MOCK_TODAY)
  const [query, setQuery] = useState('')
  const [hint, setHint] = useState<string | null>(null)

  const rangeDef = scheduleRanges.find((item) => item.key === range)!
  const days = rangeDays(range, anchor)
  const q = query.trim().toLowerCase()
  const reset = () => { setSite('all'); setRange('week'); setAnchor(MOCK_TODAY); setQuery(''); setHint(null) }

  return (
    <Preview
      flush
      title="Location View, desktop"
      code={'<ScheduleGrid\n  label="Location schedule"\n  sections={locationSections(locations)}\n  days={rangeDays(range, anchor)}\n  density={range === "week" ? "comfortable" : "compact"}\n  isMuted={(chip) => query && !matches(chip, query)}\n  corner={<CoWorkerSearch />}\n/>'}
    >
      <DesktopDemoFrame
        view="location"
        status={hint ?? 'Preview only. “Today” is Friday, June 5, 2026 in this demo.'}
        onReset={reset}
        toolbar={
          <>
            <PickerMenu label="Location" value={site} options={locationSites} onChange={setSite} />
            <PickerMenu label="Range" value={range} options={scheduleRanges.map(({ key, label }) => ({ key, label }))} onChange={setRange} />
            <ToolbarDivider />
            <RangeStepper range={range} days={days} onAnchorChange={setAnchor} onPicker={() => setHint('The date picker is not part of this demo. Use the arrows or Today.')} />
          </>
        }
      >
        <ScheduleGrid
          label="Location schedule"
          sections={locationSections(searchLocations(locationsForSite(site), query, days))}
          days={days}
          density={rangeDef.density === 'comfortable' ? 'comfortable' : 'compact'}
          columnMin={rangeDef.columnMin}
          today={MOCK_TODAY}
          corner={<CoWorkerSearch value={query} onChange={setQuery} />}
          isMuted={q ? (chip) => !chipMatches(chip, q) : undefined}
          empty={<>Nobody matching “{query}” is on a post in this range.</>}
          maxHeight="100%"
        />
      </DesktopDemoFrame>
    </Preview>
  )
}

/* ------------------------------------------------------------------ */
/* Mobile                                                              */
/* ------------------------------------------------------------------ */

/** The location furthest below target on a day, for the coverage alert. */
function worstShortfall(locations: ScheduleLocation[], day: number) {
  let worst: { location: ScheduleLocation; short: number } | null = null
  for (const location of locations) {
    const { have, need } = location.coverage(day).bodies
    if (have < need && (!worst || need - have > worst.short)) worst = { location, short: need - have }
  }
  return worst
}

function CoverageAlert({ location, short, day, onClose }: { location: ScheduleLocation; short: number; day: number; onClose: () => void }) {
  return (
    <Notification
      color="cyan"
      withBorder
      title={`${location.path.join(' › ')} coverage for ${formatFullDate(day)}`}
      onClose={onClose}
      closeButtonProps={{ 'aria-label': 'Dismiss coverage alert' }}
      className={classes.alert}
    >
      Coverage under by {short}
    </Notification>
  )
}

function MobileDemo() {
  const [mode, setMode] = useState<'week' | 'day'>('day')
  const [anchor, setAnchor] = useState(MOCK_TODAY)
  const [site, setSite] = useState('all')
  const [dismissed, setDismissed] = useState<number[]>([])
  const days = mode === 'week' ? rangeDays('week', anchor) : [anchor]
  const locations = locationsForSite(site)
  const step = (direction: 1 | -1) => setAnchor((value) => value + direction * (mode === 'week' ? 7 : 1))
  const reset = () => { setMode('day'); setAnchor(MOCK_TODAY); setSite('all'); setDismissed([]) }
  const shortfall = mode === 'day' && !dismissed.includes(anchor) ? worstShortfall(locations, anchor) : null

  return (
    <Preview flush title="Location View, mobile">
      <MobileDemoFrame
        view="location"
        status={mode === 'week' ? formatRange(days) : formatFullDate(anchor)}
        onReset={reset}
        onStep={step}
        mode={mode}
        onModeChange={setMode}
        filters={
          <>
            <Menu.Label>Location</Menu.Label>
            {locationSites.map((item) => <Menu.Item key={item.key} onClick={() => setSite(item.key)} rightSection={item.key === site ? <Check size={14} /> : null}>{item.label}</Menu.Item>)}
          </>
        }
        overlay={shortfall && <CoverageAlert {...shortfall} day={anchor} onClose={() => setDismissed((value) => [...value, anchor])} />}
        notes={
          <>
            <Text size="sm"><strong>Week.</strong> Each post gets a label row (post and time) and one strip per position. Empty cells are open positions.</Text>
            <Text size="sm"><strong>Day.</strong> Rows are the people on duty at each location, with their posts on a 0–24 hour timeline. Locations with nobody on duty keep their header, so the list does not jump around.</Text>
            <Text size="sm"><strong>Coverage alert.</strong> When a location is below target on the shown day, an alert names it and the shortfall. Dismissing it hides it for that day.</Text>
            <Text size="sm"><strong>Swipe</strong> left or right to move a week or a day. The location filter lives behind the sliders button.</Text>
          </>
        }
      >
        <MobileSchedule
          sections={locationSections(locations)}
          daySections={locationPeopleSections(locations, anchor)}
          mode={mode}
          days={days}
          today={MOCK_TODAY}
          onSwipe={step}
        />
      </MobileDemoFrame>
    </Preview>
  )
}

/* ------------------------------------------------------------------ */
/* Specimens                                                           */
/* ------------------------------------------------------------------ */

const assignment = (extra: Partial<Chip> & { overtime?: 'full'; cancelled?: boolean } = {}): Chip => ({
  segments: [{ code: 'Extra Patrol', label: 'Riley', start: 6, end: 15, overtime: extra.overtime, cancelled: extra.cancelled }],
  outOfUnit: extra.outOfUnit,
  partialKind: extra.partialKind,
})

const specimens: { name: string; meaning: string; chip: Chip | null }[] = [
  { name: 'Assigned', meaning: 'Someone holds the position for the shift.', chip: assignment() },
  { name: 'Partly on leave', meaning: 'Split diagonally: the person is on leave for part of the shift.', chip: assignment({ partialKind: 'leave' }) },
  { name: 'Overtime', meaning: 'The person works the post on overtime. Tagged OT.', chip: assignment({ overtime: 'full' }) },
  { name: 'Out of unit', meaning: 'Hatched and tagged OU: the person comes from another unit.', chip: assignment({ outOfUnit: true }) },
  { name: 'Cancelled', meaning: 'The name is struck through. The position is open again.', chip: assignment({ cancelled: true }) },
  { name: 'Open position', meaning: 'Nobody holds the position. On mobile the empty cell is tinted.', chip: null },
]

export default function LocationView() {
  return (
    <>
      <PageHeader />

      <Section id="desktop" title="Desktop" description="Posts down the side, days across, grouped by location. Each cell shows who holds the post that day. Pick a location and a range, or search for a co-worker.">
        <DesktopDemo />
        <Stack gap="xs" mt="md">
          <Text size="sm">Location View is the second tab of Team View. It shares the grid, the ranges, the period lines and the today header; see <Anchor component={Link} to="/patterns/team-view?section=ranges">Team View date ranges</Anchor>.</Text>
          <Text size="sm">Searching dims everyone else and hides posts the person is not on in the visible range.</Text>
        </Stack>
      </Section>

      <Section id="posts" title="Posts and positions" description="A row is a post: what needs doing, and when. A post that needs more than one person gets one line per position.">
        <Preview title="Post label" align="start">
          <div className={classes.postSpecimen}>
            <Text size="md" lh={1.25}>Extra Patrol</Text>
            <span className={classes.mono}>{postTime({ start: 6, end: 15 })}</span>
          </div>
          <div className={classes.postSpecimen}>
            <Text size="md" lh={1.25}>Night Shift</Text>
            <span className={classes.mono}>{postTime({ start: 18, end: 26 })}</span>
          </div>
          <Stack gap={4} maw={360}>
            <Text size="sm">The post name, then its hours in the monospace face. Hours past midnight wrap: 18:00-02:00.</Text>
            <Text size="sm">On mobile both sit on one line: “Night Shift · 18:00-02:00”.</Text>
          </Stack>
        </Preview>
        <Table.ScrollContainer minWidth={640} className="doc-table" mt="md">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr><Table.Th>State</Table.Th><Table.Th w={190}>One week</Table.Th><Table.Th w={80}>Compact</Table.Th><Table.Th w={80}>Mobile</Table.Th><Table.Th>Meaning</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {specimens.map((specimen) => (
                <Table.Tr key={specimen.name}>
                  <Table.Td><Text size="sm" fw={600}>{specimen.name}</Text></Table.Td>
                  <Table.Td>{specimen.chip ? <ShiftChip chip={specimen.chip} context={specimen.name} /> : <div className={classes.openCell} />}</Table.Td>
                  <Table.Td><div style={{ width: 56 }}>{specimen.chip ? <ShiftChip chip={specimen.chip} density="compact" context={specimen.name} /> : <div className={classes.openCell} />}</div></Table.Td>
                  <Table.Td><div style={{ width: 54, height: 44, display: 'flex' }}>{specimen.chip ? <ShiftChip chip={specimen.chip} density="strip" context={specimen.name} /> : <div className={classes.openStrip} />}</div></Table.Td>
                  <Table.Td><Text size="sm">{specimen.meaning}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Text size="sm" mt="md">Cells use the same fills and tags as <Anchor component={Link} to="/patterns/team-view?section=cells">Team View shift cells</Anchor>. Only the label changes: the person’s surname instead of a shift code.</Text>
      </Section>

      <Section id="locations" title="Location headers" description="Each location is a section with its full path, from the site down. Every level that has posts gets its own section.">
        <Preview title="Header paths" align="start">
          <Stack gap="sm" w="100%">
            {[['Convention Centre'], ['Convention Centre', 'North', 'Entrances', 'A'], ['Stadium', 'Parking Lot']].map((path) => (
              <div className={classes.headerSpecimen} key={path.join()}><LocationPath path={path} /></div>
            ))}
          </Stack>
        </Preview>
        <Stack gap="xs" mt="md">
          <Text size="sm">The last level is brightest; the levels above it are dimmed. Chevrons separate the levels and are hidden from screen readers, which read the path as a list of names.</Text>
          <Text size="sm">Desktop headers are left-aligned and pinned while the grid scrolls sideways. Mobile headers are centered.</Text>
        </Stack>
      </Section>

      <Section id="coverage" title="Coverage" description="Coverage works as in Team View, per location instead of per team. It sits above the location’s posts.">
        <Text size="sm">Bodies, hours and time of day use the same colors, arrows and outlines. See <Anchor component={Link} to="/patterns/team-view?section=coverage">Team View coverage</Anchor>.</Text>
        <Text size="sm" mt="xs">On the mobile day view, a location with nobody on duty shows only its header, without coverage.</Text>
      </Section>

      <Section id="mobile" title="Mobile" description="Week shows posts with one strip per position. Day switches to people: who is on duty at each location, on a timeline.">
        <MobileDemo />
      </Section>

      <Section id="coverage-alert" title="Coverage alert" description="When a location is below target on the day being viewed, an alert names the location, the date and the shortfall.">
        <Preview title="Alert" align="start">
          <div style={{ width: 360, maxWidth: '100%' }}>
            <CoverageAlert location={scheduleLocations[5]} short={2} day={MOCK_TODAY} onClose={() => undefined} />
          </div>
        </Preview>
        <Stack gap="xs" mt="md">
          <Text size="sm"><strong>When.</strong> On the mobile day view, for the location furthest below target. One alert at a time.</Text>
          <Text size="sm"><strong>Where.</strong> Pinned to the bottom of the screen, above the content, so it does not push the schedule down.</Text>
          <Text size="sm"><strong>Dismiss.</strong> The close button hides it for that day. It comes back on another day that is short.</Text>
          <Text size="sm"><strong>Copy.</strong> “[Location] coverage for [date]” as the title, then “Coverage under by [n]”.</Text>
        </Stack>
      </Section>

      <Section id="component" title="Using the components" description="Location View uses the Team View components with different sections. Build them from your locations; the grid and mobile view do the rest.">
        <PropsTable rows={[
          { prop: 'locationSections(locations)', type: 'ScheduleSection[]', description: 'One section per location, one row per post, one line per position. For ScheduleGrid and the mobile week.' },
          { prop: 'locationPeopleSections(locations, day)', type: 'ScheduleSection[]', description: 'One row per person on duty that day. Pass as daySections to MobileSchedule.' },
          { prop: '<LocationPath path />', type: 'string[]', description: 'Breadcrumb for section headers.' },
          { prop: 'ScheduleGrid isMuted', type: '(chip: Chip) => boolean', description: 'Dims cells that do not match the co-worker search.' },
        ]} />
        <Text size="sm" c="dimmed" mt="sm">Mock locations, posts and people live in src/components/schedule/locations.ts. The grid, mobile view and demo shell are documented on <Anchor component={Link} to="/patterns/team-view?section=component">Team View</Anchor>.</Text>
      </Section>

      <Section id="guidelines" title="Guidelines">
        <DoDont
          doItems={[
            'Show the post’s hours under its name, so a cell only needs the person.',
            'Give each position its own line, so open positions are visible at a glance.',
            'Keep empty locations as headers on the day view, so the list stays stable.',
            'Name the location and the shortfall in the coverage alert.',
          ]}
          dontItems={[
            'Repeat the location name in every post label on desktop. The header already says it.',
            'Hide an open position because nobody is assigned.',
            'Stack several coverage alerts. Show the worst one.',
            'Add sorting. Posts follow the location’s setup order.',
          ]}
        />
      </Section>

      <Section id="figma" title="Figma reference" description="Frames this page was built from.">
        <Stack gap="md">
          <img src="/figma/location-view-week.png" alt="Location View on desktop, one week: Convention Centre and its North Entrances A and B, each with coverage rows and posts such as Special Event 06:00-17:00 with surnames in the cells." className={classes.figma} />
          <div className={classes.figmaPair}>
            <img src="/figma/location-view-mobile-week.png" alt="Location View on a phone, week view: posts such as Chicco’s Chickeria Day Shift 06:00-14:00 with a strip of seven cells per position, and coverage." className={classes.figma} />
            <img src="/figma/location-view-mobile-day.png" alt="Location View on a phone, day view: location headers, people on a 0 to 24 hour timeline, coverage, and a coverage alert at the bottom." className={classes.figma} />
          </div>
        </Stack>
      </Section>
    </>
  )
}
