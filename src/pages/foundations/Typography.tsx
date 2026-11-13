import { useState } from 'react'
import { Badge, Box, Group, SegmentedControl, SimpleGrid, Stack, Table, Text } from '@mantine/core'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import CopyValue from '../../components/CopyValue'
import CodeBlock from '../../components/CodeBlock'
import StatusBadge from '../../components/StatusBadge'
import { bodyVariants, fontFamilies, headingScale, type TypeStyle } from '../../tokens/typography'

const [primary, supporting] = fontFamilies

const panel = {
  background: 'var(--intime-surface)',
  border: '1px solid var(--intime-border)',
  borderRadius: 'var(--mantine-radius-md)',
}

const specs = (style: TypeStyle) =>
  [
    `${style.size}/${style.lineHeight}`,
    `${style.weight}`,
    style.letterSpacing ? `${style.letterSpacing}px` : null,
    style.uppercase ? 'uppercase' : null,
  ].filter(Boolean).join(' · ')

const cssFor = (style: TypeStyle) =>
  [
    `font-family: ${primary.stack};`,
    `font-size: ${style.size}px;`,
    `line-height: ${style.lineHeight}px;`,
    `font-weight: ${style.weight};`,
    style.letterSpacing ? `letter-spacing: ${style.letterSpacing}px;` : null,
    style.uppercase ? 'text-transform: uppercase;' : null,
  ].filter(Boolean).join('\n')

const specimenStyle = (style: TypeStyle) => ({
  fontFamily: primary.stack,
  fontSize: style.size,
  lineHeight: `${style.lineHeight}px`,
  fontWeight: style.weight,
  letterSpacing: style.letterSpacing ? `${style.letterSpacing}px` : undefined,
  textTransform: style.uppercase ? ('uppercase' as const) : undefined,
})

function FamilyCard({ font }: { font: (typeof fontFamilies)[number] }) {
  return (
    <Box p="lg" style={panel}>
      <Stack gap="lg">
        <Group justify="space-between" wrap="nowrap">
          <Text size="xs" tt="uppercase" lts="0.08em" c="dimmed">
            {font.role} · {font.name}
            {font.variable ? ' · Variable' : ''}
          </Text>
          <StatusBadge status={font.status} />
        </Group>
        <Text
          style={{ fontFamily: font.stack, fontSize: 'clamp(64px, 12vw, 104px)', lineHeight: 1, letterSpacing: '-3px', fontWeight: font.variable ? 500 : 400 }}
          className="tabular"
          aria-hidden="true"
        >
          {font.specimen}
        </Text>
        <SimpleGrid cols={font.weights.length} spacing="md">
          {font.weights.map((item) => (
            <Stack key={item.weight} gap={2}>
              <Text style={{ fontFamily: font.stack, fontWeight: item.weight, fontSize: 'clamp(20px, 3vw, 28px)', lineHeight: 1.4 }}>{font.name}</Text>
              <Text size="xs" c="dimmed">
                {item.name} · {item.weight}
              </Text>
            </Stack>
          ))}
        </SimpleGrid>
        <Text size="sm" c="dimmed">{font.usage}</Text>
        <Group gap={6}>
          <CopyValue value={font.stack} display="Copy font stack" label={`${font.name} font stack`} />
          <CopyValue value={`--mantine-font-family${font === supporting ? '-monospace' : ''}`} label="Mantine CSS variable" />
        </Group>
      </Stack>
    </Box>
  )
}

