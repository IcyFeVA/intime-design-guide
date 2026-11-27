import { useState } from 'react'
import { MIN_REST_HOURS, WEEKLY_HOURS_CAP } from '../../components/workforce/warnings'
import { Badge, Button, Group, Stack, Table, Text } from '@mantine/core'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import Preview from '../../components/Preview'
import DoDont from '../../components/DoDont'
import CopyValue from '../../components/CopyValue'
import PropsTable from '../../components/PropsTable'
import ShortcutKeys from '../../components/shortcuts/ShortcutKeys'
import { detectPlatform, spokenKeys } from '../../components/shortcuts/keys'
import WorkforceDemo from '../../components/workforce/WorkforceDemo'
import OpenShiftChip from '../../components/workforce/OpenShiftChip'
import DetailedChip from '../../components/workforce/DetailedChip'
import StackedChip from '../../components/workforce/StackedChip'
import { openStatus, type OpenShift } from '../../components/workforce/data'
import { MOCK_TODAY, PARTIAL_OVERTIME_HOURS, formatDuration, type Chip } from '../../components/schedule/data'
import { TimeField } from '../../components/workforce/panel/TimeField'
import { formatSpan, normalizeEnd, parseTime } from '../../components/workforce/panel/format'
import {
  DAY_MAX_WIDTH, LABEL_WIDTH, LABEL_WIDTH_NARROW, NARROW_LABEL_BELOW, PANEL_WIDTH, cellLayouts, fitColumns, viewDensities, workforceRanges, workforceTokens,
} from '../../tokens/workforce'
import ShiftChip from '../../components/schedule/ShiftChip'
import classes from './WorkforceScheduling.module.css'

const mouse: [string, string][] = [
  ['Click', 'Selects one cell and opens the details panel.'],
  ['Drag', 'Selects a block of cells. The panel opens when you let go.'],
  ['Shift-click', 'Selects everything between the active cell and the one you click.'],
  ['Click a name', 'Selects the person’s whole row, including their extra row. Shift-click another name for every row in between, Ctrl-click (⌘-click) to add a row, or drag down the names.'],
  ['Click a date', 'Selects that day for everyone, open shifts included. Shift-click, Ctrl-click (⌘-click) or drag along the dates for more days.'],
  ['Right-click', 'Opens a menu for a name, a date or a selected cell: Copy, Paste, Load from template, Pre-fill, Leave, Post, Fill, Add new ruler and History. Paste is available after Copy. Anything not yet selected is selected first, so a selection of rows or days stays as it is. The Menu key or Shift+F10 opens it from the keyboard.'],
  ['Click Open shifts', 'Selects all open shifts.'],
  ['Type in “Filter employees”', 'The search sits above the names, always ready. X or Escape clears it. Filtering the rows isn’t built yet.'],
  ['Ctrl-click (⌘-click on Mac)', 'Adds a cell to the selection, or takes it out. Drag after it to add a block.'],
  ['Hover an empty cell', 'Shows a plus. Click to add an activity for that person and day.'],
]

