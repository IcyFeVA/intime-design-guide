import type { TokenStatus } from './types'

export interface FontFamily {
  role: string
  name: string
  stack: string
  /** Weights in use, with their style names */
  weights: { weight: number; name: string }[]
  variable: boolean
  specimen: string
  usage: string
  status: TokenStatus
}

export const fontFamilies: FontFamily[] = [
  {
    role: 'Primary typeface',
    name: 'Roboto',
    stack: 'Roboto, "Segoe UI", system-ui, sans-serif',
    weights: [
      { weight: 400, name: 'Regular' },
      { weight: 600, name: 'SemiBold' },
      { weight: 800, name: 'ExtraBold' },
    ],
    variable: true,
    specimen: 'Aa',
    usage: 'A workhorse sans-serif tuned for screen reading. All interface text: navigation, headings, body, forms and tables.',
    status: 'confirmed',
  },
  {
    role: 'Supporting typeface',
    name: 'Cousine',
    stack: 'Cousine, ui-monospace, SFMono-Regular, Menlo, monospace',
    weights: [
      { weight: 400, name: 'Regular' },
      { weight: 700, name: 'Bold' },
    ],
    variable: false,
    specimen: 'Aa 01234',
    usage: 'For better numerical display. Primarily used in the scheduling view: shift times, durations, totals, badge numbers and unit IDs.',
    status: 'confirmed',
  },
]

export interface TypeStyle {
  /** Token name, e.g. `h1` or `md` */
  token: string
  size: number
  /** Line height in px */
  lineHeight: number
  weight: number
  /** Letter spacing in px */
  letterSpacing?: number
  uppercase?: boolean
  usage?: string
  status: TokenStatus
}

/** Heading scale (Roboto). Sizes and line heights in px. */
export const headingScale: TypeStyle[] = [
  { token: 'h1', size: 25, lineHeight: 34, weight: 600, usage: 'Page titles.', status: 'confirmed' },
  { token: 'h2', size: 22, lineHeight: 32, weight: 600, usage: 'Section titles.', status: 'confirmed' },
  { token: 'h3', size: 18, lineHeight: 28, weight: 500, usage: 'Card, panel and modal titles.', status: 'confirmed' },
  { token: 'h4', size: 12, lineHeight: 24, weight: 600, letterSpacing: 0.6, uppercase: true, usage: 'Group labels, column group headers.', status: 'confirmed' },
  { token: 'h5', size: 13, lineHeight: 20, weight: 600, letterSpacing: 0.6, uppercase: true, usage: 'Section kickers, sidebar groups.', status: 'confirmed' },
  { token: 'h6', size: 12, lineHeight: 16, weight: 700, letterSpacing: 0.6, usage: 'Small emphasized labels.', status: 'confirmed' },
]

export interface BodyVariant {
  key: string
  label: string
  weight: number
  uppercase: boolean
  usage: string
  sizes: TypeStyle[]
}

const size = (token: string, px: number, lineHeight: number, weight: number, extra: Partial<TypeStyle> = {}): TypeStyle => ({
  token, size: px, lineHeight, weight, status: 'confirmed', ...extra,
})

/** Body scale (Roboto). Each size is paired with a line height to form a complete style. */
export const bodyVariants: BodyVariant[] = [
  {
    key: 'regular',
    label: 'Regular',
    weight: 400,
    uppercase: false,
    usage: 'Default for paragraphs, table cells, form values and descriptions.',
    sizes: [
      size('xxs', 10, 13, 400), size('xs', 12, 14, 400), size('sm', 14, 20, 400),
      size('md', 16, 22, 400), size('lg', 18, 28, 400), size('xl', 20, 32, 400),
    ],
  },
  {
    key: 'semibold',
    label: 'Semi Bold',
    weight: 600,
    uppercase: false,
    usage: 'Emphasis inside body text, labels, names and selected values.',
    sizes: [
      size('xxs', 10, 13, 600, { letterSpacing: 0.3 }), size('xs', 12, 16, 600), size('sm', 14, 20, 600),
      size('md', 16, 24, 600), size('lg', 18, 28, 600), size('xl', 20, 32, 600),
    ],
  },
  {
    key: 'semibold-uppercase',
    label: 'Semi Bold & Uppercase',
    weight: 600,
    uppercase: true,
    usage: 'Short labels only: buttons, badges, tabs and overlines. Never for sentences.',
    sizes: [
      size('xxs', 10, 13, 600, { letterSpacing: 0.4, uppercase: true }), size('xs', 12, 14, 600, { uppercase: true }),
      size('sm', 14, 20, 600, { uppercase: true }), size('md', 16, 22, 600, { uppercase: true }),
      size('lg', 18, 28, 600, { uppercase: true }), size('xl', 20, 32, 600, { uppercase: true }),
    ],
  },
]

/** Mantine font size keys mapped to the regular body scale. */
export const fontSizes = Object.fromEntries(bodyVariants[0].sizes.map((style) => [style.token, `${style.size / 16}rem`]))
