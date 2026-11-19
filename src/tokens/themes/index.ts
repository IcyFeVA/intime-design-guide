import { DEFAULT_THEME } from '@mantine/core'
import type { TokenStatus } from '../types'
import darkCss from './dark.css?raw'
import lightCss from './light.css?raw'
import duskCss from './dusk.css?raw'
import miamiViceCss from './miami-vice.css?raw'
import terraCss from './terra.css?raw'
import candyCss from './candy.css?raw'

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

/**
 * Primitive ramps referenced by the exports (e.g. `--primary-primary-color-6`, `--teal-teal-8`).
 * They resolve to Mantine's default palettes with **primary = cyan**.
 */
export const primitivePalettes = [
  { key: 'primary', name: 'Primary (cyan)', mantine: 'cyan', prefixes: ['primary-primary-color', 'cyan-color-cyan'] },
  { key: 'gray', name: 'Gray', mantine: 'gray', prefixes: ['gray-gray'] },
  { key: 'teal', name: 'Teal (success)', mantine: 'teal', prefixes: ['teal-teal'] },
  { key: 'yellow', name: 'Yellow (warning)', mantine: 'yellow', prefixes: ['yellow-yellow', 'yellow-teal-yellow'] },
  { key: 'red', name: 'Red (error)', mantine: 'red', prefixes: ['red-red'] },
  { key: 'blue', name: 'Blue (info)', mantine: 'blue', prefixes: ['blue-blue'] },
  { key: 'indigo', name: 'Indigo', mantine: 'indigo', prefixes: ['indigo-indigo'] },
  { key: 'pink', name: 'Pink', mantine: 'pink', prefixes: ['pink-pink'] },
].map((palette) => ({ ...palette, shades: DEFAULT_THEME.colors[palette.mantine] as readonly string[] }))

/** Alpha variants referenced by the export (`primary-color-dark-15`, `-light-10`, …). */
const primaryAlpha: Record<string, number> = { 'dark-15': 0.15, 'dark-20': 0.2, 'light-10': 0.1, 'light-12': 0.12 }

const toHex8 = (hex: string, alpha: number) =>
  `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`

function resolvePrimitive(name: string): string | undefined {
  for (const palette of primitivePalettes) {
    for (const prefix of palette.prefixes) {
      if (!name.startsWith(`${prefix}-`)) continue
      const rest = name.slice(prefix.length + 1)
      if (/^\d$/.test(rest)) return palette.shades[Number(rest)]
      if (palette.key === 'primary' && rest in primaryAlpha) return toHex8(palette.shades[6], primaryAlpha[rest])
    }
  }
  return undefined
}

/* ------------------------------------------------------------------ */
/* Parsing + resolution                                                */
/* ------------------------------------------------------------------ */

export interface ThemeToken {
  /** CSS custom property without leading dashes, e.g. `background-body` */
  name: string
  /** Value exactly as exported */
  raw: string
  /** Resolved literal (hex / hex8 / px) */
  value: string
  /** Primitive alias when the export used `var(--…)`, e.g. `teal-teal-8` */
  alias?: string
  /** True when the value relies on an assumed primitive */
  assumed: boolean
  /** Opacity the guide added because the Figma export dropped it (see `exportAlphaFixes`) */
  addedAlpha?: number
}

/**
 * The Figma export drops the alpha channel, so translucent variables arrive as solid colors
 * (`--background-error-light: #fa5252`, `--background-transparent: #ffffff`).
 * Until the export keeps alpha, the guide adds it back to solid hex values of these tokens.
 */
export const exportAlphaFixes: { test: RegExp; alpha: number; label: string }[] = [
  { test: /^background-[\w-]+-light$/, alpha: 0.16, label: 'background-*-light' },
  { test: /^background-[\w-]+-light-hover$/, alpha: 0.2, label: 'background-*-light-hover' },
  { test: /^background-transparent$/, alpha: 0, label: 'background-transparent' },
]

