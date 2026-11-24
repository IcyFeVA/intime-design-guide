import { memo, type CSSProperties } from 'react'
import { useElementSize } from '@mantine/hooks'
import { Badge, UnstyledButton, VisuallyHidden } from '@mantine/core'
import { ChevronDown, Megaphone, Plus, ShieldCheck, Triangle } from 'lucide-react'
import ShiftChip from '../schedule/ShiftChip'
import { BodiesValue, HoursValue, TimeOfDayBar } from '../schedule/Coverage'
import { coverageLevel, dayNumber, describeChip, formatFullDate, formatHeader, formatWeekday, isPeriodStart, type Chip, type DayCoverage } from '../schedule/data'
import { fitColumns, type CellLayout, type ViewDensity } from '../../tokens/workforce'
import OpenShiftChip from './OpenShiftChip'
import { describeOpenShift, rankLabels, shortName, type OpenShift, type Watch, type WatchId } from './data'
import { HEADER_ROW, staffingMetrics, type GridModel, type GridRow, type StaffingMetric } from './model'
import type { GridSelection } from './useGridSelection'
import classes from './Workforce.module.css'

type CellDensity = CellLayout

export interface WorkforceGridProps {
  model: GridModel
  selection: GridSelection
  /** Row layout. Only `detailed` is built; the others will override row and chip heights under `[data-view]`. */
  view: ViewDensity
  today: number
  onToggleGroup: (watch: WatchId) => void
  onToggleStaffing: (watch: WatchId) => void
  onCoverageClick: (watch: Watch, day: number) => void
}

const levelText = { under: 'below target', over: 'above target', met: 'on target' }

