import { Badge } from '@mantine/core'
import { shiftStates } from '../../tokens/status'

export default function ShiftStateBadge({ stateKey, size = 'sm' }: { stateKey: string; size?: 'xs' | 'sm' | 'md' }) {
  const state = shiftStates.find((item) => item.key === stateKey) ?? shiftStates[1]
  const Icon = state.icon
  return (
    <Badge color={state.color} variant="light" size={size} leftSection={<Icon size={12} strokeWidth={1.75} aria-hidden="true" />}>
      {state.label}
    </Badge>
  )
}
