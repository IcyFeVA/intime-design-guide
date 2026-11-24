import { ActionIcon, Popover, Text, Tooltip } from '@mantine/core'
import { BookOpen } from 'lucide-react'
import ShiftChip from '../schedule/ShiftChip'
import { MOCK_TODAY, type Chip } from '../schedule/data'
import { legendItems, viewDensities, type LegendKey, type ViewDensity } from '../../tokens/workforce'
import type { OpenShift } from './data'
import DetailedChip from './DetailedChip'
import OpenShiftChip from './OpenShiftChip'
import StackedChip from './StackedChip'
import classes from './Workforce.module.css'

const chips: Partial<Record<LegendKey, Chip>> = {
  scheduled: { segments: [{ code: 'PatD' }] },
  several: { segments: [{ code: 'C-AM' }, { code: 'PatD', start: 12 }] },
  overtime: { segments: [{ code: 'ExP', overtime: 'full' }] },
  partialOvertime: { segments: [{ code: 'PatS', overtime: 'partial' }] },
  leave: { segments: [{ code: 'Sick' }] },
  outOfUnit: { segments: [{ code: 'PatD' }], outOfUnit: true },
}

const openShift = (status: OpenShift['status']): OpenShift => ({
  id: status, day: MOCK_TODAY, watch: 'swing', code: 'PatS', start: 12, end: 22, status, needed: 1, location: 'Sector B',
})

/** The real cell for a legend row, as the current view density draws it (Full layout). */
function Specimen({ item, view }: { item: LegendKey; view: ViewDensity }) {
  if (item === 'open' || item === 'live') {
    return <OpenShiftChip shift={openShift(item)} density={view === 'compact' ? 'comfortable' : view} />
  }
  const chip = chips[item]!
  if (view === 'detailed') return <DetailedChip chip={chip} />
  if (view === 'stacked') return <StackedChip chip={chip} />
  return <ShiftChip chip={chip} interactive={false} />
}

/** Legend button for the title row: a popover that explains each kind of cell, drawn in the current view density. */
export default function WorkforceLegend({ view }: { view: ViewDensity }) {
  const label = viewDensities.find((item) => item.key === view)?.label
  return (
    <Popover position="bottom-end" offset={6} width={440} shadow="md" trapFocus returnFocus>
      <Popover.Target>
        <Tooltip label="Legend">
          <ActionIcon variant="default" size={36} aria-label="Legend" aria-haspopup="dialog">
            <BookOpen size={18} />
          </ActionIcon>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown p={0} aria-labelledby="workforce-legend-title" tabIndex={-1}>
        <div className={classes.alertsHeader}>
          <Text id="workforce-legend-title" fw={600}>Legend</Text>
          <Text size="sm" c="dimmed">Cells as the {label} view shows them</Text>
        </div>
        <dl className={classes.legendList} data-view={view}>
          {legendItems.map((item) => (
            <div className={classes.legendRow} key={item.key}>
              <dt className={classes.legendSpecimen}><Specimen item={item.key} view={view} /></dt>
              <dd className={classes.legendText}>
                <Text size="sm" fw={600}>{item.label}</Text>
                <Text size="xs" c="dimmed">{item.meaning}</Text>
              </dd>
            </div>
          ))}
        </dl>
      </Popover.Dropdown>
    </Popover>
  )
}
