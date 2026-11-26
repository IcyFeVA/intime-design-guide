import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Text, Transition } from '@mantine/core'
import { useReducedMotion } from '@mantine/hooks'
import { CalendarClock } from 'lucide-react'
import { DesktopDemoFrame, FramePage } from '../schedule/ScheduleChrome'
import { ApprovalFilters, ApprovalTabs } from '../approvals/Approvals'
import ApprovalsWorkspace from '../approvals/ApprovalsWorkspace'
import { useApprovals } from '../approvals/useApprovals'
import { openCount } from '../approvals/data'
import { approvalKinds } from '../../tokens/approvals'
import { CoverageDrawer, type CoverageSelection } from '../schedule/ScheduleDetails'
import { SortModal, type SortField } from '../sort/SortModal'
import type { SortDirection } from '../schedule/FilterSheet'
import { MOCK_TODAY, formatHeader, rangeDays, type Chip } from '../schedule/data'
import { DEFAULT_VIEW_DENSITY, TARGET_WIDTH, workforceRanges, type ViewDensity, type WorkforceRange } from '../../tokens/workforce'
import {
  applyEdits, dayKey, findUnit, openShifts, shortName, stillNeeded, watches, type Watch, type WatchId, type WorkforceMember, type WorkforceSort,
} from './data'
import { HEADER_ROW, assignDay, buildGridModel, panelContent, type AssignSource } from './model'
import { useGridSelection, type CellRef, type GridActivation, type GridContextTarget } from './useGridSelection'
import { useScheduleEdits } from './useScheduleEdits'
import WorkforceGrid from './WorkforceGrid'
import WorkforcePanel from './WorkforcePanel'
import { WorkforceToolbar, WorkforceViewActions } from './WorkforceChrome'
import { AssignBar } from './AssignBar'
import { chipSpanLabel } from './panel/format'
import classes from './WorkforceDemo.module.css'

const sortFields: SortField<WorkforceSort>[] = [
  { key: 'watch', label: 'Watch order' },
  { key: 'name', label: 'Name' },
  { key: 'rank', label: 'Rank' },
  { key: 'rankEffective', label: 'Rank, then effective date', description: 'Same rank: by the date the rank took effect' },
  { key: 'rankPrecedence', label: 'Rank, then precedence' },
  { key: 'precedence', label: 'Precedence' },
  { key: 'precedenceRank', label: 'Precedence, then rank' },
]

const ALL_WATCHES: ReadonlySet<WatchId> = new Set(watches.map((watch) => watch.id))

const panelSlide = {
  in: { opacity: 1, transform: 'translateX(0)' },
  out: { opacity: 0, transform: 'translateX(16px)' },
  transitionProperty: 'opacity, transform',
}

const DEFAULT_STATUS = '“Today” is Friday, June 5, 2026 in this demo. Click, Shift-click, Ctrl/⌘-click or drag to select cells. Changes in the panel save as you go; Undo reverts them and Reset demo restores the schedule.'
const APPROVALS_STATUS = 'Preview only. Approvals opens on top of the schedule, so going back is instant and keeps your place.'
const DEFAULT_STAFFING: ReadonlySet<WatchId> = new Set(['swing'])

