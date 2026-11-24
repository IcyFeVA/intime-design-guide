import { useState } from 'react'
import { Badge, Group, Stack, Table, Text } from '@mantine/core'
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
import { openStatus, type OpenShift } from '../../components/workforce/data'
import { MOCK_TODAY, PARTIAL_OVERTIME_HOURS, type Chip } from '../../components/schedule/data'
import {
  LABEL_WIDTH, LABEL_WIDTH_NARROW, NARROW_LABEL_BELOW, PANEL_WIDTH, cellLayouts, fitColumns, viewDensities, workforceRanges, workforceTokens,
} from '../../tokens/workforce'
import ShiftChip from '../../components/schedule/ShiftChip'
import classes from './WorkforceScheduling.module.css'

const mouse: [string, string][] = [
  ['Click', 'Selects one cell and opens the details panel.'],
  ['Drag', 'Selects a block of cells. The panel opens when you let go.'],
  ['Shift-click', 'Selects everything between the active cell and the one you click.'],
  ['Click a name', 'Selects the person’s whole row, including their extra row. Shift-click another name for every row in between, Ctrl-click (⌘-click) to add a row, or drag down the names.'],
  ['Click a date', 'Selects that day for everyone, open shifts included. Shift-click, Ctrl-click (⌘-click) or drag along the dates for more days.'],
  ['Click Open shifts', 'Selects all open shifts.'],
  ['Click the search icon by “Employee”', 'Opens a search field in its place. Click X or press Escape to close it.'],
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
  { mode: 'Open shift', when: 'An open or live shift in the top row', shows: '“Editing: Tue, Jun 2, 2026 · Swing Patrol”, no employee yet, the shift’s segment and times.', footer: 'Assign, more' },
  { mode: 'Assigned', when: 'A person’s cell with an activity', shows: 'The person, each segment of the cell (the active one outlined) and the times of the active segment.', footer: 'Assign, Leave, more' },
  { mode: 'New activity', when: 'An empty cell in a person’s row', shows: '“New activity: …” with the person filled in, a shift code and its default times.', footer: 'Assign, more' },
  { mode: 'Several cells', when: 'Two or more cells', shows: 'How many activities and empty cells, a list of the cells, and fields that apply to all of them. Fields that differ show “Mixed”.', footer: 'Assign, Leave, more' },
  { mode: 'Nothing', when: 'The panel is opened from the toolbar with nothing selected', shows: 'A hint to select a cell.', footer: 'None' },
]

const layoutSpecimens: Chip[] = [
  { segments: [{ code: 'PatD' }] },
  { segments: [{ code: 'PatD', overtime: 'partial' }] },
  { segments: [{ code: 'Train' }], outOfUnit: true },
  { segments: [{ code: 'Vac' }] },
]

