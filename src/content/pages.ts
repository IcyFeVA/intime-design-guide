import { lazy } from 'react'
import {
  Accessibility, BookOpen, Box, CalendarRange, Clock, Code, FileClock, FormInput, Layers,
  LayoutGrid, MessageSquareWarning, MousePointerClick, Palette, PanelLeft, Shapes, Sparkles, Table, Tag, Type, Users, MapPin,
} from 'lucide-react'
import type { PageDef, PageGroup } from './types'

export const pageGroups: PageGroup[] = ['Getting started', 'Foundations', 'Components', 'Patterns', 'Resources']

const s = (...items: [string, string][]) => items.map(([id, title]) => ({ id, title }))

/** Single registry that drives the sidebar, search, TOC, overview cards and prev/next links. */
export const pages: PageDef[] = [
  {
    path: '/', title: 'Overview', group: 'Getting started', icon: BookOpen, status: 'draft', updated: '2026-11-12',
    description: 'What this guide is, how to use it, and how values move from Draft to Confirmed.',
    keywords: ['home', 'intro', 'start', 'status legend'],
    sections: s(['purpose', 'Purpose'], ['how-to-use', 'How to use this guide'], ['status-legend', 'Status legend'], ['pages', 'All pages'], ['recent-changes', 'Recent changes']),
    component: lazy(() => import('../pages/Overview')),
  },
  // Foundations
  {
    path: '/foundations/colors', title: 'Colors', group: 'Foundations', icon: Palette, status: 'confirmed', updated: '2026-11-12',
    description: 'Color helps to express hierarchy, establish brand identity, give meaning, and indicate element states.',
    keywords: ['palette', 'hex', 'theme', 'dark', 'light', 'color-blind', 'surface', 'background', 'text', 'border', 'cta', 'success', 'warning', 'error', 'info', 'contrast'],
    sections: s(['themes', 'Themes'], ['main-ui', 'Main UI colors'], ['signalling', 'Signalling colors'], ['in-context', 'Signalling colors with example'], ['text', 'Text'], ['borders', 'Borders'], ['grays', 'Gray scale & neutrals'], ['primitives', 'Primitive palettes'], ['all-tokens', 'All color tokens']),
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
    path: '/components/status-badges', title: 'Status Badges', group: 'Components', icon: Tag, status: 'draft', updated: '2026-11-12', hidden: true,
    description: 'Shift-state badges, department tags and counters.',
    keywords: ['badge', 'tag', 'chip', 'pill', 'overtime', 'on duty', 'leave', 'sick', 'conflict', 'open shift'],
    sections: s(['shift-states', 'Shift states'], ['departments', 'Department tags'], ['counts', 'Counts & indicators'], ['guidelines', 'Guidelines'], ['figma', 'Figma reference']),
    component: lazy(() => import('../pages/components/StatusBadges')),
  },
  {
    path: '/components/feedback', title: 'Feedback', group: 'Components', icon: MessageSquareWarning, status: 'confirmed', updated: '2026-11-12',
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
    path: '/patterns/team-view', title: 'Team View', group: 'Patterns', icon: Users, status: 'confirmed', updated: '2026-11-13',
    description: 'The team schedule by unit: members down the side, days across, with coverage under each team. One to four weeks on desktop, a day or a week on mobile.',
    keywords: ['schedule', 'roster', 'grid', 'unit', 'week', 'month', 'two weeks', 'three weeks', 'day view', 'mobile', 'coverage', 'bodies', 'hours', 'time of day', 'overtime', 'OT', 'out of unit', 'OU', 'sick', 'PTO', 'leave', 'cancelled', 'shift code', 'co-worker search'],
    sections: s(['desktop', 'Desktop'], ['ranges', 'Date ranges'], ['cells', 'Shift cells'], ['coverage', 'Coverage'], ['mobile', 'Mobile'], ['component', 'Using the components'], ['tokens', 'CSS variables'], ['guidelines', 'Guidelines'], ['figma', 'Figma reference']),
    component: lazy(() => import('../pages/patterns/TeamView')),
  },
  {
    path: '/patterns/location-view', title: 'Location View', group: 'Patterns', icon: MapPin, status: 'confirmed', updated: '2026-11-13',
    description: 'The schedule by location: posts down the side with one line per position, people in the cells, and coverage above each location.',
    keywords: ['location', 'site', 'post', 'position', 'open position', 'breadcrumb', 'paid duty', 'event', 'coverage alert', 'shortfall', 'notification', 'toast', 'day view', 'mobile', 'schedule'],
    sections: s(['desktop', 'Desktop'], ['posts', 'Posts and positions'], ['locations', 'Location headers'], ['coverage', 'Coverage'], ['mobile', 'Mobile'], ['coverage-alert', 'Coverage alert'], ['component', 'Using the components'], ['guidelines', 'Guidelines'], ['figma', 'Figma reference']),
    component: lazy(() => import('../pages/patterns/LocationView')),
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
    path: '/resources/tokens', title: 'Tokens & Code', group: 'Resources', icon: Code, status: 'draft', updated: '2026-11-12',
    description: 'Theme export, CSS variables and naming conventions.',
    keywords: ['theme', 'css variables', 'export', 'mantine', 'developer', 'naming'],
    sections: s(['theme', 'Mantine theme'], ['css-variables', 'CSS variables'], ['naming', 'Naming conventions']),
    component: lazy(() => import('../pages/resources/TokensCode')),
  },
  {
    path: '/resources/changelog', title: 'Changelog', group: 'Resources', icon: FileClock, status: 'draft', updated: '2026-11-12',
    description: 'History of guide updates and how to submit Figma frames.',
    keywords: ['history', 'updates', 'release', 'figma frames', 'submit'],
    sections: s(['entries', 'Updates'], ['submitting-frames', 'Submitting Figma frames']),
    component: lazy(() => import('../pages/resources/Changelog')),
  },
]

/** Pages shown in navigation, search and links. */
export const navPages = pages.filter((page) => !page.hidden)

export const findPage = (path: string) => pages.find((page) => page.path === path)