/** The Workforce Scheduling desktop demo: toolbar, grid, details panel, coverage drawer and employee details. */
export default function WorkforceDemo() {
  const reduceMotion = useReducedMotion()
  const [range, setRange] = useState<WorkforceRange>('week')
  const [anchor, setAnchor] = useState(MOCK_TODAY)
  const [view, setView] = useState<ViewDensity>(DEFAULT_VIEW_DENSITY)
  const [sort, setSort] = useState<WorkforceSort>('watch')
  const [direction, setDirection] = useState<SortDirection>('asc')
  const [sortOpen, setSortOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<ReadonlySet<WatchId>>(new Set())
  const [staffingCollapsed, setStaffingCollapsed] = useState(DEFAULT_STAFFING)
  const [panelOpen, setPanelOpen] = useState(false)
  const [focusTick, setFocusTick] = useState(0)
  const [hint, setHint] = useState<string | null>(null)
  const [coverage, setCoverage] = useState<CoverageSelection | null>(null)
  const [approvalsOpen, setApprovalsOpen] = useState(false)
  const [menuTarget, setMenuTarget] = useState<GridContextTarget | null>(null)
  const [assign, setAssign] = useState<AssignSource | null>(null)
  const approvals = useApprovals({ kind: 'activity' })
  const schedule = useScheduleEdits()
  const edited = useMemo(() => applyEdits(schedule.edits), [schedule.edits])
  const approvalsButton = useRef<HTMLButtonElement>(null)
  const pendingApprovals = approvalKinds.reduce((sum, item) => sum + openCount(approvals.requests, item.key), 0)
  const closeApprovals = () => {
    setApprovalsOpen(false)
    // The schedule is inert while Approvals is open: wait for it to come back before focusing
    requestAnimationFrame(() => approvalsButton.current?.focus())
  }

  const rangeDef = workforceRanges.find((item) => item.key === range)!
  const placeholder = !!rangeDef.placeholder
  const days = useMemo(() => (placeholder ? [] : rangeDays(range, anchor)), [placeholder, range, anchor])
  const stepperDays = useMemo(() => rangeDays(range, anchor), [range, anchor])

  const model = useMemo(
    () => buildGridModel({ watches: edited, days, collapsed, staffingCollapsed, sort, direction, filter: 'all', openEdits: schedule.edits.open }),
    [edited, days, collapsed, staffingCollapsed, sort, direction, schedule.edits.open],
  )

  /** Assign mode: give every clicked person-day a copy of the source. One save, so one Undo reverts a whole drag. */
  const assignCells = (source: AssignSource, cells: CellRef[]) => {
    const byDay = new Map<string, { member: WorkforceMember; day: number; lines: number[] }>()
    for (const cell of cells) {
      const row = model.byKey.get(cell.row)
      if (row?.kind !== 'member') continue
      const key = dayKey(row.member.id, cell.day)
      const entry = byDay.get(key) ?? { member: row.member, day: cell.day, lines: [] }
      entry.lines.push(row.line)
      byDay.set(key, entry)
    }
    if (!byDay.size) return

    const shift = source.openShift ? openShifts(source.openShift.day, schedule.edits.open).find((item) => item.id === source.openShift!.id) : undefined
    let places = shift ? stillNeeded(shift) : Infinity
    const saved: [string, Chip[]][] = []
    const names: string[] = []
    const skipped: string[] = []
    for (const [key, { member, day, lines }] of byDay) {
      const who = `${shortName(member)}, ${formatHeader(day)}`
      if (shift && day !== shift.day) { skipped.push(`${who} (the shift is on ${formatHeader(shift.day)})`); continue }
      if (places <= 0) { skipped.push(`${who} (nobody else is needed)`); continue }
      const result = assignDay(member.chips(day), lines, source.chip)
      if (result.error) { skipped.push(`${who} (${result.error})`); continue }
      if (!result.changed) continue
      saved.push([key, result.chips])
      names.push(who)
      places -= 1
    }

    const what = `${[...new Set(source.chip.segments.map((segment) => segment.code))].join(' + ')} ${chipSpanLabel(source.chip)}`
    const parts: string[] = []
    if (saved.length) {
      parts.push(`Assigned ${what} to ${names.length <= 3 ? names.join("; ") : `${names.length} cells`}. Undo reverts it.`)
      schedule.commit({ days: saved, open: shift ? [[shift.id, { filled: (shift.filled ?? 0) + saved.length }]] : undefined })
    }
    if (skipped.length) parts.push(`Skipped ${skipped.join('; ')}.`)
    if (shift && places <= 0 && saved.length) {
      parts.push('The open shift is filled, so assigning stopped.')
      setAssign(null)
    }
    if (parts.length) setHint(parts.join(' '))
  }

  const onActivate = (via: 'pointer' | 'keyboard', target: GridActivation) => {
    if (assign && target.kind === 'cells') assignCells(assign, target.cells)
    setPanelOpen(true)
    if (via === 'keyboard') setFocusTick((tick) => tick + 1)
  }

  const startAssign = (source: AssignSource | null) => {
    setAssign(source)
    setHint(null)
  }

  // Escape ends assign mode wherever focus is, before the grid or panel use it, unless it is closing a field, dropdown, menu or dialog
  const assigning = !!assign
  useEffect(() => {
    if (!assigning) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      const target = event.target as HTMLElement
      if (target.closest?.('input, textarea, [aria-expanded="true"], [role="menu"], [role="dialog"], [role="listbox"]')) return
      event.preventDefault()
      event.stopPropagation()
      setAssign(null)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [assigning])

  const selection = useGridSelection({
    rows: model.navRows,
    headerRow: HEADER_ROW,
    rowGroup: model.rowGroup,
    fallbackRow: model.fallbackRow,
    days: model.days,
    isSelectable: model.isSelectable,
    preferredDay: MOCK_TODAY,
    onActivate,
    onContextMenu: setMenuTarget,
    escapeHandled: panelOpen || !!assign,
    onEscape: () => {
      if (!panelOpen) return false
      setPanelOpen(false)
      setFocusTick(0)
      return true
    },
  })

  const content = useMemo(() => panelContent(model, selection.ordered), [model, selection.ordered])

  // The context menu's title: what it acts on, from the selection as it is now
  const menuTitle = (() => {
    if (menuTarget?.kind === 'columns') {
      const count = model.days.filter(selection.isColumnSelected).length
      return count > 1 ? `${count} days` : formatHeader(menuTarget.day)
    }
    if (menuTarget?.kind === 'rows') {
      const heads = model.rows.filter((row) => (row.kind === 'member' || row.kind === 'open') && row.line === 0 && selection.isRowSelected(row.key))
      if (heads.length > 1) return `${heads.length} rows`
      const row = model.byKey.get(menuTarget.row)
      return row?.kind === 'member' ? shortName(row.member) : 'Open shifts'
    }
    const count = selection.selected.size
    return `${count} ${count === 1 ? 'cell' : 'cells'}`
  })()

  const closePanel = () => {
    setPanelOpen(false)
    setFocusTick(0)
    selection.focusActive()
  }
  const preview = (action: string) => setHint(`Preview only: “${action}” isn’t built in this demo yet.`)
  const toggle = (set: ReadonlySet<WatchId>, id: WatchId) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }

  const reset = () => {
    setRange('week'); setAnchor(MOCK_TODAY); setView(DEFAULT_VIEW_DENSITY); setSort('watch'); setDirection('asc')
    setSortOpen(false); setCollapsed(new Set()); setStaffingCollapsed(DEFAULT_STAFFING); setPanelOpen(false); setFocusTick(0); setHint(null)
    setCoverage(null); setMenuTarget(null); setAssign(null); selection.reset(); setApprovalsOpen(false); approvals.reset(); schedule.reset()
  }

  return (
    <DesktopDemoFrame
      title="Work Scheduling"
      status={approvalsOpen ? approvals.hint ?? APPROVALS_STATUS : hint ?? DEFAULT_STATUS}
      onReset={reset}
      targetWidth={TARGET_WIDTH}
      overlayOpen={approvalsOpen}
      overlay={(
        <FramePage
          title="Approvals"
          back={{ label: 'Back to Scheduling', onClick: closeApprovals, autoFocus: true }}
          tabs={<ApprovalTabs kind={approvals.kind} requests={approvals.requests} onChange={approvals.setKind} />}
          toolbar={<ApprovalFilters state={approvals} />}
        >
          <ApprovalsWorkspace state={approvals} />
        </FramePage>
      )}
      actions={(
        <WorkforceViewActions
          density={view}
          onDensity={setView}
          panelOpen={panelOpen}
          onTogglePanel={() => (panelOpen ? closePanel() : setPanelOpen(true))}
          onSort={() => setSortOpen(true)}
          allCollapsed={collapsed.size === ALL_WATCHES.size}
          onCollapseAll={(collapse) => {
            setCollapsed(collapse ? ALL_WATCHES : new Set())
            setStaffingCollapsed(collapse ? ALL_WATCHES : new Set())
          }}
          onUndo={schedule.canUndo ? schedule.undo : undefined}
        />
      )}
      toolbar={(
        <WorkforceToolbar
          range={range}
          onRange={setRange}
          days={stepperDays}
          anchor={anchor}
          onAnchorChange={setAnchor}
          team="patrol"
          onTeam={(key) => key !== 'patrol' && setHint(`Preview only: the demo has data for Patrol only, not ${findUnit(key)?.label}.`)}
          underAlerts={placeholder ? [] : model.underAlerts}
          approvals={pendingApprovals}
          onApprovals={() => { setApprovalsOpen(true); setHint(null) }}
          approvalsRef={approvalsButton}
          onPreview={preview}
        />
      )}
    >
      <div
        className={classes.workspace}
        onKeyDown={(event) => {
          // Ctrl/⌘+Z undoes the last saved change, except while typing, where it undoes the typing
          if (event.key.toLowerCase() !== 'z' || !(event.ctrlKey || event.metaKey) || event.shiftKey || event.altKey) return
          if ((event.target as HTMLElement).closest('input, textarea, [contenteditable="true"]') || !schedule.canUndo) return
          event.preventDefault()
          schedule.undo()
        }}
      >
        <div className={classes.gridArea}>
          {placeholder ? (
            <div className={classes.placeholder}>
              <CalendarClock size={32} strokeWidth={1.5} aria-hidden="true" />
              <Text fw={600} c="var(--text-default)">Day view is coming</Text>
              <Text size="sm" maw={420}>It will show each person’s shifts on an hour-by-hour timeline. Pick another range to keep scheduling.</Text>
              <Button variant="default" size="sm" mt="xs" onClick={() => setRange('week')}>Show one week</Button>
            </div>
          ) : (
            <WorkforceGrid
              model={model}
              selection={selection}
              view={view}
              today={MOCK_TODAY}
              onToggleGroup={(id) => setCollapsed((set) => toggle(set, id))}
              onToggleStaffing={(id) => setStaffingCollapsed((set) => toggle(set, id))}
              onCoverageClick={(watch: Watch, day: number) => setCoverage({ title: `${watch.title} watch`, day, coverage: watch.coverage(day) })}
              contextMenu={{ title: menuTitle, onPreview: preview }}
              assigning={!!assign}
            />
          )}
          {assign && !placeholder && <AssignBar source={assign} onDone={() => startAssign(null)} />}
        </div>
        <Transition mounted={panelOpen} transition={panelSlide} duration={reduceMotion ? 0 : 220} timingFunction="cubic-bezier(0.2, 0, 0, 1)">
          {(style) => (
            <WorkforcePanel
              style={style}
              content={content}
              onEdit={schedule.commit}
              onUndo={schedule.undo}
              saves={schedule.saves}
              assigning={!!assign}
              onAssign={startAssign}
              onClose={closePanel}
              onPreview={preview}
              focusTick={focusTick}
            />
          )}
        </Transition>
        <CoverageDrawer selection={coverage} onClose={() => setCoverage(null)} contained />
        <SortModal
          opened={sortOpen}
          value={{ field: sort, direction }}
          fields={sortFields}
          onClose={() => setSortOpen(false)}
          onApply={(value) => { setSort(value.field); setDirection(value.direction) }}
          contained
        />
      </div>
    </DesktopDemoFrame>
  )
}
