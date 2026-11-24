import { openStatus, type OpenShift } from './data'
import classes from './Workforce.module.css'

/**
 * An open or live shift: Team View's cell shape with no fill and a dashed outline.
 * Comfortable shows icon, label and code; compact shows icon and code; mini shows the icon only.
 */
export default function OpenShiftChip({ shift, density = 'comfortable' }: {
  shift: OpenShift
  density?: 'comfortable' | 'compact' | 'mini'
}) {
  const status = openStatus[shift.status]
  const Icon = status.icon
  return (
    <span className={classes.openChip} data-status={shift.status} data-density={density} aria-hidden="true">
      <Icon size={density === 'comfortable' ? 15 : 13} strokeWidth={2} className={classes.openIcon} />
      {density === 'comfortable' && <span className={classes.openStatus}>{status.label}</span>}
      {density !== 'mini' && <span className={classes.openCode}>{shift.code}</span>}
    </span>
  )
}