const keyboard: { keys: string[]; action: string }[] = [
  { keys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'], action: 'Move between cells. Landing on a person’s cell selects it.' },
  { keys: ['shift+ArrowDown'], action: 'Grow the selection from the active cell (any arrow).' },
  { keys: ['Home', 'End'], action: 'First or last day of the row.' },
  { keys: ['mod+Home', 'mod+End'], action: 'First or last cell of the grid.' },
  { keys: ['PageUp', 'PageDown'], action: 'Ten rows up or down.' },
  { keys: ['mod+A'], action: 'Select every cell in view.' },
  { keys: ['Space'], action: 'Add the active cell to the selection, or take it out.' },
  { keys: ['shift+Space'], action: 'Select the whole row.' },
  { keys: ['mod+Space'], action: 'Select the whole day (column).' },
  { keys: ['Enter'], action: 'Open the details panel and move focus into it. On a name or a date, select its row or day first (Space selects without opening).' },
  { keys: ['Escape'], action: 'With several cells selected, keep only the active one. Otherwise close the panel.' },
]

const modes: { mode: string; when: string; shows: string; footer: string }[] = [
  { mode: 'A person’s day', when: 'Any cell in a person’s row, on any of their lines', shows: 'The name and date, every segment of that day in one list (each assignment’s first segment as the root, touching segments indented), and one form for the selected segment: times, then its fields. An empty day says so and offers Add segment. Another unit’s or precinct’s assignment adds a banner; a locked one (e.g. a court date) is read-only.', footer: 'Assign, Leave, more (History, Delete assignment or leave)' },
  { mode: 'Open shift', when: 'An open or live shift in the top row', shows: '“Open shift · Swing Patrol” or “Live post · …”, no employee yet, and the shift as one block.', footer: 'Assign, more (History, Delete open shift)' },
  { mode: 'Several cells', when: 'Two or more cells', shows: '“9 cells selected”, how many people and empty cells, a shift picker with “Assign to N”, and a collapsed “Change fields” section. The grid shows which cells are selected, so the panel doesn’t list them.', footer: 'Assign, Leave, more (Load from template, Paste, History, Delete all)' },
  { mode: 'Nothing', when: 'The panel is opened from the toolbar with nothing selected', shows: 'A hint to select a cell, and how to select several.', footer: 'None' },
]

const assignmentCases: [string, string, string, string][] = [
  ['Touching', 'PatD 07:00–17:00, then PatD 17:00–18:00', 'One cell', 'The first segment, with the second indented below it. The first shows the total: 11h total · 07:00–18:00.'],
  ['With a gap', 'PatD 07:00–17:00, then Spe 19:00–20:00', 'A second line for that day', 'Two assignments, each starting a new row.'],
  ['Partial leave', 'PatD 08:00–16:00, with Sick 13:00–16:00', 'One cell, split diagonally', 'The leave indented under PatD: 5h worked · 3h leave.'],
  ['Overnight', 'PatN 20:00–04:00', 'One cell, on the day it starts', '20:00–04:00 +1, 8h.'],
  ['All-day leave', 'Sick, all day', 'One leave cell', 'Sick, All day, 24h. The form shows only its times and leave type.'],
  ['Out of unit', 'PatD for Special Ops', 'Striped, with an OU tag', 'A banner, “Working for Special Ops (out of unit)”. Still editable; Unit shows Special Ops.'],
  ['Out of branch', 'PatD at 84th Precinct', 'Muted, with “↗”', 'A banner, “Working out of branch”. Still editable.'],
  ['Locked', 'Court 13:00–17:00, set by Kings County Court', 'Muted, with a lock', 'A banner, “Set by Kings County Court. You can’t change it here.”, and its values as plain text. Nothing can be changed.'],
]

/** Days in the demo that show each case (week of Jun 1–7) */
const scenarioDays: [string, string][] = [
  ['Partial leave', 'E. Rodriguez, Wed, Jun 3'],
  ['Two assignments in a day', 'J. Anderson, Wed, Jun 3'],
  ['Out of unit', 'L. Garcia, Tue, Jun 2'],
  ['Out of branch', 'D. Patel, Thu, Jun 4'],
  ['Locked court date', 'T. Nguyen, Wed, Jun 3; S. Kowalski, Tue, Jun 2; L. Garcia, Fri, Jun 5'],
  ['All-day leave', 'T. Nguyen, Tue, Jun 2'],
]

const elsewhereRows: [string, string, string, string][] = [
  ['Example', 'L. Garcia works PatD for Special Ops.', 'D. Patel works PatD at the 84th Precinct.', 'S. Kowalski is due in court, set by Kings County Court.'],
  ['In the grid', 'Striped, with an OU tag where there is room.', 'Muted, with an arrow (“↗”).', 'Muted, with a lock.'],
  ['Banner', '“Working for Special Ops (out of unit)”', '“Working out of branch”', '“Set by Kings County Court. You can’t change it here.”'],
  ['In the panel', 'Editable as usual. Unit shows Special Ops.', 'Editable as usual. Branch shows 84th Precinct.', 'Read-only: the values as plain text, no form. Assign and Delete are off, and assign mode skips it.'],
  ['Staffing', 'Not counted: they are on the other unit’s street.', 'Not counted: they are at the other precinct.', 'Counted, like any assignment.'],
]

const typedTimes: [string, string][] = [
  ['8 or 08', '08:00'],
  ['0800', '08:00'],
  ['830 or 0830', '08:30'],
  ['1730', '17:30'],
  ['8:30, 8.30 or 8h30', '08:30'],
  ['2400', '00:00, the end of the day (as an end time)'],
  ['2500, 8:75 or abc', 'Not a time. It isn’t saved.'],
]

/** Two time fields to try the typed formats on */
function TimeEntryDemo() {
  const [start, setStart] = useState('0700')
  const [end, setEnd] = useState('1730')
  const from = parseTime(start)
  const to = parseTime(end)
  const result = (() => {
    if (from === null || to === null) return 'Not saved: type times like 0800, 830 or 17:30.'
    if (from === to) return 'Not saved: it starts and ends at the same time.'
    const until = normalizeEnd(from, to)
    return `Saves as ${formatSpan(from, until)}, ${formatDuration(until - from)}.`
  })()
  return (
    <Preview title="Try it" align="start">
      <Stack gap="sm">
        <Group gap="sm" align="flex-end">
          <TimeField label="Start" value={start} onChange={setStart} w={110} />
          <TimeField label="End" value={end} onChange={setEnd} w={110} />
          <Button variant="default" size="sm" onClick={() => { setStart('0700'); setEnd('1730') }}>Reset demo</Button>
        </Group>
        <Text size="sm" role="status">{result}</Text>
      </Stack>
    </Preview>
  )
}

const layoutSpecimens: Chip[] = [
  { segments: [{ code: 'PatD' }] },
  { segments: [{ code: 'PatD', overtime: 'partial' }] },
  { segments: [{ code: 'Train' }], outOfUnit: true },
  { segments: [{ code: 'Vac' }] },
]

/** Collapsed nav rail and borders: the grid is this much narrower than the screen */
const APP_CHROME = 60
const screens = [1280, 1512, 1920]
const rangeDays: [string, number][] = [['1 week', 7], ['2 weeks', 14], ['3 weeks', 21], ['1 month', 30]]
/** Detailed needs Full-width days: true when the range gets them on a 1920px screen with the panel closed */
const detailedFits = (range: string) => {
  const count = { day: 1, week: 7, '2weeks': 14, '3weeks': 21, month: 30 }[range]
  return !!count && fitColumns(1920 - APP_CHROME, count).layout === 'comfortable'
}
const layoutLabel = Object.fromEntries(cellLayouts.map((layout) => [layout.key, layout.label]))

/** What changes in each layout */
const layoutDetails: [string, string, string, string][] = [
  ['Cell height', '40px', '40px', '32px'],
  ['Row height', '52px', '52px', '44px'],
  ['Codes', 'All, side by side with dividers', 'Up to two, stacked; “…” for more', 'None (tooltip, accessible name and panel)'],
  ['Tags', 'OT and OU with labels', 'OU arrow only', 'OU arrow only'],
  ['Fills and stripes', 'Yes', 'Yes', 'Yes, including diagonal splits'],
  ['Cancelled', 'Code struck through', 'Code struck through', 'Bar across the cell'],
  ['Open shifts', 'Icon, label and code', 'Icon over code', 'Icon only'],
  ['Date header', '“Fri Jun 5”', '“Fr 5”', '“Fr” over “5”'],
  ['Coverage', 'As Team View', 'As Team View, 13px', '11px; hours without decimals; no arrow in the group badge'],
]

/** Detailed view cells, with what each one shows */
const detailedSpecimens: { chip: Chip; label: string }[] = [
  { chip: { segments: [{ code: 'PatD' }] }, label: 'One assignment' },
  { chip: { segments: [{ code: 'PatD', overtime: 'partial' }] }, label: 'Runs into overtime: the overtime is split out' },
  { chip: { segments: [{ code: 'ExP', overtime: 'full' }] }, label: 'Overtime' },
  { chip: { segments: [{ code: 'C-AM' }, { code: 'PatD', start: 12 }] }, label: 'Two assignments in one cell' },
  { chip: { segments: [{ code: 'C-AM' }, { code: 'PatD', start: 12 }, { code: 'ExP', overtime: 'full' }] }, label: 'Three assignments: the row gets taller' },
  { chip: { segments: [{ code: 'Train' }], outOfUnit: true }, label: 'Out of unit' },
  { chip: { segments: [{ code: 'Sick' }] }, label: 'Leave for the whole day' },
]

const specimen = (status: OpenShift['status']): OpenShift => ({
  id: status, day: MOCK_TODAY, watch: 'swing', code: 'PatS', start: 12, end: 22, status, needed: 1, location: 'Sector B',
})

export default function WorkforceScheduling() {
  const [platform] = useState(detectPlatform)
  return (
    <>
      <PageHeader />

      <Section id="desktop" title="Desktop" description="Select a cell to see its details on the right. Drag or Shift-click to select several, like in a spreadsheet. Select a name or a date for a whole row or day. Select a time-of-day bar for that day’s coverage.">
        <div className="page-wide">
          <Preview flush title="Work Scheduling, desktop">
            <WorkforceDemo />
          </Preview>
        </div>
      </Section>

      <Section id="the-grid" title="The grid" size="display" description="Selecting cells, the rows of each watch, view densities and how the grid fits the screen." />

      <Section id="selection" title="Selecting cells" description="People’s cells and open shifts can be selected, one by one or a whole row or day at a time from the names and dates. Coverage, staffing and group rows can’t. A selection has a thick outline, and the active cell inside a larger selection has its own outline. Its name and date are highlighted, and so are the headers of fully selected rows and days.">
        <Text size="sm" fw={600} mb="xs">Mouse</Text>
        <Table.ScrollContainer minWidth={560} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th w={220}>Do this</Table.Th><Table.Th>To</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {mouse.map(([what, result]) => (
                <Table.Tr key={what}><Table.Td><Text size="sm" fw={600}>{what}</Text></Table.Td><Table.Td><Text size="sm">{result}</Text></Table.Td></Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Text size="sm" fw={600} mb="xs" mt="lg">Keyboard</Text>
        <Table.ScrollContainer minWidth={560} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th w={220}>Keys</Table.Th><Table.Th>To</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {keyboard.map(({ keys, action }) => (
                <Table.Tr key={action}>
                  <Table.Td aria-label={keys.map((item) => spokenKeys(item, platform)).join(' or ')}>
                    <Group gap={6} wrap="wrap">{keys.map((item) => <ShortcutKeys key={item} keys={item} platform={platform} />)}</Group>
                  </Table.Td>
                  <Table.Td><Text size="sm">{action}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Stack gap="xs" mt="md">
          <Text size="sm">The grid is one stop in the tab order. Arrow keys move inside it, through every row, including names and coverage.</Text>
          <Text size="sm">Changing the range keeps the cells that are still in view. Moving to another week or month clears the selection, and so does collapsing the watch the cells are in.</Text>
          <Text size="sm">Screen readers announce each cell’s person, date and activity, whether it is selected, and how many cells are selected.</Text>
        </Stack>
      </Section>

      <Section id="rows" title="Groups and staffing" description="The grid starts with open shifts, then one group per watch. Each watch has its staffing numbers above its people.">
        <Preview title="Open and live shifts" align="start">
          <div className={classes.specimens}>
            {(['open', 'live'] as const).map((status) => (
              <div className={classes.specimen} key={status}>
                <div className={classes.specimenCells}>
                  <div className={classes.specimenCell}><OpenShiftChip shift={specimen(status)} /></div>
                  <div className={classes.specimenCell} data-compact><OpenShiftChip shift={specimen(status)} density="compact" /></div>
                </div>
                <Text size="sm" fw={600}>{openStatus[status].label}</Text>
                <Text size="xs" c="dimmed">{openStatus[status].meaning}</Text>
              </div>
            ))}
          </div>
        </Preview>
        <Stack gap="xs" mt="md">
          <Text size="sm"><strong>Open shifts</strong> are the first rows under the dates and scroll with the grid. A shift nobody holds yet has a dashed outline and no fill, with an icon and a label: Open, or Live once it is posted to employees. Two weeks and longer show the icon and code only.</Text>
          <Text size="sm"><strong>Watches</strong> (Day, Swing, Night) show how many officers they have and, for each day, staff scheduled against staff needed. ▼ is below target, ▲ above. Select the header to collapse the watch. Collapse all, next to Sort, closes every watch and its staffing rows; once all are closed it turns into Expand all.</Text>
          <Text size="sm"><strong>Staffing</strong> uses Team View’s coverage rows: Bodies, Supervisors, Hours and Time of day. Collapsed, it says how many days in the range are below target.</Text>
          <Text size="sm"><strong>Names</strong> show the rank for corporals and up, and a shield for supervisors.</Text>
          <Text size="sm"><strong>Sort</strong> orders the people inside each watch: by watch order, name, rank or precedence, or by rank then effective date or precedence, or precedence then rank. The name breaks any remaining tie. Ascending puts the highest rank and the lowest precedence number first.</Text>
        </Stack>
      </Section>

      <Section id="views" title="Views and densities" description="Five date ranges, each with three densities: Compact (the default), Detailed and Stacked. Every range fits the width.">
        <Table.ScrollContainer minWidth={560} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Range</Table.Th>
                {viewDensities.map((density) => <Table.Th key={density.key}>{density.label}</Table.Th>)}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {workforceRanges.map((range) => (
                <Table.Tr key={range.key}>
                  <Table.Td><Text size="sm" fw={600}>{range.label}</Text></Table.Td>
                  {viewDensities.map((density) => (
                    <Table.Td key={density.key}>
                      {!density.available || range.placeholder
                        ? <Badge size="sm" variant="light" color="gray">Coming soon</Badge>
                        : density.key === 'detailed' && !detailedFits(range.key)
                          ? <Badge size="sm" variant="light" color="gray">Shows Compact</Badge>
                          : <Badge size="sm" variant="light" color="intime">In the demo</Badge>}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Text size="xs" c="dimmed" mt="xs">Shows Compact: the days are too narrow for Detailed even on a 1920px screen, so the grid shows Compact cells.</Text>
        <Stack gap="xs" mt="md">
          {viewDensities.map((density) => <Text size="sm" key={density.key}><strong>{density.label}:</strong> {density.description}</Text>)}
          <Text size="sm"><strong>Legend:</strong> the book button in the title row explains each kind of cell, drawn as the current density shows it. It only lists cells the grid can show.</Text>
        </Stack>
        <Text size="sm" mt="md"><strong>One day</strong> is a single centered column, at most {DAY_MAX_WIDTH}px wide with the names, as in the calendar’s day view. Its header gives the full date. All three densities work.</Text>
        <Text size="sm" fw={600} mb="xs" mt="lg">Detailed cells</Text>
        <Text size="sm" mb="sm">Detailed shows each assignment’s activity and times, as in the calendar. Overtime always gets its own red container with an OT tag, so a shift that runs into overtime is split in two instead of showing a diagonal. Two or more assignments in a cell stack as one-line containers. The cell is still the only click target.</Text>
        <Preview title="Detailed cells" align="start">
          <div className={classes.detailedSpecimens}>
            {detailedSpecimens.map(({ chip, label }) => (
              <div className={classes.detailedSpecimen} key={label}>
                <div className={classes.detailedCell}><DetailedChip chip={chip} /></div>
                <Text size="xs" c="dimmed">{label}</Text>
              </div>
            ))}
            <div className={classes.detailedSpecimen}>
              <div className={classes.detailedCell}><OpenShiftChip shift={specimen('open')} density="detailed" /></div>
              <Text size="xs" c="dimmed">Open shift</Text>
            </div>
          </div>
        </Preview>
        <Stack gap="xs" mt="md">
          <Text size="sm"><strong>Only where it fits.</strong> Detailed needs days at least {cellLayouts[0].minWidth}px wide (the Full layout below), usually one week. Narrower days show Compact cells, and switch back when there is room again, e.g. when the panel closes.</Text>
          <Text size="sm"><strong>Text fits the day.</strong> Under about 205px, two or more assignments show codes instead of names and the OT and OU tags keep only their icons. Under about 165px, a single assignment’s tags do the same. Under about 140px, stacked lines show hours without minutes (“08–12”), and open shifts drop the activity name under about 160px. The examples above are 200px wide.</Text>
          <Text size="sm"><strong>Taller rows:</strong> cells are 44px and rows 56px, so a name fits over its times. A cell with three or more containers makes its row taller still; nothing is hidden.</Text>
          <Text size="sm"><strong>Runs into overtime:</strong> in this demo the last {PARTIAL_OVERTIME_HOURS} hours of the shift are the overtime part.</Text>
        </Stack>
        <Text size="sm" fw={600} mb="xs" mt="lg">Stacked cells</Text>
        <Text size="sm" mb="sm">Stacked shows the same assignments as Detailed, as plain colored bars: no names, times, codes, tags or icons. Every assignment is a 16px bar, so a row with one assignment is 28px high and fits the most people on screen. A cell with more assignments makes its row taller. A separate assignment on the same day still goes on the extra line.</Text>
        <Preview title="Stacked cells" align="start">
          <div className={classes.stackedSpecimens}>
            {detailedSpecimens.map(({ chip, label }) => (
              <div className={classes.detailedSpecimen} key={label}>
                <div className={classes.stackedCell}><StackedChip chip={chip} /></div>
                <Text size="xs" c="dimmed">{label}</Text>
              </div>
            ))}
            <div className={classes.detailedSpecimen}>
              <div className={classes.stackedCell}><OpenShiftChip shift={specimen('open')} density="stacked" /></div>
              <Text size="xs" c="dimmed">Open shift: the Open or Live icon stays</Text>
            </div>
          </div>
        </Preview>
        <Stack gap="xs" mt="md">
          <Text size="sm"><strong>Any range.</strong> With no text, Stacked works from one week to a month; on narrow days the bars just get shorter.</Text>
          <Text size="sm"><strong>Color carries the kind.</strong> Overtime is red, leave yellow and out of unit striped; a cancelled assignment is struck through. Select a cell to see codes, times and tags in the panel. Screen readers hear the full details from the cell.</Text>
        </Stack>

        <Text size="sm" fw={600} mb="xs" mt="lg">Every range fits the screen</Text>
        <Text size="sm" mb="sm">The days always share the full width, so schedulers never scroll sideways, from one week to a month, with or without the docked panel. The cell layout follows how wide a day column is, not the range. When columns would be narrower than 48px, the name column narrows to 168px and rank badges and supervisor icons hide if they don’t fit.</Text>
        <Table.ScrollContainer minWidth={640} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th w={110}>Layout</Table.Th><Table.Th w={110}>Column</Table.Th><Table.Th w={170}>Cells</Table.Th><Table.Th>Shows</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {cellLayouts.map((layout, index) => (
                <Table.Tr key={layout.key}>
                  <Table.Td><Text size="sm" fw={600}>{layout.label}</Text></Table.Td>
                  <Table.Td><Text size="sm" className="tabular">{index === 0 ? `${layout.minWidth}px and wider` : `${layout.minWidth ? `${layout.minWidth}–` : 'Under '}${cellLayouts[index - 1].minWidth}px`}</Text></Table.Td>
                  <Table.Td>
                    <div className={classes.layoutSpecimens} data-layout={layout.key}>
                      {layoutSpecimens.map((chip, chipIndex) => <ShiftChip key={chipIndex} chip={chip} density={layout.key} context="Specimen" />)}
                    </div>
                  </Table.Td>
                  <Table.Td><Text size="sm">{layout.shows}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Text size="xs" c="dimmed" mt="xs">At 1512 × 982 (a 14-inch MacBook): one week gets 174px columns (120px with the panel docked), two weeks 87px (60px), three weeks 58px (43px) and a month 43px (30px).</Text>
      </Section>

      <Section id="sizing" title="Sizing for screens" description="For developers: how the grid fits every range on screen and when cells switch to Compact or Mini. The rule depends on the width of a day column, not on the range or the screen.">
        <Text size="sm" fw={600} mb="xs">How the layout is picked</Text>
        <Stack gap={6} mb="md">
          <Text size="sm"><strong>1. Measure the grid,</strong> not the window: the width of its scroll area without a vertical scrollbar. Measure again whenever it changes: window resize, the panel docking, undocking or closing, the navigation being pinned.</Text>
          <Text size="sm"><strong>2. Share the width.</strong> Day columns are equal shares of what’s left after the name column, with no minimum width, so the grid never scrolls sideways.</Text>
          <Text size="sm"><strong>3. Try the {LABEL_WIDTH}px name column.</strong> Column width = (grid width − {LABEL_WIDTH}) ÷ days. If that is under {NARROW_LABEL_BELOW}px, switch to the {LABEL_WIDTH_NARROW}px name column and work it out again. Rank badges and supervisor icons hide when the name column is under 200px.</Text>
          <Text size="sm"><strong>4. Pick the layout from the column width:</strong> {cellLayouts.map((layout) => (layout.minWidth ? `${layout.label} from ${layout.minWidth}px` : `${layout.label} below that`)).join(', ')}.</Text>
          <Text size="sm"><strong>5. Decide once per width.</strong> The name column is chosen from the wide-column result first, so the outcome can’t flip back and forth. No breakpoints by screen size: the same screen can show Full with the panel closed and Compact with it docked.</Text>
        </Stack>

        <Text size="sm" fw={600} mb="xs">What changes per layout</Text>
        <Table.ScrollContainer minWidth={720} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={140}>Part</Table.Th>
                {cellLayouts.map((layout, index) => (
                  <Table.Th key={layout.key}>{layout.label} <Text span size="xs" c="dimmed" fw={400}>{index === 0 ? `≥ ${layout.minWidth}px` : layout.minWidth ? `${layout.minWidth}–${cellLayouts[index - 1].minWidth}px` : `< ${cellLayouts[index - 1].minWidth}px`}</Text></Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {layoutDetails.map(([part, ...values]) => (
                <Table.Tr key={part}>
                  <Table.Td><Text size="sm" fw={600}>{part}</Text></Table.Td>
                  {values.map((value, index) => <Table.Td key={index}><Text size="sm">{value}</Text></Table.Td>)}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>

        <Text size="sm" fw={600} mb="xs" mt="lg">Examples</Text>
        <Text size="sm" mb="sm">Day column width and layout for common screens, with the navigation collapsed. With the panel open, the grid is {PANEL_WIDTH}px narrower. 1512 × 982 is the target (a 14-inch MacBook).</Text>
        <Table.ScrollContainer minWidth={720} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Range</Table.Th>
                {screens.map((screen) => <Table.Th key={screen} className="tabular">{screen}px: panel closed / open</Table.Th>)}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rangeDays.map(([label, count]) => (
                <Table.Tr key={label}>
                  <Table.Td><Text size="sm" fw={600}>{label}</Text></Table.Td>
                  {screens.map((screen) => (
                    <Table.Td key={screen}>
                      <Text size="sm" className="tabular">
                        {[screen - APP_CHROME, screen - APP_CHROME - PANEL_WIDTH].map((width) => {
                          const fit = fitColumns(width, count)
                          return `${Math.floor(fit.column)}px ${layoutLabel[fit.layout]}${fit.narrowLabel ? '*' : ''}`
                        }).join(' / ')}
                      </Text>
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Text size="xs" c="dimmed" mt="xs">* With the {LABEL_WIDTH_NARROW}px name column. A month is counted as 30 days.</Text>

        <Text size="sm" fw={600} mb="xs" mt="lg">Good to know</Text>
        <Stack gap={6}>
          <Text size="sm"><strong>Codes are never lost.</strong> In every layout the tooltip, the cell’s accessible name and the panel give the full code, times and tags.</Text>
          <Text size="sm"><strong>Mini changes height, not just content.</strong> It sets the chip and row heights to --workforce-mini-chip-height and --workforce-mini-row-height, so more people fit on screen.</Text>
          <Text size="sm"><strong>Some rows keep their height.</strong> The date row, open shifts and watch headers keep their heights; only their content gets smaller.</Text>
          <Text size="sm"><strong>Thresholds live in one place:</strong> cellLayouts and NARROW_LABEL_BELOW in src/tokens/workforce.ts, with fitColumns doing the sums. View densities don’t change this rule: cellViewFor picks the cells from the view and the layout. Detailed only applies in the Full layout and sets --workforce-detailed-chip-height and --workforce-detailed-row-height; Stacked applies at any width and sets --workforce-stacked-chip-height and --workforce-stacked-row-height.</Text>
        </Stack>
      </Section>

      <Section
        id="the-panel"
        title="The details panel"
        size="display"
        description="Everything about the panel beside the grid: what it shows, how a person’s day is made of segments, how editing and saving work, and how to type times."
      />

      <Section id="panel" title="What it shows" description="The panel sits beside the grid, which gets narrower, so the schedule stays in view while you edit. It follows the selection.">
        <Table.ScrollContainer minWidth={640} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th w={130}>Shows</Table.Th><Table.Th>When you select</Table.Th><Table.Th>Content</Table.Th><Table.Th w={150}>Buttons</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {modes.map((item) => (
                <Table.Tr key={item.mode}>
                  <Table.Td><Text size="sm" fw={600}>{item.mode}</Text></Table.Td>
                  <Table.Td><Text size="sm">{item.when}</Text></Table.Td>
                  <Table.Td><Text size="sm">{item.shows}</Text></Table.Td>
                  <Table.Td><Text size="sm">{item.footer}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Stack gap="xs" mt="md">
          <Text size="sm"><strong>It opens</strong> when a click or drag ends, or on Enter. Moving with the arrow keys doesn’t open it, but if it is open, it follows the active cell.</Text>
          <Text size="sm"><strong>It closes</strong> with its close button, Escape or the panel button in the toolbar. Focus goes back to the active cell.</Text>
          <Text size="sm"><strong>Two tabs:</strong> Details and Attachments. Attachments (tags, assets, tasks and notes) is coming.</Text>
          <Text size="sm"><strong>Not built yet:</strong> Assign, History, Post as live and Find an employee say “Preview only” in the status line.</Text>
        </Stack>
      </Section>

      <Section id="assignments" title="Assignments and segments" description="A person’s day is made of segments. Segments that touch, where one ends when the next starts, form one assignment, which the grid shows as one cell.">
        <Table.ScrollContainer minWidth={640} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th w={130}>Case</Table.Th><Table.Th>Example</Table.Th><Table.Th>In the grid</Table.Th><Table.Th>In the panel</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {assignmentCases.map(([name, example, grid, panel]) => (
                <Table.Tr key={name}>
                  <Table.Td><Text size="sm" fw={600}>{name}</Text></Table.Td>
                  <Table.Td><Text size="sm" className="tabular">{example}</Text></Table.Td>
                  <Table.Td><Text size="sm">{grid}</Text></Table.Td>
                  <Table.Td><Text size="sm">{panel}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Stack gap="xs" mt="md">
          <Text size="sm"><strong>Every line of the day.</strong> Whichever of a person’s lines you click, the panel lists every segment of their day, so a separate assignment is never missed. Each assignment starts with its first segment; the segments that touch it are indented below it.</Text>
          <Text size="sm"><strong>Times decide the assignment.</strong> Change a segment’s times so it no longer touches and it moves to an assignment, and a grid line, of its own. A note says “Doesn’t touch 08:00–17:00. It shows on its own line.” with Undo. Make it touch another assignment and it joins that one.</Text>
          <Text size="sm"><strong>Add segment</strong> adds one that starts where the day’s last one ends, so it touches. On an empty day it adds the watch’s shift.</Text>
          <Text size="sm"><strong>Moving and deleting.</strong> The first segment’s menu moves the whole assignment to another day or deletes it. Changing Scheduled in the form moves it too. A move that would overlap on the new day is refused.</Text>
        </Stack>
        <Text size="sm" fw={600} mt="md" mb={6}>Try them in the demo</Text>
        <Stack gap={4}>
          {scenarioDays.map(([name, where]) => <Text size="sm" key={name}>{name}: <strong>{where}</strong></Text>)}
        </Stack>
      </Section>

      <Section id="editing" title="Editing and saving" description="Click a segment to select it, then edit it in the form below the list. Changes save as you go.">
        <Stack gap="xs">
          <Text size="sm"><strong>One form for the selected segment.</strong> Its times come first (Scheduled, Start, End, Hours and actual times), then shift code, activity, location, customer, hours modifier, time bank, unit and acting rank. Every segment has its own values.</Text>
          <Text size="sm"><strong>Bank this time</strong> adds a time bank (Overtime, Comp Time or Holiday) and the hours to bank, with how many that bank can still take.</Text>
          <Text size="sm"><strong>The selected segment</strong> is outlined and shows its actions: Post as live and Find an employee. Every row’s ⋯ menu has History, Cancel segment (Restore once cancelled) and Delete segment.</Text>
          <Text size="sm"><strong>Saving.</strong> A field saves when you pick a value or leave it. The grid and staffing update at once, and the title says “Saved”. There is no Save button.</Text>
          <Text size="sm"><strong>Undo.</strong> Undo in the toolbar, or Ctrl/⌘ Z outside a field, reverts the last change. Reset demo restores the whole schedule.</Text>
          <Text size="sm"><strong>What isn’t saved.</strong> Times that overlap another segment, or that start and end together. The card says why, and the last saved times stay. Spans over 16h are saved but ask: “Longer than 16h. Is that right?”</Text>
        </Stack>
      </Section>

      <Section id="times" title="Typing times" description="Times are typed, never picked, in 24-hour format with no AM or PM. Schedulers know the times by heart, and typing them is faster than any time picker.">
        <TimeEntryDemo />
        <Table.ScrollContainer minWidth={480} className="doc-table" mt="md">
          <Table verticalSpacing="xs" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th>You type</Table.Th><Table.Th>It becomes</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {typedTimes.map(([typed, becomes]) => (
                <Table.Tr key={typed}>
                  <Table.Td><Text size="sm" ff="monospace">{typed}</Text></Table.Td>
                  <Table.Td><Text size="sm">{becomes}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Stack gap="xs" mt="md">
          <Text size="sm"><strong>Type over it.</strong> Clicking or tabbing into a time selects it, so you just type. Enter saves.</Text>
          <Text size="sm"><strong>Leaving the field tidies it</strong> to HH:MM: 830 becomes 08:30.</Text>
          <Text size="sm"><strong>Start and end save together</strong> when focus leaves the pair, so changing both doesn’t save a half-finished time.</Text>
          <Text size="sm"><strong>An end before the start is the next day:</strong> 20:00 to 0400 is 8h and shows “+1”.</Text>
          <Text size="sm"><strong>Mistakes aren’t saved.</strong> Anything that isn’t a time stays as typed, and the card says “Type times like 0800, 830 or 17:30. Not saved.”</Text>
          <Text size="sm" c="dimmed">For developers: TimeField (src/components/workforce/panel/TimeField.tsx) is a plain text input with a numeric keyboard on touch screens. parseTime in panel/format.ts reads the formats above. Times are stored as hours; an end past 24 is the next day.</Text>
        </Stack>
      </Section>

      <Section id="leave" title="Adding leave" description="Leave in the panel opens a short form below the day’s segments: the leave type, then part of the day or all day.">
        <Stack gap="xs">
          <Text size="sm"><strong>Part of the day</strong> starts on the selected assignment’s times. Leave that overlaps an assignment stays in its cell, as a partial leave: indented under the segment and counted as “5h worked · 3h leave”. The grid splits the cell diagonally, and staffing hours drop by the leave.</Text>
          <Text size="sm"><strong>All day</strong> replaces the day’s assignments with one leave cell. The form says what it replaces (“Replaces PatD 07:00–17:00. Undo brings it back.”).</Text>
          <Text size="sm"><strong>A leave segment</strong> shows only its times and leave type: no activity, location or customer, and no post or cancel actions. Delete in the footer reads “Delete leave”.</Text>
          <Text size="sm"><strong>Cancel or Escape</strong> closes the form without saving. Leave over a locked assignment (e.g. a court date) leaves it as it is.</Text>
        </Stack>
      </Section>

      <Section id="assigning" title="Assigning a shift" description="Assign copies the selected assignment, then each cell you click or drag across gets it. It’s the fastest way to give the same shift to several people or days.">
        <Stack gap="xs">
          <Text size="sm"><strong>Assign in the footer</strong> starts assign mode with the selected assignment, all its segments included. A bar over the grid says what you’re assigning and where it came from. On an empty day, Assign first gives that day the watch’s regular shift.</Text>
          <Text size="sm"><strong>Click, drag or Enter.</strong> A click gives one cell the shift; a drag or Shift-click gives it to a range in one step, so one Undo reverts it. People’s cells show a copy cursor and a dashed outline on hover.</Text>
          <Text size="sm"><strong>It replaces</strong> the clicked cell and anything else that day it would overlap. Days that already hold the shift are left as they are. A locked assignment (e.g. a court date) is never replaced: that day is skipped and the status line says why (L. Garcia, Fri).</Text>
          <Text size="sm"><strong>Open shifts and live posts</strong> fill one place per person, on the shift’s own day. When nobody else is needed, the shift leaves the grid and assign mode stops.</Text>
          <Text size="sm"><strong>Stopping.</strong> Escape, Done in the bar or Done assigning in the footer. Selecting other cells while assigning gives them the shift, so stop first to just look around.</Text>
          <Text size="sm" c="dimmed">Try it: select B. Haddad on Fri, Jun 5, select Assign, then drag across empty days. Or select the night open shift on Tue, Jun 2 (2 needed) and give it to two people that day.</Text>
        </Stack>
      </Section>

      <Section id="bulk" title="Editing several cells" description="With several cells selected, the panel changes all of them at once. Each action is one save, so one Undo reverts all of it.">
        <Stack gap="xs">
          <Text size="sm"><strong>Assign to N</strong> gives every selected person-day the shift from the picker, with that code’s usual hours (PatD 07:00–17:00). It replaces what the selected cells hold, like assign mode. N counts the days that can take it: locked cells (e.g. a court date) and open shifts are skipped.</Text>
          <Text size="sm"><strong>Change fields</strong> (collapsed) sets Activity, Location, Hours modifier or Unit on every selected assignment as soon as you pick a value. A field shows the shared value, or “Mixed” when the cells differ. Leave and locked cells stay as they are; open shifts take the value too.</Text>
          <Text size="sm"><strong>Leave</strong> adds leave to every selected day, All day by default (it replaces the day’s assignments, as for one cell). Part of the day nests inside an assignment it overlaps; a day where it would clash is skipped.</Text>
          <Text size="sm"><strong>More</strong> holds Load from template, Paste, History and Delete all. Delete all asks first, then removes every selected assignment, leave and open shift. Locked cells stay.</Text>
          <Text size="sm"><strong>Assign in the footer</strong> starts assign mode with the picked shift, to give it to more cells by clicking them.</Text>
          <Text size="sm">After each action, the status line says how many cells changed and which were skipped, and why.</Text>
          <Text size="sm" c="dimmed">Try it: drag from T. Nguyen on Mon, Jun 1 to R. Okafor on Wed, Jun 3. Two of those days hold a locked court date, so Assign to 7.</Text>
        </Stack>
      </Section>

      <Section id="warnings" title="Warnings" description="The panel warns about a person’s day when it breaks a scheduling rule. Warnings never block a change: it saves, then the warning shows.">
        <Table.ScrollContainer minWidth={560} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th>Warning</Table.Th><Table.Th>When</Table.Th><Table.Th>In the demo</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              <Table.Tr><Table.Td>Double booked</Table.Td><Table.Td>Two assignments at the same time, e.g. one at another precinct.</Table.Td><Table.Td>A. Johnson, Wed, Jun 3</Table.Td></Table.Tr>
              <Table.Tr><Table.Td>Already on leave</Table.Td><Table.Td>Leave covers all of an assignment.</Table.Td><Table.Td>C. Lee, Fri, Jun 5</Table.Td></Table.Tr>
              <Table.Tr><Table.Td>Minimum rest</Table.Td><Table.Td>Less than {MIN_REST_HOURS}h between the last work on the two days before and the day’s first work.</Table.Td><Table.Td>Y. Cohen, Tue, Jun 2</Table.Td></Table.Tr>
              <Table.Tr><Table.Td>Not certified</Table.Td><Table.Td>A segment’s activity needs a certification the person doesn’t have.</Table.Td><Table.Td>J. Anderson, Wed, Jun 3</Table.Td></Table.Tr>
              <Table.Tr><Table.Td>Over weekly hours cap</Table.Td><Table.Td>More than {WEEKLY_HOURS_CAP}h worked Monday to Sunday. It shows from the day the week goes over.</Table.Td><Table.Td>P. Fitzgerald, Sun, Jun 7</Table.Td></Table.Tr>
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Stack gap="xs" mt="md">
          <Text size="sm"><strong>In the panel</strong>, warnings sit under the employee row, most serious first. One shows as it is; several collapse to “2 warnings” (O. Petrov, Tue, Jun 2). Each names what it’s about, and selecting it selects that assignment.</Text>
          <Text size="sm"><strong>In the list</strong>, the assignment a warning is about gets a ⚠ after its times.</Text>
          <Text size="sm"><strong>In the grid</strong>, the cell gets a small ⚠ in its corner, in every view density. Its label reads the warning to screen readers.</Text>
          <Text size="sm"><strong>They follow your changes.</strong> Assign B. Haddad’s Friday shift to Saturday and Sunday: Sunday goes over the hours cap and warns at once. Undo clears it.</Text>
          <Text size="sm" c="dimmed">For developers: dayWarnings(member, day) in src/components/workforce/warnings.ts returns each warning with the cells (blocks) it’s about. The grid model and the panel both use it. The cap and the rest minimum are mock rules ({WEEKLY_HOURS_CAP}h, {MIN_REST_HOURS}h).</Text>
        </Stack>
      </Section>

      <Section id="elsewhere" title="Out of unit, out of branch and locked" description="People sometimes work for another unit in the precinct or at another precinct, and some assignments, like court dates, are set outside scheduling. The grid and the panel show all three, so nobody is counted twice and nothing is changed by the wrong person.">
        <Table.ScrollContainer minWidth={760} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th w={120}></Table.Th><Table.Th>Out of unit</Table.Th><Table.Th>Out of branch</Table.Th><Table.Th>Locked</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {elsewhereRows.map(([label, unit, branch, locked]) => (
                <Table.Tr key={label}>
                  <Table.Td><Text size="sm" fw={600}>{label}</Text></Table.Td>
                  <Table.Td><Text size="sm">{unit}</Text></Table.Td>
                  <Table.Td><Text size="sm">{branch}</Text></Table.Td>
                  <Table.Td><Text size="sm">{locked}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Text size="sm" mt="md">On a day with assignments in both places, the banner follows the selected assignment, and each assignment’s first row names where it is worked.</Text>
      </Section>

      <Section id="reference" title="Reference" size="display" description="The components behind the demo, its CSS variables and guidelines." />

      <Section id="component" title="Using the components" description="The demo is built from the components in src/components/workforce, on top of the schedule components.">
        <Text size="sm" fw={600} mb="xs">WorkforceGrid</Text>
        <PropsTable rows={[
          { prop: 'model', type: 'GridModel', description: 'Rows to render. Build it with buildGridModel({ watches, days, collapsed, staffingCollapsed, sort, direction, filter }) and memoise it on those inputs, not on the selection.' },
          { prop: 'selection', type: 'GridSelection', description: 'From useGridSelection({ rows: model.rowKeys, days: model.days, isSelectable: model.isSelectable }).' },
          { prop: 'view', type: "'detailed' | 'compact' | 'stacked'", description: 'View density. compact (DEFAULT_VIEW_DENSITY) shows codes. detailed shows names and times through DetailedChip, only in the Full layout. stacked shows bars through StackedChip at any width. The scroller gets data-cells="detailed" or "stacked" (cellViewFor).' },
          { prop: 'onToggleGroup / onToggleStaffing', type: '(watch) => void', description: 'Collapse or expand a watch or its staffing rows.' },
          { prop: 'onCoverageClick', type: '(watch, day) => void', description: 'A time-of-day bar was selected. The demo opens CoverageDrawer.' },
        ]} />
        <Text size="sm" fw={600} mb="xs" mt="lg">useGridSelection</Text>
        <PropsTable rows={[
          { prop: 'rows / days', type: 'string[] / number[]', description: 'Rendered row keys and visible days. When they change, cells that are no longer visible are dropped.' },
          { prop: 'isSelectable', type: '(row, day) => boolean', description: 'Which cells can be selected.' },
          { prop: 'preferredDay', type: 'number', description: 'Column of the first tab stop, e.g. today.' },
          { prop: 'headerRow', type: 'string', description: 'Key of the date row (first in rows). Its cells select a day; the corner selects nothing. The grid passes model.navRows and HEADER_ROW.' },
          { prop: 'rowGroup', type: '(row) => string[]', description: 'Rows that make up one person (their extra lines) or all open shifts. A row header selects the whole group. Use model.rowGroup.' },
          { prop: 'fallbackRow', type: '(row) => string | null', description: 'Where a selected cell goes when an edit removes its line or empties it: a person’s first line. Use model.fallbackRow.' },
          { prop: 'onActivate', type: "(via: 'pointer' | 'keyboard') => void", description: 'A click, drag or Enter ended on a cell. Open the panel here.' },
          { prop: 'onEscape', type: '() => boolean', description: 'Escape with one cell selected. Return true if it closed something.' },
        ]} />
        <Text size="sm" c="dimmed" mt="sm">The grid measures its own width: day columns are minmax(0, 1fr), and the cell layout and name column width follow from cellLayouts in src/tokens/workforce.ts.</Text>
        <Text size="sm" c="dimmed" mt="sm">Blocks come from groupBlocks(segments) in workforce/model.ts: touching segments join, a gap starts a new block, overlapping working segments are an error and a leave that overlaps stays in its block (partial leave). regroupDay rebuilds a day’s cells from its segments after an edit.</Text>
        <Text size="sm" c="dimmed" mt="sm">The hook returns the selection (selected, ordered, active), helpers for the cells (isSelected, isTabStop, edges) and gridProps to spread on the grid element. Every focusable element in the grid carries data-row and data-day.</Text>
        <Text size="sm" fw={600} mb="xs" mt="lg">WorkforcePanel</Text>
        <PropsTable rows={[
          { prop: 'content', type: 'PanelContent', description: 'From panelContent(model, selection.ordered): none, single (a person’s day with all its blocks, or an open shift) or bulk.' },
          { prop: 'onEdit', type: '(commit: EditCommit) => void', description: 'Autosave. Replaces a person’s day (memberId@day → its cells) or patches an open shift. The demo keeps the edits in useScheduleEdits and builds the grid from applyEdits(edits).' },
          { prop: 'onUndo / saves', type: '() => void / number', description: 'Undo for the split note, and a save counter for “Saved”.' },
          { prop: 'onClose', type: '() => void', description: 'The close button.' },
          { prop: 'onPreview', type: '(action: string) => void', description: 'A control that isn’t built yet was used.' },
          { prop: 'focusTick', type: 'number', description: 'Change it to move focus to the panel’s heading, e.g. after Enter.' },
        ]} />
      </Section>

      <Section id="tokens" title="CSS variables" description="Sizes for the grid and panel, and selection colors. All point at theme tokens, so they follow dark and light.">
        <Table.ScrollContainer minWidth={640} className="doc-table">
          <Table verticalSpacing="xs" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th>Variable</Table.Th><Table.Th>Value</Table.Th><Table.Th>Usage</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {workforceTokens.map((token) => (
                <Table.Tr key={token.name}>
                  <Table.Td><CopyValue value={`var(${token.name})`} display={token.name} /></Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      {token.kind === 'color' && <span className={classes.swatch} style={{ background: `var(${token.name})` }} aria-hidden="true" />}
                      <Text size="xs" ff="monospace" c="dimmed">{token.value}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td><Text size="sm">{token.usage}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Text size="xs" c="dimmed" mt="xs">Shift fills, coverage colors and row heights come from Team View’s --schedule-* variables.</Text>
      </Section>

      <Section id="guidelines" title="Guidelines">
        <DoDont
          doItems={[
            'Let people select cells the way they do in a spreadsheet: click, drag, Shift-click and Ctrl/⌘-click.',
            'Open details beside the grid, so the schedule stays visible while editing.',
            'Show the active cell’s name and date in their headers, so a busy grid stays readable.',
            'Keep dates and names pinned while the grid scrolls.',
            'Show what the panel is editing in its title: the person or unit, with the date below.',
            'Show the person’s whole day in the panel, so a separate assignment on another line is never missed. Indent the segments that touch an assignment under its first one.',
            'Save as people type, say “Saved”, and keep Undo one click away.',
            'Let schedulers type times (0830, 1730) in 24-hour format. They are faster than any time picker.',
            'Say where an assignment is worked when it isn’t this unit, and who set it when it’s locked.',
          ]}
          dontItems={[
            'Open the panel while the user is still dragging or moving with the arrow keys.',
            'Make coverage, staffing or group rows selectable.',
            'Use the shift fills for open shifts. They have no holder yet, so they have no fill.',
            'Show overtime as a diagonal in the Detailed view. Split it into its own container with its times.',
            'Put a separate button inside each cell. The cell itself is the target.',
            'Clear the selection when a range gets longer. Keep the cells that are still in view.',
            'Block a save because of a warning. Only times that can’t work (overlapping, zero length) are refused, and the field says why.',
            'Make schedulers scroll sideways to see the rest of a week or month.',
            'Let a scheduler change a locked assignment, like a court date. Show it, muted with a lock, and say who set it.',
          ]}
        />
      </Section>

      <Section id="figma" title="Figma reference" description="Screens this page was built from. The demo keeps Team View’s cells instead of the cells in this screen.">
        <Stack gap="md">
          <img src={`${import.meta.env.BASE_URL}figma/workforce-scheduling-desktop.png`} alt="Work Scheduling on desktop, one week: a toolbar with date, range, team and employee filters, an open shifts row, Day, Swing and Night watches with staffing rows and officers’ shifts, and an editing panel for B. Haddad on the right." className={classes.figma} />
          <img src={`${import.meta.env.BASE_URL}figma/workforce-scheduling-panel.png`} alt="Details panel for an open Swing Patrol shift on Tue, Feb 17, 2026: employee picker, branch, a PatS 12:00–22:00 segment, scheduled times, activity, location, hours modifier, unit, acting rank, customer and an Assign button." className={classes.figmaPanel} />
        </Stack>
      </Section>
    </>
  )
}
