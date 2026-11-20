import type { TokenStatus } from './types'

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

/**
 * Where a shortcut works. Two shortcuts may share keys when they work on different pages,
 * e.g. "Previous period" in Team View and "Previous period" in Calendar. Everywhere shortcuts share keys with nothing.
 */
export type ShortcutScope = 'global' | 'schedule' | 'calendar' | 'approvals'

export const shortcutScopes: { key: ShortcutScope; label: string; description: string }[] = [
  { key: 'global', label: 'Everywhere', description: 'Work on every page.' },
  { key: 'schedule', label: 'Team and Location View', description: 'Work while a schedule is open.' },
  { key: 'calendar', label: 'Calendar', description: 'Work while your calendar is open.' },
  { key: 'approvals', label: 'Approvals', description: 'Work while Approvals is open.' },
]

/**
 * Keys are written modifiers first, then one key: `mod+shift+K`.
 * `mod` is Ctrl on Windows and Linux and ⌘ on Mac. `alt` is Alt or ⌥. Letters are upper case.
 */
export interface ShortcutAction {
  id: string
  label: string
  /** One short line, shown under the label */
  description?: string
  scope: ShortcutScope
  /** Default keys. No default may be a character key without Ctrl/⌘ or Alt/⌥. */
  keys: string
  status: TokenStatus
}

const a = (id: string, label: string, scope: ShortcutScope, keys: string, description?: string): ShortcutAction =>
  ({ id, label, scope, keys, description, status: 'confirmed' })

export const shortcutActions: ShortcutAction[] = [
  // Everywhere
  a('show-shortcuts', 'Show keyboard shortcuts', 'global', 'mod+/', 'Opens the shortcuts panel.'),
  a('search', 'Search', 'global', 'mod+K', 'People, units, locations and pages.'),
  a('toggle-nav', 'Collapse or expand navigation', 'global', 'mod+\\'),
  a('switch-role', 'Change role', 'global', 'alt+shift+R', 'Opens the “Acting as” menu.'),
  a('switch-unit', 'Change unit', 'global', 'alt+shift+U', 'Opens the unit menu.'),
  a('go-home', 'Go to Home', 'global', 'alt+shift+H'),
  a('go-calendar', 'Go to Calendar', 'global', 'alt+shift+C'),
  a('go-team-view', 'Go to Team View', 'global', 'alt+shift+V'),
  a('go-approvals', 'Go to Approvals', 'global', 'alt+shift+P', 'Schedulers only.'),
  // Team and Location View
  a('schedule-previous', 'Previous period', 'schedule', 'alt+shift+ArrowLeft', 'Moves back by the selected range.'),
  a('schedule-next', 'Next period', 'schedule', 'alt+shift+ArrowRight', 'Moves forward by the selected range.'),
  a('schedule-today', 'Go to today', 'schedule', 'alt+shift+D'),
  a('schedule-find', 'Find a co-worker', 'schedule', 'alt+shift+F', 'Moves focus to the co-worker search.'),
  // Calendar
  a('calendar-previous', 'Previous period', 'calendar', 'alt+shift+ArrowLeft', 'Moves back a month, week or day.'),
  a('calendar-next', 'Next period', 'calendar', 'alt+shift+ArrowRight', 'Moves forward a month, week or day.'),
  a('calendar-today', 'Go to today', 'calendar', 'alt+shift+D'),
  a('calendar-month', 'Month view', 'calendar', 'alt+shift+1'),
  a('calendar-week', 'Week view', 'calendar', 'alt+shift+2'),
  a('calendar-day', 'Day view', 'calendar', 'alt+shift+3'),
  a('calendar-agenda', 'Agenda view', 'calendar', 'alt+shift+4'),
  a('calendar-add-task', 'Add task', 'calendar', 'alt+shift+N'),
  // Approvals
  a('approvals-next', 'Next request', 'approvals', 'alt+shift+ArrowDown'),
  a('approvals-previous', 'Previous request', 'approvals', 'alt+shift+ArrowUp'),
  a('approvals-approve', 'Approve', 'approvals', 'mod+Enter', 'Approves the open or selected requests.'),
  a('approvals-reject', 'Reject', 'approvals', 'mod+shift+Enter', 'Opens the reject form. Nothing is rejected until you confirm.'),
]

/**
 * How the shortcuts panel groups each tab, in column order. Every action appears once.
 */
export const shortcutPanelGroups: Record<ShortcutScope, { title: string; ids: string[] }[]> = {
  global: [
    { title: 'Find and open', ids: ['show-shortcuts', 'search', 'toggle-nav'] },
    { title: 'Go to', ids: ['go-home', 'go-calendar', 'go-team-view', 'go-approvals'] },
    { title: 'Change', ids: ['switch-role', 'switch-unit'] },
  ],
  schedule: [
    { title: 'Move through dates', ids: ['schedule-previous', 'schedule-next', 'schedule-today'] },
    { title: 'Find', ids: ['schedule-find'] },
  ],
  calendar: [
    { title: 'Move through dates', ids: ['calendar-previous', 'calendar-next', 'calendar-today'] },
    { title: 'Views', ids: ['calendar-month', 'calendar-week', 'calendar-day', 'calendar-agenda'] },
    { title: 'Add', ids: ['calendar-add-task'] },
  ],
  approvals: [
    { title: 'Move through requests', ids: ['approvals-next', 'approvals-previous'] },
    { title: 'Decide', ids: ['approvals-approve', 'approvals-reject'] },
  ],
}

/* ------------------------------------------------------------------ */
/* Standard keys                                                       */
/* ------------------------------------------------------------------ */

