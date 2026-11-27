import { memo, useState, type CSSProperties, type ReactNode, type SyntheticEvent } from 'react'
import { useElementSize } from '@mantine/hooks'
import { Badge, CloseButton, TextInput, UnstyledButton, VisuallyHidden } from '@mantine/core'
import { ChevronDown, Megaphone, Plus, Search, ShieldCheck, Triangle, TriangleAlert } from 'lucide-react'
import ShiftChip from '../schedule/ShiftChip'
import { BodiesValue, HoursValue, TimeOfDayBar } from '../schedule/Coverage'
import {
  chipFills, coverageLevel, dayNumber, describeChip, formatFullDate, formatHeader, formatHour, formatWeekday, isPeriodStart, segmentHours, type Chip, type DayCoverage,
} from '../schedule/data'
import { DAY_MAX_WIDTH, cellViewFor, fitColumns, type CellLayout, type CellView, type ViewDensity } from '../../tokens/workforce'
import GridContextMenu from './GridContextMenu'
import OpenShiftChip from './OpenShiftChip'
import DetailedChip from './DetailedChip'
import StackedChip from './StackedChip'
import { describeOpenShift, overnightSegment, rankLabels, shortName, type OpenShift, type Watch, type WatchId } from './data'
import { HEADER_ROW, staffingMetrics, type GridModel, type GridRow, type StaffingMetric } from './model'
import type { GridSelection } from './useGridSelection'
import classes from './Workforce.module.css'

type CellDensity = CellLayout

export interface WorkforceGridProps {
  model: GridModel
  selection: GridSelection
  /** View density. `compact` shows codes; `detailed` names and times where the days are wide enough (Full layout); `stacked` bars at any width. */
  view: ViewDensity
  today: number
  onToggleGroup: (watch: WatchId) => void
  onToggleStaffing: (watch: WatchId) => void
  onCoverageClick: (watch: Watch, day: number) => void
  /** Adds the right-click menu (see `GridContextMenu`). Pass `onContextMenu` to `useGridSelection` too. */
  contextMenu?: { title: string; onPreview: (action: string) => void }
  /** Assign mode is on: people's cells show a copy cursor and a dashed outline on hover */
  assigning?: boolean
  /** Overnight overlap (proposal): a shift that ends after midnight stays on its start day and points into the next day's cell */
  overnight?: boolean
}

// Keeps clicks, keys and focus inside the search away from the grid's selection handlers
const isolate = {
  onPointerDown: (event: SyntheticEvent) => event.stopPropagation(),
  onKeyDown: (event: SyntheticEvent) => event.stopPropagation(),
  onFocus: (event: SyntheticEvent) => event.stopPropagation(),
}

/** The name column's header: an always-visible employee search. X (or Escape) clears it. Filtering isn't built yet. */
function EmployeeSearch() {
  const [query, setQuery] = useState('')
  return (
    <TextInput
      {...isolate}
      onKeyDown={(event) => { event.stopPropagation(); if (event.key === 'Escape' && query) setQuery('') }}
      data-mantine-stop-propagation={query ? 'true' : undefined}
      className={classes.cornerSearch}
      classNames={{ input: classes.cornerSearchInput }}
      size="sm"
      aria-label="Search employees"
      placeholder="Search employees…"
      value={query}
      onChange={(event) => setQuery(event.currentTarget.value)}
      leftSection={<Search size={16} strokeWidth={1.75} aria-hidden="true" />}
      rightSection={query ? <CloseButton size="sm" aria-label="Clear search" onClick={() => setQuery('')} /> : null}
    />
  )
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
  /** What the cell shows: codes, names and times, or bars (see `cellViewFor`) */
  cells: CellView
}