function ScaleTable({ rows, sample, usageFor }: { rows: TypeStyle[]; sample: string; usageFor: (style: TypeStyle) => string }) {
  return (
    <Table.ScrollContainer minWidth={720} className="doc-table">
      <Table verticalSpacing="md" horizontalSpacing="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={150}>Token</Table.Th>
            <Table.Th>Specimen</Table.Th>
            <Table.Th w={170}>Copy</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((style) => (
            <Table.Tr key={style.token}>
              <Table.Td>
                <Stack gap={2}>
                  <Text size="sm" fw={600}>{style.token}</Text>
                  <Text size="xs" c="dimmed" className="tabular">{specs(style)}</Text>
                </Stack>
              </Table.Td>
              <Table.Td>
                <Text style={specimenStyle(style)}>{sample}</Text>
                {style.usage && <Text size="xs" c="dimmed" mt={6}>{style.usage}</Text>}
              </Table.Td>
              <Table.Td>
                <Stack gap={6} align="flex-start">
                  <CopyValue value={usageFor(style)} display="Mantine" label={`${style.token} Mantine usage`} />
                  <CopyValue value={cssFor(style)} display="CSS" label={`${style.token} CSS`} />
                </Stack>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}

export default function Typography() {
  const [variantKey, setVariantKey] = useState(bodyVariants[0].key)
  const variant = bodyVariants.find((item) => item.key === variantKey) ?? bodyVariants[0]

  return (
    <>
      <PageHeader />

      <Section
        id="families"
        title="Font families"
        description="Roboto carries the interface. Cousine, a monospace companion, supports numerical display so times and totals line up in the scheduling view."
      >
        <SimpleGrid cols={{ base: 1, md: 2 }}>
          {fontFamilies.map((font) => (
            <FamilyCard key={font.name} font={font} />
          ))}
        </SimpleGrid>
      </Section>

      <Section
        id="heading-scale"
        title="Heading type scale"
        description="Paired with font size, line height and weight to form complete styles. Sizes are in px (size/line height)."
      >
        <ScaleTable
          rows={headingScale}
          sample="Engine 12 · Day shift starts at 07:00"
          usageFor={(style) => `<Title order={${style.token.slice(1)}}${style.uppercase ? ' tt="uppercase"' : ''}${style.letterSpacing ? ` lts="${style.letterSpacing}px"` : ''}>`}
        />
      </Section>

      <Section
        id="body-scale"
        title="Body type scale"
        description="Each size is paired with its line height in px to form a complete style, in three weights."
      >
        <Stack gap="md">
          <Group justify="space-between" wrap="wrap" gap="sm">
            <SegmentedControl
              size="xs"
              value={variantKey}
              onChange={setVariantKey}
              data={bodyVariants.map((item) => ({ value: item.key, label: item.label }))}
              aria-label="Body style"
            />
            <Group gap={6}>
              <Badge variant="outline" color="gray">Weight {variant.weight}</Badge>
              {variant.uppercase && <Badge variant="outline" color="gray">Uppercase</Badge>}
            </Group>
          </Group>
          <Text size="sm" c="dimmed">{variant.usage}</Text>
          <ScaleTable
            rows={variant.sizes}
            sample={
              variant.uppercase
                ? 'Open shift · Patrol D4'
                : 'Officer Ramirez swapped the 19:00–07:00 night shift with Officer Chen. Supervisor approval is pending.'
            }
            usageFor={(style) =>
              `<Text fz="${style.token}" lh="${style.lineHeight}px"${style.weight !== 400 ? ` fw={${style.weight}}` : ''}${style.uppercase ? ' tt="uppercase"' : ''}${style.letterSpacing ? ` lts="${style.letterSpacing}px"` : ''}>`
            }
          />
        </Stack>
      </Section>

      <Section
        id="numerals"
        title="Numbers & time"
        description="Use Cousine for schedules, totals and identifiers so digits align column to column. Keep the format consistent within each view."
      >
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          {[
            { label: 'Shift range · 24 hour', value: '07:00–19:00', note: 'Use an en dash; keep the date nearby.' },
            { label: 'Duration', value: '12h 00m', note: 'State the unit; avoid ambiguous decimals.' },
            { label: 'Weekly total', value: '048.00', note: 'Align totals on the decimal point.' },
          ].map((item) => (
            <Box key={item.label} p="lg" style={panel}>
              <Text size="xs" c="dimmed" mb="sm">{item.label}</Text>
              <Text fz={23} fw={700} ff={supporting.stack}>{item.value}</Text>
              <Text size="xs" c="dimmed" mt="sm">{item.note}</Text>
            </Box>
          ))}
        </SimpleGrid>
        <Text size="sm" c="dimmed" mt="md">
          If an agency uses 12-hour time, include AM/PM on both ends (7:00 AM–7:00 PM). Do not mix formats.
        </Text>
      </Section>

      <Section id="usage" title="Usage in code">
        <CodeBlock
          code={`<Title order={1}>Workforce schedule</Title>
<Text fz="sm" lh="20px">Select a shift to view its assignments.</Text>
<Text fz="xs" fw={600} tt="uppercase">Open shift</Text>
<Text ff="monospace" fw={700}>07:00–19:00 · 12h 00m</Text>

// Applied by the theme
fontFamily: '${primary.stack}',
fontFamilyMonospace: '${supporting.stack}',`}
        />
      </Section>
    </>
  )
}
