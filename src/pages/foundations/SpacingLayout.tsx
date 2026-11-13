import { Box, Group, SimpleGrid, Stack, Table, Text } from '@mantine/core'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import CopyValue from '../../components/CopyValue'
import CodeBlock from '../../components/CodeBlock'
import Preview from '../../components/Preview'
import StatusBadge from '../../components/StatusBadge'
import { spacing, breakpoints, layout } from '../../tokens/scales'

export default function SpacingLayout() {
  return <>
    <PageHeader />
    <Section id="spacing" title="Spacing scale" description="A four-pixel base keeps dense schedules coherent. Use the named scale through Mantine props."><Stack gap="sm">{spacing.map((token) => <Group key={token.name} gap="md" wrap="nowrap" p="sm" style={{ borderBottom: '1px solid var(--intime-border)' }}><Text w={36} fw={600} size="sm">{token.name}</Text><Box w={80} style={{ flexShrink: 0 }}><Box h={16} w={token.px} bg="intime.6" style={{ borderRadius: 2 }} /></Box><Stack gap={4} style={{ flex: 1 }}><Group gap={6}><CopyValue value={token.value} display={`${token.px}px · ${token.value}`} /><CopyValue value={token.cssVar} display="CSS var" /><StatusBadge status={token.status} /></Group><Text size="xs" c="dimmed">{token.usage}</Text></Stack></Group>)}</Stack></Section>
    <Section id="breakpoints" title="Breakpoints" description="Mobile-first breakpoints are expressed in em so layouts respond to text scaling."><Table.ScrollContainer minWidth={540} className="doc-table"><Table verticalSpacing="sm" horizontalSpacing="md"><Table.Thead><Table.Tr><Table.Th>Key</Table.Th><Table.Th>Value</Table.Th><Table.Th>Use</Table.Th></Table.Tr></Table.Thead><Table.Tbody>{breakpoints.map((token) => <Table.Tr key={token.name}><Table.Td><Text fw={600}>{token.name}</Text></Table.Td><Table.Td><CopyValue value={token.value} display={`${token.value} / ${token.px}px`} /></Table.Td><Table.Td><Text size="sm" c="dimmed">{token.usage}</Text></Table.Td></Table.Tr>)}</Table.Tbody></Table></Table.ScrollContainer></Section>
    <Section id="layout" title="App shell dimensions" description="Fixed rails help users build muscle memory. The schedule canvas may expand to use the remaining space."><SimpleGrid cols={{ base: 1, sm: 2 }}>{layout.map((item) => <Box key={item.name} p="md" bg="var(--intime-surface)" style={{ border: '1px solid var(--intime-border)', borderRadius: 'var(--mantine-radius-md)' }}><Group justify="space-between" mb="xs"><Text size="sm" fw={600}>{item.name}</Text><CopyValue value={item.value} /></Group><Text size="xs" c="dimmed">{item.usage}</Text></Box>)}</SimpleGrid></Section>
    <Section id="grid" title="Grid & containers" description="Use responsive columns for forms and full-width canvases for schedule views. Keep long-form text to a comfortable measure."><Stack gap="md"><Preview title="Responsive 12-column grid" align="start"><Box w="100%"><SimpleGrid cols={{ base: 1, sm: 3 }}>{[1, 2, 3].map((n) => <Box key={n} p="lg" ta="center" bg="var(--mantine-color-intime-light)" c="intime.4" style={{ border: '1px dashed var(--mantine-color-intime-6)', borderRadius: 'var(--mantine-radius-sm)' }}>4 / 12</Box>)}</SimpleGrid></Box></Preview><CodeBlock code={'<Container size="xl">\n  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">\n    <ShiftSummary />\n    <StaffingSummary />\n    <OvertimeSummary />\n  </SimpleGrid>\n</Container>\n\n// Use tokens for all spacing\n<Stack gap="lg" p="xl">…</Stack>'} /></Stack></Section>
  </>
}
