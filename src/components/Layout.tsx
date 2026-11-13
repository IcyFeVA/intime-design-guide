import { Suspense, useEffect } from 'react'
import { AppShell, Badge, Box, Burger, Center, Divider, Group, Loader, NavLink, ScrollArea, Text, Tooltip } from '@mantine/core'
import { useDisclosure, useReducedMotion } from '@mantine/hooks'
import { Link, Outlet, useLocation, useSearchParams } from 'react-router'
import { navPages, pageGroups } from '../content/pages'
import { statusMeta } from '../tokens/types'
import GuideSpotlight from './GuideSpotlight'
import Logo from './Logo'
import PageFooterNav from './PageFooterNav'
import SearchTrigger from './SearchTrigger'
import TableOfContents from './TableOfContents'
import ThemeToggle from './ThemeToggle'

export default function Layout() {
  const [navOpened, { toggle: toggleNav, close: closeNav }] = useDisclosure()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const section = params.get('section')
  const reduceMotion = useReducedMotion()

  // Scroll to `?section=` once the lazy page renders, otherwise to the top on navigation.
  useEffect(() => {
    if (!section) {
      window.scrollTo({ top: 0 })
      return
    }
    let attempts = 0
    const timer = window.setInterval(() => {
      const element = document.getElementById(section)
      attempts += 1
      if (element) {
        element.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
        window.clearInterval(timer)
      } else if (attempts > 40) {
        window.clearInterval(timer)
      }
    }, 50)
    return () => window.clearInterval(timer)
  }, [pathname, section, reduceMotion])

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !navOpened } }}
      aside={{ width: 220, breakpoint: 'lg', collapsed: { desktop: false, mobile: true } }}
      padding={0}
    >
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <GuideSpotlight />

      <AppShell.Header className="shell-header">
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Burger opened={navOpened} onClick={toggleNav} hiddenFrom="sm" size="sm" aria-label="Toggle navigation" />
            <Link to="/" className="brand-link" aria-label="InTime Design Guide home">
              <Logo />
            </Link>
            <Divider orientation="vertical" my={16} visibleFrom="xs" />
            <Text size="sm" c="dimmed" fw={500} visibleFrom="xs">
              Design Guide
            </Text>
            <Badge variant="outline" color="yellow" size="sm" visibleFrom="md">
              v0.1 Draft
            </Badge>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <SearchTrigger />
            <ThemeToggle />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar className="shell-navbar">
        <AppShell.Section grow component={ScrollArea} px="sm" py="md">
          <nav aria-label="Design guide">
            {pageGroups.map((group) => (
              <Box key={group} mb="lg">
                <Text size="xs" fw={600} tt="uppercase" lts="0.08em" c="dimmed" px="sm" mb={6}>
                  {group}
                </Text>
                {navPages
                  .filter((page) => page.group === group)
                  .map((page) => {
                    const Icon = page.icon
                    const meta = statusMeta[page.status]
                    return (
                      <NavLink
                        key={page.path}
                        component={Link}
                        to={page.path}
                        label={page.title}
                        active={pathname === page.path}
                        onClick={closeNav}
                        leftSection={<Icon size={16} strokeWidth={1.75} />}
                        rightSection={
                          page.status !== 'confirmed' ? (
                            <Tooltip label={meta.label} position="right">
                              <span className="status-dot" data-status={page.status} aria-label={meta.label} />
                            </Tooltip>
                          ) : null
                        }
                        className="shell-navlink"
                      />
                    )
                  })}
              </Box>
            ))}
          </nav>
        </AppShell.Section>
        <AppShell.Section px="md" py="sm" className="shell-navbar__footer">
          <Group gap={6}>
            <span className="status-dot" data-status="draft" aria-hidden="true" />
            <Text size="xs" c="dimmed">
              Draft: awaiting Figma confirmation
            </Text>
          </Group>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Aside className="shell-aside" p="md" withBorder={false}>
        <TableOfContents />
      </AppShell.Aside>

      <AppShell.Main id="main-content">
        <div className="page-container">
          <Suspense
            fallback={
              <Center h={320}>
                <Loader size="sm" />
              </Center>
            }
          >
            <Outlet />
          </Suspense>
          <PageFooterNav />
        </div>
      </AppShell.Main>
    </AppShell>
  )
}
