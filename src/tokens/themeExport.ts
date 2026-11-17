import { allPalettes } from './colors'
import { fontFamilies, fontSizes, headingScale } from './typography'
import { breakpoints, radius, shadows, spacing } from './scales'
import { isColorToken, mantineAliases, themes, type ThemeDef } from './themes'

/* ------------------------------------------------------------------ */
/* theme.ts                                                            */
/* ------------------------------------------------------------------ */

const record = (items: { name: string; value: string }[]) => Object.fromEntries(items.map((item) => [item.name, item.value]))

/** The Mantine theme object, shared by every InTime theme. Colors per theme come from the CSS file. */
export const themeConfig = {
  primaryColor: 'intime',
  primaryShade: { light: 8, dark: 9 },
  fontFamily: fontFamilies[0].stack,
  fontFamilyMonospace: fontFamilies[1].stack,
  fontSizes,
  defaultRadius: 'sm',
  colors: Object.fromEntries(allPalettes.map((palette) => [palette.key, palette.shades])),
  spacing: record(spacing),
  radius: record(radius),
  shadows: record(shadows),
  breakpoints: record(breakpoints),
  headings: {
    sizes: Object.fromEntries(headingScale.map((item) => [
      item.token,
      { fontSize: `${item.size / 16}rem`, lineHeight: (item.lineHeight / item.size).toFixed(3), fontWeight: String(item.weight) },
    ])),
  },
}

export const themeTs = `import { createTheme } from '@mantine/core'

/**
 * One Mantine theme for all InTime themes (Dark, Light, Dusk, …).
 * Fonts, sizes, spacing and radius live here. Colors per theme come from
 * intime-themes.css, keyed on <html data-intime-theme="…">.
 */
export const theme = createTheme(${JSON.stringify(themeConfig, null, 2)})
`

/* ------------------------------------------------------------------ */
/* Theme switching                                                     */
/* ------------------------------------------------------------------ */

const schemeMap = themes.map((theme) => `  ${/^[a-z]+$/.test(theme.id) ? theme.id : `'${theme.id}'`}: '${theme.scheme}',`).join('\n')

export const switcherTs = `import { useMantineColorScheme } from '@mantine/core'

/** Every InTime theme and the Mantine color scheme it renders on. */
export const intimeThemes = {
${schemeMap}
} as const

export type IntimeTheme = keyof typeof intimeThemes

const STORAGE_KEY = 'intime-theme'

/** Call once before React renders (main.tsx), so the first paint has the right colors. */
export function applyStoredTheme() {
  const stored = localStorage.getItem(STORAGE_KEY) as IntimeTheme | null
  if (stored && stored in intimeThemes) document.documentElement.setAttribute('data-intime-theme', stored)
}

/** Returns a function that switches theme: sets the attribute and Mantine's color scheme. */
export function useIntimeTheme() {
  const { setColorScheme } = useMantineColorScheme()
  return (id: IntimeTheme) => {
    document.documentElement.setAttribute('data-intime-theme', id)
    localStorage.setItem(STORAGE_KEY, id)
    setColorScheme(intimeThemes[id])
  }
}
`

export const mainTsx = `import '@mantine/core/styles.css'
import './intime-themes.css' // after Mantine's styles
import { MantineProvider } from '@mantine/core'
import { theme } from './theme'
import { applyStoredTheme } from './intime-theme'

applyStoredTheme()

createRoot(document.getElementById('root')!).render(
  <MantineProvider theme={theme} defaultColorScheme="dark">
    <App />
  </MantineProvider>,
)
`

export const selectTsx = `import { Select } from '@mantine/core'
import { useIntimeTheme, type IntimeTheme } from './intime-theme'

export function ThemeSelect() {
  const setTheme = useIntimeTheme()
  return (
    <Select
      label="Theme"
      defaultValue={document.documentElement.getAttribute('data-intime-theme') ?? 'dark'}
      data={[
${themes.map((theme) => `        { value: '${theme.id}', label: '${theme.label}' },`).join('\n')}
      ]}
      onChange={(value) => value && setTheme(value as IntimeTheme)}
    />
  )
}`

/* ------------------------------------------------------------------ */
/* intime-themes.css                                                   */
/* ------------------------------------------------------------------ */

/** Mantine's primary-color variables, pointed at the theme's primary tokens. */
export const primaryAliases: [cssVar: string, token: string][] = [
  ['filled', 'background-primary-filled'],
  ['filled-hover', 'background-primary-filled-hover'],
  ['light', 'background-primary-light'],
  ['light-hover', 'background-primary-light-hover'],
  ['light-color', 'text-primary-default'],
].flatMap(([suffix, token]) => [
  [`--mantine-primary-color-${suffix}`, token] as [string, string],
  [`--mantine-color-${themeConfig.primaryColor}-${suffix}`, token] as [string, string],
]).concat([
  [`--mantine-color-${themeConfig.primaryColor}-text`, 'text-primary-default'],
  [`--mantine-color-${themeConfig.primaryColor}-outline`, 'border-primary-default'],
  [`--mantine-color-${themeConfig.primaryColor}-outline-hover`, 'background-primary-light'],
])

/** Base themes also apply when no `data-intime-theme` is set, so a plain light/dark toggle keeps working. */
const isBase = (theme: ThemeDef) => theme.id === theme.scheme

export function themeSelector(theme: ThemeDef) {
  const scheme = `:root[data-mantine-color-scheme='${theme.scheme}']`
  const selector = `${scheme}[data-intime-theme='${theme.id}']`
  return isBase(theme) ? `${scheme}:not([data-intime-theme]),\n${selector}` : selector
}

export function themeCss(theme: ThemeDef) {
  const tokens = Object.values(theme.tokens).filter((token) => isColorToken(token.name))
  const width = Math.max(...tokens.map((token) => token.name.length)) + 3
  const line = (name: string, value: string) => `  ${`${name}:`.padEnd(width)} ${value};`
  return `/* ${theme.label} · ${theme.scheme} scheme · ${theme.status} */
${themeSelector(theme)} {
${tokens.map((token) => line(`--${token.name}`, token.value)).join('\n')}

  /* Mantine and app aliases */
${[...mantineAliases, ...primaryAliases].map(([cssVar, token]) => `  ${cssVar}: var(--${token});`).join('\n')}
}
`
}

const cssHeader = `/*
 * InTime themes for Mantine, generated from the Figma variable exports.
 * Import after '@mantine/core/styles.css'.
 * Switch with <html data-intime-theme="dusk"> plus Mantine's color scheme (see intime-theme.ts).
 * Without data-intime-theme, Dark and Light apply, so the plain light/dark toggle still works.
 * Spacing, radius and padding are in theme.ts, not here.
 */
`

export const allThemesCss = `${cssHeader}\n${themes.map(themeCss).join('\n')}`

/** Tokens in non-cyan themes that still point at the cyan primary ramp. Likely Figma leftovers. */
export const cyanLeftovers = themes
  .filter((theme) => !isBase(theme))
  .flatMap((theme) => Object.values(theme.tokens)
    .filter((token) => token.alias && /^(primary-primary-color|cyan-)/.test(token.alias))
    .map((token) => ({ theme, token })))
