export interface ChangelogEntry {
  date: string
  /** Page path from the registry, or `null` for guide-wide changes */
  page: string | null
  summary: string
  /** Optional itemised details */
  changes?: string[]
}

/** Newest first. Add an entry whenever a Figma frame updates a page or token. */
export const changelog: ChangelogEntry[] = [
  {
    date: '2026-11-23',
    page: '/patterns/keyboard-shortcuts',
    summary: 'Keyboard Shortcuts is confirmed again, including the shortcuts panel and its groups.',
  },
  {
    date: '2026-11-23',
    page: '/patterns/keyboard-shortcuts',
    summary: 'The shortcuts modal and panel now share one demo, with a button for each. Removed the Touch devices and Guidelines sections.',
  },
  {
    date: '2026-11-20',
    page: '/patterns/keyboard-shortcuts',
    summary: 'New shortcuts panel for discovering the most used shortcuts. The page is back in review.',
    changes: [
      'Docks to the bottom of the window, with a tab for each place shortcuts work and related shortcuts in columns.',
      'Opens on the current page’s tab, shows the user’s keys and doesn’t block the page.',
      'Ctrl/⌘ / and the user menu now open the panel. Its Customize button opens the shortcuts modal.',
    ],
  },
  {
    date: '2026-11-20',
    page: '/patterns/keyboard-shortcuts',
    summary: 'Keyboard Shortcuts is confirmed, including the default shortcuts.',
  },
  {
    date: '2026-11-20',
    page: '/patterns/keyboard-shortcuts',
    summary: 'New Keyboard Shortcuts page: a modal in Preferences to look up, change and turn off shortcuts.',
    changes: [
      'Search by action or keys, shortcuts grouped by where they work, and a switch to turn them all off.',
      'Recording new keys, with the reason when keys aren’t allowed and a Replace step when another action uses them.',
      'Rules for allowed keys (WCAG 2.1.4), the browser and system keys that are blocked, and the default shortcuts.',
      'Key hints in tooltips and menus with aria-keyshortcuts, and hidden on touch-only devices.',
    ],
  },
  {
    date: '2026-11-20',
    page: null,
    summary: 'Team View and Location View explain the coverage drawer in its own section.',
    changes: [
      'New Coverage drawer section on both pages: an example drawer, its parts and how it opens and closes.',
      'Team View’s Coverage and employee details section is now Employee details.',
    ],
  },
  {
    date: '2026-11-19',
    page: null,
    summary: 'Light background tokens are translucent again. The Figma export had dropped their opacity.',
    changes: [
      'background-*-light is 16% opacity and background-*-light-hover is 20%, in every theme. background-transparent is fully transparent.',
      'The Theme Export downloads include the corrected values.',
      'Alerts, status badges, Approvals and the cell colors use the tokens directly instead of mixing their own tint.',
      'Temporary until the Figma export keeps opacity.',
    ],
  },
  {
    date: '2026-11-18',
    page: '/foundations/colors',
    summary: 'Restored --text-warning-default (#e5b953) and --text-info (#5fb5ff) in Dark, Dusk and Miami Vice to the Figma export values.',
  },
  {
    date: '2026-11-18',
    page: '/foundations/colors',
    summary: 'Miami Vice: --background-info-light now matches Dark (#228be6). Temporary until the next Figma export.',
  },
  {
    date: '2026-11-18',
    page: '/foundations/colors',
    summary: 'Shift cell colors are confirmed.',
  },
  {
    date: '2026-11-18',
    page: '/foundations/colors',
    summary: 'Text warning and text info now match across all six themes. Shift cell labels for pending and all-day events use them.',
    changes: [
      'Dark, Dusk and Miami Vice: --text-warning-default is #8a4700 and --text-info is #075599, the same as the light themes. Temporary until the next Figma export.',
      'Pending cells use --text-warning-default for their label; all-day events use --text-info.',
    ],
  },
  {
    date: '2026-11-18',
    page: '/foundations/colors',
    summary: 'Added the Shift cell colors table: which soft, base and deep token fills each schedule and calendar cell in every theme.',
    changes: [
      'Covers activity, out of unit, leave, overtime, task, sign-ups, all-day event and leave, schedule ruler and pending cells.',
      'Sign-ups, all-day events and pending cells add a border or text token.',
    ],
  },
  {
    date: '2026-11-18',
    page: '/foundations/colors',
    summary: 'Re-imported all six themes from Figma. Each theme adds 24 categorical colors.',
    changes: [
      'New tokens: --soft1 to --soft8, --base1 to --base8 and --deep1 to --deep8, in every theme.',
      'They are listed in the All color tokens table and included in the Theme Export downloads.',
      'Existing theme values are unchanged.',
    ],
  },
  {
    date: '2026-11-18',
    page: '/components/feedback',
    summary: 'Alerts use the theme’s error, warning and info colors.',
    changes: [
      'The background uses the tone’s light color, and the title and icon use the tone color.',
      'Applies to the alert examples and the alert in the delete confirmation.',
      'Removed the alert props table.',
    ],
  },
  {
    date: '2026-11-18',
    page: '/components/status-badges',
    summary: 'Each status group has its own icon shape, so badges stay clear for people who are color blind.',
    changes: [
      'Rejected: cross (was a ban sign). Expired: timer off (was the clock, same as Pending). Missed: calendar with a cross (had no icon). Submitted: paper plane (was a check).',
      'Every status now has an icon, and the table shows each status’s group.',
      'Gray badges (Closed, Full) use the gray text color instead of dimmed text.',
    ],
  },
  {
    date: '2026-11-18',
    page: null,
    summary: 'New theme colors from Figma for status text and borders, in all six themes.',
    changes: [
      'Warning, success, error, info and gray text and borders now use one value per tone: the same in all dark themes and the same in all light themes.',
      'Status badge text reaches 4.7:1 or more in every theme (was as low as 1.9:1 in the light themes).',
      'Dimmed text changes too: #c5d2e0 in dark themes, #3a4753 in light themes.',
    ],
  },
  {
    date: '2026-11-17',
    page: null,
    summary: 'In the full-screen desktop demos (Team View, Location View, Approvals), dialogs and drawers keep their normal size.',
  },
  {
    date: '2026-11-17',
    page: '/patterns/calendar',
    summary: 'Add and the + on a day open a menu: Activity, Leave, Timesheet or Trade Request, or Task.',
    changes: ['In the demo, every item opens the Add task form.'],
  },
  {
    date: '2026-11-17',
    page: '/patterns/calendar',
    summary: 'Busy month cells show two items and a “+N more” button that lists everything on that day.',
  },
  {
    date: '2026-11-17',
    page: '/patterns/team-view',
    summary: 'New Extra rows section: assignments outside a member’s block go to a lighter row under them.',
  },
  {
    date: '2026-11-17',
    page: '/patterns/team-view',
    summary: 'The desktop Sort button opens the Sort dialog, as on Approvals, instead of a dropdown.',
    changes: ['Pick ascending or descending, then a field, and confirm with Apply.'],
  },
  {
    date: '2026-11-17',
    page: '/resources/theme-export',
    summary: 'Theme Export approved and confirmed.',
  },
  {
    date: '2026-11-17',
    page: '/foundations/colors',
    summary: 'Dusk, Miami Vice, Terra and Candy are confirmed. All six themes are now confirmed.',
  },
  {
    date: '2026-11-17',
    page: '/resources/theme-export',
    summary: 'New Theme Export page: copy or download all six themes for Mantine.',
    changes: [
      'Dusk, Miami Vice, Terra and Candy added from Figma as Draft. They also show on the Colors page.',
      'One theme.ts for all themes; colors per theme in intime-themes.css, switched with data-intime-theme on <html>.',
      'Each theme block sets Mantine\'s body, text, border and primary-color variables, so components follow the theme.',
    ],
  },
  {
    date: '2026-11-16',
    page: '/resources/color-vision',
    summary: 'Patterns are quieter and no longer cover the text.',
    changes: [
      'Dots, lines and out-of-unit stripes now have the same strength, so overtime lines no longer look fainter.',
      'A halo in the fill color keeps codes and titles readable on top of a pattern.',
      'One pattern per cell: out-of-unit stripes replace the dots or lines.',
      'Cancelled events have no pattern, so the line through the text stays clear.',
      'OU and OT tags in the calendar have space between them.',
    ],
  },
  {
    date: '2026-11-16',
    page: '/resources/color-vision',
    summary: 'Out-of-unit stripes use a tint of the text color with color-blind friendly colors on, so they show on the blue regular fill.',
  },
  {
    date: '2026-11-16',
    page: '/resources/color-vision',
    summary: 'Color Vision approved.',
  },
  {
    date: '2026-11-16',
    page: '/resources/color-vision',
    summary: 'New Color Vision page: how Team View, Location View and Calendar work for people who are color blind.',
    changes: [
      'Two user settings on top of all themes: color-blind friendly colors and patterns on shift fills.',
      'The user’s setting wins over agency colors. Icons, tags and line styles carry the meaning in every case.',
      'Static Team View and Calendar mocks with the changes applied, and a simulated side-by-side comparison.',
      'Steps, tokens and suggested CSS for developers. Current pages are unchanged.',
    ],
  },
  {
    date: '2026-11-16',
    page: null,
    summary: 'On phones, the sliders button on Team View and Location View opens a filter sheet.',
    changes: [
      'Team View: start date, team, and sort (ascending or descending by team order, name or rank).',
      'Location View: date and location. Posts keep the location’s setup order, so there is no sort.',
      'Changes apply on Done. Cancel or the handle keeps the previous filters.',
    ],
  },
  {
    date: '2026-11-16',
    page: null,
    summary: 'The date buttons on Team View, Location View, Calendar and Approvals open a date picker.',
    changes: [
      'Team View and Location View: one to three weeks pick a start week, and the whole range highlights as you hover. One month picks a month.',
      'Calendar: Month picks a month, Week a week, Agenda a start day for seven days, and Day a single day.',
      'Approvals: pick a start and an end day on a two-month calendar, or a preset such as This week or Last 30 days.',
      'The demo’s “today” (June 5, 2026) is ringed in every picker.',
    ],
  },
  {
    date: '2026-11-16',
    page: '/patterns/approvals',
    summary: 'Approvals approved.',
  },
  {
    date: '2026-11-16',
    page: '/patterns/approvals',
    summary: 'Activity and trade approvals follow their frames, and Sort is a dialog.',
    changes: [
      'Activity: “Surname · Activity” with the location in the list, and one details list with hours modifier, time bank and banked time. Visibility adds Premium and Time Bank.',
      'Trades: “Surname ⇄ Surname” with both shifts in the list, sender and receiver cards with their own tags and assets, and a notes thread from both employees and the approvers.',
      'A warning icon marks activity and trade requests with alerts. Approvers read “Approved · date”, and your own approval is marked “(you)”.',
      'Sort opens a dialog with ascending or descending and one field. Hidden properties cannot be sorted by. Visibility is kept per tab.',
      'Tabs are in the order Activity, Leave, Timesheets, Trade.',
    ],
  },
  {
    date: '2026-11-16',
    page: '/patterns/approvals',
    summary: 'Leave approvals follow the leave frames.',
    changes: [
      'List items read “Type · Surname” and show the rank. Visibility adds Precedence, and the toolbar adds All Leave Types.',
      'Details: leave request (ID, type, date, hours), employee (unit, branch, rank, precedence), Critical and Warnings alerts, and tracking tags, flat or grouped by label.',
      'Rejected requests show the rejection reason in red at the top. A note written while rejecting becomes the reason.',
      'Pending leave offers Approve and Reject, without Clear.',
    ],
  },
  {
    date: '2026-11-16',
    page: '/patterns/approvals',
    summary: 'New Approvals page: timesheet, leave, trade and activity approvals on desktop and on a phone.',
    changes: [
      'Desktop demo with a list, the open request and an action panel in a Mantine Splitter, so each pane can be resized.',
      'Pending, approved, rejected and unsubmitted states, required approvals, alerts, multi-select with bulk actions, visibility and sort.',
      'Phone demo: list, full-screen details and the actions in a bottom sheet.',
      'New components in src/components/approvals and tokens in src/tokens/approvals.ts. DesktopDemoFrame takes tabs.',
    ],
  },
  {
    date: '2026-11-16',
    page: null,
    summary: 'The desktop demos on Team View, Location View and Calendar use the full width of the page, up to 1920px.',
  },
  {
    date: '2026-11-16',
    page: null,
    summary: 'Code and Figma references are hidden across the guide for now.',
    changes: [
      'The "Using the components" and "Usage in code" sections and the "Show code" toggles are hidden. They can be turned back on with one flag.',
      'The "Figma reference" sections are hidden. They have their own flag.',
    ],
  },
  {
    date: '2026-11-13',
    page: '/patterns/calendar',
    summary: 'The map button toggles the legend, on desktop and on the phone.',
    changes: ['The legend is hidden by default and can be shown in any view. On desktop it sits under the toolbar. MapButton takes pressed and label for toggle use.'],
  },
  {
    date: '2026-11-13',
    page: '/patterns/team-view',
    summary: 'Shift cells open the day details.',
    changes: [
      'Clicking a cell in the desktop grid, a mobile week cell or a mobile day bar opens that person’s day on a timeline.',
      'New onChipClick prop on ScheduleGrid and MobileSchedule, and chipDayEvents to build a rough day from a cell.',
    ],
  },
  {
    date: '2026-11-13',
    page: '/patterns/day-details',
    summary: 'Day Details approved.',
  },
  {
    date: '2026-11-13',
    page: '/patterns/day-details',
    summary: 'New Day Details page: one person’s day on a timeline, and how leave takes precedence.',
    changes: [
      'Three scenarios from the design: back-to-back activities, leave on one activity that overlaps another, and all-day leave.',
      'New resolveDay helper and DayDetailsModal in src/components/day-details. A 600px modal on desktop, full screen on a phone.',
      'PhoneFrame takes bare to leave out the app header.',
    ],
  },
  {
    date: '2026-11-13',
    page: '/components/status-badges',
    summary: 'Added Missed, dot badges (Live, Closed) and the outline role badge.',
  },
  {
    date: '2026-11-13',
    page: '/resources/changelog',
    summary: 'Changelog approved.',
  },
  {
    date: '2026-11-13',
    page: '/components/status-badges',
    summary: 'Status Badges approved.',
    changes: ['Page and request status tokens are now confirmed.'],
  },
  {
    date: '2026-11-13',
    page: '/components/status-badges',
    summary: 'Status Badges page is now visible, with the new pill badges from the design.',
    changes: [
      'Eleven states: Queued, Pending, Approved, Your Turn, Available, Rejected, Expired, Taken Down, Submitted, Closed and Full.',
      'Each pairs an icon with a label, grouped by color: yellow waiting, teal positive, red negative, blue submitted, gray closed.',
    ],
  },
  {
    date: '2026-11-13',
    page: '/patterns/location-view',
    summary: 'Time-of-day cells open the coverage drawer, as in Team View.',
    changes: [
      'The drawer shows the location breadcrumb, the date and the day’s coverage hour by hour. A bottom sheet on a phone.',
      'New useCoverageDrawer hook in src/components/schedule, used by Team View and Location View.',
    ],
  },
  {
    date: '2026-11-13',
    page: '/patterns/team-view',
    summary: 'Team View opens coverage details and employee details.',
    changes: [
      'Select a time-of-day cell to open the day’s coverage hour by hour: a side drawer on desktop, a bottom sheet on a phone.',
      'Select a name to see the employee’s rank, team, first day, contact details and employee ID.',
      'ScheduleGrid and MobileSchedule take onRowClick and onCoverageClick. New CoverageDrawer and EmployeeDetailsModal in ScheduleDetails.tsx.',
      'New --schedule-hour-under, --schedule-hour-met and --schedule-hour-over variables.',
    ],
  },
  {
    date: '2026-11-13',
    page: null,
    summary: 'Calendar and Overview approved and set to Confirmed.',
    changes: [
      'Patterns: Calendar. Its --calendar-* tokens are Confirmed too.',
      'Getting started: Overview.',
    ],
  },
  {
    date: '2026-11-13',
    page: '/patterns/calendar',
    summary: 'New Calendar pattern, built from the Figma calendar frames.',
    changes: [
      'Month, week, day and agenda views on desktop and on a phone, with today, the current time and pay-period lines.',
      'Event types: activity, overtime, leave and task fills, plus pending, out-of-unit and cancelled. Holidays and sign-ups sit in the all-day area.',
      'Details dialogs for assignments, leave, tasks from a scheduler and sign-ups, and a form to add or edit your own tasks.',
      'New --calendar-* CSS variables. The app frame (DesktopDemoFrame, PhoneFrame) is now shared with Team View.',
    ],
  },
  {
    date: '2026-11-13',
    page: null,
    summary: 'Ten pages approved and set to Confirmed.',
    changes: [
      'Foundations: Typography, Icons, Spacing & Layout, Radius & Elevation and Motion. Their spacing, radius, shadow, breakpoint, z-index and motion tokens are Confirmed too.',
      'Components: Buttons, Forms and Feedback.',
      'Patterns: Empty & Loading States.',
      'Resources: Accessibility.',
    ],
  },
  {
    date: '2026-11-13',
    page: '/patterns/location-view',
    summary: 'New Location View pattern, built on the Team View components.',
    changes: [
      'Posts down the side with their hours, one line per position, and surnames in the cells.',
      'Location headers as breadcrumb paths, with coverage above each location.',
      'Co-worker search dims other people and hides posts they are not on.',
      'Mobile week (posts and positions) and day (people on duty), plus a coverage alert for the location furthest below target.',
    ],
  },
  {
    date: '2026-11-13',
    page: '/patterns/team-view',
    summary: 'Schedule components generalized for Location View.',
    changes: [
      'ScheduleGrid and MobileSchedule take `sections` (build them with teamSections) instead of `groups`.',
      'The Unit and Location tabs in the demos now open the other page.',
    ],
  },
  {
    date: '2026-11-13',
    page: '/patterns/team-view',
    summary: 'New Team View pattern with reusable schedule components and CSS variables.',
    changes: [
      'Desktop grid for one, two or three weeks or a month, with pinned names and dates, a today header, schedule period lines and co-worker search.',
      'Shift cells: regular, leave and overtime fills, diagonal split for mixed days, OT and OU tags, hatching for out of unit, strikethrough for cancelled, overflow rows.',
      'Coverage above each team: bodies, hours and a time-of-day bar.',
      'Mobile week strips and a 24-hour day timeline.',
      '`--schedule-*` CSS variables in src/tokens/schedule.ts.',
    ],
  },
  {
    date: '2026-11-13',
    page: '/patterns/navigation',
    summary: 'New Navigation pattern with a reusable component and CSS variables.',
    changes: [
      'Four variants by role: Scheduler, Administrator, Employee (and Scheduler), Employee only. The role switcher appears only for users with more than one role.',
      'Collapsed rail: icon-only items with tooltips, and dots instead of count badges.',
      'Pinned (page shifts) and overlay (floats over the page) behavior, with a live demo.',
      '`--nav-*` CSS variables in src/tokens/navigation.ts, published on :root and aliased to the theme tokens.',
    ],
  },
  {
    date: '2026-11-12',
    page: '/foundations/typography',
    summary: 'Typography updated to the production typefaces and type scales.',
    changes: [
      'Font families: Roboto (variable; Regular 400, SemiBold 600, ExtraBold 800) as the primary typeface and Cousine (Regular, Bold) for numerical display in the scheduling view.',
      'Heading type scale h1–h6: 25/34, 22/32, 18/28, 12/24 uppercase, 13/20 uppercase, 12/16.',
      'Body type scale xxs–xl (10/13 to 20/32) in Regular, Semi Bold and Semi Bold & Uppercase, with copyable Mantine and CSS snippets.',
      'Guide theme now renders in Roboto and Cousine (replacing Inter and JetBrains Mono).',
    ],
  },
  {
    date: '2026-11-12',
    page: '/foundations/colors',
    summary: 'Colors page streamlined. The Figma token export is now the single source of truth.',
    changes: [
      'Removed the "Figma vs export" comparison: exported values are authoritative.',
      'Removed the draft Department accents, Shift states and Usage in code sections, plus the Patch Notes block.',
      'Primitive palettes no longer carry a "Needs review" status. Page status set to Confirmed.',
    ],
  },
  {
    date: '2026-11-12',
    page: '/foundations/colors',
    summary: 'Imported the dark and light theme tokens from Figma and rebuilt the Colors page after the "Colors (default theme)" frame.',
    changes: [
      'Theme exports stored verbatim in src/tokens/themes/dark.css and light.css; re-exports can be pasted over them.',
      'Theme registry with a page-level theme switcher (Dark, Light). Color-blind safe and High contrast themes are listed as planned.',
      'Sections follow the frame: Main UI colors, Signalling colors (CTA, Success, Warning, Error, Info, plus Indigo and Gray), Signalling colors with example, Text and Borders.',
      'Added Gray scale & neutrals, Primitive palettes and a searchable All color tokens table with per-theme values and WCAG contrast on body.',
      'Swatches copy either var(--token) or the hex value; tooltips show the referenced primitive.',
      'Primitive references (primary, cyan, gray, teal, yellow, red, blue, indigo) resolve to Mantine defaults with primary = cyan.',
    ],
  },
  {
    date: '2026-11-12',
    page: null,
    summary: 'Guide now uses the real InTime tokens and Figma typography.',
    changes: [
      'All exported color tokens are available as CSS variables in both color schemes; guide surfaces, borders and text map to them.',
      'Mantine primary color switched to the cyan CTA ramp; semantic colors mapped to teal, yellow, red and blue.',
      'Page headers restyled to match Figma: red overline, 44px title, 17px description.',
      'Loaded the exact Figma font faces (Inter, Roboto, Inconsolata, Cousine).',
    ],
  },
  {
    date: '2026-11-12',
    page: null,
    summary: 'Scaffolded the InTime design guide.',
    changes: [
      'Dark-first Mantine + Lucide app with a light-mode preview toggle.',
      'Grouped sidebar, ⌘K / "/" search across pages and sections, on-page table of contents and previous/next links.',
      'Draft pages for Foundations, Components, Patterns and Resources, with copy chips, code snippets, live previews, do/don\'t guidance and Figma placeholders.',
      'Draft tokens: public-safety palette, Inter / JetBrains Mono, spacing, radius, elevation, motion, icons and shift states.',
    ],
  },
  {
    date: '2026-11-12',
    page: null,
    summary: 'Project set up for Figma Make: install, dev server, preview and static deploy scripts verified.',
  },
]
