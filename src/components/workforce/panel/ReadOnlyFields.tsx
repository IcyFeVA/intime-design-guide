import { shiftCodeMap } from '../../../tokens/schedule'
import { formatDuration, segmentHours, segmentKind } from '../../schedule/data'
import { formatLongDay, type SegmentDetails, type WorkforceSegment } from '../data'
import { formatSpan } from './format'
import classes from '../WorkforcePanel.module.css'

/** The selected segment as plain label and value pairs: another branch's assignment, which only that branch can change. */
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
      ...(details.actual ? [['Actual', formatSpan(details.actual.start, details.actual.end)] as [string, string]] : []),
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
