import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'

/* ------------------------------------------------------------------ */
/* Excel-like selection and roving focus for a grid of rows × days.    */
/* Knows nothing about schedules: rows are keys, days are numbers.     */
/*                                                                     */
/* Every focusable element in the grid carries `data-row` and          */
/* `data-day` (a day number, or "label" for the row-header column).    */
/* A cell that spans all days carries `data-span` instead of a day.    */
/* Like a spreadsheet, a row header selects its row, a column header   */
/* (the `headerRow`) its day. The corner only takes focus.               */
/* ------------------------------------------------------------------ */

export type CellKey = `${string}@${number}`
export interface CellRef { row: string; day: number }
/** `day: null` is the row-header column */
export interface CellPos { row: string; day: number | null }
/** What a right-click opened the context menu on: a row header, a column header or a selected cell */
export type GridContextTarget =
  | { kind: 'rows'; row: string }
  | { kind: 'columns'; day: number }
  | { kind: 'cells'; cell: CellRef }

/** What a click, drag or Enter ended on: cells, whole rows (a row header) or whole days (a column header), and the cells selected then */
export interface GridActivation {
  kind: 'cells' | 'rows' | 'columns'
  cells: CellRef[]
}

export const cellKey = (row: string, day: number): CellKey => `${row}@${day}`
const parseKey = (key: CellKey): CellRef => {
  const at = key.lastIndexOf('@')
  return { row: key.slice(0, at), day: Number(key.slice(at + 1)) }
}

interface SelectionState {
  /** Cells selected before the current range started (Ctrl/⌘-click keeps adding to it) */
  base: ReadonlySet<CellKey>
  /** Corners of the current rectangle */
  anchor: CellRef | null
  focus: CellRef | null
  /** The cell the keyboard and the panel work on */
  active: CellPos | null
  /** Rows and days the state was made for. When they change, cells that are gone are dropped. */
  signature: string
}

export interface GridSelectionOptions {
  rows: readonly string[]
  days: readonly number[]
  isSelectable: (row: string, day: number) => boolean
  /** Column for the first tab stop, e.g. today. Defaults to the first day. */
  preferredDay?: number
  /** A click, a drag or Enter on a selectable cell ended. Open the details here. `target` has the cells selected now. */
  onActivate?: (via: 'pointer' | 'keyboard', target: GridActivation) => void
  /** Escape with at most one cell selected. Return `true` if it did something, e.g. closed a panel. */
  onEscape?: () => boolean
  /** `onEscape` will handle Escape right now (e.g. a panel is open). Keeps a surrounding Mantine modal from closing too. */
  escapeHandled?: boolean
  /** Key of the column-header row (must be `rows[0]`). Its cells select a day; its row-header cell (the corner) selects nothing. */
  headerRow?: string
  /** Rows that make up one logical row, top to bottom, e.g. a person's extra lines. Selecting a row header selects them all. */
  rowGroup?: (row: string) => readonly string[]
  /** When a selected cell's row is gone or its cell empties (e.g. a person's extra line after an edit), select this row's cell on the same day instead */
  fallbackRow?: (row: string) => string | null
  /**
   * Right-click (or the Menu key) on a row header, a column header or a selectable cell. Like a spreadsheet, the
   * row, day or cell is selected first unless it already is. Open a menu here (e.g. Mantine `Menu.ContextMenu`
   * around the grid). Elsewhere in the grid the browser menu is suppressed.
   */
  onContextMenu?: (target: GridContextTarget) => void
}

type Mode = 'replace' | 'add' | 'extend'
const modeOf = (event: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean }): Mode =>
  event.shiftKey ? 'extend' : event.ctrlKey || event.metaKey ? 'add' : 'replace'

type Indexes = { rowIndex: Map<string, number>; dayIndex: Map<number, number> }

