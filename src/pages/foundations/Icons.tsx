import { useState } from 'react'
import { Badge, Box, CopyButton, Group, SegmentedControl, SimpleGrid, Stack, Text, TextInput, Tooltip, UnstyledButton } from '@mantine/core'
import { Check, Search, Shield } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import CodeBlock from '../../components/CodeBlock'
import Preview from '../../components/Preview'
import DoDont from '../../components/DoDont'
import { iconGroups, iconRules } from '../../tokens/icons'

export default function Icons() {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('all')
  const groups = iconGroups.filter((item) => group === 'all' || item.key === group).map((item) => ({ ...item, icons: item.icons.filter((entry) => `${entry.name} ${entry.keywords}`.toLowerCase().includes(query.toLowerCase())) })).filter((item) => item.icons.length)
  return <>
    <PageHeader />
    <Section id="library" title="Icon library" description="A curated draft set from Lucide. Click an icon to copy its import statement.">
      <Stack gap="lg">
        <TextInput placeholder="Search name or intent…" aria-label="Search icons" value={query} onChange={(event) => setQuery(event.currentTarget.value)} leftSection={<Search size={16} />} />
        <Box style={{ overflowX: 'auto' }}><SegmentedControl value={group} onChange={setGroup} data={[{ value: 'all', label: 'All icons' }, ...iconGroups.map((item) => ({ value: item.key, label: item.title.split(' & ')[0] }))]} /></Box>
        <Text size="xs" c="dimmed">{groups.reduce((sum, item) => sum + item.icons.length, 0)} icons · stroke {iconRules.strokeWidth} · Draft</Text>
        {groups.length === 0 && <Box p="xl" ta="center"><Text fw={600}>No icons found</Text><Text size="sm" c="dimmed">Try an intent like “shift”, “police” or “add”.</Text></Box>}
        {groups.map((item) => <Stack key={item.key} gap="sm"><Group gap="sm"><Text fw={600}>{item.title}</Text><Badge color="gray" variant="light" size="sm">{item.icons.length}</Badge></Group><Text size="xs" c="dimmed">{item.description}</Text><SimpleGrid cols={{ base: 3, xs: 4, sm: 5, md: 6 }} spacing={8}>{item.icons.map((entry) => { const Icon = entry.icon; return <CopyButton key={entry.name} value={`import { ${entry.name} } from 'lucide-react'`} timeout={1500}>{({ copied, copy }) => <Tooltip label={copied ? 'Import copied' : `Copy ${entry.name} import`}><UnstyledButton onClick={copy} aria-label={`Copy ${entry.name} import`} style={{ border: `1px solid ${copied ? 'var(--mantine-color-green-6)' : 'var(--intime-border)'}`, borderRadius: 'var(--mantine-radius-md)', background: 'var(--intime-surface)', padding: '18px 4px 12px', minWidth: 0 }}><Stack align="center" gap={12}>{copied ? <Check size={24} color="var(--mantine-color-green-5)" /> : <Icon size={24} strokeWidth={iconRules.strokeWidth} aria-hidden="true" />}<Text size="xs" ta="center" w="100%" truncate>{entry.name}</Text></Stack></UnstyledButton></Tooltip>}</CopyButton> })}</SimpleGrid></Stack>)}
      </Stack>
    </Section>
    <Section id="sizing" title="Size & stroke" description="Align to the pixel grid and use a consistent stroke. Do not stretch icons non-uniformly."><Preview>{iconRules.sizes.map((size) => <Stack key={size.name} align="center" gap="sm" p="md"><Shield size={size.px} strokeWidth={iconRules.strokeWidth} /><Text size="sm" fw={600}>{size.px}px · {size.name}</Text><Text size="xs" c="dimmed" ta="center" maw={160}>{size.usage}</Text></Stack>)}</Preview></Section>
    <Section id="accessibility" title="Accessibility"><DoDont doItems={['Pair unfamiliar icons with a visible text label.', 'Give icon-only buttons an aria-label that describes the action.', 'Hide decorative icons from assistive technology with aria-hidden.']} dontItems={['Use color alone to distinguish status.', 'Use a tooltip as the only accessible name.', 'Change icons for the same action between screens.']} /></Section>
    <Section id="usage" title="Usage in code"><CodeBlock code={`import { CalendarPlus } from 'lucide-react'\n\n<Button leftSection={<CalendarPlus size={20} strokeWidth={${iconRules.strokeWidth}} aria-hidden="true" />}>\n  Create shift\n</Button>\n\n<ActionIcon aria-label="Create shift">\n  <CalendarPlus size={20} strokeWidth={${iconRules.strokeWidth}} />\n</ActionIcon>`} /></Section>
  </>
}
