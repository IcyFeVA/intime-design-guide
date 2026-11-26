import { DEFAULT_THEME, type MantineColorsTuple } from '@mantine/core'
import type { TokenStatus } from './types'
import { findTheme } from './themes'

const dark = findTheme('dark').tokens
const light = findTheme('light').tokens
const v = (tokens: typeof dark, name: string) => tokens[name].value

export interface Palette {
  /** Mantine color key, e.g. `intime` -> `--mantine-color-intime-6` */
  key: string
  name: string
  description: string
  status: TokenStatus
  shades: MantineColorsTuple
  /** Shade used as the default `filled` color */
  primaryShade: number
}

export const brandPalettes: Palette[] = [
  {
    key: 'intime',
    name: 'Primary (cyan)',
    description: 'Primary brand and interaction color. CTAs, links, focus rings, selected states. Mantine key `intime` maps to the cyan primitive ramp.',
    status: 'review',
    primaryShade: 6,
    shades: DEFAULT_THEME.colors.cyan,
  },
  {
    key: 'police',
    name: 'Police',
    description: 'Department accent for law enforcement units, rosters and tags.',
    status: 'draft',
    primaryShade: 5,
    shades: ['#ecefff', '#d5dafc', '#a9b1f3', '#7b86eb', '#5562e4', '#3d4be0', '#303fdf', '#2332c6', '#1c2cb2', '#10249e'],
  },
  {
    key: 'fire',
    name: 'Fire',
    description: 'Department accent for fire and EMS units, rosters and tags.',
    status: 'draft',
    primaryShade: 6,
    shades: ['#fff0e8', '#ffdfd2', '#fdbca3', '#fb9771', '#f97746', '#f8632b', '#f8581c', '#dd4710', '#c53d0a', '#ac3102'],
  },
]

/**
 * Neutral surface ramp used as Mantine's `dark` palette.
 * 0 = primary text in dark mode, 9 = deepest background.
 */
export const neutralPalette: Palette = {
  key: 'dark',
  name: 'Dark neutrals',
  description: 'Mantine `dark` ramp derived from the dark theme export: 0 text, 2 dimmed, 3 placeholder, 4 border, 5 hover, 6 default surface, 7 body, 8 body-alt, 9 framework-alt.',
  status: 'review',
  primaryShade: 7,
  shades: [
    v(dark, 'text-default'), '#cfdbe8', v(dark, 'text-dimmed'), v(dark, 'text-placeholder'), v(dark, 'border-default'),
    v(dark, 'background-default-hover'), v(dark, 'background-default'), v(dark, 'background-body'),
    v(dark, 'background-body-alt'), v(dark, 'background-framework-alt'),
  ],
}

export interface SurfaceToken {
  name: string
  cssVar: string
  dark: string
  light: string
  usage: string
  status: TokenStatus
}

const surface = (name: string, token: string, cssVar: string, usage: string): SurfaceToken => ({
  name, cssVar, usage, status: 'confirmed', dark: v(dark, token), light: v(light, token),
})

/** Guide-level aliases onto the exported theme tokens. */
export const surfaceTokens: SurfaceToken[] = [
  surface('Background', 'background-body', '--background-body', 'App canvas behind all content.'),
  surface('Surface', 'background-default', '--background-default', 'Cards, panels, table containers.'),
  surface('Surface raised', 'background-default-hover', '--background-default-hover', 'Hovered rows, popovers, menus.'),
  surface('Border', 'border-default', '--border-default', 'Dividers, card outlines, table grid lines.'),
  surface('Text primary', 'text-default', '--text-default', 'Body copy.'),
  surface('Text secondary', 'text-dimmed', '--text-dimmed', 'Descriptions, metadata.'),
]

export interface SemanticToken {
  name: string
  /** Mantine color key */
  mantine: string
  usage: string
  status: TokenStatus
}

export const semanticTokens: SemanticToken[] = [
  { name: 'Success', mantine: 'teal', usage: 'Confirmed saves, approved requests, fully staffed.', status: 'confirmed' },
  { name: 'Warning', mantine: 'yellow', usage: 'Approaching overtime limits, understaffed shifts.', status: 'confirmed' },
  { name: 'Danger', mantine: 'red', usage: 'Destructive actions, conflicts, failed validation.', status: 'confirmed' },
  { name: 'Info', mantine: 'blue', usage: 'Neutral notices, tips, informational banners.', status: 'confirmed' },
]

/**
 * Delete and other destructive buttons (`color="red"`, filled or light variant): error-light background, error text.
 * The theme applies these to every red Button and ActionIcon, so pages don't style them one by one.
 */
export const destructiveAction = {
  background: 'var(--background-error-light)',
  hover: 'var(--background-error-light-hover)',
  text: 'var(--text-error-default)',
  status: 'review' as TokenStatus,
}

export const allPalettes: Palette[] = [...brandPalettes, neutralPalette]