function materialize(
  state: SelectionState, { rowIndex, dayIndex }: Indexes, rows: readonly string[], days: readonly number[],
  isSelectable: GridSelectionOptions['isSelectable'], fallbackRow?: GridSelectionOptions['fallbackRow'],
) {
  const result = new Set<CellKey>()
  /** The cell, or its fallback row's cell on the same day when it can't be selected any more */
  const add = (row: string, day: number) => {
    if (rowIndex.has(row) && isSelectable(row, day)) return result.add(cellKey(row, day))
    const other = fallbackRow?.(row)
    if (other && rowIndex.has(other) && isSelectable(other, day)) result.add(cellKey(other, day))
  }
  for (const key of state.base) {
    const { row, day } = parseKey(key)
    if (dayIndex.has(day)) add(row, day)
  }
  if (state.anchor && state.focus && state.anchor.row === state.focus.row && state.anchor.day === state.focus.day && !rowIndex.has(state.anchor.row)) {
    add(state.anchor.row, state.anchor.day)
  }
  if (state.anchor && state.focus) {
    const r1 = rowIndex.get(state.anchor.row)
    const r2 = rowIndex.get(state.focus.row)
    const d1 = dayIndex.get(state.anchor.day)
    const d2 = dayIndex.get(state.focus.day)
    if (r1 !== undefined && r2 !== undefined && d1 !== undefined && d2 !== undefined) {
      const single = r1 === r2 && d1 === d2
      for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r += 1) {
        for (let d = Math.min(d1, d2); d <= Math.max(d1, d2); d += 1) {
          if (single) add(rows[r], days[d])
          else if (isSelectable(rows[r], days[d])) result.add(cellKey(rows[r], days[d]))
        }
      }
    }
  }
  return result
}

const samePos = (a: CellPos | null, b: CellPos | null) => a?.row === b?.row && a?.day === b?.day

