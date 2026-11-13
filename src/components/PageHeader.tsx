import { Group, Stack, Text, Title } from '@mantine/core'
import { useLocation } from 'react-router'
import { findPage } from '../content/pages'
import StatusBadge from './StatusBadge'

/** Title block driven by the page registry; render at the top of every page. */
export default function PageHeader() {
  const { pathname } = useLocation()
  const page = findPage(pathname)
  if (!page) return null

  return (
    <Stack gap={12} className="page-header">
      <Text className="page-header__kicker">
        {page.group}
      </Text>
      <Group gap="sm" align="center">
        <Title order={1} className="page-header__title">
          {page.title}
        </Title>
        <StatusBadge status={page.status} />
      </Group>
      <Text className="page-header__description" maw={768}>
        {page.description}
      </Text>
      <Text size="xs" c="dimmed">
        Last updated {page.updated}
      </Text>
    </Stack>
  )
}
