import { Box, Group, SimpleGrid, Stack, Table, Text } from '@mantine/core'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import CopyValue from '../../components/CopyValue'
import StatusBadge from '../../components/StatusBadge'
import { radius, shadows, zIndex } from '../../tokens/scales'

export default function RadiusElevation() {
  return <>
    <PageHeader />
    <Section id="radius" title="Radius" description="Use the smallest radius that fits the object. Our default small radius keeps dense operational UI crisp."><SimpleGrid cols={{ base: 2, sm: 3, md: 5 }}>{radius.map((token) => <Stack key={token.name} gap="sm"><Box h={88} style={{ border: '2px solid var(--mantine-color-intime-5)', borderRadius: token.value, background: 'var(--mantine-color-intime-light)' }} /><Group justify="space-between"><Text fw={600}>{token.name}</Text><StatusBadge status={token.status} /></Group><CopyValue value={token.value} display={`${token.px}px`} /><CopyValue value={token.cssVar} display="CSS var" /><Text size="xs" c="dimmed">{token.usage}</Text></Stack>)}</SimpleGrid></Section>
    <Section id="elevation" title="Elevation" description="Dark surfaces need a subtle border as well as a shadow. Elevation separates temporary layers, not every card."><SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">{shadows.map((token) => <Stack key={token.name} gap="sm"><Box p="lg" h={120} bg="var(--intime-surface-raised)" style={{ border: '1px solid var(--intime-border)', borderRadius: 'var(--mantine-radius-md)', boxShadow: token.value }}><Group justify="space-between"><Text fw={600}>{token.name}</Text><StatusBadge status={token.status} /></Group><Text size="sm" c="dimmed" mt="sm">{token.usage}</Text></Box><CopyValue value={token.cssVar} /><CopyValue value={token.value} display="Copy shadow value" /></Stack>)}</SimpleGrid></Section>
    <Section id="z-index" title="Z-index layers" description="Use Mantine layering defaults rather than arbitrary high numbers. Place overlays in portals so they are not trapped by a parent stacking context."><Table.ScrollContainer minWidth={520} className="doc-table"><Table verticalSpacing="sm" horizontalSpacing="md"><Table.Thead><Table.Tr><Table.Th>Layer</Table.Th><Table.Th>Z-index</Table.Th><Table.Th>Use</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{zIndex.map((token) => <Table.Tr key={token.name}><Table.Td><Text size="sm" fw={600}>{token.name}</Text></Table.Td><Table.Td><CopyValue value={token.value} /></Table.Td><Table.Td><Text size="sm" c="dimmed">{token.usage}</Text></Table.Td></Table.Tr>)}</Table.Tbody></Table></Table.ScrollContainer><Text size="xs" c="dimmed" mt="md">Popover and modal share a base layer. Portal order determines which appears above; avoid raising a popover globally to fix one screen.</Text></Section>
  </>
}
