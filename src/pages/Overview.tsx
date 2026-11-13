import { Anchor, Badge, Button, Card, Group, Kbd, List, Paper, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { ArrowRight, BookOpen, Code, Compass, Frame, Shield } from 'lucide-react'
import { Link } from 'react-router'
import PageHeader from '../components/PageHeader'
import Section from '../components/Section'
import StatusBadge from '../components/StatusBadge'
import CopyValue from '../components/CopyValue'
import { pageGroups, pages, findPage } from '../content/pages'
import { changelog } from '../content/changelog'
import { statusMeta, type TokenStatus } from '../tokens/types'

export default function Overview() {
  return (
    <>
      <PageHeader />
      <Section id="purpose" title="A shared language for critical work">
        <Paper withBorder p="xl" style={{ background: 'var(--intime-surface)', borderColor: 'var(--intime-border)' }}>
          <Group gap="sm" mb="md">
            <ThemeIcon variant="light" size={38} radius="md"><Shield size={21} /></ThemeIcon>
            <Badge color="intime" variant="light">Police · Fire · EMS</Badge>
          </Group>
          <Title order={3} mb="sm">Built for the people behind every shift.</Title>
          <Text c="dimmed" size="sm" maw={640} mb="lg">
            This is the working design reference for <Anchor href="https://www.intime.com" target="_blank" rel="noreferrer" inherit>InTime's</Anchor> workforce scheduling web app. It connects the visual foundations,
            Mantine components and scheduling patterns that developers use to build a consistent public-safety experience.
          </Text>
          <Group gap="xs">
            <Badge variant="outline" color="gray">Mantine 9</Badge>
            <Badge variant="outline" color="gray">Lucide icons</Badge>
            <Badge variant="outline" color="yellow">Provisional v0.1</Badge>
          </Group>
        </Paper>
        <Text c="dimmed" size="xs" mt="sm">
          This scaffold is not an official InTime brand specification. All starting values remain Draft until matched to real Figma frames.
        </Text>
      </Section>

      <Section id="how-to-use" title="How to use this guide" description="A reference for implementation today, with a clear path to production accuracy tomorrow.">
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          {[
            { Icon: Compass, title: 'Find your pattern', text: 'Browse the grouped sidebar or search pages and sections.', extra: <Group gap={4}><Kbd>⌘</Kbd><Kbd>K</Kbd><Text size="xs" c="dimmed">or</Text><Kbd>/</Kbd></Group> },
            { Icon: Code, title: 'Copy, then build', text: 'Click any token chip to copy its exact value. Live previews include TSX snippets.', extra: <CopyValue value="intime.6" /> },
            { Icon: Frame, title: 'Refine with Figma', text: 'Share a frame and context. Update the token, confirm the value and record the change.', extra: <Group gap={6}><StatusBadge status="draft" /><ArrowRight size={13} /><StatusBadge status="confirmed" /></Group> },
          ].map(({ Icon, title, text, extra }) => (
            <Card key={title} withBorder p="lg" style={{ background: 'var(--intime-surface)', borderColor: 'var(--intime-border)' }}>
              <ThemeIcon variant="light" color="intime" size={32} mb="md"><Icon size={17} /></ThemeIcon>
              <Text fw={600} size="sm" mb={6}>{title}</Text>
              <Text size="sm" c="dimmed" mb="md" style={{ flex: 1 }}>{text}</Text>
              {extra}
            </Card>
          ))}
        </SimpleGrid>
      </Section>

      <Section id="status-legend" title="Know what is ready" description="Status is attached to the documented value, not just the page. A page may contain a mix of confirmed and draft tokens as the guide evolves.">
        <Stack gap="sm">
          {(Object.entries(statusMeta) as [TokenStatus, typeof statusMeta.draft][]).map(([status, meta]) => (
            <Paper key={status} withBorder p="md" style={{ background: 'var(--intime-surface)', borderColor: 'var(--intime-border)' }}>
              <Group gap="md" wrap="nowrap">
                <StatusBadge status={status} />
                <Text size="sm" c="dimmed">{meta.description}</Text>
              </Group>
            </Paper>
          ))}
        </Stack>
      </Section>

      <Section id="pages" title="Explore the system">
        <Stack gap="xl">
          {pageGroups.filter((group) => group !== 'Getting started').map((group) => (
            <div key={group}>
              <Text size="xs" fw={600} tt="uppercase" lts="0.08em" c="dimmed" mb="sm">{group}</Text>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                {pages.filter((page) => page.group === group).map((page) => {
                  const Icon = page.icon
                  return (
                    <Card key={page.path} component={Link} to={page.path} withBorder p="md" style={{ color: 'inherit', textDecoration: 'none', background: 'var(--intime-surface)', borderColor: 'var(--intime-border)' }}>
                      <Group justify="space-between" mb="sm">
                        <ThemeIcon variant="light" color="gray" size={30}><Icon size={16} /></ThemeIcon>
                        <StatusBadge status={page.status} />
                      </Group>
                      <Group justify="space-between" wrap="nowrap" mb={4}>
                        <Text fw={600} size="sm">{page.title}</Text>
                        <ArrowRight size={14} color="var(--mantine-color-dimmed)" />
                      </Group>
                      <Text size="xs" c="dimmed">{page.description}</Text>
                    </Card>
                  )
                })}
              </SimpleGrid>
            </div>
          ))}
        </Stack>
      </Section>

      <Section id="recent-changes" title="Recent changes">
        <Paper withBorder p="lg" style={{ background: 'var(--intime-surface)', borderColor: 'var(--intime-border)' }}>
          <List spacing="md" size="sm" icon={<BookOpen size={15} color="var(--mantine-color-dimmed)" />}>
            {changelog.slice(0, 3).map((entry, index) => (
              <List.Item key={`${entry.date}-${index}`}>
                <Text size="xs" c="dimmed" mb={3}>{entry.date} · {entry.page ? findPage(entry.page)?.title : 'Guide-wide'}</Text>
                {entry.summary}
              </List.Item>
            ))}
          </List>
          <Button component={Link} to="/resources/changelog" variant="subtle" size="xs" rightSection={<ArrowRight size={13} />} mt="lg">View changelog</Button>
        </Paper>
      </Section>
    </>
  )
}
