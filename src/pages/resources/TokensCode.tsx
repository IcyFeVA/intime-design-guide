import { Alert, Code, Group, Table, Text } from '@mantine/core'
import { Info } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import CodeBlock from '../../components/CodeBlock'
import CopyValue from '../../components/CopyValue'
import { allPalettes, surfaceTokens } from '../../tokens/colors'
import { spacing, radius, shadows, zIndex } from '../../tokens/scales'
import { themeConfig } from '../../tokens/themeExport'

const themeCode = `import { createTheme, MantineProvider } from '@mantine/core'\n\nexport const theme = createTheme(${JSON.stringify(themeConfig, null, 2)})\n\n// Mount once, at the application root.\n<MantineProvider theme={theme} defaultColorScheme="dark">\n  <App />\n</MantineProvider>`
const scaleVariables = [
  ...spacing.map((token) => `${token.cssVar}: ${token.value};`),
  ...radius.map((token) => `${token.cssVar}: ${token.value};`),
  ...shadows.map((token) => `${token.cssVar}: ${token.value};`),
]
const cssCode = `/* Mantine generates palette and scale variables from the theme. */\n:root {\n${allPalettes.flatMap((palette) => palette.shades.map((hex, shade) => `  --mantine-color-${palette.key}-${shade}: ${hex};`)).join('\n')}\n${scaleVariables.map((line) => `  ${line}`).join('\n')}\n}\n\n/* Application surface aliases — use these instead of hardcoded hex. */\n[data-mantine-color-scheme="dark"] {\n${surfaceTokens.map((token) => `  ${token.cssVar}: ${token.dark};`).join('\n')}\n}\n\n[data-mantine-color-scheme="light"] {\n${surfaceTokens.map((token) => `  ${token.cssVar}: ${token.light};`).join('\n')}\n}`

export default function TokensCode() {
  return (
    <>
      <PageHeader />
      <Section id="theme" title="Mantine theme" description="A copyable theme snapshot generated from the same draft token data as this guide. src/theme.ts remains the app's implementation entry point.">
        <Alert icon={<Info size={17} />} variant="light" color="yellow" mb="lg" title="Provisional contract">Do not treat this snapshot as approved production branding. Replace Draft values with confirmed Figma specifications before shipping.</Alert>
        <CodeBlock code={themeCode} title="theme.ts · generated snapshot" />
      </Section>
      <Section id="css-variables" title="CSS variables" description="Prefer Mantine props in TSX. Use CSS variables when styling a custom scheduling primitive or a CSS module.">
        <Group gap="xs" mb="lg"><CopyValue value="var(--mantine-color-intime-6)" /><CopyValue value="var(--intime-surface)" /><CopyValue value="var(--intime-border)" /></Group>
        <CodeBlock code={cssCode} title="tokens.css · generated reference" />
        <Text size="xs" c="dimmed" mt="sm">Breakpoint variables are documentation-only: CSS custom properties cannot be used directly in media-query conditions. Use the theme breakpoint values.</Text>
      </Section>
      <Section id="naming" title="Naming conventions" description="Name by intent first, then scale. A stable vocabulary keeps a schedule cell, a roster row and a notification speaking the same language.">
        <Table.ScrollContainer minWidth={570} className="doc-table">
          <Table horizontalSpacing="md" verticalSpacing="sm">
            <Table.Thead><Table.Tr><Table.Th>Kind</Table.Th><Table.Th>Pattern</Table.Th><Table.Th>Example</Table.Th><Table.Th>Usage</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {[
                ['Color', '{palette}.{shade}', 'intime.6', 'Mantine color props; 0–9 from light to dark.'],
                ['Surface', '--intime-{role}', '--intime-surface', 'Semantic aliases that adapt to the color scheme.'],
                ['Spacing / radius', '{scale}', 'sm / md / lg', 'Use named scale values, not arbitrary pixel numbers.'],
                ['State', '{domain}-{state}', 'shift-overtime', 'A meaningful key, paired with icon and text.'],
                ['Layer', '{role}', zIndex.find((token) => token.name === 'sticky')!.name, 'Describe the stacking purpose, not the numeric value.'],
              ].map(([kind, pattern, example, usage]) => <Table.Tr key={kind}><Table.Td>{kind}</Table.Td><Table.Td><Code>{pattern}</Code></Table.Td><Table.Td><CopyValue value={example} /></Table.Td><Table.Td><Text size="sm" c="dimmed">{usage}</Text></Table.Td></Table.Tr>)}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Section>
    </>
  )
}
