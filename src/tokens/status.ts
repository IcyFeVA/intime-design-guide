import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  BadgeCheck,
  Ban,
  CalendarClock,
  CalendarX,
  CircleCheck,
  CircleSlash,
  CircleX,
  Clock,
  Clock3,
  GraduationCap,
  HeartPulse,
  Hourglass,
  Lock,
  Send,
  TimerOff,
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

export interface RequestState {
  key: string
  label: string
  /** Tone class; colors come from the light/dark theme tokens */
  tone: 'warning' | 'success' | 'error' | 'info' | 'gray'
  /** Required. One shape per group: Waiting = hourglass or clock, Positive = check or forward arrow, Negative = a cross or a slash, Neutral = paper plane or lock. */
  icon: LucideIcon
  group: 'Waiting' | 'Positive' | 'Negative' | 'Neutral'
  meaning: string
  status: TokenStatus
}

/** Request and sign-up states (time off, shift swaps, open shifts). Icon + label always; never reuse an icon across groups. */
export const requestStates: RequestState[] = [
  { key: 'queued', label: 'Queued', tone: 'warning', icon: Hourglass, group: 'Waiting', meaning: 'Request is in line and has not been reviewed yet.', status: 'confirmed' },
  { key: 'pending', label: 'Pending', tone: 'warning', icon: Clock, group: 'Waiting', meaning: 'Waiting for a decision.', status: 'confirmed' },
  { key: 'approved', label: 'Approved', tone: 'success', icon: CircleCheck, group: 'Positive', meaning: 'Request was accepted.', status: 'confirmed' },
  { key: 'your-turn', label: 'Your Turn', tone: 'success', icon: ArrowRight, group: 'Positive', meaning: 'The member can now act, for example pick a shift.', status: 'confirmed' },
  { key: 'available', label: 'Available', tone: 'success', icon: CircleCheck, group: 'Positive', meaning: 'Open for sign-up.', status: 'confirmed' },
  { key: 'rejected', label: 'Rejected', tone: 'error', icon: CircleX, group: 'Negative', meaning: 'Request was declined.', status: 'confirmed' },
  { key: 'expired', label: 'Expired', tone: 'error', icon: TimerOff, group: 'Negative', meaning: 'The deadline passed before action was taken.', status: 'confirmed' },
  { key: 'missed', label: 'Missed', tone: 'error', icon: CalendarX, group: 'Negative', meaning: 'The member did not pick before the window closed.', status: 'confirmed' },
  { key: 'taken-down', label: 'Taken Down', tone: 'error', icon: Ban, group: 'Negative', meaning: 'Posting was withdrawn by a manager.', status: 'confirmed' },
  { key: 'submitted', label: 'Submitted', tone: 'info', icon: Send, group: 'Neutral', meaning: 'Sent successfully; no decision yet.', status: 'confirmed' },
  { key: 'closed', label: 'Closed', tone: 'gray', icon: Lock, group: 'Neutral', meaning: 'No longer accepting sign-ups.', status: 'confirmed' },
  { key: 'full', label: 'Full', tone: 'gray', icon: Lock, group: 'Neutral', meaning: 'All spots are taken.', status: 'confirmed' },
]
