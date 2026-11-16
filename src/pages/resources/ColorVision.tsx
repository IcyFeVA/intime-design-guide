import type { ReactNode } from 'react'
import { Alert, Code, List, Stack, Table, Text, Title } from '@mantine/core'
import { AlarmClock, ArrowUpRight, Check, Clock3, Info, SquareCheck, Triangle } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import Preview from '../../components/Preview'
import CodeBlock from '../../components/CodeBlock'
import CopyValue from '../../components/CopyValue'
import DoDont from '../../components/DoDont'
import { colorVisionSettings, colorVisionTokens } from '../../tokens/colorVision'
import classes from './ColorVision.module.css'

/* ------------------------------------------------------------------ */
/* Mock data                                                           */
/* ------------------------------------------------------------------ */

type Kind = 'regular' | 'leave' | 'overtime'
type Level = 'under' | 'met' | 'over'

interface Cell {
  codes: string[]
  /** One kind, or two for a split cell (bottom-left, top-right) */
  kinds: [Kind] | [Kind, Kind]
  ot?: boolean
  ou?: boolean
}

const days = ['Mon 1', 'Tue 2', 'Wed 3', 'Thu 4', 'Fri 5', 'Sat 6', 'Sun 7']
const todayIndex = 4

const r = (code: string, extra: Partial<Cell> = {}): Cell => ({ codes: [code], kinds: ['regular'], ...extra })
const l = (code: string): Cell => ({ codes: [code], kinds: ['leave'] })
const o = (code: string, extra: Partial<Cell> = {}): Cell => ({ codes: [code], kinds: ['overtime'], ot: true, ...extra })

const members: { name: string; rank: string; initials: string; cells: (Cell | null)[] }[] = [
  { name: 'Marino, J.', rank: 'Sergeant', initials: 'JM', cells: [r('PatD'), r('PatD'), l('Sick'), { codes: ['PatD', 'ExP'], kinds: ['regular', 'overtime'], ot: true }, r('PatD'), null, null] },
  { name: 'Okafor, A.', rank: 'Officer', initials: 'AO', cells: [r('PatN'), r('PatN'), r('PatN'), null, l('Vac'), l('Vac'), null] },
  { name: 'Chen, L.', rank: 'Officer', initials: 'LC', cells: [r('Court'), r('PatD', { ou: true }), r('PatD'), r('PatD'), r('Train'), null, o('PatG')] },
  { name: 'Alvarez, R.', rank: 'Officer', initials: 'RA', cells: [r('PatG'), { codes: ['PTO', 'PatG'], kinds: ['leave', 'regular'] }, r('PatG'), r('PatG'), r('PatG', { ou: true }), null, null] },
  { name: 'Byrne, K.', rank: 'Detective', initials: 'KB', cells: [null, r('Office'), r('Office'), r('Act Sup'), r('Office'), o('Spe', { ou: true }), null] },
]

const staff: { have: number; need: number }[] = [
  { have: 4, need: 4 }, { have: 5, need: 4 }, { have: 3, need: 4 }, { have: 4, need: 4 }, { have: 3, need: 4 }, { have: 2, need: 2 }, { have: 1, need: 2 },
]
const hours: { value: number; level: Level }[] = [
  { value: 0, level: 'met' }, { value: 6.5, level: 'over' }, { value: 10, level: 'under' }, { value: 0, level: 'met' }, { value: 8, level: 'under' }, { value: 0, level: 'met' }, { value: 12, level: 'under' },
]
const timeOfDay: { from: number; to: number; level: Exclude<Level, 'met'> }[][] = [
  [], [{ from: 9, to: 14, level: 'over' }], [{ from: 19, to: 24, level: 'under' }], [], [{ from: 0, to: 7, level: 'under' }, { from: 12, to: 15, level: 'over' }], [], [{ from: 7, to: 19, level: 'under' }],
]

const levelOf = ({ have, need }: { have: number; need: number }): Level => (have < need ? 'under' : have > need ? 'over' : 'met')
const levelWords: Record<Level, string> = { under: 'below target', met: 'on target', over: 'above target' }

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function LevelIcon({ level }: { level: Level }) {
  if (level === 'met') return <Check size={13} strokeWidth={3} aria-hidden="true" />
  return <Triangle size={11} fill="currentColor" strokeWidth={0} aria-hidden="true" style={level === 'under' ? { transform: 'rotate(180deg)' } : undefined} />
}

