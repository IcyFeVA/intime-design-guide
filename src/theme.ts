import { createTheme, type CSSVariablesResolver, type MantineColorsTuple } from '@mantine/core'
import { brandPalettes, neutralPalette } from './tokens/colors'
import { findTheme, isColorToken, type ThemeDef } from './tokens/themes'
import { fontFamilies, fontSizes, headingScale } from './tokens/typography'
import { radius, shadows, spacing } from './tokens/scales'
import { navCssVariables } from './tokens/navigation'
import { scheduleCssVariables, scheduleDarkVariables, scheduleLightVariables } from './tokens/schedule'
import { calendarCssVariables, calendarDarkVariables, calendarLightVariables } from './tokens/calendar'
import { colorVisionCssVariables, colorVisionDarkVariables, colorVisionLightVariables } from './tokens/colorVision'

const toRecord = <T extends { name: string; value: string }>(items: T[]) =>
  Object.fromEntries(items.map((item) => [item.name, item.value]))

const colors: Record<string, MantineColorsTuple> = Object.fromEntries(
  [...brandPalettes, neutralPalette].map((palette) => [palette.key, palette.shades]),
)

const heading = (token: string) => {
  const style = headingScale.find((item) => item.token === token)!
  return { fontSize: `${style.size / 16}rem`, lineHeight: `${style.lineHeight / style.size}`, fontWeight: String(style.weight) }
}

/** Theme generated from `src/tokens/*`. Edit tokens, not this file, when Figma values change. */
export const theme = createTheme({
  primaryColor: 'intime',
  primaryShade: { light: 8, dark: 9 },
  colors,
  fontFamily: fontFamilies[0].stack,
  fontFamilyMonospace: fontFamilies[1].stack,
  fontSizes,
  defaultRadius: 'sm',
  radius: toRecord(radius),
  spacing: toRecord(spacing),
  shadows: toRecord(shadows),
  cursorType: 'pointer',
  focusRing: 'auto',
  headings: {
    fontFamily: fontFamilies[0].stack,
    fontWeight: '600',
    sizes: {
      h1: heading('h1'),
      h2: heading('h2'),
      h3: heading('h3'),
      h4: heading('h4'),
      h5: heading('h5'),
      h6: heading('h6'),
    },
  },
  components: {
    Tooltip: { defaultProps: { withArrow: true, openDelay: 150 } },
    Badge: { defaultProps: { radius: 'sm' } },
    Paper: { defaultProps: { radius: 'md' } },
    Card: { defaultProps: { radius: 'md' } },
  },
})

/** Exposes every exported theme token as a CSS variable plus Mantine/guide aliases. */
function schemeVariables(theme: ThemeDef): Record<string, string> {
  const token = (name: string) => theme.tokens[name].value
  const exported = Object.fromEntries(
    Object.values(theme.tokens)
      .filter((item) => isColorToken(item.name))
      .map((item) => [`--${item.name}`, item.value]),
  )
  return {
    ...exported,
    '--mantine-color-body': token('background-body'),
    '--mantine-color-text': token('text-default'),
    '--mantine-color-dimmed': token('text-dimmed'),
    '--mantine-color-placeholder': token('text-placeholder'),
    '--mantine-color-anchor': token('text-link'),
    '--mantine-color-error': token('text-error-default'),
    '--mantine-color-default': token('background-default'),
    '--mantine-color-default-hover': token('background-default-hover'),
    '--mantine-color-default-border': token('border-default'),
    '--intime-surface': token('background-default'),
    '--intime-surface-raised': token('background-default-hover'),
    '--intime-border': token('border-default'),
  }
}

export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: { ...navCssVariables, ...scheduleCssVariables, ...calendarCssVariables, ...colorVisionCssVariables },
  light: { ...schemeVariables(findTheme('light')), ...scheduleLightVariables, ...calendarLightVariables, ...colorVisionLightVariables },
  dark: { ...schemeVariables(findTheme('dark')), ...scheduleDarkVariables, ...calendarDarkVariables, ...colorVisionDarkVariables },
})