export function useGridSelection({
  rows, days, isSelectable, preferredDay, onActivate, onEscape, escapeHandled = false, headerRow, rowGroup, fallbackRow, onContextMenu: onContextMenuOpen,
}: GridSelectionOptions) {
  const gridRef = useRef<HTMLDivElement>(null)
  /** What a drag started on: cells draw a rectangle, a row header whole rows, a column header whole days */
  const dragKind = useRef<'cells' | 'rows' | 'columns'>('cells')
  const signature = `${rows.join('|')}#${days.join(',')}`
  const [state, setState] = useState<SelectionState>({ base: new Set(), anchor: null, focus: null, active: null, signature })
  const [dragging, setDragging] = useState(false)

  const indexes = useMemo<Indexes>(() => ({
    rowIndex: new Map(rows.map((row, index) => [row, index])),
    dayIndex: new Map(days.map((day, index) => [day, index])),
  }), [rows, days])

  // Rows or days changed (range, date, collapse, sort, filter): keep only cells that are still on screen.
  if (state.signature !== signature) {
    const kept = materialize(state, indexes, rows, days, isSelectable, fallbackRow)
    const visible = (pos: CellPos | null) => !!pos && indexes.rowIndex.has(pos.row) && (pos.day === null || indexes.dayIndex.has(pos.day))
    const fallback = state.active && fallbackRow?.(state.active.row)
    const moved = state.active && fallback ? { ...state.active, row: fallback } : null
    setState({
      base: kept,
      anchor: null,
      focus: null,
      active: visible(state.active) ? state.active : visible(moved) ? moved : null,
      signature,
    })
  }

  const selected = useMemo(() => materialize(state, indexes, rows, days, isSelectable, fallbackRow), [state, indexes, rows, days, isSelectable, fallbackRow])

  const stopEscape = selected.size > 1 || escapeHandled
  const escapeProps = useMemo((): Record<string, string> => (stopEscape ? { 'data-mantine-stop-propagation': 'true' } : {}), [stopEscape])

  // Rows and days whose selectable cells are all selected: their headers are highlighted
  const full = useMemo(() => {
    const rowsFull = new Set<string>()
    const daysFull = new Set<number>()
    if (!selected.size) return { rowsFull, daysFull }
    const dayHas = new Map(days.map((day) => [day, 0]))
    const dayAll = new Map(days.map((day) => [day, 0]))
    for (const row of rows) {
      let has = 0
      let all = 0
      for (const day of days) {
        if (!isSelectable(row, day)) continue
        all += 1
        dayAll.set(day, dayAll.get(day)! + 1)
        if (selected.has(cellKey(row, day))) { has += 1; dayHas.set(day, dayHas.get(day)! + 1) }
      }
      if (all && has === all) rowsFull.add(row)
    }
    for (const day of days) if (dayAll.get(day) && dayHas.get(day) === dayAll.get(day)) daysFull.add(day)
    return { rowsFull, daysFull }
  }, [selected, rows, days, isSelectable])

  const ordered = useMemo(() => [...selected].map(parseKey).sort((a, b) =>
    (indexes.rowIndex.get(a.row)! - indexes.rowIndex.get(b.row)!) || (indexes.dayIndex.get(a.day)! - indexes.dayIndex.get(b.day)!)), [selected, indexes])

  /** The selection as last rendered, for the end of a drag (its listener outlives several renders) */
  const orderedRef = useRef(ordered)
  useLayoutEffect(() => { orderedRef.current = ordered }, [ordered])

  const tabStop = useMemo<CellPos | null>(() => {
    if (state.active) return state.active
    const day = preferredDay !== undefined && indexes.dayIndex.has(preferredDay) ? preferredDay : days[0]
    if (day === undefined) return rows[0] ? { row: rows[0], day: null } : null
    const row = rows.find((key) => isSelectable(key, day))
    return row ? { row, day } : rows[0] ? { row: rows[0], day: null } : null
  }, [state.active, preferredDay, indexes, days, rows, isSelectable])

  // End a drag wherever the pointer is released, then open the details.
  useEffect(() => {
    if (!dragging) return
    const end = () => {
      setDragging(false)
      onActivate?.('pointer', { kind: dragKind.current, cells: orderedRef.current })
      // Opening a panel narrows the grid: keep the clicked cell in view
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const focused = document.activeElement
        if (focused instanceof HTMLElement && gridRef.current?.contains(focused)) focused.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      }))
    }
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
    }
  }, [dragging, onActivate])

  /* ---------- Helpers ---------- */

  const posFrom = (element: EventTarget | null): CellPos | null => {
    const target = (element as HTMLElement | null)?.closest?.<HTMLElement>('[data-row]')
    if (!target || !gridRef.current?.contains(target)) return null
    const row = target.dataset.row!
    if (target.dataset.span !== undefined) return { row, day: state.active?.row === row ? state.active.day : days[0] ?? null }
    const day = target.dataset.day
    return { row, day: day === undefined || day === 'label' ? null : Number(day) }
  }

  const elementAt = (pos: CellPos) => {
    const grid = gridRef.current
    if (!grid) return null
    const row = CSS.escape(pos.row)
    return grid.querySelector<HTMLElement>(`[data-row="${row}"][data-day="${pos.day ?? 'label'}"]`)
      ?? grid.querySelector<HTMLElement>(`[data-row="${row}"][data-span]`)
  }

  const focusAt = (pos: CellPos) => {
    const element = elementAt(pos)
    if (!element) return
    element.focus({ preventScroll: true })
    element.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  const isCell = (pos: CellPos | null): pos is CellRef => !!pos && pos.day !== null
  const canSelect = (pos: CellPos | null): pos is CellRef => isCell(pos) && isSelectable(pos.row, pos.day)

  const selectOnly = (cell: CellRef) => setState((s) => ({ ...s, base: new Set(), anchor: cell, focus: cell, active: cell }))
  const extendTo = (cell: CellRef) => setState((s) => ({
    ...s,
    anchor: s.anchor ?? (isCell(s.active) ? s.active : cell),
    focus: cell,
    active: s.anchor || isCell(s.active) ? s.active : cell,
  }))
  const toggle = (cell: CellRef) => {
    const key = cellKey(cell.row, cell.day)
    const next = new Set(selected)
    const removing = next.has(key)
    if (removing) next.delete(key)
    setState((s) => ({ ...s, base: next, anchor: cell, focus: removing ? null : cell, active: cell }))
  }
  const selectAll = () => {
    const firstRow = rows.find((row) => days.some((day) => isSelectable(row, day)))
    const lastRow = [...rows].reverse().find((row) => days.some((day) => isSelectable(row, day)))
    if (!firstRow || !lastRow) return
    setState((s) => ({ ...s, base: new Set(), anchor: { row: firstRow, day: days[0] }, focus: { row: lastRow, day: days[days.length - 1] } }))
  }

  const group = (row: string) => rowGroup?.(row) ?? [row]
  const rowHasCells = (row: string) => group(row).some((key) => days.some((day) => isSelectable(key, day)))
  const firstDay = days[0]
  const lastDay = days[days.length - 1]
  const dataRows = headerRow ? rows.slice(1) : rows

  /** A row header: select that person's whole row (all their lines). Shift: every row from the anchor. Ctrl/⌘: add it. */
  const selectRows = (row: string, mode: Mode) => {
    if (firstDay === undefined) return
    const lines = group(row)
    if (mode === 'extend' && state.anchor) {
      const from = group(state.anchor.row)
      const down = (indexes.rowIndex.get(lines[0]) ?? 0) >= (indexes.rowIndex.get(from[0]) ?? 0)
      setState((s) => ({ ...s, anchor: { row: down ? from[0] : from[from.length - 1], day: firstDay }, focus: { row: down ? lines[lines.length - 1] : lines[0], day: lastDay } }))
      return
    }
    setState((s) => ({ ...s, base: mode === 'add' ? new Set(selected) : new Set(), anchor: { row: lines[0], day: firstDay }, focus: { row: lines[lines.length - 1], day: lastDay } }))
  }

  /** A column header: select every cell on that day. Shift: every day from the anchor. Ctrl/⌘: add it. */
  const selectColumns = (day: number, mode: Mode) => {
    if (!dataRows.length) return
    const top = dataRows[0]
    const bottom = dataRows[dataRows.length - 1]
    if (mode === 'extend' && state.anchor) {
      setState((s) => ({ ...s, anchor: { row: top, day: s.anchor?.day ?? day }, focus: { row: bottom, day } }))
      return
    }
    setState((s) => ({ ...s, base: mode === 'add' ? new Set(selected) : new Set(), anchor: { row: top, day }, focus: { row: bottom, day } }))
  }

  /* ---------- Pointer ---------- */

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return
    const pos = posFrom(event.target)
    if (!pos) return
    const mode = modeOf(event)
    if (headerRow && pos.row === headerRow) {
      if (pos.day === null) return
      selectColumns(pos.day, mode)
      dragKind.current = 'columns'
    } else if (pos.day === null) {
      if (!rowHasCells(pos.row)) return
      selectRows(pos.row, mode)
      dragKind.current = 'rows'
    } else {
      if (!canSelect(pos)) return
      if (mode === 'extend') extendTo(pos)
      else if (mode === 'add') toggle(pos)
      else selectOnly(pos)
      dragKind.current = 'cells'
    }
    setDragging(true)
  }

  // A double click would select text around the grid (the grid itself has user-select: none)
  const onMouseDown = (event: MouseEvent<HTMLElement>) => {
    if (event.detail > 1) event.preventDefault()
  }

  const onPointerOver = (event: PointerEvent<HTMLElement>) => {
    if (!dragging) return
    const pos = posFrom(event.target)
    if (!pos) return
    const kind = dragKind.current
    if (kind === 'rows') {
      if (pos.row !== headerRow && rowHasCells(pos.row)) selectRows(pos.row, 'extend')
    } else if (kind === 'columns') {
      if (pos.day !== null) selectColumns(pos.day, 'extend')
    } else if (kind === 'cells' && isCell(pos)) {
      setState((s) => (s.focus && samePos(s.focus, pos) ? s : { ...s, anchor: s.anchor ?? pos, focus: pos }))
    }
  }

  /* ---------- Context menu ---------- */

  const isRowSelected = (row: string) => group(row).every((key) => full.rowsFull.has(key) || !days.some((day) => isSelectable(key, day))) && group(row).some((key) => full.rowsFull.has(key))

  const onContextMenu = (event: MouseEvent<HTMLElement>) => {
    if (!onContextMenuOpen) return
    const pos = posFrom(event.target)
    let target: GridContextTarget | null = null
    if (pos && headerRow && pos.row === headerRow) {
      if (pos.day !== null) {
        if (!full.daysFull.has(pos.day)) selectColumns(pos.day, 'replace')
        target = { kind: 'columns', day: pos.day }
      }
    } else if (pos && pos.day === null) {
      if (rowHasCells(pos.row)) {
        if (!isRowSelected(pos.row)) selectRows(pos.row, 'replace')
        target = { kind: 'rows', row: pos.row }
      }
    } else if (canSelect(pos)) {
      if (!selected.has(cellKey(pos.row, pos.day))) selectOnly(pos)
      target = { kind: 'cells', cell: pos }
    }
    // Nothing to act on here: no menu at all, rather than the browser's
    if (!target) { event.preventDefault(); return }
    onContextMenuOpen(target)
  }

  /* ---------- Keyboard ---------- */

  const move = (from: CellPos, key: string, jump: boolean): CellPos | null => {
    const rowAt = indexes.rowIndex.get(from.row)
    if (rowAt === undefined) return null
    const columns = [null, ...days]
    const colAt = from.day === null ? 0 : (indexes.dayIndex.get(from.day) ?? 0) + 1
    let r = rowAt
    let c = colAt
    switch (key) {
      case 'ArrowUp': r = jump ? 0 : r - 1; break
      case 'ArrowDown': r = jump ? rows.length - 1 : r + 1; break
      case 'ArrowLeft': c = jump ? 1 : c - 1; break
      case 'ArrowRight': c = jump ? columns.length - 1 : c + 1; break
      case 'Home': c = 1; if (jump) r = headerRow ? 1 : 0; break
      case 'End': c = columns.length - 1; if (jump) r = rows.length - 1; break
      case 'PageUp': r -= 10; break
      case 'PageDown': r += 10; break
      default: return null
    }
    r = Math.max(0, Math.min(rows.length - 1, r))
    c = Math.max(0, Math.min(columns.length - 1, c))
    return { row: rows[r], day: columns[c] }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const pos = posFrom(event.target)
    if (!pos) return
    const mod = event.ctrlKey || event.metaKey
    const handled = () => { event.preventDefault(); event.stopPropagation() }

    const next = move(pos, event.key, mod)
    if (next) {
      handled()
      if (event.shiftKey && isCell(next)) {
        setState((s) => ({ ...s, anchor: s.anchor ?? (isCell(pos) ? pos : next), focus: next, active: next }))
      } else if (canSelect(next)) {
        selectOnly(next)
      } else {
        setState((s) => ({ ...s, active: next }))
      }
      focusAt(next)
      return
    }

    if (mod && event.key.toLowerCase() === 'a') { handled(); selectAll(); return }

    // Headers: Space or Enter selects the column or the row (the corner selects nothing); Enter also opens the details
    const onHeader = headerRow && pos.row === headerRow
    if ((event.key === ' ' || event.key === 'Enter') && ((onHeader && pos.day !== null) || (!onHeader && pos.day === null && rowHasCells(pos.row)))) {
      handled()
      const mode = modeOf(event)
      if (onHeader) {
        selectColumns(pos.day!, mode)
      } else {
        selectRows(pos.row, mode)
      }
      if (event.key === 'Enter') onActivate?.('keyboard', { kind: onHeader ? 'columns' : 'rows', cells: [] })
      return
    }

    // Ctrl/⌘+Space selects the active cell's column, as in a spreadsheet
    if (event.key === ' ' && mod && isCell(pos)) { handled(); selectColumns(pos.day, 'replace'); return }

    if (event.key === ' ' && canSelect(pos)) {
      handled()
      if (event.shiftKey) setState((s) => ({ ...s, base: new Set(), anchor: { row: pos.row, day: days[0] }, focus: { row: pos.row, day: days[days.length - 1] } }))
      else toggle(pos)
      return
    }

    if (event.key === 'Enter' && canSelect(pos)) {
      handled()
      const inSelection = selected.has(cellKey(pos.row, pos.day))
      if (!inSelection) selectOnly(pos)
      onActivate?.('keyboard', { kind: 'cells', cells: inSelection ? ordered : [pos] })
      return
    }

    if (event.key === 'Escape') {
      if (selected.size > 1) {
        handled()
        if (canSelect(state.active)) selectOnly(state.active)
        else setState((s) => ({ ...s, base: new Set(), anchor: null, focus: null }))
      } else if (onEscape?.()) {
        handled()
      }
    }
  }

  const onFocus = (event: FocusEvent<HTMLElement>) => {
    const pos = posFrom(event.target)
    if (pos && !samePos(pos, state.active)) setState((s) => ({ ...s, active: pos }))
  }

  /* ---------- Rendering helpers ---------- */

  /** Which sides of a selected cell are on the edge of its range: "t r b l" */
  const edges = (row: string, day: number) => {
    const r = indexes.rowIndex.get(row)
    const d = indexes.dayIndex.get(day)
    if (r === undefined || d === undefined) return ''
    const has = (rr: number, dd: number) => rr >= 0 && rr < rows.length && dd >= 0 && dd < days.length && selected.has(cellKey(rows[rr], days[dd]))
    return [!has(r - 1, d) && 't', !has(r, d + 1) && 'r', !has(r + 1, d) && 'b', !has(r, d - 1) && 'l'].filter(Boolean).join(' ')
  }

  return {
    selected,
    /** Selected cells, top to bottom, then left to right */
    ordered,
    active: state.active,
    dragging,
    isSelected: (row: string, day: number) => selected.has(cellKey(row, day)),
    isTabStop: (row: string, day: number | null) => !!tabStop && tabStop.row === row && tabStop.day === day,
    /** For cells spanning all days */
    isRowTabStop: (row: string) => tabStop?.row === row,
    edges,
    /** Every selectable cell in this row (or day) is selected: highlight its header */
    isRowSelected,
    isColumnSelected: (day: number) => full.daysFull.has(day),
    /**
     * Spread on every focusable element in the grid. Mantine modals close on Escape from a window listener that runs
     * before the grid's; this attribute tells them the grid uses Escape right now.
     */
    escapeProps,
    clear: () => setState((s) => ({ ...s, base: new Set(), anchor: null, focus: null })),
    /** Back to nothing selected and no active cell, e.g. for Reset demo */
    reset: () => setState({ base: new Set(), anchor: null, focus: null, active: null, signature }),
    /** Puts focus back on the active cell, e.g. after closing the panel */
    focusActive: () => { if (state.active) focusAt(state.active) },
    /** Spread on the grid element */
    gridProps: { ref: gridRef, onKeyDown, onPointerDown, onMouseDown, onPointerOver, onFocus, onContextMenu },
  }
}

export type GridSelection = ReturnType<typeof useGridSelection>
