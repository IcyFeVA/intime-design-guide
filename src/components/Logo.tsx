import { Group, Text, ThemeIcon } from '@mantine/core'
import { Clock3 } from 'lucide-react'

/** Draft wordmark until the official InTime logo asset is provided. */
export default function Logo() {
  return (
    <Group gap={10} wrap="nowrap">
      <ThemeIcon size={30} radius="sm" variant="gradient" gradient={{ from: 'intime.5', to: 'police.7', deg: 135 }}>
        <Clock3 size={17} strokeWidth={2.25} aria-hidden="true" />
      </ThemeIcon>
      <Text fw={700} size="lg" lts="-0.02em" component="span">
        InTime
      </Text>
    </Group>
  )
}
