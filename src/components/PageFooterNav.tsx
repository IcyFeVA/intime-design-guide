import { Group, Text, UnstyledButton } from '@mantine/core'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { navPages as pages } from '../content/pages'

export default function PageFooterNav() {
  const { pathname } = useLocation()
  const index = pages.findIndex((page) => page.path === pathname)
  if (index === -1) return null
  const previous = pages[index - 1]
  const next = pages[index + 1]

  return (
    <Group justify="space-between" className="footer-nav" grow preventGrowOverflow={false}>
      {previous ? (
        <UnstyledButton component={Link} to={previous.path} className="footer-nav__link">
          <Text size="xs" c="dimmed">
            <ArrowLeft size={12} /> Previous
          </Text>
          <Text fw={600}>{previous.title}</Text>
        </UnstyledButton>
      ) : (
        <span />
      )}
      {next ? (
        <UnstyledButton component={Link} to={next.path} className="footer-nav__link" data-align="end">
          <Text size="xs" c="dimmed">
            Next <ArrowRight size={12} />
          </Text>
          <Text fw={600}>{next.title}</Text>
        </UnstyledButton>
      ) : (
        <span />
      )}
    </Group>
  )
}
