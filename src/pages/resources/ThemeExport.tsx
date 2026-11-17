import { useState } from 'react'
import { Badge, Button, Code, Group, List, SegmentedControl, Table, Text } from '@mantine/core'
import { Download } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import CodeBlock from '../../components/CodeBlock'
import CopyValue from '../../components/CopyValue'
import { mantineAliases, themes, type ThemeDef } from '../../tokens/themes'
import {
  allThemesCss, cyanLeftovers, mainTsx, primaryAliases, selectTsx, switcherTs, themeCss, themeSelector, themeTs,
} from '../../tokens/themeExport'
import classes from './ThemeExport.module.css'

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function DownloadButton({ filename, text }: { filename: string; text: string }) {
  return (
    <Button size="xs" variant="default" leftSection={<Download size={14} aria-hidden />} onClick={() => download(filename, text)}>
      {filename}
    </Button>
  )
}

function ThemeDots({ theme }: { theme: ThemeDef }) {
  const t = (name: string) => theme.tokens[name].value
  return (
    <span className={classes.dots} style={{ background: t('background-body'), borderColor: t('border-default') }} aria-hidden="true">
      <span style={{ background: t('background-primary-filled') }} />
      <span style={{ background: t('text-link') }} />
      <span style={{ background: t('text-default') }} />
    </span>
  )
}

const files = [
  { name: 'theme.ts', text: themeTs, use: 'Mantine theme: fonts, sizes, spacing, radius, shadows and palettes. The same for every theme.' },
  { name: 'intime-themes.css', text: allThemesCss, use: 'Color tokens for all six themes, plus the Mantine variables that read them.' },
  { name: 'intime-theme.ts', text: switcherTs, use: 'Theme list and a hook that switches theme and color scheme together.' },
]

const ALL = 'all'

/** Light themes first, then dark. */
const themesByScheme = [...themes].sort((a, b) => (a.scheme === b.scheme ? 0 : a.scheme === 'light' ? -1 : 1))

/** "Values to check" is hidden for now. Set to `true` (and add 'to-check' back to the registry) to show it. */
const SHOW_TO_CHECK = false

