import type { CSSProperties } from 'react'
import { Group, Stack, Text } from '@mantine/core'
import { shiftStates } from '../../tokens/status'
import ShiftStateBadge from './ShiftStateBadge'
import styles from './ComponentDemos.module.css'

export default function ShiftBlock({
  name = 'Alex Morgan',
  unit = 'Patrol D4 · Platoon A',
  time = '07:00–19:00',
  stateKey = 'scheduled',
  compact = false,
}: { name?: string; unit?: string; time?: string; stateKey?: string; compact?: boolean }) {
  const state = shiftStates.find((item) => item.key === stateKey) ?? shiftStates[1]
  return (
    <div
      className={`${styles.shift} ${compact ? styles.shiftCompact : ''}`}
      style={{ '--shift-color': `var(--mantine-color-${state.color}-5)` } as CSSProperties}
    >
      <Stack gap={compact ? 3 : 8}>
        <div className={styles.shiftHeader}>
          <Text size={compact ? 'xs' : 'sm'} fw={600} className="tabular">{time}</Text>
          {!compact && <ShiftStateBadge stateKey={stateKey} size="xs" />}
        </div>
        <Group gap={6} wrap="nowrap">
          {compact && <state.icon size={12} aria-label={state.label} color={`var(--mantine-color-${state.color}-5)`} />}
          <Text size="sm" fw={500} truncate>{name}</Text>
        </Group>
        {!compact && <Text size="xs" c="dimmed">{unit}</Text>}
      </Stack>
    </div>
  )
}
