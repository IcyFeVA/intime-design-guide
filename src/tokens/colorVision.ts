import type { TokenStatus } from './types'

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export interface ColorVisionSetting {
  key: 'safeColors' | 'patterns'
  label: string
  /** Attribute the app sets on <html> when the setting is on */
  attribute: string
  defaultValue: string
  effect: string
}

/** Per-user settings. They sit next to the theme picker and work with all six themes. */
export const colorVisionSettings: ColorVisionSetting[] = [
  {
    key: 'safeColors',
    label: 'Color-blind friendly colors',
    attribute: 'data-color-vision="safe"',
    defaultValue: 'Off',
    effect: 'Swaps the shift and coverage colors for a blue, yellow and gray set that stays distinct with red-green color blindness. Replaces agency colors for those items.',
  },
  {
    key: 'patterns',
    label: 'Patterns on shift fills',
    attribute: 'data-fill-patterns="on"',
    defaultValue: 'Off. Turns on with the setting above.',
    effect: 'Adds dots to leave and lines to overtime, in both halves of a split cell. Out-of-unit stripes stay as they are.',
  },
]

/* ------------------------------------------------------------------ */
/* CSS variables                                                       */
/* ------------------------------------------------------------------ */

export interface ColorVisionToken {
  name: `--cv-${string}`
  /** Dark value, or the value for both schemes when `light` is not set */
  value: string
  light?: string
  /** The product variable it replaces when the setting is on */
  replaces?: string
  usage: string
  status: TokenStatus
}

const t = (name: ColorVisionToken['name'], value: string, usage: string, light?: string, replaces?: string): ColorVisionToken =>
  ({ name, value, light, replaces, usage, status: 'confirmed' })

/**
 * Color-blind friendly set. Picked by simulating protanopia, deuteranopia and tritanopia
 * (Machado 2009) and keeping chip text at 4.5:1 or more in both schemes.
 */
export const colorVisionTokens: ColorVisionToken[] = [
  t('--cv-regular', '#2563a8', 'Regular shifts: blue.', '#9fc3f3', '--schedule-regular'),
  t('--cv-leave', '#5c4a00', 'Leave: dark yellow (dark) or pale yellow (light).', '#fbf2b4', '--schedule-leave'),
  t('--cv-overtime', '#3a3a44', 'Overtime: graphite. Red and green are the hues that fail, so overtime moves to a neutral.', '#d6d6dc', '--schedule-overtime'),
  t('--cv-under', '#f08c3a', 'Coverage below target: orange.', '#c25400', '--schedule-under-text'),
  t('--cv-over', '#5aa9f0', 'Coverage above target: blue.', '#1a6fc4', '--schedule-over-text'),
  t('--cv-met', 'var(--text-dimmed)', 'Coverage on target: neutral, so only the gaps draw the eye.', undefined, '--schedule-met-text'),
  t('--cv-pattern', 'color-mix(in srgb, var(--schedule-chip-text) 24%, transparent)', 'Dots and lines laid over a shift fill.'),
]

export const colorVisionCssVariables: Record<string, string> = Object.fromEntries(
  colorVisionTokens.filter((token) => !token.light).map((token) => [token.name, token.value]),
)
export const colorVisionDarkVariables: Record<string, string> = Object.fromEntries(
  colorVisionTokens.filter((token) => token.light).map((token) => [token.name, token.value]),
)
export const colorVisionLightVariables: Record<string, string> = Object.fromEntries(
  colorVisionTokens.filter((token) => token.light).map((token) => [token.name, token.light!]),
)
