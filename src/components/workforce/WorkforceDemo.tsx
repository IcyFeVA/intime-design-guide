import { useCallback, useMemo, useState } from 'react'
import { Button, Text, Transition } from '@mantine/core'
import { useReducedMotion } from '@mantine/hooks'
import { CalendarClock } from 'lucide-react'
import { DesktopDemoFrame } from '../schedule/ScheduleChrome'
import { CoverageDrawer, type CoverageSelection } from '../schedule/ScheduleDetails'
import { SortModal, type SortField } from '../sort/SortModal'
import type { SortDirection } from '../schedule/FilterSheet'
import { MOCK_TODAY, rangeDays } from '../schedule/data'
import { DEFAULT_VIEW_DENSITY, TARGET_WIDTH, workforceRanges, type ViewDensity, type WorkforceRange } from '../../tokens/workforce'
import { findUnit, watches, type Watch, type WatchId, type WorkforceSort } from './data'
import { HEADER_ROW, buildGridModel, panelContent } from './model'
import { useGridSelection } from './useGridSelection'
import WorkforceGrid from './WorkforceGrid'
import WorkforcePanel from './WorkforcePanel'
import { WorkforceToolbar, WorkforceViewActions } from './WorkforceChrome'
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

const DEFAULT_STATUS = 'Preview only. “Today” is Friday, June 5, 2026 in this demo. Click, Shift-click, Ctrl/⌘-click or drag to select cells.'
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

  const rangeDef = workforceRanges.find((item) => item.key === range)!
  const placeholder = !!rangeDef.placeholder
  const days = useMemo(() => (placeholder ? [] : rangeDays(range, anchor)), [placeholder, range, anchor])
  const stepperDays = useMemo(() => rangeDays(range, anchor), [range, anchor])

  const model = useMemo(
    () => buildGridModel({ watches, days, collapsed, staffingCollapsed, sort, direction, filter: 'all' }),
    [days, collapsed, staffingCollapsed, sort, direction],
  )

  const onActivate = useCallback((via: 'pointer' | 'keyboard') => {
    setPanelOpen(true)
    if (via === 'keyboard') setFocusTick((tick) => tick + 1)
  }, [])

  const selection = useGridSelection({
    rows: model.navRows,
    headerRow: HEADER_ROW,
    rowGroup: model.rowGroup,
    days: model.days,
    isSelectable: model.isSelectable,
    preferredDay: MOCK_TODAY,
    onActivate,
    escapeHandled: panelOpen,
    onEscape: () => {
      if (!panelOpen) return false
      setPanelOpen(false)
      setFocusTick(0)
      return true
    },
  })

  const content = useMemo(() => panelContent(model, selection.ordered), [model, selection.ordered])

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
    setCoverage(null); selection.reset()
  }

  return (
    <DesktopDemoFrame
      title="Workforce Scheduling"
      status={hint ?? DEFAULT_STATUS}
      onReset={reset}
      targetWidth={TARGET_WIDTH}
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
          onPreview={preview}
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
          onPreview={preview}
        />
      )}
    >
      <div className={classes.workspace}>
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
            />
          )}
        </div>
        <Transition mounted={panelOpen} transition={panelSlide} duration={reduceMotion ? 0 : 220} timingFunction="cubic-bezier(0.2, 0, 0, 1)">
          {(style) => <WorkforcePanel style={style} content={content} onClose={closePanel} onPreview={preview} focusTick={focusTick} />}
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
