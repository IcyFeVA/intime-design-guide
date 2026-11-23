import { Triangle } from 'lucide-react'
import { coverageLevel, formatHour, hoursLevel, type DayCoverage } from './data'
import classes from './Schedule.module.css'

const levelText = { under: 'below target', over: 'above target', met: 'on target' }

/**
 * Scheduled against needed staff, e.g. "8/10". `noun` names what is counted in the accessible name (default "staff").
 * `minimum`: the need is a floor, so more than needed is on target (e.g. supervisors).
 */
export function BodiesValue({ bodies, noun = 'staff', minimum = false }: { bodies: DayCoverage['bodies']; noun?: string; minimum?: boolean }) {
  const level = minimum && bodies.have >= bodies.need ? 'met' : coverageLevel(bodies.have, bodies.need)
  return (
    <div className={`${classes.coverage} tabular`} data-level={level} aria-label={`${bodies.have} of ${bodies.need} ${noun}, ${levelText[level]}`}>
      {bodies.have}/{bodies.need}
    </div>
  )
}

/** Staff hours against the target. ▼ short, ▲ over, no arrow on target. */
export function HoursValue({ hours }: { hours: DayCoverage['hours'] }) {
  const level = hoursLevel(hours)
  const label = hours.direction === 'down' ? `${hours.value} hours short` : hours.direction === 'up' ? `${hours.value} hours over` : `${hours.value} hours, on target`
  return (
    <div className={`${classes.coverage} tabular`} data-level={level} aria-label={label}>
      {hours.value.toFixed(1)}
      {hours.direction && (
        <Triangle size={11} fill="currentColor" strokeWidth={0} aria-hidden="true" style={hours.direction === 'down' ? { transform: 'rotate(180deg)' } : undefined} />
      )}
    </div>
  )
}

/** 24-hour track. Outlined stretches are below (red) or above (amber) target. */
export function TimeOfDayBar({ segments }: { segments: DayCoverage['timeOfDay'] }) {
  const label = segments.length
    ? segments.map((segment) => `${levelText[segment.level]} ${formatHour(segment.from)}–${formatHour(segment.to)}`).join(', ')
    : 'On target all day'
  return (
    <div className={classes.timeOfDay} role="img" aria-label={label}>
      {segments.map((segment, index) => (
        <span
          key={index}
          className={classes.todSegment}
          data-level={segment.level}
          style={{ left: `${(segment.from / 24) * 100}%`, width: `${((segment.to - segment.from) / 24) * 100}%` }}
        />
      ))}
    </div>
  )
}
