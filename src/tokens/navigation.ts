import type { LucideIcon } from 'lucide-react'
import {
  BookOpen, CalendarClock, CalendarDays, DollarSign, FileText, KeyRound, LayoutDashboard, ListCheck, ListTodo,
  MessageSquare, Plug, ShieldCheck, Users,
} from 'lucide-react'
import type { TokenStatus } from './types'

export type NavRole = 'employee' | 'scheduler' | 'administrator'

export interface NavRoleDef {
  key: NavRole
  label: string
  description: string
}

/** Roles in the "Acting as" menu, in display order. */
export const navRoles: NavRoleDef[] = [
  { key: 'employee', label: 'Employee', description: 'Your shifts, requests and pay' },
  { key: 'scheduler', label: 'Scheduler', description: 'Rosters and approvals for your teams' },
  { key: 'administrator', label: 'Administrator', description: 'Org settings, users, roles, billing' },
]

export interface NavItemDef {
  key: string
  label: string
  icon: LucideIcon
  /** Pending items. Shown as a number when expanded and as a dot when collapsed. */
  count?: number
  /** Draws a divider below the item */
  dividerAfter?: boolean
}

const employeeItems: NavItemDef[] = [
  { key: 'home', label: 'Home', icon: LayoutDashboard, dividerAfter: true },
  { key: 'calendar', label: 'Calendar', icon: CalendarDays },
  { key: 'team-view', label: 'Team View', icon: Users },
  { key: 'sign-ups', label: 'Sign Ups', icon: ListTodo, count: 2 },
  { key: 'requests', label: 'Requests', icon: MessageSquare, count: 4 },
  { key: 'reports', label: 'Reports', icon: FileText },
  { key: 'resources', label: 'Resources', icon: BookOpen },
]

/** Items shown for the role the user is currently acting as. */
export const navItemsByRole: Record<NavRole, NavItemDef[]> = {
  employee: employeeItems,
  scheduler: [
    { key: 'home', label: 'Home', icon: LayoutDashboard },
    { key: 'approvals', label: 'Approvals', icon: ListCheck, count: 3, dividerAfter: true },
    { key: 'team-view', label: 'Schedule Unit view', icon: CalendarClock },
    { key: 'payroll', label: 'Payroll', icon: DollarSign },
  ],
  administrator: [
    { key: 'connectors', label: 'Connectors', icon: Plug },
    { key: 'permissions', label: 'Permissions', icon: ShieldCheck },
    { key: 'logins', label: 'Logins', icon: KeyRound },
  ],
}

export interface NavVariantDef {
  key: 'scheduler' | 'administrator' | 'employee-switcher' | 'employee-only'
  title: string
  /** Roles the signed-in user holds. More than one shows the "Acting as" switcher. */
  roles: NavRole[]
  /** Role the user is acting as in this specimen */
  acting: NavRole
  summary: string
}

const allRoles: NavRole[] = ['employee', 'scheduler', 'administrator']

export const navVariants: NavVariantDef[] = [
  { key: 'scheduler', title: 'Scheduler', roles: allRoles, acting: 'scheduler', summary: 'Acting as Scheduler. Rosters, approvals and payroll.' },
  { key: 'administrator', title: 'Administrator', roles: allRoles, acting: 'administrator', summary: 'Acting as Administrator. Org settings only.' },
  { key: 'employee-switcher', title: 'Employee (and Scheduler)', roles: allRoles, acting: 'employee', summary: 'Acting as Employee, with the role switcher still available.' },
  { key: 'employee-only', title: 'Employee only', roles: ['employee'], acting: 'employee', summary: 'The user holds no other role, so there is no switcher.' },
]

/** Example units for the unit selector. Real units come from the user's assignments. */
export const navUnits = ['99th Precinct - Brooklyn', '12th Precinct - Manhattan', 'Engine 12 - Queens']

/* ------------------------------------------------------------------ */
/* CSS variables                                                       */
/* ------------------------------------------------------------------ */

export interface NavToken {
  /** CSS custom property, including leading dashes */
  name: `--nav-${string}`
  value: string
  kind: 'size' | 'color' | 'effect' | 'motion'
  usage: string
  status: TokenStatus
}

const t = (name: NavToken['name'], value: string, kind: NavToken['kind'], usage: string): NavToken => ({ name, value, kind, usage, status: 'confirmed' })

/**
 * Navigation variables. Colors alias the theme tokens, so they follow the dark/light scheme.
 * Plain sizes are literals because spacing and radius tokens are not exposed as CSS variables.
 * `theme.ts` publishes these on `:root`, so any page can use `var(--nav-width)` and friends.
 */
export const navTokens: NavToken[] = [
  t('--nav-width', '300px', 'size', 'Expanded width, pinned or overlay.'),
  t('--nav-width-collapsed', '60px', 'size', 'Collapsed rail width. Also the space reserved while the nav is an overlay.'),
  t('--nav-item-height', '40px', 'size', 'Row height for items and switchers. Meets the minimum touch target.'),
  t('--nav-padding', '12px', 'size', 'Inner padding of the panel.'),
  t('--nav-gap', '4px', 'size', 'Space between items.'),
  t('--nav-radius', 'var(--mantine-radius-md)', 'size', 'Corner radius of items, fields and switchers.'),
  t('--nav-bg', 'var(--background-body-alt)', 'color', 'Panel background.'),
  t('--nav-border', 'var(--border-default)', 'color', 'Panel edge, dividers, switcher borders and count badges.'),
  t('--nav-field-bg', 'var(--background-default)', 'color', 'Search field and count badge background.'),
  t('--nav-hover-bg', 'var(--background-default-hover)', 'color', 'Hover background for items, switchers and icon buttons.'),
  t('--nav-text', 'var(--text-default)', 'color', 'Item labels.'),
  t('--nav-text-dimmed', 'var(--text-dimmed)', 'color', 'Chevrons, descriptions and secondary text.'),
  t('--nav-accent', 'var(--text-primary-default)', 'color', 'Active item text, switcher values and icons.'),
  t('--nav-active-bg', 'var(--background-primary-light)', 'color', 'Background of the active item.'),
  t('--nav-indicator', 'var(--background-info)', 'color', 'Dot that replaces a count badge in the collapsed rail.'),
  t('--nav-scrim', 'color-mix(in srgb, var(--neutral-black) 40%, transparent)', 'color', 'Dimming layer over the page while the nav is an overlay.'),
  t('--nav-overlay-shadow', '8px 0 24px color-mix(in srgb, var(--neutral-black) 35%, transparent)', 'effect', 'Shadow of the nav while it floats over the page.'),
  t('--nav-transition', '220ms cubic-bezier(0.2, 0, 0, 1)', 'motion', 'Width change when collapsing, expanding or pinning. Disabled for reduced motion.'),
]

export const navCssVariables: Record<string, string> = Object.fromEntries(navTokens.map((token) => [token.name, token.value]))
