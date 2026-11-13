import { useState } from 'react'
import { Alert, Box, Button, Group, SimpleGrid, Stack, Text } from '@mantine/core'
import { useReducedMotion } from '@mantine/hooks'
import { Play, Accessibility } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import CopyValue from '../../components/CopyValue'
import CodeBlock from '../../components/CodeBlock'
import StatusBadge from '../../components/StatusBadge'
import { motion } from '../../tokens/scales'

export default function Motion() {
  const [playing, setPlaying] = useState(false)
  const reduceMotion = useReducedMotion()
  return <>
    <PageHeader />
    <Section id="durations" title="Durations" description="Movement should explain a state change, not delay an operational task. Use short transitions for frequent interactions.">
      <Group mb="lg"><Button size="xs" variant="light" leftSection={<Play size={14} />} onClick={() => setPlaying((value) => !value)}>{playing ? 'Reset demos' : 'Play demos'}</Button>{reduceMotion && <Text size="xs" c="dimmed">Reduced motion is enabled; demos are static.</Text>}</Group>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>{motion.durations.map((token) => <Box key={token.name} p="md" bg="var(--intime-surface)" style={{ border: '1px solid var(--intime-border)', borderRadius: 'var(--mantine-radius-md)' }}><Stack gap="md"><Group justify="space-between"><Text fw={600}>{token.name}</Text><StatusBadge status={token.status} /></Group><Box h={32} style={{ position: 'relative', borderRadius: 'var(--mantine-radius-sm)', background: 'var(--mantine-color-body)' }}><Box h={24} w={24} bg="intime.6" style={{ position: 'absolute', top: 4, left: playing && !reduceMotion ? 'calc(100% - 28px)' : 4, borderRadius: 'var(--mantine-radius-xs)', transition: `left ${reduceMotion ? '0ms' : token.value} ${motion.easings[0].value}` }} /></Box><CopyValue value={token.value} /><Text size="sm" c="dimmed">{token.usage}</Text></Stack></Box>)}</SimpleGrid>
    </Section>
    <Section id="easing" title="Easing" description="Ease out on entry to settle quickly; ease in on exit to leave the interface without lingering."><Stack gap="md">{motion.easings.map((token) => <Box key={token.name} p="md" bg="var(--intime-surface)" style={{ border: '1px solid var(--intime-border)', borderRadius: 'var(--mantine-radius-md)' }}><Group justify="space-between" mb="sm"><Text fw={600}>{token.name}</Text><StatusBadge status={token.status} /></Group><Box h={24} mb="sm" style={{ position: 'relative', background: 'var(--mantine-color-body)', borderRadius: 'var(--mantine-radius-sm)' }}><Box h={16} w={16} bg="police.5" style={{ position: 'absolute', top: 4, left: playing && !reduceMotion ? 'calc(100% - 20px)' : 4, borderRadius: '50%', transition: `left ${reduceMotion ? '0ms' : motion.durations[3].value} ${token.value}` }} /></Box><Group justify="space-between"><CopyValue value={token.value} /><Text size="xs" c="dimmed">{token.usage}</Text></Group></Box>)}</Stack></Section>
    <Section id="reduced-motion" title="Reduced motion" description="Respect the operating system preference. Essential feedback must remain visible when all decorative motion is removed."><Stack gap="md"><Alert icon={<Accessibility size={18} />} color="cyan" title="Motion is optional; clarity is not">Avoid large transforms, parallax and flashing. Under reduced motion, switch instantly between states and keep loading indicators meaningful through text.</Alert><CodeBlock title="TSX + CSS" code={'const reduceMotion = useReducedMotion()\n\n<Transition transition={reduceMotion ? "fade" : "pop"}\n  duration={reduceMotion ? 0 : 220}>…</Transition>\n\n@media (prefers-reduced-motion: reduce) {\n  .shift-block { transition: none; animation: none; }\n}'} /></Stack></Section>
  </>
}