export default function ThemeExport() {
  const [selected, setSelected] = useState(ALL)
  const theme = themes.find((item) => item.id === selected)
  const css = theme ? themeCss(theme) : allThemesCss
  const filename = theme ? `intime-${theme.id}.css` : 'intime-themes.css'

  return (
    <>
      <PageHeader />

      <Section id="files" title="Files" description="Three files bring the InTime themes into a Mantine app. Copy them from the sections below or download them here.">
        <Table.ScrollContainer minWidth={560} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th>File</Table.Th><Table.Th>What it holds</Table.Th><Table.Th /></Table.Tr></Table.Thead>
            <Table.Tbody>
              {files.map((file) => (
                <Table.Tr key={file.name}>
                  <Table.Td><Code>{file.name}</Code></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{file.use}</Text></Table.Td>
                  <Table.Td ta="right"><DownloadButton filename={file.name} text={file.text} /></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Section>

      <Section id="themes" title="Themes" description="Mantine has two color schemes, light and dark. Each InTime theme sits on one of them and is picked with the data-intime-theme attribute on <html>.">
        <Table.ScrollContainer minWidth={560} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr><Table.Th>Theme</Table.Th><Table.Th>Scheme</Table.Th><Table.Th>Attribute</Table.Th><Table.Th /></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {themesByScheme.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>
                    <Group gap="sm" wrap="nowrap">
                      <ThemeDots theme={item} />
                      <div>
                        <Text size="sm" fw={600}>{item.label}</Text>
                        <Text size="xs" c="dimmed">{item.description}</Text>
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td><Badge variant="light" color="gray" size="sm">{item.scheme}</Badge></Table.Td>
                  <Table.Td><CopyValue value={`data-intime-theme="${item.id}"`} /></Table.Td>
                  <Table.Td ta="right"><DownloadButton filename={`intime-${item.id}.css`} text={themeCss(item)} /></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Text size="xs" c="dimmed" mt="sm">Dark and Light also apply when the attribute is missing, so an app that only toggles light and dark keeps working unchanged.</Text>
      </Section>

      <Section id="css" title="Theme CSS" description="Color tokens per theme, resolved to hex. Each block also points Mantine's body, text, border and primary-color variables at the tokens, so Mantine components follow the theme.">
        <Group justify="space-between" mb="md" gap="sm">
          <div className={classes.picker}>
            <SegmentedControl
              size="xs"
              value={selected}
              onChange={setSelected}
              aria-label="Theme to show"
              data={[{ value: ALL, label: 'All themes' }, ...themesByScheme.map((item) => ({ value: item.id, label: item.label }))]}
            />
          </div>
          <DownloadButton filename={filename} text={css} />
        </Group>
        {theme && (
          <Text size="xs" c="dimmed" mb="sm">
            Selector: <Code>{themeSelector(theme).replace(',\n', ', ')}</Code>
          </Text>
        )}
        <div className={classes.code}>
          <CodeBlock code={css} title={filename} />
        </div>
        <Text size="xs" c="dimmed" mt="sm">Import it after <Code>@mantine/core/styles.css</Code>. Spacing, radius and padding tokens are left out: they are in theme.ts.</Text>
      </Section>

      <Section id="theme-ts" title="Mantine theme" description="One createTheme for all six themes. Colors change through the CSS file, so the theme object never needs to switch.">
        <Group mb="md"><DownloadButton filename="theme.ts" text={themeTs} /></Group>
        <div className={classes.code}>
          <CodeBlock code={themeTs} title="theme.ts" />
        </div>
      </Section>

      <Section id="switching" title="Switching themes" description="Switching sets the attribute and Mantine's color scheme together. Mantine remembers the scheme; the hook stores the theme next to it.">
        <Group mb="md"><DownloadButton filename="intime-theme.ts" text={switcherTs} /></Group>
        <CodeBlock code={switcherTs} title="intime-theme.ts" />
        <Text size="sm" fw={600} mt="lg" mb="xs">Mount it</Text>
        <CodeBlock code={mainTsx} title="main.tsx" />
        <Text size="sm" fw={600} mt="lg" mb="xs">Let people pick</Text>
        <CodeBlock code={selectTsx} title="ThemeSelect.tsx" />
        <Text size="xs" c="dimmed" mt="sm">If the theme is saved in the user's profile instead, call the hook with the saved value after sign-in.</Text>
      </Section>

      <Section id="mapping" title="Mantine mapping" description="The Mantine variables each theme block sets, and the token they read.">
        <Table.ScrollContainer minWidth={560} className="doc-table" maxHeight={480}>
          <Table verticalSpacing="sm" horizontalSpacing="md" stickyHeader>
            <Table.Thead><Table.Tr><Table.Th>Variable</Table.Th><Table.Th>Token</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {[...mantineAliases, ...primaryAliases].map(([cssVar, token]) => (
                <Table.Tr key={cssVar}>
                  <Table.Td><CopyValue value={`var(${cssVar})`} display={cssVar} /></Table.Td>
                  <Table.Td><Code>--{token}</Code></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Text size="xs" c="dimmed" mt="sm">Components with <Code>color="intime"</Code> or no color use these, so a filled Button is pink in Candy and violet in Dusk. Other palettes (red, teal, …) stay the Mantine defaults.</Text>
      </Section>

      {SHOW_TO_CHECK && cyanLeftovers.length > 0 && (
        <Section id="to-check" title="Values to check" description="These tokens still point at the cyan primary ramp in a theme with a different accent. They are probably left over from the Dark or Light theme in Figma.">
          <List size="sm" spacing="xs">
            {cyanLeftovers.map(({ theme: item, token }) => (
              <List.Item key={`${item.id}-${token.name}`}>
                <Text span size="sm" fw={600}>{item.label}</Text>: <Code>--{token.name}</Code> uses <Code>{token.alias}</Code> ({token.value})
              </List.Item>
            ))}
          </List>
        </Section>
      )}
    </>
  )
}
