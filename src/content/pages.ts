import { lazy } from 'react'
import {
  Accessibility, BookOpen, Box, CalendarClock, CalendarDays, CalendarRange, Clock, Code, Download, Eye, FileClock, FormInput, Keyboard, Layers,
  LayoutGrid, ListCheck, MessageSquareWarning, MousePointerClick, Palette, PanelLeft, Shapes, Sparkles, Table, Tag, Type, Users, MapPin, Grid3x3,
} from 'lucide-react'
import type { PageDef, PageGroup } from './types'
import { isHiddenSection } from './flags'

export const pageGroups: PageGroup[] = ['Getting started', 'Foundations', 'Components', 'Patterns', 'Resources', 'Work in Progress']

/** Sections in page order. A third item `'group'` marks a group heading; the sections after it belong to it. */
const s = (...items: ([string, string] | [string, string, 'group'])[]) =>
  items.filter(([id]) => !isHiddenSection(id)).map(([id, title, group]) => (group ? { id, title, group: true } : { id, title }))

/** Single registry that drives the sidebar, search, TOC, overview cards and prev/next links. */
export const pages: PageDef[] = [
  {
    path: '/', title: 'Overview', group: 'Getting started', icon: BookOpen, status: 'confirmed', updated: '2026-11-12',
    description: 'What this guide is, how to use it, and how values move from Draft to Confirmed.',
    keywords: ['home', 'intro', 'start', 'status legend'],
    sections: s(['purpose', 'Purpose'], ['status-legend', 'Status legend'], ['recent-changes', 'Recent changes']),
    component: lazy(() => import('../pages/Overview')),
  },
  // Foundations
  {
    path: '/foundations/colors', title: 'Colors', group: 'Foundations', icon: Palette, status: 'confirmed', updated: '2026-11-24',
    description: 'Color helps to express hierarchy, establish brand identity, give meaning, and indicate element states.',
    keywords: ['palette', 'hex', 'shift cell', 'soft', 'base', 'deep', 'activity', 'overtime', 'pending', 'theme', 'dark', 'light', 'color-blind', 'surface', 'background', 'text', 'border', 'cta', 'success', 'warning', 'error', 'info', 'contrast'],
    sections: s(['themes', 'Themes'], ['main-ui', 'Main UI colors'], ['signalling', 'Signalling colors'], ['in-context', 'Signalling colors with example'], ['text', 'Text'], ['borders', 'Borders'], ['grays', 'Gray scale & neutrals'], ['primitives', 'Primitive palettes'], ['all-tokens', 'All color tokens'], ['cell-colors', 'Shift cell colors']),
    component: lazy(() => import('../pages/foundations/Colors')),
  },
  {
    path: '/foundations/typography', title: 'Typography', group: 'Foundations', icon: Type, status: 'confirmed', updated: '2026-11-12',
    description: 'Roboto and Cousine, the heading and body type scales, and rules for times and numbers.',
    keywords: ['font', 'roboto', 'cousine', 'mono', 'heading', 'body', 'text', 'type scale', 'numbers', 'time format'],
    sections: s(['families', 'Font families'], ['heading-scale', 'Heading type scale'], ['body-scale', 'Body type scale'], ['numerals', 'Numbers & time'], ['usage', 'Usage in code']),
    component: lazy(() => import('../pages/foundations/Typography')),
  },
  {
    path: '/foundations/icons', title: 'Icons', group: 'Foundations', icon: Shapes, status: 'confirmed', updated: '2026-11-12',
    description: 'Curated Lucide icon set, sizes, stroke and accessibility rules.',
    keywords: ['lucide', 'svg', 'glyph', 'symbol'],
    sections: s(['library', 'Icon library'], ['sizing', 'Size & stroke'], ['accessibility', 'Accessibility'], ['usage', 'Usage in code']),
    component: lazy(() => import('../pages/foundations/Icons')),
  },
  {
    path: '/foundations/spacing-layout', title: 'Spacing & Layout', group: 'Foundations', icon: LayoutGrid, status: 'confirmed', updated: '2026-11-12',
    description: 'Spacing scale, breakpoints, grid and app shell dimensions.',
    keywords: ['padding', 'margin', 'gap', 'grid', 'breakpoint', 'responsive', 'container'],
    sections: s(['spacing', 'Spacing scale'], ['breakpoints', 'Breakpoints'], ['layout', 'App shell dimensions'], ['grid', 'Grid & containers']),
    component: lazy(() => import('../pages/foundations/SpacingLayout')),
  },
  {
    path: '/foundations/radius-elevation', title: 'Radius & Elevation', group: 'Foundations', icon: Layers, status: 'confirmed', updated: '2026-11-12',
    description: 'Corner radii, shadows on dark surfaces and z-index layers.',
    keywords: ['border radius', 'shadow', 'depth', 'z-index', 'layer'],
    sections: s(['radius', 'Radius'], ['elevation', 'Elevation'], ['z-index', 'Z-index layers']),
    component: lazy(() => import('../pages/foundations/RadiusElevation')),
  },
  {
    path: '/foundations/motion', title: 'Motion', group: 'Foundations', icon: Sparkles, status: 'confirmed', updated: '2026-11-12',
    description: 'Durations, easing curves and reduced-motion behavior.',
    keywords: ['animation', 'transition', 'easing', 'duration', 'reduced motion'],
    sections: s(['durations', 'Durations'], ['easing', 'Easing'], ['reduced-motion', 'Reduced motion']),
    component: lazy(() => import('../pages/foundations/Motion')),
  },
  // Components
  {
    path: '/components/buttons', title: 'Buttons', group: 'Components', icon: MousePointerClick, status: 'confirmed', updated: '2026-11-12',
    description: 'Button variants, sizes, icon buttons and states.',
    keywords: ['cta', 'action', 'action icon', 'destructive', 'loading'],
    sections: s(['variants', 'Variants'], ['sizes', 'Sizes'], ['icon-buttons', 'Icon buttons'], ['states', 'States'], ['guidelines', 'Guidelines'], ['figma', 'Figma reference']),
    component: lazy(() => import('../pages/components/Buttons')),
  },
  {
    path: '/components/forms', title: 'Forms', group: 'Components', icon: FormInput, status: 'confirmed', updated: '2026-11-12',
    description: 'Inputs, selection controls, date & time fields and validation.',
    keywords: ['input', 'select', 'checkbox', 'radio', 'switch', 'validation', 'date', 'time', 'field'],
    sections: s(['text-inputs', 'Text inputs'], ['selection', 'Selection controls'], ['date-time', 'Date & time'], ['validation', 'Validation'], ['layout', 'Form layout'], ['figma', 'Figma reference']),
    component: lazy(() => import('../pages/components/Forms')),
  },
  {
    path: '/components/data-tables', title: 'Data Tables', group: 'Components', icon: Table, status: 'draft', updated: '2026-11-12', hidden: true,
    description: 'Roster tables, density, sorting and row states.',
    keywords: ['table', 'roster', 'grid', 'list', 'sort', 'personnel'],
    sections: s(['roster', 'Roster table'], ['density', 'Density'], ['row-states', 'Row states'], ['guidelines', 'Guidelines'], ['figma', 'Figma reference']),
    component: lazy(() => import('../pages/components/DataTables')),
  },
  {
    path: '/components/shift-cells', title: 'Calendar & Shift Cells', group: 'Components', icon: CalendarRange, status: 'draft', updated: '2026-11-12', hidden: true,
    description: 'Shift blocks and calendar day cells used across schedule views.',
    keywords: ['calendar', 'shift', 'block', 'event', 'day cell', 'assignment'],
    sections: s(['shift-block', 'Shift block'], ['day-cell', 'Day cell'], ['variants', 'Variants'], ['guidelines', 'Guidelines'], ['figma', 'Figma reference']),
    component: lazy(() => import('../pages/components/ShiftCells')),
  },
  {
    path: '/components/status-badges', title: 'Status Badges', group: 'Components', icon: Tag, status: 'confirmed', updated: '2026-11-18',
    description: 'Request and sign-up status badges and counters.',
    keywords: ['badge', 'tag', 'chip', 'pill', 'overtime', 'on duty', 'leave', 'sick', 'conflict', 'open shift'],
    sections: s(['shift-states', 'Status badges'], ['outline-dot', 'Outline & dot badges'], ['counts', 'Counts & indicators'], ['guidelines', 'Guidelines'], ['figma', 'Figma reference']),
    component: lazy(() => import('../pages/components/StatusBadges')),
  },
  {
    path: '/components/feedback', title: 'Feedback', group: 'Components', icon: MessageSquareWarning, status: 'confirmed', updated: '2026-11-18',
    description: 'Alerts, notifications, confirmation modals and tooltips.',
    keywords: ['alert', 'toast', 'notification', 'modal', 'dialog', 'confirm', 'tooltip'],
    sections: s(['alerts', 'Alerts'], ['notifications', 'Notifications'], ['modals', 'Modals & confirmation'], ['tooltips', 'Tooltips'], ['figma', 'Figma reference']),
    component: lazy(() => import('../pages/components/Feedback')),
  },
  // Patterns
  {
    path: '/patterns/navigation', title: 'Navigation', group: 'Patterns', icon: PanelLeft, status: 'confirmed', updated: '2026-11-13',
    description: 'The main navigation: four role-based variants, a collapsed rail, and pinned or overlay behavior.',
    keywords: ['sidebar', 'menu', 'nav', 'rail', 'collapse', 'pin', 'overlay', 'role', 'acting as', 'switcher', 'permissions', 'tooltip', 'badge'],
    sections: s(['variants', 'Variants'], ['switchers', 'Role and unit switchers'], ['collapsed', 'Collapsed rail'], ['pinning', 'Pinned and overlay'], ['component', 'Using the component'], ['tokens', 'CSS variables'], ['guidelines', 'Guidelines'], ['figma', 'Figma reference']),
    component: lazy(() => import('../pages/patterns/Navigation')),
  },
  {
    path: '/patterns/team-view', title: 'Team View', group: 'Patterns', icon: Users, status: 'confirmed', updated: '2026-11-24',
    description: 'The team schedule by unit: members down the side, days across, with coverage under each team. One to four weeks on desktop, a day or a week on mobile.',
    keywords: ['schedule', 'roster', 'grid', 'unit', 'week', 'month', 'two weeks', 'three weeks', 'day view', 'mobile', 'coverage', 'bodies', 'hours', 'time of day', 'overtime', 'OT', 'out of unit', 'OU', 'sick', 'PTO', 'leave', 'cancelled', 'shift code', 'co-worker search', 'drawer', 'bottom sheet', 'employee details', 'profile', 'contact', 'required', 'scheduled', 'hourly', 'extra row', 'overflow', 'additional assignment', 'outside block', 'block', 'expired', 'expiry', 'inactive', 'terminated', 'contract end', 'left agency', 'hatch', 'stripes', 'pattern', 'diagonal', 'split', 'copy css'],
    sections: s(['desktop', 'Desktop'], ['ranges', 'Date ranges'], ['cells', 'Shift cells'], ['extra-rows', 'Extra rows'], ['expired', 'Inactive employees'], ['coverage', 'Coverage'], ['coverage-drawer', 'Coverage drawer'], ['details', 'Employee details'], ['mobile', 'Mobile'], ['component', 'Using the components'], ['tokens', 'CSS variables'], ['patterns', 'Cell patterns'], ['guidelines', 'Guidelines'], ['figma', 'Figma reference']),
    component: lazy(() => import('../pages/patterns/TeamView')),
  },
  {
    path: '/patterns/location-view', title: 'Location View', group: 'Patterns', icon: MapPin, status: 'confirmed', updated: '2026-11-20',
    description: 'The schedule by location: posts down the side with one line per position, people in the cells, and coverage above each location.',
    keywords: ['location', 'site', 'post', 'position', 'open position', 'breadcrumb', 'paid duty', 'event', 'coverage alert', 'shortfall', 'notification', 'toast', 'day view', 'mobile', 'schedule'],
    sections: s(['desktop', 'Desktop'], ['posts', 'Posts and positions'], ['locations', 'Location headers'], ['coverage', 'Coverage'], ['coverage-drawer', 'Coverage drawer'], ['mobile', 'Mobile'], ['coverage-alert', 'Coverage alert'], ['component', 'Using the components'], ['guidelines', 'Guidelines'], ['figma', 'Figma reference']),
    component: lazy(() => import('../pages/patterns/LocationView')),
  },
  {
    path: '/patterns/workforce-scheduling', title: 'Work Scheduling', group: 'Work in Progress', icon: Grid3x3, status: 'confirmed', updated: '2026-11-25',
    description: 'The scheduler’s grid: open shifts, watches with their staffing, and people’s shifts. Select cells like in a spreadsheet and edit them in a panel beside the grid.',
    keywords: ['work scheduling', 'workforce scheduling', 'workforce', 'scheduling', 'scheduler', 'grid', 'select', 'multi-select', 'range', 'drag', 'spreadsheet', 'excel', 'bulk edit', 'assign', 'open shift', 'live shift', 'watch', 'day', 'swing', 'night', 'staffing', 'supervisors', 'details panel', 'editing', 'new activity', 'segment', 'assignment', 'autosave', 'undo', 'typing times', 'time entry', '24-hour', 'time format', 'actual times', 'bank time', 'leave', 'partial leave', 'sick', 'all day', 'out of unit', 'out of branch', 'another precinct', 'read-only', 'density', 'detailed', 'compact', 'stacked', 'day view', 'responsive', 'screen size', 'resolution', 'mini', 'column width', 'fit to width', 'horizontal scroll'],
    sections: s(
      ['desktop', 'Desktop'],
      ['the-grid', 'The grid', 'group'], ['selection', 'Selecting cells'], ['rows', 'Groups and staffing'], ['views', 'Views and densities'], ['sizing', 'Sizing for screens'],
      ['the-panel', 'The details panel', 'group'], ['panel', 'What it shows'], ['assignments', 'Assignments and segments'], ['editing', 'Editing and saving'], ['times', 'Typing times'], ['leave', 'Adding leave'], ['elsewhere', 'Out of unit and branch'],
      ['reference', 'Reference', 'group'], ['component', 'Using the components'], ['tokens', 'CSS variables'], ['guidelines', 'Guidelines'], ['figma', 'Figma reference'],
    ),
    component: lazy(() => import('../pages/patterns/WorkforceScheduling')),
  },
  {
    path: '/patterns/calendar', title: 'Calendar', group: 'Patterns', icon: CalendarDays, status: 'confirmed', updated: '2026-11-24',
    description: 'An employee’s own calendar in month, week, day and agenda views, with event details, sign-ups and adding tasks.',
    keywords: ['calendar', 'month', 'week', 'day', 'agenda', 'event', 'task', 'reminder', 'leave', 'vacation', 'pending', 'overtime', 'holiday', 'sign-ups', 'all-day', 'current time', 'legend', 'add task', 'mobile'],
    sections: s(['desktop', 'Desktop'], ['views', 'Views'], ['events', 'Event types'], ['details', 'Event details'], ['add-task', 'Adding a task'], ['mobile', 'Mobile'], ['component', 'Using the components'], ['tokens', 'CSS variables'], ['guidelines', 'Guidelines'], ['figma', 'Figma reference']),
    component: lazy(() => import('../pages/patterns/Calendar')),
  },
  {
    path: '/patterns/day-details', title: 'Day Details', group: 'Patterns', icon: CalendarClock, status: 'confirmed', updated: '2026-11-13',
    description: 'One person’s day on a timeline, opened from a shift cell, and how leave takes precedence over the activities it overlaps.',
    keywords: ['day view', 'day details', 'modal', 'timeline', 'leave', 'vacation', 'overlap', 'overlapping activity', 'precedence', 'all-day leave', 'on leave', 'replaces', 'shift cell', 'mobile', 'full screen'],
    sections: s(['back-to-back', 'Back-to-back activities'], ['partial-leave', 'Leave on one activity'], ['all-day-leave', 'All-day leave'], ['rules', 'Precedence rules'], ['component', 'Using the component'], ['guidelines', 'Guidelines'], ['figma', 'Figma reference']),
    component: lazy(() => import('../pages/patterns/DayDetails')),
  },
  {
    path: '/patterns/approvals', title: 'Approvals', group: 'Patterns', icon: ListCheck, status: 'confirmed', updated: '2026-11-23',
    description: 'How schedulers approve timesheets, leave, trades and activity: a list, the open request and a resizable action panel, with multi-select and a phone layout.',
    keywords: ['approvals', 'approve', 'reject', 'clear status', 'timesheet', 'unsubmitted', 'submit', 'leave', 'trade', 'activity', 'hold over', 'overtime', 'multi-select', 'bulk', 'select all', 'required approvals', 'approval level', 'scheduler note', 'alerts', 'prevent', 'warnings', 'payout', 'comp time', 'visibility', 'sort', 'splitter', 'resize', 'panel', 'bottom sheet', 'mobile'],
    sections: s(['desktop', 'Desktop'], ['types', 'Request types'], ['statuses', 'Statuses and actions'], ['required-approvals', 'Required approvals'], ['visibility', 'Visibility and sort'], ['mobile', 'Mobile'], ['component', 'Using the components'], ['guidelines', 'Guidelines'], ['figma', 'Figma reference']),
    component: lazy(() => import('../pages/patterns/Approvals')),
  },
  {
    path: '/patterns/keyboard-shortcuts', title: 'Keyboard Shortcuts', group: 'Patterns', icon: Keyboard, status: 'confirmed', updated: '2026-11-23',
    description: 'How power users discover, change and turn off keyboard shortcuts, from a quick panel and a modal in Preferences.',
    keywords: ['keyboard', 'shortcut', 'shortcuts', 'hotkey', 'keybinding', 'remap', 'rebind', 'key', 'kbd', 'preferences', 'settings', 'power user', 'wcag 2.1.4', 'character key', 'aria-keyshortcuts', 'cheat sheet', 'quick reference', 'panel', 'help', 'touch', 'ctrl', 'cmd', 'command'],
    sections: s(['modal', 'Shortcuts modal and panel'], ['changing', 'Changing a shortcut'], ['allowed-keys', 'Allowed keys'], ['entry-points', 'Where to find it'], ['revealing', 'Showing shortcuts'], ['defaults', 'Default shortcuts'], ['component', 'Using the components'], ['figma', 'Figma reference']),
    component: lazy(() => import('../pages/patterns/KeyboardShortcuts')),
  },
  {
    path: '/patterns/schedule-views', title: 'Schedule Views', group: 'Patterns', icon: Clock, status: 'draft', updated: '2026-11-12', hidden: true,
    description: 'Day, week and month schedule layouts and shift swap requests.',
    keywords: ['day view', 'week view', 'month view', 'calendar', 'swap', 'trade', 'roster'],
    sections: s(['day', 'Day view'], ['week', 'Week view'], ['month', 'Month view'], ['swap-request', 'Shift swap request'], ['figma', 'Figma reference']),
    component: lazy(() => import('../pages/patterns/ScheduleViews')),
  },
  {
    path: '/patterns/states', title: 'Empty & Loading States', group: 'Patterns', icon: Box, status: 'confirmed', updated: '2026-11-12',
    description: 'Empty, loading, error and no-permission states.',
    keywords: ['empty', 'skeleton', 'loader', 'error', 'permission', 'zero state'],
    sections: s(['empty', 'Empty'], ['loading', 'Loading'], ['error', 'Error'], ['permission', 'No permission']),
    component: lazy(() => import('../pages/patterns/States')),
  },
  // Resources
  {
    path: '/resources/accessibility', title: 'Accessibility', group: 'Resources', icon: Accessibility, status: 'confirmed', updated: '2026-11-12',
    description: 'Contrast, focus, keyboard and field-use requirements.',
    keywords: ['a11y', 'wcag', 'contrast', 'focus', 'keyboard', 'screen reader', 'touch target'],
    sections: s(['contrast', 'Contrast'], ['focus', 'Focus states'], ['keyboard', 'Keyboard'], ['color-independence', 'Beyond color'], ['touch-targets', 'Touch targets']),
    component: lazy(() => import('../pages/resources/AccessibilityPage')),
  },
  {
    path: '/resources/color-vision', title: 'Color Vision', group: 'Resources', icon: Eye, status: 'confirmed', updated: '2026-11-16',
    description: 'How Team View, Location View and Calendar work for people who are color blind.',
    keywords: ['color blind', 'colour blind', 'cvd', 'deuteranopia', 'protanopia', 'patterns', 'agency colors', 'wcag 1.4.1'],
    sections: s(['approach', 'Approach'], ['settings', 'Settings'], ['agency-colors', 'Agency colors'], ['cues', 'Cues beyond color'], ['team-view', 'Team View'], ['calendar', 'Calendar'], ['simulation', 'Side by side'], ['developers', 'For developers'], ['guidelines', 'Guidelines']),
    component: lazy(() => import('../pages/resources/ColorVision')),
  },
  {
    path: '/resources/tokens', title: 'Tokens & Code', group: 'Resources', icon: Code, status: 'draft', updated: '2026-11-12', hidden: true,
    description: 'Theme export, CSS variables and naming conventions.',
    keywords: ['theme', 'css variables', 'export', 'mantine', 'developer', 'naming'],
    sections: s(['theme', 'Mantine theme'], ['css-variables', 'CSS variables'], ['naming', 'Naming conventions']),
    component: lazy(() => import('../pages/resources/TokensCode')),
  },
  {
    path: '/resources/theme-export', title: 'Theme Export', group: 'Resources', icon: Download, status: 'confirmed', updated: '2026-11-17',
    description: 'Copy or download the six InTime themes as a Mantine theme and CSS variables.',
    keywords: ['export', 'download', 'mantine', 'css', 'theme.ts', 'dusk', 'miami vice', 'terra', 'candy', 'dark', 'light', 'data-intime-theme', 'developer'],
    sections: s(['files', 'Files'], ['themes', 'Themes'], ['css', 'Theme CSS'], ['theme-ts', 'Mantine theme'], ['switching', 'Switching themes'], ['mapping', 'Mantine mapping']),
    component: lazy(() => import('../pages/resources/ThemeExport')),
  },
  {
    path: '/resources/changelog', title: 'Changelog', group: 'Resources', icon: FileClock, status: 'confirmed', updated: '2026-11-13',
    description: 'History of guide updates and how to submit Figma frames.',
    keywords: ['history', 'updates', 'release', 'figma frames', 'submit'],
    sections: s(['entries', 'Updates'], ['submitting-frames', 'Submitting Figma frames']),
    component: lazy(() => import('../pages/resources/Changelog')),
  },
]

/** Pages shown in navigation, search and links. */
export const navPages = pages.filter((page) => !page.hidden)

export const findPage = (path: string) => pages.find((page) => page.path === path)

