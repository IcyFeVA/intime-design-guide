import { formatHeader, type Chip } from '../schedule/data'
import { dayKey, shortName, type WorkforceMember } from './data'
import { assignDay, type GridModel } from './model'
import type { CellRef } from './useGridSelection'

/* ------------------------------------------------------------------ */
/* Copy and paste cells, like a spreadsheet. The demo keeps its own    */
/* clipboard (not the system one). Rows are people, columns are days.  */
/* ------------------------------------------------------------------ */

/** What was copied: each person-day's cells, by its offset from the copied area's top-left */
export interface ScheduleClipboard {
  entries: { person: number; day: number; chips: Chip[] }[]
  /** One person-day was copied: paste gives it to every selected cell */
  single: boolean
  /** Copied cells, for the status line */
  count: number
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/** People in grid order (their first line) */
const peopleOf = (model: GridModel) => model.rows.flatMap((row) => (row.kind === 'member' && row.line === 0 ? [row.member] : []))

/** The selected person-days and the lines selected on each */
function personDays(model: GridModel, cells: CellRef[]) {
  const byDay = new Map<string, { member: WorkforceMember; day: number; lines: number[]; chips: Chip[] }>()
  let open = 0
  for (const cell of cells) {
    const row = model.byKey.get(cell.row)
    if (row?.kind === 'open') open += 1
    if (row?.kind !== 'member') continue
    const key = dayKey(row.member.id, cell.day)
    const entry = byDay.get(key) ?? { member: row.member, day: cell.day, lines: [], chips: [] }
    entry.lines.push(row.line)
    const chip = row.cells[model.days.indexOf(cell.day)]
    if (chip) entry.chips.push(chip)
    byDay.set(key, entry)
  }
  return { days: [...byDay.values()], open }
}

/** Copies the selected cells. Locked cells (e.g. court dates) and open shifts aren't copied. */
export function copyCells(model: GridModel, cells: CellRef[]): { clipboard?: ScheduleClipboard; status: string } {
  const { days, open } = personDays(model, cells)
  const people = new Map(peopleOf(model).map((member, index) => [member.id, index]))
  let locked = 0
  const kept = days.map((entry) => {
    const chips = entry.chips.filter((chip) => !chip.locked)
    locked += entry.chips.length - chips.length
    return { ...entry, chips }
  })
  const filled = kept.filter((entry) => entry.chips.length)
  const notCopied = [open && `${plural(open, 'open shift')}`, locked && `${plural(locked, 'locked cell')}`].filter(Boolean).join(' and ')
  if (!filled.length) {
    return { status: `Nothing to copy. Select cells with an assignment or leave${notCopied ? ` (${notCopied} can’t be copied)` : ''}.` }
  }
  // The empty cells count for the area's shape, like a spreadsheet: pasting keeps the gaps
  const top = Math.min(...kept.map((entry) => people.get(entry.member.id)!))
  const left = Math.min(...kept.map((entry) => entry.day))
  const count = filled.reduce((sum, entry) => sum + entry.chips.length, 0)
  return {
    clipboard: {
      entries: filled.map((entry) => ({ person: people.get(entry.member.id)! - top, day: entry.day - left, chips: entry.chips })),
      single: kept.length === 1,
      count,
    },
    status: `Copied ${plural(count, 'cell')}${notCopied ? ` (not the ${notCopied})` : ''}. Select where to paste, then press Ctrl/⌘ V or right-click › Paste.`,
  }
}

/**
 * Pastes into the selection. One copied person-day goes into every selected person-day; a larger area is laid
 * down from the selection's top-left cell, and what falls outside the grid is skipped. Each pasted cell replaces
 * the selected cell and any unlocked cell it overlaps (as assign mode does); empty copied cells change nothing.
 */
export function pasteCells(model: GridModel, cells: CellRef[], clipboard: ScheduleClipboard): { days: [string, Chip[]][]; status: string } {
  const { days: targets } = personDays(model, cells)
  if (!targets.length) return { days: [], status: 'Select a person’s cell to paste into.' }
  const people = peopleOf(model)
  const selectedLines = new Map(targets.map((target) => [dayKey(target.member.id, target.day), target.lines]))

  const plan: { member: WorkforceMember; day: number; lines: number[]; chips: Chip[] }[] = []
  let outside = 0
  if (clipboard.single) {
    for (const target of targets) plan.push({ member: target.member, day: target.day, lines: target.lines, chips: clipboard.entries[0].chips })
  } else {
    const index = new Map(people.map((member, i) => [member.id, i]))
    const top = Math.min(...targets.map((target) => index.get(target.member.id)!))
    const left = Math.min(...targets.map((target) => target.day))
    for (const entry of clipboard.entries) {
      const member = people[top + entry.person]
      const day = left + entry.day
      if (!member || !model.days.includes(day)) { outside += entry.chips.length; continue }
      plan.push({ member, day, lines: selectedLines.get(dayKey(member.id, day)) ?? [], chips: entry.chips })
    }
  }

  const saved: [string, Chip[]][] = []
  const skipped: string[] = []
  for (const { member, day, lines, chips: copies } of plan) {
    let chips = member.chips(day)
    let changed = false
    let error: string | undefined
    copies.forEach((copy, index) => {
      if (error) return
      const result = assignDay(chips, index === 0 ? lines : [], copy)
      if (result.error) error = result.error
      else {
        chips = result.chips
        changed ||= result.changed
      }
    })
    if (error) skipped.push(`${shortName(member)}, ${formatHeader(day)} (${error})`)
    else if (changed) saved.push([dayKey(member.id, day), chips])
  }

  const parts: string[] = []
  if (saved.length) parts.push(`Pasted into ${plural(saved.length, 'cell')}. Undo reverts it.`)
  else if (!skipped.length && !outside) parts.push('Nothing changed: the cells already hold this.')
  if (skipped.length) parts.push(`Skipped ${skipped.join('; ')}.`)
  if (outside) parts.push(`${plural(outside, 'copied cell')} fell outside the grid.`)
  return { days: saved, status: parts.join(' ') }
}
