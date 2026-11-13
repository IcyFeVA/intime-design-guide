import type { LucideIcon } from 'lucide-react'
import {
  BadgeCheck,
  CalendarClock,
  CircleSlash,
  Clock3,
  GraduationCap,
  HeartPulse,
  TreePalm,
  TriangleAlert,
  UserPlus,
} from 'lucide-react'
import type { TokenStatus } from './types'

export interface ShiftState {
  key: string
  label: string
  /** Mantine color key */
  color: string
  icon: LucideIcon
  meaning: string
  status: TokenStatus
}

/** Shift / duty states. Always render with icon + label, never color alone. */
export const shiftStates: ShiftState[] = [
  { key: 'on-duty', label: 'On duty', color: 'green', icon: BadgeCheck, meaning: 'Member is currently working an active shift.', status: 'draft' },
  { key: 'scheduled', label: 'Scheduled', color: 'intime', icon: CalendarClock, meaning: 'Assigned to a future shift; not yet started.', status: 'draft' },
  { key: 'overtime', label: 'Overtime', color: 'orange', icon: Clock3, meaning: 'Hours beyond the regular schedule, subject to OT rules.', status: 'draft' },
  { key: 'open', label: 'Open shift', color: 'yellow', icon: UserPlus, meaning: 'Unfilled slot that needs coverage.', status: 'draft' },
  { key: 'leave', label: 'Leave / PTO', color: 'violet', icon: TreePalm, meaning: 'Approved vacation or personal leave.', status: 'draft' },
  { key: 'sick', label: 'Sick', color: 'pink', icon: HeartPulse, meaning: 'Sick leave; may trigger a coverage request.', status: 'draft' },
  { key: 'training', label: 'Training', color: 'cyan', icon: GraduationCap, meaning: 'Assigned to training, academy or certification.', status: 'draft' },
  { key: 'conflict', label: 'Conflict', color: 'red', icon: TriangleAlert, meaning: 'Double booking, rest-period or rule violation.', status: 'draft' },
  { key: 'off', label: 'Off', color: 'gray', icon: CircleSlash, meaning: 'Regular day off; not available.', status: 'draft' },
]

export const departments = [
  { key: 'police', label: 'Police', color: 'police', example: 'Patrol · District 4' },
  { key: 'fire', label: 'Fire', color: 'fire', example: 'Engine 12 · Station 3' },
] as const