/** Built into browsers and every component. Listed for reference; they cannot be changed or turned off. */
export const standardKeys: { label: string; keys: string[] }[] = [
  { label: 'Move to the next control', keys: ['Tab'] },
  { label: 'Move to the previous control', keys: ['shift+Tab'] },
  { label: 'Press a button or open a link', keys: ['Enter'] },
  { label: 'Press a button, tick a checkbox', keys: ['Space'] },
  { label: 'Move in menus, lists, tabs and radio groups', keys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'] },
  { label: 'First or last item in a list', keys: ['Home', 'End'] },
  { label: 'Close a dialog, menu or drawer', keys: ['Escape'] },
]

/* ------------------------------------------------------------------ */
/* Keys that are not allowed                                           */
/* ------------------------------------------------------------------ */

export interface ReservedKeys {
  keys: string
  /** What the browser or the system does with the keys, as a sentence fragment: "closes the tab" */
  usedFor: string
  /** Only on this platform. Blocked on both anyway, because shortcuts follow the user to every device. */
  platform?: 'windows' | 'mac'
}

const r = (keys: string, usedFor: string, platform?: ReservedKeys['platform']): ReservedKeys => ({ keys, usedFor, platform })

/**
 * Browser, system and screen reader keys a shortcut may not use. The recorder checks these
 * before checking for conflicts. Ctrl/⌘ + 1–9 (tabs) and function keys are checked by rule, see `keys.ts`.
 */
export const reservedKeys: ReservedKeys[] = [
  // Browser: tabs and windows
  r('mod+T', 'opens a new tab'),
  r('mod+W', 'closes the tab'),
  r('mod+N', 'opens a new window'),
  r('mod+shift+T', 'reopens the last closed tab'),
  r('mod+shift+W', 'closes the window'),
  r('mod+shift+N', 'opens a private window'),
  r('mod+shift+P', 'opens a private window in Firefox'),
  r('mod+Q', 'quits the browser'),
  r('mod+shift+Q', 'quits the browser'),
  r('mod+shift+[', 'switches tabs', 'mac'),
  r('mod+shift+]', 'switches tabs', 'mac'),
  r('mod+0', 'resets the zoom'),
  r('mod+-', 'zooms out'),
  r('mod+=', 'zooms in'),
  // Browser: page and navigation
  r('mod+R', 'reloads the page'),
  r('mod+shift+R', 'reloads the page without the cache'),
  r('mod+L', 'moves to the address bar'),
  r('mod+E', 'moves to the address bar search'),
  r('mod+D', 'bookmarks the page'),
  r('mod+shift+D', 'bookmarks all tabs'),
  r('mod+B', 'opens bookmarks in Firefox'),
  r('mod+shift+B', 'shows the bookmarks bar'),
  r('mod+shift+O', 'opens the bookmark manager'),
  r('mod+H', 'opens history or hides the window'),
  r('mod+Y', 'opens history or redoes'),
  r('mod+J', 'opens downloads'),
  r('mod+F', 'finds in the page'),
  r('mod+G', 'finds the next match'),
  r('mod+shift+G', 'finds the previous match'),
  r('mod+P', 'prints'),
  r('mod+S', 'saves the page'),
  r('mod+O', 'opens a file'),
  r('mod+U', 'shows the page source'),
  r('mod+I', 'opens page info'),
  r('mod+shift+A', 'searches open tabs'),
  r('mod+shift+M', 'switches browser profile'),
  r('mod+shift+Delete', 'clears browsing data'),
  r('mod+shift+I', 'opens developer tools'),
  r('mod+shift+J', 'opens the console'),
  r('mod+shift+C', 'inspects an element'),
  r('mod+shift+K', 'opens the console in Firefox'),
  r('alt+ArrowLeft', 'goes back'),
  r('alt+ArrowRight', 'goes forward'),
  r('alt+Home', 'opens the home page'),
  r('alt+D', 'moves to the address bar', 'windows'),
  r('alt+E', 'opens the browser menu', 'windows'),
  r('alt+F', 'opens the browser menu', 'windows'),
  r('alt+shift+A', 'moves to browser dialogs in Chrome'),
  r('alt+shift+I', 'sends feedback in Chrome'),
  r('alt+shift+T', 'moves to the browser toolbar in Chrome'),
  // Editing
  r('mod+A', 'selects all'),
  r('mod+C', 'copies'),
  r('mod+X', 'cuts'),
  r('mod+V', 'pastes'),
  r('mod+shift+V', 'pastes without formatting'),
  r('mod+Z', 'undoes'),
  r('mod+shift+Z', 'redoes'),
  // System
  r('alt+F4', 'closes the window', 'windows'),
  r('mod+F5', 'reloads the page without the cache', 'windows'),
  r('shift+F5', 'reloads the page without the cache', 'windows'),
  r('shift+F10', 'opens the context menu', 'windows'),
  r('mod+M', 'minimizes the window', 'mac'),
  r('mod+,', 'opens settings', 'mac'),
  r('mod+`', 'switches windows', 'mac'),
  r('mod+shift+3', 'takes a screenshot', 'mac'),
  r('mod+shift+4', 'takes a screenshot', 'mac'),
  r('mod+shift+5', 'takes a screenshot', 'mac'),
]

/** Function keys the browser or a screen reader uses on their own. */
export const reservedFunctionKeys: { key: string; usedFor: string }[] = [
  { key: 'F1', usedFor: 'opens help' },
  { key: 'F3', usedFor: 'finds the next match' },
  { key: 'F5', usedFor: 'reloads the page' },
  { key: 'F6', usedFor: 'moves between the page and the address bar' },
  { key: 'F7', usedFor: 'turns on caret browsing' },
  { key: 'F10', usedFor: 'moves to the browser menu' },
  { key: 'F11', usedFor: 'turns full screen on or off' },
  { key: 'F12', usedFor: 'opens developer tools' },
]