function addExportAlpha(name: string, value: string) {
  if (!/^#[0-9a-f]{6}$/i.test(value)) return undefined
  return exportAlphaFixes.find((fix) => fix.test.test(name))?.alpha
}

function parse(css: string) {
  const entries = new Map<string, string>()
  for (const match of css.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) entries.set(match[1], match[2].trim())
  return entries
}

function resolveTheme(css: string): Record<string, ThemeToken> {
  const entries = parse(css)
  const resolve = (raw: string, depth = 0): { value: string; alias?: string; assumed: boolean } => {
    const ref = raw.match(/^var\(--([\w-]+)\)$/)
    if (!ref || depth > 5) return { value: raw, assumed: false }
    const inTheme = entries.get(ref[1])
    if (inTheme) return { ...resolve(inTheme, depth + 1), alias: ref[1] }
    const primitive = resolvePrimitive(ref[1])
    return { value: primitive ?? raw, alias: ref[1], assumed: true }
  }
  return Object.fromEntries(
    [...entries].map(([name, raw]) => {
      const resolved = resolve(raw)
      const addedAlpha = addExportAlpha(name, resolved.value)
      if (addedAlpha === undefined) return [name, { name, raw, ...resolved }]
      return [name, { name, raw, ...resolved, value: toHex8(resolved.value, addedAlpha), addedAlpha }]
    }),
  )
}

/* ------------------------------------------------------------------ */
/* Theme registry                                                      */
/* ------------------------------------------------------------------ */

export interface ThemeDef {
  id: string
  label: string
  /** Mantine color scheme this theme renders on */
  scheme: 'dark' | 'light'
  description: string
  status: TokenStatus
  source: string
  tokens: Record<string, ThemeToken>
}

/** Add future themes (high contrast, color-blind, …) here with their exported CSS. */
export const themes: ThemeDef[] = [
  {
    id: 'dark', label: 'Dark', scheme: 'dark', status: 'confirmed', source: darkCss, tokens: resolveTheme(darkCss),
    description: 'Default theme. Optimised for long shifts, dispatch rooms and night use.',
  },
  {
    id: 'light', label: 'Light', scheme: 'light', status: 'confirmed', source: lightCss, tokens: resolveTheme(lightCss),
    description: 'High ambient light: offices, vehicles in daylight, printing.',
  },
  {
    id: 'dusk', label: 'Dusk', scheme: 'dark', status: 'confirmed', source: duskCss, tokens: resolveTheme(duskCss),
    description: 'Dark navy with a violet accent.',
  },
  {
    id: 'miami-vice', label: 'Miami Vice', scheme: 'dark', status: 'confirmed', source: miamiViceCss, tokens: resolveTheme(miamiViceCss),
    description: 'Near-black with a magenta accent and cyan titles.',
  },
  {
    id: 'terra', label: 'Terra', scheme: 'light', status: 'confirmed', source: terraCss, tokens: resolveTheme(terraCss),
    description: 'Warm off-white with sage green and clay accents.',
  },
  {
    id: 'candy', label: 'Candy', scheme: 'light', status: 'confirmed', source: candyCss, tokens: resolveTheme(candyCss),
    description: 'Light gray with a pink accent and purple links.',
  },
]

export const plannedThemes = [
  { id: 'color-blind', label: 'Color-blind safe', description: 'Signal colors tuned for protanopia, deuteranopia and tritanopia. Same token names, new values.' },
  { id: 'high-contrast', label: 'High contrast', description: 'Stronger borders and text for bright sunlight and low-vision users.' },
]

export const findTheme = (id: string) => themes.find((theme) => theme.id === id) ?? themes[0]

/** Every token name across all themes, in export order of the first theme. */
export const allTokenNames = [...new Set(themes.flatMap((theme) => Object.keys(theme.tokens)))]

export const isColorToken = (name: string) => !/^(radius|padding|spacing)-/.test(name)

/** Mantine and guide variables that read from a theme token. Used by `src/theme.ts` and the theme export. */
export const mantineAliases: [cssVar: string, token: string][] = [
  ['--mantine-color-body', 'background-body'],
  ['--mantine-color-text', 'text-default'],
  ['--mantine-color-dimmed', 'text-dimmed'],
  ['--mantine-color-placeholder', 'text-placeholder'],
  ['--mantine-color-anchor', 'text-link'],
  ['--mantine-color-error', 'text-error-default'],
  ['--mantine-color-default', 'background-default'],
  ['--mantine-color-default-hover', 'background-default-hover'],
  ['--mantine-color-default-border', 'border-default'],
  ['--intime-surface', 'background-default'],
  ['--intime-surface-raised', 'background-default-hover'],
  ['--intime-border', 'border-default'],
]

/* ------------------------------------------------------------------ */
/* Presentation groups (mirrors the Figma colors frame)                */
/* ------------------------------------------------------------------ */

export interface SwatchDef {
  /** Token name without `--` */
  token: string
  label: string
}

const sw = (token: string, label: string): SwatchDef => ({ token, label })

export const mainUiSwatches: SwatchDef[] = [
  sw('background-framework-alt', 'framework-alt'),
  sw('background-body', 'body'),
  sw('background-body-alt', 'body-alt'),
  sw('background-framework', 'framework'),
  sw('background-default', 'default'),
  sw('background-default-hover', 'default-hover'),
  sw('background-disabled-default', 'disabled'),
]

export interface SignalGroup {
  key: string
  title: string
  description: string
  swatches: SwatchDef[]
}

const signal = (key: string, title: string, description: string, variants = ['filled', 'filled-hover', 'light', 'light-hover']): SignalGroup => ({
  key,
  title,
  description,
  swatches: variants.map((variant) => sw(`background-${key}-${variant}`, variant)),
})

export const signalGroups: SignalGroup[] = [
  signal('primary', 'CTA', 'Primary actions and selected states. Use sparingly. The accent is a signal, not a surface.'),
  signal('success', 'Success', 'Saved, approved, fully staffed.'),
  signal('warning', 'Warning / Alert', 'Approaching limits, understaffed shifts, pending approval.'),
  signal('error', 'Danger / Error', 'Conflicts, failed validation, destructive actions.'),
  {
    key: 'info',
    title: 'Information / Education',
    description: 'Neutral notices, tips and onboarding.',
    swatches: [sw('background-info', 'filled'), sw('background-info-light', 'light')],
  },
  // signal('indigo', 'Indigo', 'Secondary accent for categorisation (e.g. tags, training).'),
  signal('gray', 'Gray', 'Neutral actions and inactive status.'),
]

export const textSignalSwatches: SwatchDef[] = [
  sw('text-link', 'Text Links / Primary'),
  sw('text-success-default', 'Text Success'),
  sw('text-warning-default', 'Text Warning'),
  sw('text-error-default', 'Text Error'),
  sw('text-info', 'Text Info'),
  // sw('text-indigo-default', 'Text Indigo'),
]

export const alertExamples = [
  { key: 'success', background: 'background-success-light', text: 'text-success-default' },
  { key: 'warning', background: 'background-warning-light', text: 'text-warning-default' },
  { key: 'error', background: 'background-error-light', text: 'text-error-default' },
  { key: 'info', background: 'background-info-light', text: 'text-info' },
]

export const textSwatches: SwatchDef[] = [
  sw('text-title', 'Title'),
  sw('text-default', 'Default'),
  sw('text-dimmed', 'Dimmed'),
  sw('text-placeholder', 'Placeholder'),
  sw('text-disabled-default', 'Disabled'),
  sw('text-primary-default', 'Primary'),
  sw('text-gray-default', 'Gray'),
  sw('text-error-disabled', 'Error disabled'),
]

export const borderSwatches: SwatchDef[] = [
  sw('border-default', 'Default'),
  sw('border-primary-default', 'Primary'),
  sw('border-success-default', 'Success'),
  sw('border-warning-default', 'Warning'),
  sw('border-error-default', 'Error'),
  sw('border-border-info', 'Info'),
  sw('border-gray-default', 'Gray'),
  sw('border-indigo-default', 'Indigo'),
]

export const grayScaleSwatches: SwatchDef[] = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((step) => sw(`gray-${step}`, `gray-${step}`))

export const neutralSwatches: SwatchDef[] = [
  sw('neutral-white', 'white'),
  sw('neutral-black', 'black'),
  sw('background-transparent', 'transparent'),
  sw('background-gray-light', 'gray-light'),
]
