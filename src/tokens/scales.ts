import type { TokenStatus } from './types'

export interface ScaleToken {
  name: string
  value: string
  px?: number
  cssVar: string
  usage: string
  status: TokenStatus
}

export const spacing: ScaleToken[] = [
  { name: 'xxs', value: '0.25rem', px: 4, cssVar: '--mantine-spacing-xxs', usage: 'Icon-to-label gaps inside badges.', status: 'draft' },
  { name: 'xs', value: '0.5rem', px: 8, cssVar: '--mantine-spacing-xs', usage: 'Tight groups, chip gaps.', status: 'draft' },
  { name: 'sm', value: '0.75rem', px: 12, cssVar: '--mantine-spacing-sm', usage: 'Table cell padding, form row gaps.', status: 'draft' },
  { name: 'md', value: '1rem', px: 16, cssVar: '--mantine-spacing-md', usage: 'Default card padding and stack gap.', status: 'draft' },
  { name: 'lg', value: '1.5rem', px: 24, cssVar: '--mantine-spacing-lg', usage: 'Between related sections.', status: 'draft' },
  { name: 'xl', value: '2rem', px: 32, cssVar: '--mantine-spacing-xl', usage: 'Page gutters, between page sections.', status: 'draft' },
  { name: 'xxl', value: '3rem', px: 48, cssVar: '--mantine-spacing-xxl', usage: 'Major layout separation.', status: 'draft' },
]

export const radius: ScaleToken[] = [
  { name: 'xs', value: '0.125rem', px: 2, cssVar: '--mantine-radius-xs', usage: 'Shift blocks inside dense calendar cells.', status: 'draft' },
  { name: 'sm', value: '0.375rem', px: 6, cssVar: '--mantine-radius-sm', usage: 'Default: buttons, inputs, badges.', status: 'draft' },
  { name: 'md', value: '0.5rem', px: 8, cssVar: '--mantine-radius-md', usage: 'Cards, panels, popovers.', status: 'draft' },
  { name: 'lg', value: '0.75rem', px: 12, cssVar: '--mantine-radius-lg', usage: 'Modals, drawers.', status: 'draft' },
  { name: 'xl', value: '1rem', px: 16, cssVar: '--mantine-radius-xl', usage: 'Large feature surfaces.', status: 'draft' },
]

export const shadows: ScaleToken[] = [
  { name: 'xs', value: '0 1px 2px rgb(0 0 0 / 40%)', cssVar: '--mantine-shadow-xs', usage: 'Hovered table rows, subtle lift.', status: 'draft' },
  { name: 'sm', value: '0 2px 6px rgb(0 0 0 / 40%)', cssVar: '--mantine-shadow-sm', usage: 'Cards on canvas.', status: 'draft' },
  { name: 'md', value: '0 8px 20px rgb(0 0 0 / 45%)', cssVar: '--mantine-shadow-md', usage: 'Menus, popovers, dropdowns.', status: 'draft' },
  { name: 'lg', value: '0 16px 40px rgb(0 0 0 / 50%)', cssVar: '--mantine-shadow-lg', usage: 'Modals, drawers.', status: 'draft' },
  { name: 'xl', value: '0 24px 64px rgb(0 0 0 / 55%)', cssVar: '--mantine-shadow-xl', usage: 'Command palette, full overlays.', status: 'draft' },
]

export const breakpoints: ScaleToken[] = [
  { name: 'xs', value: '36em', px: 576, cssVar: '--mantine-breakpoint-xs', usage: 'Large phones.', status: 'draft' },
  { name: 'sm', value: '48em', px: 768, cssVar: '--mantine-breakpoint-sm', usage: 'Tablets: navbar collapses below.', status: 'draft' },
  { name: 'md', value: '62em', px: 992, cssVar: '--mantine-breakpoint-md', usage: 'Small laptops, MDT screens.', status: 'draft' },
  { name: 'lg', value: '75em', px: 1200, cssVar: '--mantine-breakpoint-lg', usage: 'Desktop: week view fits fully.', status: 'draft' },
  { name: 'xl', value: '88em', px: 1408, cssVar: '--mantine-breakpoint-xl', usage: 'Wide dispatch and supervisor monitors.', status: 'draft' },
]

export const zIndex: ScaleToken[] = [
  { name: 'base', value: '0', cssVar: '—', usage: 'Page content.', status: 'draft' },
  { name: 'sticky', value: '100', cssVar: '—', usage: 'Sticky table headers, schedule time gutter.', status: 'draft' },
  { name: 'app', value: '200', cssVar: '--mantine-z-index-app', usage: 'AppShell header and navbar.', status: 'draft' },
  { name: 'modal', value: '300', cssVar: '--mantine-z-index-modal', usage: 'Modals and drawers.', status: 'draft' },
  { name: 'popover', value: '300', cssVar: '--mantine-z-index-popover', usage: 'Menus, tooltips, selects.', status: 'draft' },
  { name: 'overlay', value: '400', cssVar: '--mantine-z-index-overlay', usage: 'Command palette, blocking overlays.', status: 'draft' },
  { name: 'max', value: '9999', cssVar: '--mantine-z-index-max', usage: 'Notifications.', status: 'draft' },
]

export const motion = {
  durations: [
    { name: 'instant', value: '80ms', ms: 80, usage: 'Hover color, focus ring.', status: 'draft' as TokenStatus },
    { name: 'fast', value: '150ms', ms: 150, usage: 'Buttons, toggles, tooltips.', status: 'draft' as TokenStatus },
    { name: 'base', value: '220ms', ms: 220, usage: 'Popovers, dropdowns, accordions.', status: 'draft' as TokenStatus },
    { name: 'slow', value: '320ms', ms: 320, usage: 'Modals, drawers, page-level panels.', status: 'draft' as TokenStatus },
  ],
  easings: [
    { name: 'standard', value: 'cubic-bezier(0.2, 0, 0, 1)', usage: 'Most UI transitions.', status: 'draft' as TokenStatus },
    { name: 'enter', value: 'cubic-bezier(0, 0, 0.2, 1)', usage: 'Elements appearing.', status: 'draft' as TokenStatus },
    { name: 'exit', value: 'cubic-bezier(0.4, 0, 1, 1)', usage: 'Elements leaving.', status: 'draft' as TokenStatus },
  ],
}

/** Fixed layout dimensions of the scheduling app shell. */
export const layout = [
  { name: 'Header height', value: '56px', usage: 'Global top bar.' },
  { name: 'Navbar width', value: '260px', usage: 'Primary navigation; collapses below sm.' },
  { name: 'Content max width', value: '1280px', usage: 'Forms and settings pages. Schedules may go full width.' },
  { name: 'Schedule time gutter', value: '64px', usage: 'Hour labels in day/week views.' },
  { name: 'Min. touch target', value: '40px', usage: 'In-vehicle and tablet use with gloves.' },
]
