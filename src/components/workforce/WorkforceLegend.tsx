import { ActionIcon, Popover, Text, Tooltip } from '@mantine/core'
import { BookOpen, TriangleAlert } from 'lucide-react'
import ShiftChip from '../schedule/ShiftChip'
import { MOCK_TODAY, type Chip } from '../schedule/data'
import { SHOW_TAG_LABELS, legendItems, viewDensities, type LegendKey, type ViewDensity } from '../../tokens/workforce'
import type { OpenShift } from './data'
import DetailedChip from './DetailedChip'
import OpenShiftChip from './OpenShiftChip'
import StackedChip from './StackedChip'
import { WithAttachmentMark } from './AttachmentMark'
import classes from './Workforce.module.css'

const chips: Partial<Record<LegendKey, Chip>> = {
  scheduled: { segments: [{ code: 'PatD' }] },
  several: { segments: [{ code: 'C-AM' }, { code: 'PatD', start: 12 }] },
  overtime: { segments: [{ code: 'ExP', overtime: 'full' }] },
  partialOvertime: { segments: [{ code: 'PatS', end: 20 }, { code: 'PatS', start: 20, overtime: 'full' }] },
  leave: { segments: [{ code: 'Sick' }] },
  partialLeave: { segments: [{ code: 'PatD', start: 8, end: 16 }, { code: 'Sick', start: 13, end: 16 }] },
  outOfUnit: { segments: [{ code: 'PatD' }], outOfUnit: true, unit: 'Special Ops' },
  outOfBranch: { segments: [{ code: 'PatD' }], branch: '84th Precinct - Brooklyn' },
  locked: { segments: [{ code: 'Court' }], locked: 'Kings County Court' },
  warning: { segments: [{ code: 'PatD' }] },
  attachments: { segments: [{ code: 'PatD' }] },
}

const openShift = (status: OpenShift['status']): OpenShift => ({
  id: status, day: MOCK_TODAY, watch: 'swing', code: 'PatS', start: 12, end: 22, status, needed: 1, location: 'Sector B',
})

/** The real cell for a legend row, as the current view density draws it (Full layout). */
function Specimen({ item, view }: { item: LegendKey; view: ViewDensity }) {
  if (item === 'open' || item === 'live') {
    return <OpenShiftChip shift={openShift(item)} density={view === 'compact' ? 'comfortable' : view} />
  }
  if (item === 'warning') {
    return (
      <span className={classes.legendWarning}>
        <Specimen item="scheduled" view={view} />
        <TriangleAlert size={16} strokeWidth={2} className={classes.warnMark} aria-hidden="true" />
      </span>
    )
  }
  if (item === 'attachments') {
    return (
      <span className={classes.legendWarning}>
        <WithAttachmentMark attached><Specimen item="scheduled" view={view} /></WithAttachmentMark>
      </span>
    )
  }
  const chip = chips[item]!
  if (view === 'detailed') return <DetailedChip chip={chip} />
  if (view === 'stacked') return <StackedChip chip={chip} />
  return <ShiftChip chip={chip} interactive={false} tagLabels={SHOW_TAG_LABELS} />
}

/** Legend button for the title row: a popover that explains each kind of cell, drawn in the current view density. */
export default function WorkforceLegend({ view }: { view: ViewDensity }) {
  const label = viewDensities.find((item) => item.key === view)?.label
  return (
    <Popover position="bottom-end" offset={6} width={440} shadow="md" trapFocus returnFocus middlewares={{ flip: true, shift: true, size: { padding: 16 } }}>
      <Popover.Target>
        <Tooltip label="Legend">
          <ActionIcon variant="default" size={36} aria-label="Legend" aria-haspopup="dialog">
            <BookOpen size={18} />
          </ActionIcon>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown p={0} className={classes.legendDropdown} aria-labelledby="workforce-legend-title" tabIndex={-1}>
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
