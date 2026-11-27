import { dayOf, type Chip } from '../schedule/data'
import type { CalendarEvent } from '../calendar/events'

/* ------------------------------------------------------------------ */
/* Attachments: tags, assets, tasks and a note on one assignment (block) */
/* ------------------------------------------------------------------ */

/** A tag or an asset: a value picked from a category ("Vehicle" › "Car 4417"). Custom tags have the category `Custom`. */
export interface AttachmentPick {
  id: string
  category: string
  value: string
}

/** A task from the calendar's task form, plus its recurrence ("Every week"; missing = none) */
export type AttachedTask = CalendarEvent & { recurrence?: string }

export interface Attachments {
  tags: AttachmentPick[]
  assets: AttachmentPick[]
  tasks: AttachedTask[]
  /** One note per assignment, saved when the scheduler leaves the field. Empty: no note. */
  note: string
}

/** A block (one grid cell) with its attachments. Copies made in assign mode don't take them along. */
export type WorkforceChip = Chip & { attachments?: Attachments }

export const noAttachments: Attachments = { tags: [], assets: [], tasks: [], note: '' }

export const attachmentsOf = (chip: Chip | null | undefined): Attachments => (chip as WorkforceChip | null | undefined)?.attachments ?? noAttachments

/** Tags, assets, tasks and the note together: the Attachments tab's count */
export const attachmentCount = (attachments: Attachments) =>
  attachments.tags.length + attachments.assets.length + attachments.tasks.length + (attachments.note.trim() ? 1 : 0)

/** "2 tags, 1 asset and a note" for a cell's label, or null when there's nothing */
export function attachmentSummary(attachments: Attachments | undefined): string | null {
  if (!attachments || !attachmentCount(attachments)) return null
  const count = (n: number, word: string) => (n ? [`${n} ${word}${n === 1 ? '' : 's'}`] : [])
  const parts = [
    ...count(attachments.tags.length, 'tag'),
    ...count(attachments.assets.length, 'asset'),
    ...count(attachments.tasks.length, 'task'),
    ...(attachments.note.trim() ? ['a note'] : []),
  ]
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0]
}

/** Several blocks' attachments as one (when blocks join) */
export function mergeAttachments(list: Attachments[]): Attachments | undefined {
  const filled = list.filter((item) => attachmentCount(item) > 0)
  if (filled.length <= 1) return filled[0]
  const unique = <T extends { id: string }>(items: T[]) => items.filter((item, index) => items.findIndex((other) => other.id === item.id) === index)
  return {
    tags: unique(filled.flatMap((item) => item.tags)),
    assets: unique(filled.flatMap((item) => item.assets)),
    tasks: unique(filled.flatMap((item) => item.tasks)),
    note: filled.map((item) => item.note.trim()).filter(Boolean).join('\n\n'),
  }
}

/** The category tags use for free text */
export const CUSTOM_CATEGORY = 'Custom'

/** Tag values by category. Tags label the assignment; "Custom…" adds free text. */
export const tagCategories: Record<string, string[]> = {
  Vehicle: ['Lambo 05', 'Car 4417', 'Marked car', 'Unmarked car', 'Motorcycle'],
  Radio: ['Channel 3 - Dispatch', 'Channel 5 - Precinct', 'Channel 7 - Tactical'],
  'Court file': ['#PKXD393', '#PKXD402', '#QRTB118', '#QRTB131'],
}

/** Asset inventory by category. Assets come from the inventory only (no free text). */
export const assetCategories: Record<string, string[]> = {
  Vehicle: ['Car 4417', 'Car 4420', 'Car 4431', 'Van 12', 'Engine 12'],
  Radio: ['R-208', 'R-211', 'R-215', 'R-230'],
  'Body camera': ['BWC-0193', 'BWC-0207', 'BWC-0218'],
  'Breath tester': ['BT-04', 'BT-07'],
}

/* ------------------------------------------------------------------ */
/* Mock attachments on a few cells of the week of Jun 1–7               */
/* ------------------------------------------------------------------ */

const pick = (id: string, category: string, value: string): AttachmentPick => ({ id, category, value })

/** B. Haddad, Fri Jun 5: a car, a radio, a body camera, a task and a note */
export const haddadFriday: Attachments = {
  tags: [pick('t1', 'Vehicle', 'Marked car'), pick('t2', 'Radio', 'Channel 5 - Precinct')],
  assets: [pick('a1', 'Vehicle', 'Car 4417'), pick('a2', 'Radio', 'R-208'), pick('a3', 'Body camera', 'BWC-0193')],
  tasks: [{ id: 'k1', day: dayOf(2026, 6, 5), title: 'Return radio to the desk', kind: 'task', start: 16, reminders: [{ when: 'Day of event' }] }],
  note: 'Covering Sector C until 10:00 while Patrol D4 is at the Barclays detail. Car 4417 is back from service: check the light bar before roll call.',
}

/** A court date's file and note, set by the court with the assignment */
export const courtDate = (file: string, note: string): Attachments => ({
  tags: [pick(`c-${file}`, 'Court file', file)],
  assets: [],
  tasks: [],
  note,
})
