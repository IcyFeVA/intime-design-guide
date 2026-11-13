import { useState } from 'react'
import { Badge, Button, Group, SimpleGrid, Stack, Text } from '@mantine/core'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import Preview from '../../components/Preview'
import FigmaSlot from '../../components/FigmaSlot'
import PropsTable from '../../components/PropsTable'
import DoDont from '../../components/DoDont'
import ShiftBlock from './ShiftBlock'
import styles from './ComponentDemos.module.css'

export default function ShiftCells() {
  const [showAll, setShowAll] = useState(false)
  return (
    <>
      <PageHeader />
      <Section id="shift-block" title="Shift block" description="A shift block answers three questions in order: when, who, and where. A colored edge and state label provide a secondary status cue.">
        <Stack gap="lg">
          <Preview align="start" code={'<ShiftBlock time="07:00–19:00" name="Alex Morgan"\n  unit="Patrol D4 · Platoon A" stateKey="scheduled" />'}>
            <SimpleGrid cols={{ base: 1, sm: 2 }} w="100%">
              <ShiftBlock />
              <ShiftBlock name="Jordan Lee" unit="Engine 12 · Platoon B" time="07:00–07:00 +1" stateKey="on-duty" />
            </SimpleGrid>
          </Preview>
          <PropsTable rows={[
            { prop: 'time', type: 'string', description: 'Explicit start and end, with +1 for an overnight end date.' },
            { prop: 'name', type: 'string', description: 'Assigned member, or “Unassigned” for an open shift.' },
            { prop: 'unit', type: 'string', description: 'Unit and platoon; truncate only after preserving identity.' },
            { prop: 'stateKey', type: 'ShiftState.key', default: 'scheduled', description: 'Token-defined status icon, label and edge color.' },
            { prop: 'compact', type: 'boolean', default: 'false', description: 'Use inside dense month cells; details remain available on activation.' },
          ]} />
        </Stack>
      </Section>
      <Section id="day-cell" title="Day cell" description="Keep the date and shift count fixed at the top. Limit visible shifts and disclose the remaining count.">
        <Preview align="start" code={'<DayCell date="Mon 4" count={5}>\n  <ShiftBlock compact />\n  <ShiftBlock name="Unassigned" stateKey="open" compact />\n  <Button variant="subtle" size="xs">+3 more shifts</Button>\n</DayCell>'}>
          <div className={styles.calendarGrid}>
            <div className={styles.dayCell}>
              <Group justify="space-between" mb="sm"><Text fw={600} size="sm">Mon <span className="tabular">4</span></Text><Badge size="xs" variant="default">5 shifts</Badge></Group>
              <Stack gap={6}>
                <ShiftBlock compact /><ShiftBlock name="Unassigned" stateKey="open" time="19:00–07:00 +1" compact />
                {showAll && <><ShiftBlock name="Jordan Lee" stateKey="on-duty" compact /><ShiftBlock name="Sam Rivera" time="19:00–23:00" stateKey="overtime" compact /><ShiftBlock name="Taylor Brooks" stateKey="training" compact /></>}
                <Button variant="subtle" size="compact-xs" fullWidth onClick={() => setShowAll((value) => !value)} aria-expanded={showAll}>{showAll ? 'Show fewer shifts' : '+3 more shifts'}</Button>
              </Stack>
            </div>
            <div className={styles.dayCell}>
              <Group justify="space-between" mb="sm"><Text fw={600} size="sm">Tue <span className="tabular">5</span></Text><Badge size="xs" variant="default">2 shifts</Badge></Group>
              <Stack gap={6}><ShiftBlock name="Sam Rivera" stateKey="overtime" time="07:00–11:00" compact /><ShiftBlock name="Jordan Lee" unit="Engine 12" stateKey="training" compact /></Stack>
            </div>
          </div>
        </Preview>
      </Section>
      <Section id="variants" title="Variants" description="Expanded blocks are for day and week views. Compact blocks preserve time, identity and an accessible status icon in month views.">
        <Preview align="start" code={'<ShiftBlock stateKey="overtime" />\n<ShiftBlock stateKey="conflict" />\n<ShiftBlock name="Unassigned" stateKey="open" compact />'}>
          <SimpleGrid cols={{ base: 1, sm: 2 }} w="100%">
            <Stack><Text size="xs" c="dimmed" tt="uppercase" fw={600}>Expanded</Text><ShiftBlock stateKey="overtime" time="19:00–23:00" name="Sam Rivera" /><ShiftBlock stateKey="conflict" name="Taylor Brooks" unit="Engine 12 · Rest period violation" /></Stack>
            <Stack><Text size="xs" c="dimmed" tt="uppercase" fw={600}>Compact</Text><ShiftBlock stateKey="scheduled" compact /><ShiftBlock stateKey="open" name="Unassigned" compact /><ShiftBlock stateKey="leave" name="Casey Chen" time="All day" compact /><Text size="xs" c="dimmed">Open full details on click or keyboard activation in the scheduling app.</Text></Stack>
          </SimpleGrid>
        </Preview>
      </Section>
      <Section id="guidelines" title="Guidelines"><DoDont doItems={['Use tabular figures for time ranges and consistent 24h formatting.', 'Show the next-day marker for overnight shifts.', 'Preserve status with text or an accessible icon at every density.']} dontItems={['Make department color and shift-state color compete on the same edge.', 'Hide overlapping shifts without an overflow indicator.', 'Treat these visual samples as production drag-and-drop behavior.']} /></Section>
      <Section id="figma" title="Figma reference"><FigmaSlot title="Calendar cells & shift blocks" notes="Share day, week and month variants; drag, resize, overlap, selected and conflict states; minimum cell widths and overflow behavior." /></Section>
    </>
  )
}
