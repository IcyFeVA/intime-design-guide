import { Badge } from '@mantine/core'
import { requestStates } from '../../tokens/status'
import classes from './RequestStatusBadge.module.css'

export default function RequestStatusBadge({ stateKey, size = 'md' }: { stateKey: string; size?: 'sm' | 'md' | 'lg' }) {
  const state = requestStates.find((item) => item.key === stateKey) ?? requestStates[0]
  const Icon = state.icon
  return (
    <Badge
      size={size}
      radius="xl"
      data-tone={state.tone}
      classNames={{ root: classes.root }}
      leftSection={<Icon size={14} strokeWidth={2} aria-hidden="true" />}
    >
      {state.label}
    </Badge>
  )
}