/** Group-header summary of bodies: "▼8/9". Plain when on target. */
function BodiesBadge({ bodies }: { bodies: DayCoverage['bodies'] }) {
  const level = coverageLevel(bodies.have, bodies.need)
  return (
    <span className={`${classes.badge} tabular`} data-level={level} aria-label={`${bodies.have} of ${bodies.need} staff, ${levelText[level]}`}>
      {level !== 'met' && <Triangle size={10} fill="currentColor" strokeWidth={0} aria-hidden="true" style={level === 'under' ? { transform: 'rotate(180deg)' } : undefined} />}
      {bodies.have}/{bodies.need}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Selectable cells. Memoised: a drag step only re-renders the cells   */
/* whose state changed.                                                */
/* ------------------------------------------------------------------ */

interface CellState {
  row: string
  day: number
  selectable: boolean
  selected: boolean
  active: boolean
  edges: string
  tabStop: boolean
  density: CellDensity
  boundary: boolean
  /** The grid uses Escape right now (see `escapeProps`) */
  stopEscape: boolean
}

const cellProps = ({ row, day, selectable, selected, active, edges, tabStop, density, boundary, stopEscape }: CellState) => ({
  role: 'gridcell',
  'data-mantine-stop-propagation': stopEscape ? 'true' : undefined,
  'data-row': row,
  'data-day': day,
  tabIndex: tabStop ? 0 : -1,
  'aria-selected': selectable ? selected : undefined,
  'data-selectable': selectable || undefined,
  'data-active': (selectable && active) || undefined,
  'data-edges': selected ? edges : undefined,
  'data-density': density,
  'data-boundary': boundary || undefined,
})

const MemberCell = memo(function MemberCell({ chip, name, overflow, ...state }: CellState & { chip: Chip | null; name: string; overflow: boolean }) {
  const context = `${name}, ${formatHeader(state.day)}`
  return (
    <div
      {...cellProps(state)}
      className={classes.cell}
      data-overflow={overflow || undefined}
      aria-label={`${context}: ${chip ? describeChip(chip) : state.selectable ? 'no activity' : 'empty'}`}
    >
      {chip ? (
        <ShiftChip chip={chip} density={state.density} context={context} interactive={false} tooltip={false} />
      ) : state.selectable && (
        <Plus size={18} strokeWidth={1.75} className={classes.add} aria-hidden="true" />
      )}
    </div>
  )
})

const OpenCell = memo(function OpenCell({ shift, ...state }: CellState & { shift: OpenShift | null }) {
  return (
    <div
      {...cellProps(state)}
      className={`${classes.cell} ${classes.openCell}`}
      aria-label={`${formatHeader(state.day)}: ${shift ? describeOpenShift(shift) : 'no open shift'}`}
    >
      {shift && <OpenShiftChip shift={shift} density={state.density} />}
    </div>
  )
})

/* ------------------------------------------------------------------ */
/* Staffing rows: Team View's coverage values                          */
/* ------------------------------------------------------------------ */

const StaffingRow = memo(function StaffingRow({ rowKey, watch, metric, label, days, density, tabStopDay, onCoverageClick, esc }: {
  rowKey: string
  watch: Watch
  metric: StaffingMetric
  label: string
  days: number[]
  density: CellDensity
  /** The day (or "label") that holds this row's tab stop, if any */
  tabStopDay: number | 'label' | null
  onCoverageClick: (watch: Watch, day: number) => void
  /** See `escapeProps` in useGridSelection */
  esc: Record<string, string>
}) {
  return (
    <div role="row" className={classes.row}>
      <div role="rowheader" className={classes.coverageLabel} {...esc} data-row={rowKey} data-day="label" tabIndex={tabStopDay === 'label' ? 0 : -1}>
        {label}<VisuallyHidden>, {watch.title} watch</VisuallyHidden>
      </div>
      {days.map((day) => {
        const coverage = watch.coverage(day)
        const focus = { ...esc, 'data-row': rowKey, 'data-day': day, tabIndex: tabStopDay === day ? 0 : -1 }
        return (
          <div role="gridcell" className={classes.coverageCell} data-density={density} data-boundary={isPeriodStart(day) || undefined} key={day} {...(metric === 'timeOfDay' ? {} : focus)}>
            {metric === 'bodies' && <BodiesValue bodies={coverage.bodies} />}
            {metric === 'supervisors' && <BodiesValue bodies={coverage.supervisors} noun="supervisors" minimum />}
            {metric === 'hours' && <HoursValue hours={coverage.hours} digits={density === 'mini' ? 0 : 1} />}
            {metric === 'timeOfDay' && (
              <UnstyledButton
                {...focus}
                className={classes.coverageButton}
                onClick={() => onCoverageClick(watch, day)}
                aria-label={`${watch.title} watch, coverage on ${formatHeader(day)}. Show details`}
                aria-haspopup="dialog"
              >
                <TimeOfDayBar segments={coverage.timeOfDay} />
              </UnstyledButton>
            )}
          </div>
        )
      })}
    </div>
  )
})

/* ------------------------------------------------------------------ */
/* Grid                                                                */
/* ------------------------------------------------------------------ */

/**
 * Workforce Scheduling grid. Rows: open shifts, then each watch with its staffing and members. Days across.
 * Employee and open-shift cells can be selected like a spreadsheet (see `useGridSelection`).
 */
export default function WorkforceGrid({
  model, selection, view, today, onToggleGroup, onToggleStaffing, onCoverageClick,
}: WorkforceGridProps) {
  const { days } = model
  const { ref: scrollerRef, width } = useElementSize<HTMLDivElement>()
  const { narrowLabel, layout: density } = fitColumns(width, days.length)
  const compact = density !== 'comfortable'
  const mini = density === 'mini'
  const active = selection.active
  const activeRow = active ? model.byKey.get(active.row) : undefined
  const activeDay = activeRow && (activeRow.kind === 'member' || activeRow.kind === 'open') ? active?.day ?? null : null
  const style = { gridTemplateColumns: `var(--workforce-label-width) repeat(${days.length}, minmax(0, 1fr))` } as CSSProperties

  const esc = selection.escapeProps

  const tabStopIn = (row: string): number | 'label' | null => {
    for (const day of [null, ...days]) if (selection.isTabStop(row, day)) return day ?? 'label'
    return null
  }

  const cellState = (row: string, day: number, dayIndex: number): CellState => {
    const selected = selection.isSelected(row, day)
    return {
      row,
      day,
      selectable: model.isSelectable(row, day),
      selected,
      active: active?.row === row && active.day === day,
      edges: selected ? selection.edges(row, day) : '',
      tabStop: selection.isTabStop(row, day),
      density,
      boundary: dayIndex > 0 && isPeriodStart(day),
      stopEscape: 'data-mantine-stop-propagation' in selection.escapeProps,
    }
  }

  const renderRow = (row: GridRow) => {
    switch (row.kind) {
      case 'open':
        return (
          <div role="row" className={`${classes.row} ${classes.openRow}`} data-last={row.line === row.lines - 1 || undefined} key={row.key}>
            <div role="rowheader" className={classes.openLabel} data-row-header="" data-selected={selection.isRowSelected(row.key) || undefined} data-row={row.key} data-day="label" {...esc} tabIndex={selection.isTabStop(row.key, null) ? 0 : -1}>
              {row.line === 0 ? (
                <>
                  <Megaphone size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span className={classes.openTitle}>Open shifts</span>
                  <Badge size="sm" variant="light" color="gray" circle className="tabular" aria-label={`${model.openCount} in this range`}>{model.openCount}</Badge>
                </>
              ) : <VisuallyHidden>Open shifts, line {row.line + 1}</VisuallyHidden>}
            </div>
            {row.cells.map((shift, index) => (
              <OpenCell key={days[index]} shift={shift} {...cellState(row.key, days[index], index)} />
            ))}
          </div>
        )

      case 'group':
        return (
          <div role="row" className={classes.row} key={row.key}>
            <div role="rowheader" className={classes.groupLabel}>
              <UnstyledButton
                className={classes.toggle}
                data-row={row.key}
                data-day="label"
                {...esc}
                tabIndex={selection.isTabStop(row.key, null) ? 0 : -1}
                aria-expanded={row.expanded}
                onClick={() => onToggleGroup(row.watch.id)}
              >
                <ChevronDown size={16} strokeWidth={2} className={classes.chevron} data-collapsed={!row.expanded || undefined} aria-hidden="true" />
                <span className={classes.groupName}>{row.watch.title}</span>
                <span className={classes.groupCount}>· {row.count} officers</span>
              </UnstyledButton>
            </div>
            {days.map((day) => (
              <div role="gridcell" className={classes.groupCell} data-density={density} {...esc} data-row={row.key} data-day={day} tabIndex={selection.isTabStop(row.key, day) ? 0 : -1} data-boundary={isPeriodStart(day) || undefined} key={day}>
                <BodiesBadge bodies={row.watch.coverage(day).bodies} />
              </div>
            ))}
          </div>
        )

      case 'staffing-toggle':
        return (
          <div role="row" className={classes.row} key={row.key}>
            <div role="rowheader" className={classes.staffingLabel}>
              <UnstyledButton
                className={classes.toggle}
                data-row={row.key}
                data-day="label"
                {...esc}
                tabIndex={selection.isTabStop(row.key, null) ? 0 : -1}
                aria-expanded={row.expanded}
                onClick={() => onToggleStaffing(row.watch.id)}
              >
                <ChevronDown size={14} strokeWidth={2} className={classes.chevron} data-collapsed={!row.expanded || undefined} aria-hidden="true" />
                Staffing<VisuallyHidden>, {row.watch.title} watch</VisuallyHidden>
              </UnstyledButton>
            </div>
            <div role="gridcell" className={classes.staffingSummary} {...esc} data-row={row.key} data-span="" tabIndex={selection.isRowTabStop(row.key) && !selection.isTabStop(row.key, null) ? 0 : -1} style={{ gridColumn: `span ${days.length}` }}>
              {!row.expanded && (row.daysUnder > 0 ? (
                <span className={classes.under}>
                  <Triangle size={10} fill="currentColor" strokeWidth={0} aria-hidden="true" style={{ transform: 'rotate(180deg)' }} />
                  {row.daysUnder} {row.daysUnder === 1 ? 'day' : 'days'} under
                </span>
              ) : <span className={classes.onTarget}>On target every day</span>)}
            </div>
          </div>
        )

      case 'staffing':
        return (
          <StaffingRow
            key={row.key}
            rowKey={row.key}
            watch={row.watch}
            metric={row.metric}
            label={staffingMetrics.find((item) => item.key === row.metric)!.label}
            days={days}
            density={density}
            tabStopDay={tabStopIn(row.key)}
            onCoverageClick={onCoverageClick}
            esc={esc}
          />
        )

      case 'member': {
        const { member } = row
        const name = shortName(member)
        const rowActive = active?.row === row.key && activeDay !== null
        const rowSelected = selection.isRowSelected(row.key)
        return (
          <div role="row" className={classes.row} key={row.key}>
            {row.line === 0 ? (
              <div
                role="rowheader"
                className={classes.label}
                data-row-header=""
                data-active={rowActive || undefined}
                data-selected={rowSelected || undefined}
                data-row={row.key}
                data-day="label"
                {...esc}
                tabIndex={selection.isTabStop(row.key, null) ? 0 : -1}
                aria-label={`${name}, ${rankLabels[member.rank]}${member.supervisor ? ', supervisor' : ''}`}
              >
                <span className={classes.nameButton}>
                  <span className={classes.name}>{name}</span>
                  {member.rank !== 'PO' && <Badge size="xs" radius="xs" variant="default" className={classes.rank} aria-hidden="true">{member.rank}</Badge>}
                  {member.supervisor && (
                    <ShieldCheck size={15} strokeWidth={1.75} className={classes.supervisor} aria-hidden="true" />
                  )}
                </span>
              </div>
            ) : (
              <div
                role="rowheader"
                className={classes.label}
                data-overflow=""
                data-row-header=""
                data-active={rowActive || undefined}
                data-selected={rowSelected || undefined}
                data-row={row.key}
                data-day="label"
                {...esc}
                tabIndex={selection.isTabStop(row.key, null) ? 0 : -1}
              >
                <VisuallyHidden>{name}, additional assignments</VisuallyHidden>
              </div>
            )}
            {row.cells.map((chip, index) => (
              <MemberCell key={days[index]} chip={chip} name={name} overflow={row.overflow} {...cellState(row.key, days[index], index)} />
            ))}
          </div>
        )
      }
    }
  }

  return (
    <div
      ref={scrollerRef}
      className={classes.scroller}
      style={{ ...(narrowLabel ? { '--workforce-label-width': 'var(--workforce-label-width-narrow)' } : {}) } as CSSProperties}
      data-layout={density}
    >
      <div
        {...selection.gridProps}
        className={classes.grid}
        style={style}
        role="grid"
        aria-multiselectable="true"
        aria-label="Workforce schedule"
        aria-colcount={days.length + 1}
        data-view={view}
        data-dragging={selection.dragging || undefined}
      >
        <div role="row" className={classes.row}>
          <div
            role="columnheader"
            className={classes.corner}
            data-row={HEADER_ROW}
            data-day="label"
            {...esc}
            tabIndex={selection.isTabStop(HEADER_ROW, null) ? 0 : -1}
            aria-label="Employee. Select all"
          >
            Employee
          </div>
          {days.map((day) => (
            <div
              role="columnheader"
              key={day}
              className={classes.dayHeader}
              data-today={day === today || undefined}
              data-active={day === activeDay || undefined}
              data-selected={selection.isColumnSelected(day) || undefined}
              data-row={HEADER_ROW}
              data-day={day}
              {...esc}
              tabIndex={selection.isTabStop(HEADER_ROW, day) ? 0 : -1}
              data-density={density}
              aria-label={`${formatFullDate(day)}${day === today ? ', today' : ''}`}
            >
              <span aria-hidden="true" className="tabular">
                {mini ? (
                  <span className={classes.stackedDate}><span className={classes.weekday}>{formatWeekday(day).slice(0, 2)}</span>{dayNumber(day)}</span>
                ) : compact ? (
                  <><span className={classes.weekday}>{formatWeekday(day).slice(0, 2)}</span> {dayNumber(day)}</>
                ) : (
                  <><span className={classes.weekday}>{formatWeekday(day)}</span> {formatHeader(day).split(', ')[1]}</>
                )}
              </span>
            </div>
          ))}
        </div>
        {model.rows.map(renderRow)}
      </div>
      <VisuallyHidden role="status">{selection.selected.size > 1 ? `${selection.selected.size} cells selected` : ''}</VisuallyHidden>
    </div>
  )
}