/** Collapsed nav rail and borders: the grid is this much narrower than the screen */
const APP_CHROME = 60
const screens = [1280, 1512, 1920]
const rangeDays: [string, number][] = [['One week', 7], ['Two weeks', 14], ['Three weeks', 21], ['One month', 30]]
/** Detailed needs Full-width days: true when the range gets them on a 1920px screen with the panel closed */
const detailedFits = (range: string) => {
  const count = { week: 7, '2weeks': 14, '3weeks': 21, month: 30 }[range]
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
          <Preview flush title="Workforce Scheduling, desktop">
            <WorkforceDemo />
          </Preview>
        </div>
      </Section>

      <Section id="selection" title="Selecting cells" description="People’s cells and open shifts can be selected, one by one or a whole row or day at a time from the names and dates. Coverage, staffing and group rows can’t. The active cell has a thick outline; its name and date are highlighted, and so are the headers of fully selected rows and days.">
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

      <Section id="panel" title="Details panel" description="The panel sits beside the grid, which gets narrower, so the schedule stays in view while you edit. It follows the selection.">
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
          <Text size="sm"><strong>One cell</strong> has three tabs: Details, Attachments and Notes. Attachments and Notes are coming.</Text>
          <Text size="sm"><strong>In this demo,</strong> the fields can be changed but nothing is saved, and the grid doesn’t change. Assign, Leave and the segment buttons say so in the status line.</Text>
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
          <Text size="sm"><strong>Watches</strong> (Day, Swing, Night) show how many officers they have and, for each day, staff scheduled against staff needed. ▼ is below target, ▲ above. Select the header to collapse the watch.</Text>
          <Text size="sm"><strong>Staffing</strong> uses Team View’s coverage rows: Bodies, Supervisors, Hours and Time of day. Collapsed, it says how many days in the range are below target.</Text>
          <Text size="sm"><strong>Names</strong> show the rank for corporals and up, and a shield for supervisors.</Text>
        </Stack>
      </Section>

      <Section id="views" title="Views and densities" description="Five date ranges, each with three densities. Compact (the default) and Detailed are in the demo; the Day range and Stacked are coming. Every range fits the width.">
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
        </Stack>
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
          <Text size="sm"><strong>Thresholds live in one place:</strong> cellLayouts and NARROW_LABEL_BELOW in src/tokens/workforce.ts, with fitColumns doing the sums. View densities don’t change this rule: Detailed only applies in the Full layout (showsDetailed) and sets the chip and row heights to --workforce-detailed-chip-height and --workforce-detailed-row-height.</Text>
        </Stack>
      </Section>

      <Section id="component" title="Using the components" description="The demo is built from the components in src/components/workforce, on top of the schedule components.">
        <Text size="sm" fw={600} mb="xs">WorkforceGrid</Text>
        <PropsTable rows={[
          { prop: 'model', type: 'GridModel', description: 'Rows to render. Build it with buildGridModel({ watches, days, collapsed, staffingCollapsed, sort, direction, filter }) and memoise it on those inputs, not on the selection.' },
          { prop: 'selection', type: 'GridSelection', description: 'From useGridSelection({ rows: model.rowKeys, days: model.days, isSelectable: model.isSelectable }).' },
          { prop: 'view', type: "'detailed' | 'compact' | 'stacked'", description: 'View density. compact (DEFAULT_VIEW_DENSITY) shows codes. detailed shows names and times through DetailedChip, only in the Full layout; the scroller gets data-cells="detailed". stacked isn’t built yet.' },
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
          { prop: 'onActivate', type: "(via: 'pointer' | 'keyboard') => void", description: 'A click, drag or Enter ended on a cell. Open the panel here.' },
          { prop: 'onEscape', type: '() => boolean', description: 'Escape with one cell selected. Return true if it closed something.' },
        ]} />
        <Text size="sm" c="dimmed" mt="sm">The grid measures its own width: day columns are minmax(0, 1fr), and the cell layout and name column width follow from cellLayouts in src/tokens/workforce.ts.</Text>
        <Text size="sm" c="dimmed" mt="sm">The hook returns the selection (selected, ordered, active), helpers for the cells (isSelected, isTabStop, edges) and gridProps to spread on the grid element. Every focusable element in the grid carries data-row and data-day.</Text>
        <Text size="sm" fw={600} mb="xs" mt="lg">WorkforcePanel</Text>
        <PropsTable rows={[
          { prop: 'content', type: 'PanelContent', description: 'From panelContent(model, selection.ordered): none, single (open shift, assigned or new) or bulk.' },
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
            'Show what the panel is editing in its title: the date and the person or unit.',
          ]}
          dontItems={[
            'Open the panel while the user is still dragging or moving with the arrow keys.',
            'Make coverage, staffing or group rows selectable.',
            'Use the shift fills for open shifts. They have no holder yet, so they have no fill.',
            'Show overtime as a diagonal in the Detailed view. Split it into its own container with its times.',
            'Put a separate button inside each cell. The cell itself is the target.',
            'Clear the selection when a range gets longer. Keep the cells that are still in view.',
            'Make schedulers scroll sideways to see the rest of a week or month.',
          ]}
        />
      </Section>

      <Section id="figma" title="Figma reference" description="Screens this page was built from. The demo keeps Team View’s cells instead of the cells in this screen.">
        <Stack gap="md">
          <img src={`${import.meta.env.BASE_URL}figma/workforce-scheduling-desktop.png`} alt="Workforce Scheduling on desktop, one week: a toolbar with date, range, team and employee filters, an open shifts row, Day, Swing and Night watches with staffing rows and officers’ shifts, and an editing panel for B. Haddad on the right." className={classes.figma} />
          <img src={`${import.meta.env.BASE_URL}figma/workforce-scheduling-panel.png`} alt="Details panel for an open Swing Patrol shift on Tue, Feb 17, 2026: employee picker, branch, a PatS 12:00–22:00 segment, scheduled times, activity, location, hours modifier, unit, acting rank, customer and an Assign button." className={classes.figmaPanel} />
        </Stack>
      </Section>
    </>
  )
}
