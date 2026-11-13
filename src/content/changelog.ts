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
