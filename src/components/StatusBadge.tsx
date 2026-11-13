import { Badge, Tooltip, type MantineSize } from '@mantine/core'
import { statusMeta, type TokenStatus } from '../tokens/types'

interface StatusBadgeProps {
  status: TokenStatus
  size?: MantineSize
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const meta = statusMeta[status]
  return (
    <Tooltip label={meta.description} multiline w={260}>
      <Badge variant="light" color={meta.color} size={size} tabIndex={0}>
        {meta.label}
      </Badge>
    </Tooltip>
  )
}
