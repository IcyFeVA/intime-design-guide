import { Text, Tooltip } from '@mantine/core'
import { shiftCodeMap } from '../../tokens/schedule'
import { formatHour } from '../schedule/data'
import { openStatus, type OpenShift } from './data'
import classes from './Workforce.module.css'

/**
 * An open or live shift: Team View's cell shape with no fill and a dashed outline.
 * Comfortable shows icon, label and code; compact shows icon and code; mini shows the icon only (the rest is in the tooltip).
 */
export default function OpenShiftChip({ shift, density = 'comfortable', tooltip = true }: {
  shift: OpenShift
  density?: 'comfortable' | 'compact' | 'mini'
  tooltip?: boolean
}) {
  const status = openStatus[shift.status]
  const Icon = status.icon
  return (
    <Tooltip
      disabled={!tooltip}
      position="top"
      multiline
      w={240}
      label={(
        <div>
          <Text size="xs" fw={600} mb={4}>{status.label} shift</Text>
          <Text size="xs"><span className="tabular">{formatHour(shift.start)}–{formatHour(shift.end)}</span> · {shiftCodeMap[shift.code]?.label ?? shift.code}</Text>
          <Text size="xs">{shift.location} · {shift.needed} still needed</Text>
        </div>
      )}
    >
      <span className={classes.openChip} data-status={shift.status} data-density={density} aria-hidden="true">
        <Icon size={density === 'comfortable' ? 15 : 13} strokeWidth={2} className={classes.openIcon} />
        {density === 'comfortable' && <span className={classes.openStatus}>{status.label}</span>}
        {density !== 'mini' && <span className={classes.openCode}>{shift.code}</span>}
      </span>
    </Tooltip>
  )
}
