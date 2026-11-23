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
import { openStatus, type OpenShift } from '../../components/workforce/data'
import { MOCK_TODAY } from '../../components/schedule/data'
import { cellLayouts, panelPlacements, viewDensities, workforceRanges, workforceTokens } from '../../tokens/workforce'
import ShiftChip from '../../components/schedule/ShiftChip'
import type { Chip } from '../../components/schedule/data'
import classes from './WorkforceScheduling.module.css'

const mouse: [string, string][] = [
  ['Click', 'Selects one cell and opens the details panel.'],
  ['Drag', 'Selects a block of cells. The panel opens when you let go.'],
  ['Shift-click', 'Selects everything between the active cell and the one you click.'],
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
  { keys: ['Enter'], action: 'Open the details panel and move focus into it.' },
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

const specimen = (status: OpenShift['status']): OpenShift => ({
  id: status, day: MOCK_TODAY, watch: 'swing', code: 'PatS', start: 12, end: 22, status, needed: 1, location: 'Sector B',
})

export default function WorkforceScheduling() {
  const [platform] = useState(detectPlatform)
  return (
    <>
      <PageHeader />

      <Section id="desktop" title="Desktop" description="Select a cell to see its details on the right. Drag or Shift-click to select several, like in a spreadsheet. Select a time-of-day bar for that day’s coverage, or a name for the person’s details.">
        <div className="page-wide">
          <Preview flush title="Workforce Scheduling, desktop">
            <WorkforceDemo />
          </Preview>
        </div>
      </Section>

      <Section id="selection" title="Selecting cells" description="People’s cells and open shifts can be selected. Coverage, staffing and group rows can’t. The active cell has a thick outline; its name and date are highlighted.">
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
          <Text size="sm"><strong>Docked or drawer.</strong> The pin in the panel header switches between {panelPlacements.map((item) => `${item.label.toLowerCase()} (${item.description.charAt(0).toLowerCase()}${item.description.slice(1, -1)})`).join(' and ')}. Docked is the default; the drawer suits a month, where every column counts.</Text>
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
          <Text size="sm"><strong>Open shifts</strong> stay pinned under the dates. A shift nobody holds yet has a dashed outline and no fill, with an icon and a label: Open, or Live once it is posted to employees. Two weeks and longer show the icon and code only.</Text>
          <Text size="sm"><strong>Watches</strong> (Day, Swing, Night) show how many officers they have and, for each day, staff scheduled against staff needed. ▼ is below target, ▲ above. Select the header to collapse the watch.</Text>
          <Text size="sm"><strong>Staffing</strong> uses Team View’s coverage rows: Bodies, Supervisors, Hours and Time of day. Collapsed, it says how many days in the range are below target.</Text>
          <Text size="sm"><strong>Names</strong> show the rank for corporals and up, and a shield for supervisors. Select a name for the person’s details.</Text>
        </Stack>
      </Section>

      <Section id="views" title="Views and densities" description="Five date ranges, each with three densities. Day, Compact and Stacked are coming; the demo shows them as not available yet. Every range fits the width.">
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
                      {density.available && !range.placeholder
                        ? <Badge size="sm" variant="light" color="intime">In the demo</Badge>
                        : <Badge size="sm" variant="light" color="gray">Coming soon</Badge>}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Stack gap="xs" mt="md">
          {viewDensities.map((density) => <Text size="sm" key={density.key}><strong>{density.label}:</strong> {density.description}</Text>)}
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

      <Section id="component" title="Using the components" description="The demo is built from the components in src/components/workforce, on top of the schedule components.">
        <Text size="sm" fw={600} mb="xs">WorkforceGrid</Text>
        <PropsTable rows={[
          { prop: 'model', type: 'GridModel', description: 'Rows to render. Build it with buildGridModel({ watches, days, collapsed, staffingCollapsed, sort, direction, filter }) and memoise it on those inputs, not on the selection.' },
          { prop: 'selection', type: 'GridSelection', description: 'From useGridSelection({ rows: model.rowKeys, days: model.days, isSelectable: model.isSelectable }).' },
          { prop: 'view', type: "'detailed' | 'compact' | 'stacked'", description: 'View density. Set as data-view on the grid; only detailed is styled yet.' },
          { prop: 'onToggleGroup / onToggleStaffing', type: '(watch) => void', description: 'Collapse or expand a watch or its staffing rows.' },
          { prop: 'onMemberClick', type: '(member) => void', description: 'A name was selected. The demo opens EmployeeDetailsModal.' },
          { prop: 'onCoverageClick', type: '(watch, day) => void', description: 'A time-of-day bar was selected. The demo opens CoverageDrawer.' },
        ]} />
        <Text size="sm" fw={600} mb="xs" mt="lg">useGridSelection</Text>
        <PropsTable rows={[
          { prop: 'rows / days', type: 'string[] / number[]', description: 'Rendered row keys and visible days. When they change, cells that are no longer visible are dropped.' },
          { prop: 'isSelectable', type: '(row, day) => boolean', description: 'Which cells can be selected.' },
          { prop: 'preferredDay', type: 'number', description: 'Column of the first tab stop, e.g. today.' },
          { prop: 'onActivate', type: "(via: 'pointer' | 'keyboard') => void", description: 'A click, drag or Enter ended on a cell. Open the panel here.' },
          { prop: 'onEscape', type: '() => boolean', description: 'Escape with one cell selected. Return true if it closed something.' },
        ]} />
        <Text size="sm" c="dimmed" mt="sm">The grid measures its own width: day columns are minmax(0, 1fr), and the cell layout and name column width follow from cellLayouts in src/tokens/workforce.ts.</Text>
        <Text size="sm" c="dimmed" mt="sm">The hook returns the selection (selected, ordered, active), helpers for the cells (isSelected, isTabStop, edges) and gridProps to spread on the grid element. Every focusable element in the grid carries data-row and data-day.</Text>
        <Text size="sm" fw={600} mb="xs" mt="lg">WorkforcePanel</Text>
        <PropsTable rows={[
          { prop: 'content', type: 'PanelContent', description: 'From panelContent(model, selection.ordered): none, single (open shift, assigned or new) or bulk.' },
          { prop: 'placement', type: "'docked' | 'drawer'", default: "'docked'", description: 'Beside the grid, or over its right edge. The workspace needs position: relative for the drawer.' },
          { prop: 'onPlacementChange', type: '(placement) => void', description: 'Shows the pin button in the header.' },
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
            'Keep open shifts, dates and names pinned while the grid scrolls.',
            'Show what the panel is editing in its title: the date and the person or unit.',
          ]}
          dontItems={[
            'Open the panel while the user is still dragging or moving with the arrow keys.',
            'Make coverage, staffing or group rows selectable.',
            'Use the shift fills for open shifts. They have no holder yet, so they have no fill.',
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