function Patterns({ kinds }: { kinds: Kind[] }) {
  const [a, b = a] = kinds
  if (a === b) return a === 'regular' ? null : <span className={classes.pattern} data-kind={a} />
  return (
    <>
      {a !== 'regular' && <span className={classes.pattern} data-kind={a} data-half="a" />}
      {b !== 'regular' && <span className={classes.pattern} data-kind={b} data-half="b" />}
    </>
  )
}

function Chip({ cell, tags = true, patterns = true }: { cell: Cell; tags?: boolean; patterns?: boolean }) {
  const [a, b] = cell.kinds
  const tagged = tags && (cell.ot || cell.ou)
  return (
    <div className={classes.chip} data-a={a} data-b={b} data-tagged={tagged || undefined}>
      {patterns && !cell.ou && <Patterns kinds={cell.kinds} />}
      {cell.ou && <span className={classes.hatch} />}
      {cell.codes.map((code, index) => (
        <span key={code} className={classes.segment} data-last={index === cell.codes.length - 1 || undefined}>
          <span className={classes.code}>{code}</span>
        </span>
      ))}
      {tagged && (
        <span className={classes.tags} aria-hidden="true">
          {cell.ou && <span className={classes.tag}><ArrowUpRight size={13} strokeWidth={2} />OU</span>}
          {cell.ot && <span className={classes.tag}><Clock3 size={13} strokeWidth={2} />OT</span>}
        </span>
      )}
    </div>
  )
}

function Coverage({ level, label, children, icon = true }: { level: Level; label: string; children: ReactNode; icon?: boolean }) {
  return (
    <div className={`${classes.coverage} tabular`} data-level={level} aria-label={label}>
      {children}
      {icon && <LevelIcon level={level} />}
    </div>
  )
}

