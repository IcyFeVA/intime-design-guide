import { shiftCodeMap } from '../../../tokens/schedule'
import { formatDuration, segmentHours, segmentKind } from '../../schedule/data'
import { formatLongDay, type SegmentDetails, type WorkforceSegment } from '../data'
import { formatActual, formatSpan } from './format'
import classes from '../WorkforcePanel.module.css'

/** The selected segment as plain label and value pairs: a locked assignment (e.g. a court date), set outside scheduling. */
export function ReadOnlyFields({ segment, details, day }: { segment: WorkforceSegment; details: SegmentDetails; day: number }) {
  const { start, end } = segmentHours(segment)
  const name = shiftCodeMap[segment.code]?.label ?? segment.code
  const times: [string, string][] = [
    ['Scheduled', formatLongDay(day)],
    ['Times', formatSpan(start, end)],
    ['Hours', formatDuration(end - start)],
  ]
  const pairs: [string, string][] = segmentKind(segment) === 'leave'
    ? [['Leave type', name], ...times]
    : [
      ...times,
      ...(details.actual ? [['Actual', formatActual(details.actual)] as [string, string]] : []),
      ['Shift code', `${segment.code} · ${name}`],
      ['Activity', details.activity],
      ['Location', details.location ?? 'None'],
      ['Customer', details.customer],
      ['Hours modifier', details.modifier],
      ['Time bank', details.bank ? `${details.bank.bank} · ${formatDuration(details.bank.amount)}` : 'None'],
      ['Unit', details.unit],
      ['Rank (acting)', details.acting],
    ]
  return (
    <dl className={classes.pairs}>
      {pairs.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
