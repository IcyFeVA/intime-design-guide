import { useState } from 'react'
import { ActionIcon, Alert, Badge, Button, Code, Group, Kbd, List, Paper, SimpleGrid, Stack, Table, Text, TextInput } from '@mantine/core'
import { Check, Info, Plus, Search } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import Preview from '../../components/Preview'
import DoDont from '../../components/DoDont'
import CopyValue from '../../components/CopyValue'
import { surfaceTokens } from '../../tokens/colors'
import { layout } from '../../tokens/scales'
import { shiftStates } from '../../tokens/status'

const linear = (channel: number) => {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}
const luminance = (hex: string) => {
  const values = hex.replace('#', '').match(/.{2}/g)!.map((value) => linear(parseInt(value, 16)))
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722
}
const contrastRatio = (foreground: string, background: string) => {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}
const surface = (name: string) => surfaceTokens.find((token) => token.name === name)!
const contrastPairs = [
  { label: 'Primary on background', foreground: surface('Text primary'), background: surface('Background') },
  { label: 'Secondary on background', foreground: surface('Text secondary'), background: surface('Background') },
  { label: 'Primary on raised surface', foreground: surface('Text primary'), background: surface('Surface raised') },
]

export default function AccessibilityPage() {
  const [selected, setSelected] = useState(false)
  const target = layout.find((token) => token.name === 'Min. touch target')!
  return (
    <>
      <PageHeader />
      <Section id="contrast" title="Contrast" description="Aim for WCAG 2.2 AA: 4.5:1 for normal text, 3:1 for large text, and 3:1 for meaningful UI boundaries and focus indicators.">
        <Alert icon={<Info size={17} />} variant="light" color="cyan" mb="lg">These computed ratios check the draft text and surface pairs below. They do not certify every component, state or department accent. Recheck all states when real Figma values arrive.</Alert>
        <Table.ScrollContainer minWidth={550} className="doc-table">
          <Table verticalSpacing="md" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th>Pair</Table.Th><Table.Th>Dark</Table.Th><Table.Th>Light</Table.Th><Table.Th>Target</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>{contrastPairs.map((pair) => <Table.Tr key={pair.label}>
              <Table.Td><Text size="sm" fw={500}>{pair.label}</Text><Text size="xs" c="dimmed">{pair.foreground.cssVar}</Text></Table.Td>
              {(['dark', 'light'] as const).map((scheme) => {
                const ratio = contrastRatio(pair.foreground[scheme], pair.background[scheme])
                return <Table.Td key={scheme}><Group gap="sm" wrap="nowrap"><span style={{ padding: '4px 8px', color: pair.foreground[scheme], background: pair.background[scheme], border: '1px solid var(--intime-border)', borderRadius: 4, fontWeight: 600 }}>Aa</span><Stack gap={3}><Text size="xs" fw={600} className="tabular">{ratio.toFixed(2)}:1</Text><Badge size="xs" variant="light" color={ratio >= 4.5 ? 'green' : 'red'}>{ratio >= 4.5 ? 'AA pass' : 'Review'}</Badge></Stack></Group></Table.Td>
              })}
              <Table.Td><Text size="xs" c="dimmed">≥ 4.5:1</Text></Table.Td>
            </Table.Tr>)}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Section>
      <Section id="focus" title="Focus states" description="Every interactive element must show where the keyboard focus is. Keep the ring visible on both light and dark surfaces.">
        <Preview title="Try Tab and Shift + Tab">
          <Stack gap="md" w="100%" maw={380}>
            <TextInput label="Search personnel" placeholder="Officer name or badge number" leftSection={<Search size={16} />} />
            <Group><Button onClick={() => setSelected(!selected)} leftSection={selected ? <Check size={15} /> : undefined}>{selected ? 'Selected' : 'Select member'}</Button><Button variant="default" onClick={() => setSelected(false)}>Cancel</Button></Group>
            <Text size="xs" c="dimmed" role="status">{selected ? 'Member selected in this demo.' : 'Use Tab to move through these controls, then Enter or Space to activate.'}</Text>
          </Stack>
        </Preview>
        <div style={{ marginTop: 16 }}><DoDont doItems={['Use Mantine focus styles and preserve :focus-visible.', 'Keep focus in a modal while it is open, then return it to the trigger.']} dontItems={['Remove outline without an equally visible replacement.', 'Change focus order to match a visual layout that differs from DOM order.']} /></div>
      </Section>
      <Section id="keyboard" title="Keyboard" description="Core schedule tasks must not depend on a mouse. Document shortcuts, avoid single-letter collisions inside inputs, and provide a discoverable alternative.">
        <Table.ScrollContainer minWidth={480} className="doc-table">
          <Table horizontalSpacing="md" verticalSpacing="sm"><Table.Thead><Table.Tr><Table.Th>Action</Table.Th><Table.Th>Keys</Table.Th><Table.Th>Behavior</Table.Th></Table.Tr></Table.Thead><Table.Tbody>
            {[
              { action: 'Search guide', keys: ['⌘ / Ctrl', 'K'], text: 'Open the command palette from any page.' },
              { action: 'Quick search', keys: ['/'], text: 'Open search when not typing in a field.' },
              { action: 'Move through controls', keys: ['Tab'], text: 'Follow the meaningful DOM order.' },
              { action: 'Move backward', keys: ['Shift', 'Tab'], text: 'Reverse the focus sequence.' },
              { action: 'Activate / select', keys: ['Enter', 'Space'], text: 'Activate the focused button or option.' },
              { action: 'Close overlay', keys: ['Esc'], text: 'Dismiss a menu, popover or non-blocking modal.' },
            ].map((row) => <Table.Tr key={row.action}><Table.Td><Text size="sm">{row.action}</Text></Table.Td><Table.Td><Group gap={4}>{row.keys.map((key) => <Kbd key={key} size="xs">{key}</Kbd>)}</Group></Table.Td><Table.Td><Text size="xs" c="dimmed">{row.text}</Text></Table.Td></Table.Tr>)}
          </Table.Tbody></Table>
        </Table.ScrollContainer>
      </Section>
      <Section id="color-independence" title="Beyond color" description="A schedule must remain understandable in grayscale, for color-vision differences and on a dim in-vehicle display. Pair color with an icon and a readable label.">
        <Preview title="Icon + label + color">
          {shiftStates.filter((state) => ['on-duty', 'open', 'conflict', 'leave'].includes(state.key)).map((state) => {
            const Icon = state.icon
            return <Badge key={state.key} variant="light" size="lg" color={state.color} leftSection={<Icon size={13} />}>{state.label}</Badge>
          })}
        </Preview>
        <List size="sm" spacing="xs" mt="md">
          <List.Item>Give icon-only actions an <Code>aria-label</Code>; tooltips are supplementary, not a replacement.</List.Item>
          <List.Item>Mark decorative icons <Code>aria-hidden="true"</Code> so screen readers do not announce them twice.</List.Item>
          <List.Item>Announce non-blocking save and validation feedback with a polite live region.</List.Item>
        </List>
      </Section>
      <Section id="touch-targets" title="Touch targets" description="Field use means tablets, movement and sometimes gloves. Use generous hit areas even when the visual icon is compact.">
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Paper withBorder p="lg" style={{ background: 'var(--intime-surface)', borderColor: 'var(--intime-border)' }}>
            <Text size="xs" c="dimmed" mb="sm">Draft minimum target</Text><Group mb="sm"><Text fz={28} fw={600}>{target.value}</Text><CopyValue value={target.value} /></Group><Text size="sm" c="dimmed">Prefer 44–48px for primary field actions where space permits. Maintain clear separation between adjacent targets.</Text>
          </Paper>
          <Preview title="Compact icon, generous hit area">
            <div style={{ border: '1px dashed var(--mantine-color-intime-5)', padding: 8, borderRadius: 8 }}>
              <ActionIcon size={target.value} aria-label="Add shift"><Plus size={18} /></ActionIcon>
            </div>
            <Text size="xs" c="dimmed" maw={130}>18px icon inside a {target.value} control.</Text>
          </Preview>
        </SimpleGrid>
      </Section>
    </>
  )
}