function Swatch({ kinds, ou }: { kinds: Cell['kinds']; ou?: boolean }) {
  return (
    <span className={`${classes.chip} ${classes.legendSwatch}`} data-a={kinds[0]} data-b={kinds[1]}>
      {!ou && <Patterns kinds={kinds} />}
      {ou && <span className={classes.hatch} />}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Team View                                                           */
/* ------------------------------------------------------------------ */

function TeamViewMock() {
  return (
    <div className={classes.safe}>
      <div className={classes.scroller}>
        <div className={classes.grid} role="table" aria-label="Patrol Alpha, June 1 to 7, 2026">
          <div className={classes.corner}>Patrol Alpha · 5 members</div>
          {days.map((day, index) => (
            <div key={day} className={classes.dayHeader} data-today={index === todayIndex || undefined}>
              {day}
              {index === todayIndex && <span className={classes.todayLabel}>Today</span>}
            </div>
          ))}
          <div className={classes.groupHeader}>Patrol Alpha</div>
          {members.map((member) => (
            <div key={member.name} style={{ display: 'contents' }} role="row">
              <div className={classes.label}>
                <span className={classes.initials} aria-hidden="true">{member.initials}</span>
                <div><Text size="sm" fw={600}>{member.name}</Text><Text size="xs" c="dimmed">{member.rank}</Text></div>
              </div>
              {member.cells.map((cell, index) => (
                <div key={index} className={classes.cell}>{cell && <Chip cell={cell} />}</div>
              ))}
            </div>
          ))}
          <div className={classes.groupHeader}>Coverage display</div>
          <div className={classes.label} data-coverage>Staff</div>
          {staff.map((value, index) => {
            const level = levelOf(value)
            return (
              <div key={index} className={classes.cell} data-coverage>
                <Coverage level={level} label={`${value.have} of ${value.need} staff, ${levelWords[level]}`}>{value.have}/{value.need}</Coverage>
              </div>
            )
          })}
          <div className={classes.label} data-coverage>Hours</div>
          {hours.map((value, index) => (
            <div key={index} className={classes.cell} data-coverage>
              <Coverage level={value.level} label={value.level === 'met' ? 'Hours on target' : `${value.value} hours ${value.level === 'under' ? 'short' : 'over'}`}>
                {value.level === 'met' ? '0.0' : value.value.toFixed(1)}
              </Coverage>
            </div>
          ))}
          <div className={classes.label} data-coverage>Time of day</div>
          {timeOfDay.map((segments, index) => (
            <div key={index} className={classes.cell} data-coverage>
              <div className={classes.timeOfDay} role="img" aria-label={segments.length ? segments.map((s) => `${levelWords[s.level]} ${s.from}:00–${s.to}:00`).join(', ') : 'On target all day'}>
                {segments.map((segment) => (
                  <span key={segment.from} className={classes.todSegment} data-level={segment.level} style={{ left: `${(segment.from / 24) * 100}%`, width: `${((segment.to - segment.from) / 24) * 100}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={classes.legend}>
        <span className={classes.legendItem}><Swatch kinds={['regular']} />Regular</span>
        <span className={classes.legendItem}><Swatch kinds={['leave']} />Leave (dots)</span>
        <span className={classes.legendItem}><Swatch kinds={['overtime']} />Overtime (lines, OT)</span>
        <span className={classes.legendItem}><Swatch kinds={['leave', 'regular']} />Split cell</span>
        <span className={classes.legendItem}><Swatch kinds={['regular']} ou />Out of unit (stripes, OU)</span>
        <span className={classes.legendItem}><LevelIcon level="under" />Below target</span>
        <span className={classes.legendItem}><LevelIcon level="met" />On target</span>
        <span className={classes.legendItem}><LevelIcon level="over" />Above target</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Calendar                                                            */
/* ------------------------------------------------------------------ */

interface MockEvent {
  title: string
  time?: string
  kind: Kind | 'task'
  ot?: boolean
  ou?: boolean
  pending?: boolean
  cancelled?: boolean
  reminder?: boolean
}

const calendarDays: { day: number; events: MockEvent[] }[] = [
  { day: 1, events: [{ title: 'Day patrol', time: '07:00–17:00', kind: 'regular' }] },
  { day: 2, events: [{ title: 'Day patrol', time: '07:00–17:00', kind: 'regular' }, { title: 'Renew firearms card', time: '09:00', kind: 'task', reminder: true }] },
  { day: 3, events: [{ title: 'Vacation', kind: 'leave' }] },
  { day: 4, events: [{ title: 'Vacation', kind: 'leave' }] },
  { day: 5, events: [{ title: 'Day patrol', time: '07:00–17:00', kind: 'regular' }, { title: 'Court standby', time: '17:00–20:00', kind: 'overtime', ot: true }] },
  { day: 6, events: [{ title: 'Pending: Swap with Okafor', time: '19:00–24:00', kind: 'regular', pending: true }] },
  { day: 7, events: [] },
  { day: 8, events: [{ title: 'Night patrol · 75th Pct', time: '19:00–24:00', kind: 'regular', ou: true }] },
  { day: 9, events: [{ title: 'Training', time: '08:00–16:00', kind: 'regular' }] },
  { day: 10, events: [{ title: 'Sick leave', kind: 'leave' }] },
  { day: 11, events: [{ title: 'Extra patrol', time: '17:00–20:00', kind: 'overtime', ot: true, cancelled: true }, { title: 'Day patrol', time: '07:00–17:00', kind: 'regular' }] },
  { day: 12, events: [{ title: 'Day patrol', time: '07:00–17:00', kind: 'regular' }, { title: 'Submit timesheet', time: '16:00', kind: 'task' }] },
  { day: 13, events: [{ title: 'Special detail', time: '10:00–18:00', kind: 'overtime', ot: true, ou: true }] },
  { day: 14, events: [] },
]

function EventMock({ event }: { event: MockEvent }) {
  const kinds: Cell['kinds'] = [event.kind === 'task' ? 'regular' : event.kind]
  return (
    <div className={classes.event} data-kind={event.kind} data-pending={event.pending || undefined} data-cancelled={event.cancelled || undefined}>
      {!event.pending && !event.ou && !event.cancelled && event.kind !== 'task' && <Patterns kinds={kinds} />}
      {event.ou && <span className={classes.hatch} />}
      {event.kind === 'task' && <SquareCheck size={15} className={classes.eventIcon} aria-hidden="true" />}
      <span className={classes.eventText}>
        <span className={classes.eventTitle}>{event.title}</span>
        {event.time && <span className="tabular">{event.time}</span>}
      </span>
      {(event.ot || event.ou || event.reminder) && (
        <span className={classes.eventTag} aria-hidden="true">
          {event.ou && <span className={classes.tag}><ArrowUpRight size={12} strokeWidth={2} />OU</span>}
          {event.ot && <span className={classes.tag}><Clock3 size={12} strokeWidth={2} />OT</span>}
          {event.reminder && <AlarmClock size={14} />}
        </span>
      )}
    </div>
  )
}

function CalendarMock() {
  const weeks = [calendarDays.slice(0, 7), calendarDays.slice(7, 14)]
  return (
    <div className={classes.safe}>
      <div className={classes.scroller}>
        <div className={classes.month}>
          <div className={classes.monthHead}>{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <div key={day}>{day}</div>)}</div>
          {weeks.map((week, index) => (
            <div key={index} className={classes.monthWeek}>
              {week.map(({ day, events }) => (
                <div key={day} className={classes.monthDay}>
                  <span className={classes.dayNumber} data-today={day === 5 || undefined} aria-label={day === 5 ? `June ${day}, today` : undefined}>{day}</span>
                  {events.map((event) => <EventMock key={event.title} event={event} />)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className={classes.legend}>
        <span className={classes.legendItem}><Swatch kinds={['regular']} />Activity</span>
        <span className={classes.legendItem}><Swatch kinds={['leave']} />Leave (dots)</span>
        <span className={classes.legendItem}><Swatch kinds={['overtime']} />Overtime (lines, OT)</span>
        <span className={classes.legendItem}><SquareCheck size={15} aria-hidden="true" />Task (outline, checkbox)</span>
        <span className={classes.legendItem}><Swatch kinds={['regular']} ou />Out of unit (stripes, OU)</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Simulation                                                          */
/* ------------------------------------------------------------------ */

/** Machado, Oliveira and Fernandes (2009), severity 1. Applied in linear RGB, the SVG filter default. */
const simulations = [
  { id: 'cv-sim-deutan', label: 'Deuteranopia', matrix: '0.367 0.861 -0.228 0 0  0.280 0.673 0.047 0 0  -0.012 0.043 0.969 0 0  0 0 0 1 0' },
  { id: 'cv-sim-protan', label: 'Protanopia', matrix: '0.152 1.053 -0.205 0 0  0.115 0.786 0.099 0 0  -0.004 -0.048 1.052 0 0  0 0 0 1 0' },
]

function SimStrip() {
  return (
    <Stack gap={6}>
      <div className={classes.simStrip}>
        <Chip cell={{ codes: ['PatD'], kinds: ['regular'] }} tags={false} patterns={false} />
        <Chip cell={{ codes: ['Vac'], kinds: ['leave'] }} tags={false} patterns={false} />
        <Chip cell={{ codes: ['ExP'], kinds: ['overtime'] }} tags={false} patterns={false} />
      </div>
      <div className={classes.simStrip}>
        <Coverage level="under" label="Below target" icon={false}>3/4</Coverage>
        <Coverage level="met" label="On target" icon={false}>4/4</Coverage>
        <Coverage level="over" label="Above target" icon={false}>5/4</Coverage>
      </div>
    </Stack>
  )
}

function SimulationMock() {
  const rows = [
    { label: 'Current colors', safe: false },
    { label: 'Color-blind friendly', safe: true },
  ]
  return (
    <div className={classes.scroller} style={{ padding: 16 }}>
      <svg className={classes.svgDefs} aria-hidden="true" focusable="false">
        {simulations.map((sim) => <filter key={sim.id} id={sim.id}><feColorMatrix type="matrix" values={sim.matrix} /></filter>)}
      </svg>
      <div className={classes.simGrid}>
        <span />
        <span className={classes.simHead}>Typical vision</span>
        {simulations.map((sim) => <span key={sim.id} className={classes.simHead}>{sim.label} (simulated)</span>)}
        {rows.map((row) => (
          <div key={row.label} style={{ display: 'contents' }}>
            <Text size="sm" fw={600}>{row.label}</Text>
            <div className={row.safe ? classes.safe : undefined}><SimStrip /></div>
            {simulations.map((sim) => (
              <div key={sim.id} className={row.safe ? classes.safe : undefined} style={{ filter: `url(#${sim.id})` }}><SimStrip /></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Developer snippets                                                  */
/* ------------------------------------------------------------------ */

const darkValues = colorVisionTokens.filter((token) => token.light).map((token) => `  ${token.name}: ${token.value};`).join('\n')
const lightValues = colorVisionTokens.filter((token) => token.light).map((token) => `  ${token.name}: ${token.light};`).join('\n')
const sharedValues = colorVisionTokens.filter((token) => !token.light).map((token) => `  ${token.name}: ${token.value};`).join('\n')

const tokensCss = `/* 1. Cascade: theme, then agency, then the user's setting.
      Each of the six themes defines --theme-*. The agency's picks are
      written to <html> as --agency-* (never straight into --schedule-*). */
:root {
  --schedule-regular: var(--agency-regular, var(--theme-regular));
  --schedule-leave: var(--agency-leave, var(--theme-leave));
  --schedule-overtime: var(--agency-overtime, var(--theme-overtime));
  /* …same for coverage and --calendar-task */
}

/* 2. Color-blind friendly colors. Wins over the theme and the agency. */
:root[data-color-vision='safe'] {
  --schedule-regular: var(--cv-regular);
  --schedule-leave: var(--cv-leave);
  --schedule-overtime: var(--cv-overtime);
  --schedule-under-text: var(--cv-under);
  --schedule-under-bg: color-mix(in srgb, var(--cv-under) 18%, transparent);
  --schedule-over-text: var(--cv-over);
  --schedule-over-bg: color-mix(in srgb, var(--cv-over) 16%, transparent);
  --schedule-met-text: var(--cv-met);
  --schedule-met-bg: color-mix(in srgb, var(--cv-met) 12%, transparent);
  --calendar-task: transparent;
}

/* 3. The safe set. All dark themes share one set, all light themes the other.
      A theme may override these if its surfaces need it; recheck 4.5:1 for chip text. */
:root[data-mantine-color-scheme='dark'] {
${darkValues}
}
:root[data-mantine-color-scheme='light'] {
${lightValues}
}
:root {
${sharedValues}
}`

const chipCss = `/* Pattern layers sit between the fill and the text, one per half. */
.pattern {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.pattern[data-kind='leave'] {
  background: radial-gradient(var(--cv-pattern) 1.2px, transparent 1.6px) 0 0 / 6px 6px;
}
.pattern[data-kind='overtime'] {
  background: repeating-linear-gradient(0deg, var(--cv-pattern) 0 1.5px, transparent 1.5px 7px);
}
/* Split cell: the fill runs "to top right", so the line joins top-left and bottom-right. */
.pattern[data-half='a'] { clip-path: polygon(0 0, 0 100%, 100% 100%); }
.pattern[data-half='b'] { clip-path: polygon(0 0, 100% 0, 100% 100%); }

/* Out-of-unit stripes: same weight as the dots and lines. */
:root[data-color-vision='safe'] .chip[data-out-of-unit]::before {
  background: repeating-linear-gradient(135deg, var(--schedule-hatch) 0 1.5px, transparent 1.5px 8px);
}

/* Only with the setting on. Regular shifts never get a pattern,
   and out-of-unit stripes replace the dots or lines: one pattern per cell. */
:root:not([data-fill-patterns='on']) .pattern,
.chip[data-out-of-unit] .pattern { display: none; }

/* A halo in the fill color keeps the patterns away from the letters.
   Split cell: the first code sits on half a, the last on half b. */
:root[data-fill-patterns='on'] .chip .segment { --halo: var(--chip-a); }
:root[data-fill-patterns='on'] .chip .segment:last-child,
:root[data-fill-patterns='on'] .chip .tags { --halo: var(--chip-b); }
:root[data-fill-patterns='on'] .chip :is(.code, .tags),
:root[data-fill-patterns='on'] .event:not([data-pending]) :is(.eventText, .eventTag) {
  text-shadow: 0 0 2px var(--halo, var(--event-fill)), 0 0 3px var(--halo, var(--event-fill)),
    0 0 5px var(--halo, var(--event-fill));
}

/* Cancelled events: no pattern, so the line through the text stays clear. */
.event[data-cancelled] .pattern { display: none; }

/* Calendar tasks: an outline, so they never match a gray overtime fill. */
.event[data-kind='task'] {
  box-shadow: inset 0 0 0 1px var(--border-default);
}`

const coverageCss = `/* Always on, with or without the setting. */
.coverage[data-level='under'] {
  box-shadow: inset 0 0 0 1.5px currentColor;   /* outlined box */
}

/* Time-of-day bar: below target is solid with stripes, above target is dashed. */
.todSegment[data-level='under'] {
  border: 2px solid currentColor;
  background: repeating-linear-gradient(135deg,
    color-mix(in srgb, currentColor 45%, transparent) 0 2px, transparent 2px 6px);
}
.todSegment[data-level='over'] {
  border: 2px dashed currentColor;
}

/* Today: a bar under the header and a "Today" label, not just a tint. */
.dayHeader[data-today] {
  box-shadow: inset 0 -3px 0 var(--schedule-today-text);
}`

const markupTsx = `// Apply before first paint (from the profile, cached locally) to avoid a flash.
const root = document.documentElement
root.setAttribute('data-color-vision', profile.safeColors ? 'safe' : 'default')
root.setAttribute('data-fill-patterns', profile.patterns ? 'on' : 'off')

// Agency colors: write them as --agency-*, never as --schedule-*.
for (const [kind, color] of Object.entries(agency.colors)) {
  root.style.setProperty(\`--agency-\${kind}\`, color)
}

// Coverage value: icon + number + words. The icon is decorative; the label says it.
<div className="coverage" data-level={level} aria-label={\`\${have} of \${need} staff, \${levelWords[level]}\`}>
  {have}/{need}
  {level === 'met' ? <Check aria-hidden /> : <Triangle aria-hidden className={level} />}
</div>

// Shift cell: one pattern layer per non-regular half.
<div className="chip" data-a={a} data-b={b}>
  {a !== 'regular' && <span className="pattern" data-kind={a} data-half={b ? 'a' : undefined} />}
  {b && b !== 'regular' && <span className="pattern" data-kind={b} data-half="b" />}
  …codes and tags
</div>`

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const cues: { meaning: string; now: string; always: string; patterns: string }[] = [
  { meaning: 'Coverage below target', now: 'Red fill', always: '▼ icon and an outlined box. On the time-of-day bar: solid outline with stripes.', patterns: 'Orange' },
  { meaning: 'Coverage on target', now: 'Green fill', always: '✓ icon', patterns: 'Neutral gray, so only the gaps draw the eye' },
  { meaning: 'Coverage above target', now: 'Amber fill', always: '▲ icon. On the time-of-day bar: dashed outline, no fill.', patterns: 'Blue' },
  { meaning: 'Leave', now: 'Yellow fill and the code (Sick, PTO, Vac)', always: 'Code', patterns: 'Yellow with dots' },
  { meaning: 'Overtime', now: 'Red fill and the OT tag', always: 'OT tag, in the calendar too', patterns: 'Graphite with lines' },
  { meaning: 'Split cell (two kinds)', now: 'Two colors on a diagonal', always: 'Both codes', patterns: 'Each half gets its own pattern' },
  { meaning: 'Out of unit', now: 'Stripes and the OU tag', always: 'Stripes and the OU tag, in the calendar too', patterns: 'Text-colored stripes, so they show on the blue fill. They replace the dots or lines: never two patterns on one cell.' },
  { meaning: 'Cancelled', now: 'Struck through', always: 'No change', patterns: 'No pattern, so the line through the text stays clear' },
  { meaning: 'Calendar task', now: 'Gray fill', always: 'Checkbox icon and an outline', patterns: 'No fill' },
  { meaning: 'Pending', now: 'Dashed outline, stripes and “Pending:”', always: 'No change', patterns: 'No change' },
  { meaning: 'Today', now: 'Blue tint', always: 'A bar under the header and a “Today” label. In the calendar, a ring.', patterns: 'No change' },
]

export default function ColorVision() {
  return (
    <>
      <PageHeader />

      <Section id="approach" title="Approach" description="About 1 in 12 men and 1 in 200 women see colors differently. Team View, Location View and Calendar must work for them without anyone opening a setting.">
        <List spacing="sm" size="sm">
          <List.Item><Text span fw={600}>Never rely on color alone.</Text> Every color-coded meaning also has an icon, a tag, a pattern, a line style or words. This is always on, in every theme and with agency colors. It is a WCAG 2.2 requirement (1.4.1, Use of color).</List.Item>
          <List.Item><Text span fw={600}>Offer one color-blind friendly palette, not one per type.</Text> Red-green color blindness is about 99% of cases. Most people do not know their exact type, so a list of protanopia, deuteranopia and tritanopia goes unused or gets set wrong. One palette built on blue, yellow and gray covers almost everyone.</List.Item>
          <List.Item><Text span fw={600}>Make patterns optional.</Text> Dots and lines help when colors look alike, but they add noise for everyone else.</List.Item>
          <List.Item><Text span fw={600}>The settings sit on top of the theme.</Text> They work with all six themes, so there is no separate “color-blind theme” to pick and maintain.</List.Item>
        </List>
      </Section>

      <Section id="settings" title="Settings" description="Two switches in the user’s profile, next to the theme picker. They are saved to the account, so they follow the user to every device.">
        <Table.ScrollContainer minWidth={640} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th>Setting</Table.Th><Table.Th>Default</Table.Th><Table.Th>What it changes</Table.Th><Table.Th>Attribute on &lt;html&gt;</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {colorVisionSettings.map((setting) => (
                <Table.Tr key={setting.key}>
                  <Table.Td><Text size="sm" fw={600}>{setting.label}</Text></Table.Td>
                  <Table.Td><Text size="sm">{setting.defaultValue}</Text></Table.Td>
                  <Table.Td><Text size="sm">{setting.effect}</Text></Table.Td>
                  <Table.Td><CopyValue value={setting.attribute} /></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Text size="sm" c="dimmed" mt="md">Browsers and operating systems have no color-blindness preference to read, so the user has to turn this on. Mention it once in onboarding, next to the theme choice.</Text>
      </Section>

      <Section id="agency-colors" title="Agency colors" description="Agencies can pick their own shift colors. We cannot guarantee those, so the cues beyond color have to carry the meaning on their own.">
        <Table.ScrollContainer minWidth={560} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th>Order</Table.Th><Table.Th>Source</Table.Th><Table.Th>Applies when</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              <Table.Tr><Table.Td>1</Table.Td><Table.Td><Text size="sm" fw={600}>Theme</Text></Table.Td><Table.Td><Text size="sm">Always. The default for each of the six themes.</Text></Table.Td></Table.Tr>
              <Table.Tr><Table.Td>2</Table.Td><Table.Td><Text size="sm" fw={600}>Agency</Text></Table.Td><Table.Td><Text size="sm">The agency picked a color for that item. Replaces the theme color.</Text></Table.Td></Table.Tr>
              <Table.Tr><Table.Td>3</Table.Td><Table.Td><Text size="sm" fw={600}>User: Color-blind friendly colors</Text></Table.Td><Table.Td><Text size="sm">The user turned it on. Replaces both, for shift fills and coverage only.</Text></Table.Td></Table.Tr>
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <List spacing="xs" size="sm" mt="md">
          <List.Item>The user’s setting wins over the agency’s colors. A user who needs it cannot change the agency’s choice.</List.Item>
          <List.Item>Icons, tags, outlines and the “Today” label never depend on the agency’s colors.</List.Item>
          <List.Item>The agency color picker warns, but does not block, when chip text falls below 4.5:1, or when two shift kinds look alike with red-green color blindness.</List.Item>
        </List>
      </Section>

      <Section id="cues" title="Cues beyond color" description="What carries each meaning. The middle column is always on. The last column is what the two settings add.">
        <Table.ScrollContainer minWidth={760} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th>Meaning</Table.Th><Table.Th>Today</Table.Th><Table.Th>Always on</Table.Th><Table.Th>With the settings on</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {cues.map((cue) => (
                <Table.Tr key={cue.meaning}>
                  <Table.Td><Text size="sm" fw={600}>{cue.meaning}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{cue.now}</Text></Table.Td>
                  <Table.Td><Text size="sm">{cue.always}</Text></Table.Td>
                  <Table.Td><Text size="sm">{cue.patterns}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Section>

      <Section id="team-view" title="Team View" description="One week of Patrol Alpha with both settings on. Location View uses the same cells and coverage rows.">
        <div className="page-wide">
          <Preview title="Color-blind friendly colors and patterns" flush align="start">
            <div style={{ width: '100%' }}><TeamViewMock /></div>
          </Preview>
        </div>
      </Section>

      <Section id="calendar" title="Calendar" description="Two weeks of an officer’s calendar with both settings on.">
        <div className="page-wide">
          <Preview title="Color-blind friendly colors and patterns" flush align="start">
            <div style={{ width: '100%' }}><CalendarMock /></div>
          </Preview>
        </div>
      </Section>

      <Section id="simulation" title="Side by side" description="Colors only, without icons or patterns, through a simulation of the two most common types. Today, below target and on target look almost the same, and so do leave and overtime.">
        <Preview title="Simulated, approximate" flush align="start">
          <div style={{ width: '100%' }}><SimulationMock /></div>
        </Preview>
        <Text size="sm" c="dimmed" mt="md">In the simulation, the smallest difference between two shift kinds more than doubles in dark themes and grows by about 40% in light themes, where pale fills leave less room. Simulations are a check, not proof: test with people who are color blind before release.</Text>
      </Section>

      <Section id="developers" title="For developers" description="How to build this into the product.">
        <Stack gap="lg">
          <Alert icon={<Info size={17} />} variant="light" color="cyan">Nothing here changes the current guide pages. The mocks on this page use the same variables, scoped to the demo.</Alert>
          <div>
            <Title order={3} size="h4" mb="sm">Steps</Title>
            <List type="ordered" spacing="xs" size="sm">
              <List.Item>Add the two settings to the user profile and save them to the account. Turning on colors also turns on patterns; the user can turn patterns off again.</List.Item>
              <List.Item>Set <Code>data-color-vision</Code> and <Code>data-fill-patterns</Code> on <Code>&lt;html&gt;</Code> before the first paint, from a local copy of the profile, so the page does not flash.</List.Item>
              <List.Item>Route agency colors through <Code>--agency-*</Code> variables. Writing them straight into <Code>--schedule-*</Code> as inline styles would beat the user’s setting.</List.Item>
              <List.Item>Add the <Code>--cv-*</Code> tokens below. Recheck chip text contrast (4.5:1) when a theme overrides them.</List.Item>
              <List.Item>Add the cues that are always on: coverage icons, the outlined box, the time-of-day line styles, the “Today” label, OT and OU tags in the calendar, the task outline and checkbox.</List.Item>
              <List.Item>Add the pattern layers to the shift cell and the calendar event.</List.Item>
              <List.Item>Keep accessible names in words (“3 of 4 staff, below target”). Icons stay <Code>aria-hidden</Code>.</List.Item>
              <List.Item>Test in Chrome DevTools: Rendering → Emulate vision deficiencies (protanopia, deuteranopia, achromatopsia), in all six themes and with a sample of real agency colors.</List.Item>
            </List>
          </div>
          <Table.ScrollContainer minWidth={640} className="doc-table">
            <Table verticalSpacing="sm" horizontalSpacing="md">
              <Table.Thead><Table.Tr><Table.Th>Token</Table.Th><Table.Th>Dark</Table.Th><Table.Th>Light</Table.Th><Table.Th>Replaces</Table.Th><Table.Th>Use</Table.Th></Table.Tr></Table.Thead>
              <Table.Tbody>
                {colorVisionTokens.map((token) => (
                  <Table.Tr key={token.name}>
                    <Table.Td><CopyValue value={`var(${token.name})`} display={token.name} /></Table.Td>
                    <Table.Td><Text size="xs" ff="monospace">{token.value}</Text></Table.Td>
                    <Table.Td><Text size="xs" ff="monospace">{token.light ?? 'Same'}</Text></Table.Td>
                    <Table.Td><Text size="xs" ff="monospace">{token.replaces ?? '–'}</Text></Table.Td>
                    <Table.Td><Text size="sm">{token.usage}</Text></Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          <CodeBlock title="tokens.css" code={tokensCss} />
          <CodeBlock title="shift-chip.css" code={chipCss} />
          <CodeBlock title="coverage.css" code={coverageCss} />
          <CodeBlock title="TSX" code={markupTsx} />
        </Stack>
      </Section>

      <Section id="guidelines" title="Guidelines">
        <DoDont
          doItems={[
            'Pair every color with an icon, tag, pattern, line style or words.',
            'Give coverage values a ▼, ✓ or ▲ in every theme.',
            'Check new colors with a color-blindness simulation before shipping.',
            'Let the user’s color-blind setting win over agency colors.',
          ]}
          dontItems={[
            'Use red and green as the only difference between two states.',
            'Ship a separate theme for each type of color blindness.',
            'Write agency colors straight into the --schedule-* variables.',
            'Put patterns on regular shifts; they are the most common cell.',
          ]}
        />
      </Section>
    </>
  )
}
