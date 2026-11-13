import { ActionIcon, Group, Kbd, Text, UnstyledButton } from '@mantine/core'
import { spotlight } from '@mantine/spotlight'
import { Search } from 'lucide-react'
import { useOs } from '@mantine/hooks'

export default function SearchTrigger() {
  const os = useOs()
  const modifier = os === 'macos' || os === 'ios' ? '⌘' : 'Ctrl'

  return (
    <>
      <UnstyledButton className="search-trigger" onClick={spotlight.open} visibleFrom="xs" aria-label="Search the design guide">
        <Group gap={8} wrap="nowrap">
          <Search size={15} aria-hidden="true" />
          <Text size="sm" c="dimmed" component="span">
            Search guide…
          </Text>
        </Group>
        <Group gap={4} wrap="nowrap" aria-hidden="true">
          <Kbd size="xs">{modifier}</Kbd>
          <Kbd size="xs">K</Kbd>
        </Group>
      </UnstyledButton>
      <ActionIcon variant="subtle" color="gray" size="lg" onClick={spotlight.open} hiddenFrom="xs" aria-label="Search the design guide">
        <Search size={18} />
      </ActionIcon>
    </>
  )
}
