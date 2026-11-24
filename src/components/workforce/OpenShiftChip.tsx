import { shiftCodeMap } from '../../tokens/schedule'
import { formatHours } from '../schedule/data'
import { openStatus, type OpenShift } from './data'
import classes from './Workforce.module.css'

/**
 * An open or live shift: Team View's cell shape with no fill and a dashed outline.
 * Comfortable shows icon, label and code; compact shows icon and code; mini shows the icon only.
 * Detailed (the Detailed view, wide days) shows icon, label and activity name over the times. Stacked shows a small icon only.
 */
export default function OpenShiftChip({ shift, density = 'comfortable' }: {
  shift: OpenShift
  density?: 'comfortable' | 'compact' | 'mini' | 'detailed' | 'stacked'
}) {
  const status = openStatus[shift.status]
  const Icon = status.icon
  if (density === 'detailed') {
    return (
      <span className={classes.openChip} data-status={shift.status} data-density={density} aria-hidden="true">
        <span className={classes.openLine}>
          <Icon size={14} strokeWidth={2} className={classes.openIcon} />
          <span className={classes.openStatus}>{status.label}</span>
          <span className={classes.openName}>{shiftCodeMap[shift.code]?.label ?? shift.code}</span>
        </span>
        <span className={`${classes.openTime} tabular`}>{formatHours(shift.start, shift.end)}</span>
      </span>
    )
  }
  return (
    <span className={classes.openChip} data-status={shift.status} data-density={density} aria-hidden="true">
      <Icon size={density === 'comfortable' ? 15 : density === 'stacked' ? 12 : 13} strokeWidth={2} className={classes.openIcon} />
      {density === 'comfortable' && <span className={classes.openStatus}>{status.label}</span>}
      {density !== 'mini' && density !== 'stacked' && <span className={classes.openCode}>{shift.code}</span>}
    </span>
  )
}