const cellProps = ({ row, day, selectable, selected, active, edges, tabStop, density, boundary, stopEscape }: Omit<CellState, 'cells'>) => ({
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

/**
 * Overnight overlap: the cell's chip with a tip that reaches into the next day's cell, so a 22:00–08:00 shift
 * reads as running into the next morning while it stays on its start day. On the last day of the range the tip stays inside the cell.
 */
function OvernightChip({ chip, lastDay, children }: { chip: Chip; lastDay: boolean; children: ReactNode }) {
  // Out of branch and locked cells are muted, and so is their tip
  const fill = chip.branch || chip.locked ? 'var(--schedule-branch-bg)' : `var(--schedule-${chipFills(chip)[1]})`
  return (
    <span className={classes.overnight} data-last-day={lastDay || undefined} style={{ '--overnight-fill': fill } as CSSProperties}>
      {children}
      <span className={classes.overnightTip} aria-hidden="true" />
    </span>
  )
}

const MemberCell = memo(function MemberCell({ chip, name, overflow, warning, cells, overnight, lastDay, ...state }: CellState & {
  chip: Chip | null
  name: string
  overflow: boolean
  warning: string | null
  /** Show the overnight tip when the chip ends after midnight */
  overnight: boolean
  lastDay: boolean
}) {
  const context = `${name}, ${formatHeader(state.day)}`
  const late = chip && overnight ? overnightSegment(chip) : undefined
  const content = chip && (
    cells === 'detailed' ? <DetailedChip chip={chip} />
      : cells === 'stacked' ? <StackedChip chip={chip} />
        : <ShiftChip chip={chip} density={state.density} context={context} interactive={false} />
  )
  return (
    <div
      {...cellProps(state)}
      className={classes.cell}
      data-overflow={overflow || undefined}
      aria-label={`${context}: ${chip ? describeChip(chip) : state.selectable ? 'no activity' : 'empty'}${late ? `. Ends ${formatHour(segmentHours(late).end)} the next day` : ''}${warning ? `. Warning: ${warning}` : ''}`}
    >
      {warning && <TriangleAlert size={16} strokeWidth={2} className={classes.warnMark} aria-hidden="true" />}
      {chip ? (
        late ? <OvernightChip chip={chip} lastDay={lastDay}>{content}</OvernightChip> : content
      ) : state.selectable && (
        <Plus size={18} strokeWidth={1.75} className={classes.add} aria-hidden="true" />
      )}
    </div>
  )
})

const OpenCell = memo(function OpenCell({ shift, cells, ...state }: CellState & { shift: OpenShift | null }) {
  return (
    <div
      {...cellProps(state)}
      className={`${classes.cell} ${classes.openCell}`}
      aria-label={`${formatHeader(state.day)}: ${shift ? describeOpenShift(shift) : 'no open shift'}`}
    >
      {shift && <OpenShiftChip shift={shift} density={cells === 'codes' ? state.density : cells} />}
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
  model, selection, view, today, onToggleGroup, onToggleStaffing, onCoverageClick, contextMenu, assigning = false, overnight = false,
}: WorkforceGridProps) {
  const { days } = model
  const { ref: scrollerRef, width } = useElementSize<HTMLDivElement>()
  // One day: the grid is at most DAY_MAX_WIDTH wide and centered, so fit the columns to that
  const single = days.length === 1
  const { narrowLabel, layout: density } = fitColumns(single ? Math.min(width, DAY_MAX_WIDTH) : width, days.length)
  const compact = density !== 'comfortable'
  const mini = density === 'mini'
  const cells = cellViewFor(view, density)
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
      cells,
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
              <MemberCell
                key={days[index]}
                chip={chip}
                name={name}
                overflow={row.overflow}
                warning={row.warnings[index]}
                overnight={overnight}
                lastDay={index === days.length - 1}
                {...cellState(row.key, days[index], index)}
              />
            ))}
          </div>
        )
      }
    }
  }

  const grid = (
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
          aria-label="Employee"
        >
          <EmployeeSearch />
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
              {single ? (
                <><span className={classes.weekday}>{formatFullDate(day).split(', ')[0]}</span>, {formatFullDate(day).split(', ').slice(1).join(', ')}</>
              ) : mini ? (
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
  )

  return (
    <div
      ref={scrollerRef}
      className={classes.scroller}
      style={{ ...(narrowLabel ? { '--workforce-label-width': 'var(--workforce-label-width-narrow)' } : {}) } as CSSProperties}
      data-layout={density}
      data-single-day={single || undefined}
      data-cells={cells === 'codes' ? undefined : cells}
      data-assigning={assigning || undefined}
    >
      {contextMenu ? <GridContextMenu title={contextMenu.title} onPreview={contextMenu.onPreview}>{grid}</GridContextMenu> : grid}
      <VisuallyHidden role="status">{selection.selected.size > 1 ? `${selection.selected.size} cells selected` : ''}</VisuallyHidden>
    </div>
  )
}
