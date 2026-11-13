import { MOCK_TODAY, dayOf, formatHeader, scheduleUnits, type ScheduleMember } from './data'

/* ------------------------------------------------------------------ */
/* Employee details for Team View members. Mock data only.             */
/* ------------------------------------------------------------------ */

export interface EmployeeProfile {
  id: string
  first: string
  last: string
  initials: string
  rank: string
  /** e.g. "Patrol Alpha, Day Patrol" */
  team: string
  /** Day number (see data.ts) */
  firstEmployed: number
  email: string
  mobile: string
  employeeId: string
}

const firstNames: Record<string, string> = {
  rr: 'Ronald', gt: 'Gabriel', em: 'Elena', sp: 'Sanna', fd: 'Freya', eh: 'Esther', pz: 'Paulina', ct: 'Chen',
  db: 'Daan', ai: 'Amira', lb: 'Lucas', mc: 'Maya', rh: 'Rosa', am: 'Adam',
  nl: 'Kasper', sz: 'Hana', vb: 'Tess', os: 'Kwame', fr: 'Brendan',
  ms: 'Ama', rz: 'Lucia', vg: 'Jonas', kh: 'Sana', vs: 'Maarten',
}

const yearsByRank: Record<string, number> = { Lieutenant: 24, Sergeant: 16, Detective: 11, Officer: 4 }

/** Profile for a member, looked up across all units. */
export function memberProfile(memberId: string): EmployeeProfile | null {
  let index = 0
  for (const unit of scheduleUnits) {
    for (const group of unit.groups) {
      for (const member of group.members) {
        index += 1
        if (member.id === memberId) return build(member, `${group.title}, ${unit.label}`, index)
      }
    }
  }
  return null
}

function build(member: ScheduleMember, team: string, index: number): EmployeeProfile {
  const first = firstNames[member.id] ?? member.initials[0]
  const years = (yearsByRank[member.rank] ?? 6) + (index % 5)
  return {
    id: member.id,
    first,
    last: member.name,
    initials: member.initials,
    rank: member.rank,
    team,
    firstEmployed: dayOf(2026 - years, ((index * 5) % 12) + 1, ((index * 7) % 27) + 1),
    email: `${first[0].toLowerCase()}.${member.name.toLowerCase()}@99precinct.example`,
    mobile: `(718) 555-01${String(10 + index).padStart(2, '0')}`,
    employeeId: String(13800 + index * 37),
  }
}

/** "Tue, May 3, 1990" */
export const formatEmployed = (day: number) => `${formatHeader(day)}, ${new Date(day * 86_400_000).getUTCFullYear()}`

/** Whole years from the first day to the demo's today, e.g. "16 years of service". */
export function formatTenure(day: number, today = MOCK_TODAY) {
  const from = new Date(day * 86_400_000)
  const to = new Date(today * 86_400_000)
  const years = to.getUTCFullYear() - from.getUTCFullYear() - (to.getUTCMonth() * 31 + to.getUTCDate() < from.getUTCMonth() * 31 + from.getUTCDate() ? 1 : 0)
  return years < 1 ? 'Less than a year of service' : `${years} ${years === 1 ? 'year' : 'years'} of service`
}
