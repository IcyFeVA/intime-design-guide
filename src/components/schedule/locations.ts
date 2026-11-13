import { coverage, dayOf, type Chip, type DayCoverage } from './data'

/* ------------------------------------------------------------------ */
/* Location View mock data. Rows are posts; cells are the people on them. */
/* ------------------------------------------------------------------ */

export interface Person {
  id: string
  first: string
  last: string
}

export interface Post {
  id: string
  name: string
  /** Hours; an end above 24 runs past midnight */
  start: number
  end: number
  /** People needed on the post. One line per position. */
  positions: number
  /** Cells per position for a day */
  assignments: (day: number) => (Chip | null)[]
}

export interface ScheduleLocation {
  id: string
  /** Breadcrumb from the site down, e.g. ['Convention Centre', 'North', 'Entrances', 'A'] */
  path: string[]
  site: string
  posts: Post[]
  coverage: (day: number) => DayCoverage
}

const people: Person[] = [
  ['Scottie', 'Pippen'], ['Chris', 'Webber'], ['Patrick', 'Ewing'], ['Pat', 'Riley'], ['Karl', 'Malone'], ['Clyde', 'Drexler'],
  ['Steve', 'Kerr'], ['Tyrone', 'Bouges'], ['Penny', 'Hardaway'], ['Luc', 'Longley'], ['Ronald', 'Richards'], ['David', 'Nielsen'],
  ['Mei', 'Suzuki'], ['Ama', 'Mensah'], ['Lucia', 'Ramirez'], ['Jonas', 'Vogel'], ['Sana', 'Khan'], ['Maarten', 'Visser'],
].map(([first, last]) => ({ id: last.toLowerCase(), first, last }))

const personByLast = (last: string) => people.find((person) => person.last === last)!
export const fullName = (person: Person) => `${person.first} ${person.last}`
export const personForChip = (chip: Chip) => people.find((person) => person.last === chip.segments[0]?.label)

function rand(seed: number) {
  let x = Math.imul(seed ^ 0x27d4eb2f, 0x165667b1)
  x ^= x >>> 15
  x = Math.imul(x, 0x85ebca77)
  x ^= x >>> 13
  return (x >>> 0) / 4_294_967_296
}

type Extra = Partial<Pick<Chip, 'outOfUnit' | 'partialKind'>> & { overtime?: 'full'; cancelled?: boolean }

const assign = (post: Pick<Post, 'name' | 'start' | 'end'>, person: Person, extra: Extra = {}): Chip => ({
  segments: [{ code: post.name, label: person.last, start: post.start, end: post.end, overtime: extra.overtime, cancelled: extra.cancelled }],
  outOfUnit: extra.outOfUnit,
  partialKind: extra.partialKind,
})

/** Fills about a third of the positions, with the odd leave, overtime, cancellation or out-of-unit shift. */
function generated(seed: number, post: Pick<Post, 'name' | 'start' | 'end' | 'positions'>, fill = 0.32) {
  return (day: number) => Array.from({ length: post.positions }, (_, position) => {
    const r = rand(seed * 977 + position * 131 + day)
    if (r > fill) return null
    const person = people[Math.floor(rand(seed + day * 7 + position) * people.length)]
    const v = rand(seed * 3 + day * 11 + position)
    const extra: Extra = v < 0.06 ? { partialKind: 'leave' } : v < 0.11 ? { overtime: 'full' } : v < 0.14 ? { cancelled: true } : v < 0.17 ? { outOfUnit: true } : {}
    return assign(post, person, extra)
  })
}

/** Hand-made week of Jun 1–7, 2026 (matches the Figma frame); generated before and after. */
function curated(seed: number, post: Pick<Post, 'name' | 'start' | 'end' | 'positions'>, week: Record<number, [string, Extra?]>) {
  const fallback = generated(seed, post)
  const first = dayOf(2026, 6, 1)
  return (day: number) => {
    const index = day - first
    if (index < 0 || index > 6) return fallback(day)
    const entry = week[index]
    return [entry ? assign(post, personByLast(entry[0]), entry[1]) : null]
  }
}

let postSeed = 0
const post = (name: string, start: number, end: number, positions = 1, week?: Record<number, [string, Extra?]>): Post => {
  const base = { name, start, end, positions }
  postSeed += 1
  return { id: `${name}-${postSeed}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'), ...base, assignments: week ? curated(postSeed, base, week) : generated(postSeed, base) }
}

const location = (site: string, path: string[], posts: Post[], seed: number): ScheduleLocation =>
  ({ id: path.join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-'), site, path, posts, coverage: coverage(seed) })

export const scheduleLocations: ScheduleLocation[] = [
  location('convention-centre', ['Convention Centre'], [
    post('Special Event', 6, 17, 1, { 2: ['Pippen'], 5: ['Webber'] }),
    post('Extra Patrol', 6, 15, 1, { 3: ['Ewing'], 5: ['Riley', { partialKind: 'leave' }] }),
  ], 0),
  location('convention-centre', ['Convention Centre', 'North', 'Entrances', 'A'], [
    post('Extra Patrol', 6, 15, 1, { 3: ['Malone'], 4: ['Drexler'] }),
    post('Patrol Swing', 6, 17, 1, { 3: ['Kerr'] }),
  ], 10),
  location('convention-centre', ['Convention Centre', 'North', 'Entrances', 'B'], [
    post('Patrol Swing', 6, 15, 1, { 0: ['Bouges'], 2: ['Hardaway'] }),
    post('Patrol Swing', 6, 17, 1, { 4: ['Longley'] }),
  ], 4),
  location('stadium', ['Stadium'], [post('Event Security', 16, 23, 2), post('Traffic Control', 15, 22)], 2),
  location('stadium', ['Stadium', 'Parking Lot'], [post('Lot Patrol', 17, 23)], 6),
  location('stanley-park', ['Stanley Park', 'Aquarium'], [post('Foot Patrol', 9, 17)], 1),
  location('stanley-park', ['Stanley Park', 'Entrance'], [post('Bike Patrol', 10, 18)], 5),
  location('paid-duty', ['Chicco’s Chickeria'], [
    post('Day Shift', 6, 14), post('Night Shift', 18, 26), post('Security', 12, 14.5, 2), post('Cleanup Ticket', 22, 24.5),
  ], 3),
  location('paid-duty', ['Wanda’s Magic Wands'], [post('Security', 12, 14.5)], 7),
  location('paid-duty', ['Japadog Smith'], [post('Night Shift', 20, 28.5)], 8),
]

export const locationSites = [
  { key: 'all', label: 'All Locations' },
  { key: 'convention-centre', label: 'Convention Centre' },
  { key: 'stadium', label: 'Stadium' },
  { key: 'stanley-park', label: 'Stanley Park' },
  { key: 'paid-duty', label: 'Paid duty' },
]
