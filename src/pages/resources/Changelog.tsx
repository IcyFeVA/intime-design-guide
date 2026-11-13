import { Anchor, Badge, Code, Group, List, Paper, Stack, Stepper, Text, ThemeIcon } from '@mantine/core'
import { ArrowRight, Frame, GitBranch } from 'lucide-react'
import { Link } from 'react-router'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import StatusBadge from '../../components/StatusBadge'
import { changelog } from '../../content/changelog'
import { findPage } from '../../content/pages'

export default function Changelog() {
  return (
    <>
      <PageHeader />
      <Section id="entries" title="Updates" description="A small, readable record of changes to the design contract. Newest entries appear first.">
        <Stack gap="sm">
          {changelog.map((entry, index) => (
            <Paper key={`${entry.date}-${index}`} withBorder p="lg" style={{ background: 'var(--intime-surface)', borderColor: 'var(--intime-border)' }}>
              <Group gap="sm" mb="sm">
                <Badge variant="outline" color="gray" size="sm">{entry.date}</Badge>
                {entry.page ? <Anchor component={Link} to={entry.page} size="xs">{findPage(entry.page)?.title}</Anchor> : <Text size="xs" c="dimmed">Guide-wide</Text>}
              </Group>
              <Text size="sm" fw={entry.changes ? 500 : undefined}>{entry.summary}</Text>
              {entry.changes && (
                <List size="sm" spacing={6} mt="sm" c="dimmed">
                  {entry.changes.map((change) => (
                    <List.Item key={change}>{change}</List.Item>
                  ))}
                </List>
              )}
            </Paper>
          ))}
        </Stack>
      </Section>
      <Section id="submitting-frames" title="Submitting Figma frames" description="Bring the production source of truth into the guide a page at a time. A little context makes each update much more accurate.">
        <Paper withBorder p="lg" mb="lg" style={{ background: 'var(--intime-surface)', borderColor: 'var(--intime-border)' }}>
          <Group gap="sm" mb="md"><ThemeIcon variant="light" color="intime"><Frame size={16} /></ThemeIcon><Text fw={600} size="sm">Include these with every frame</Text></Group>
          <List spacing="sm" size="sm">
            <List.Item>A node-specific Figma link or a clear screenshot, including any variants or state frames.</List.Item>
            <List.Item>The guide page to update: for example, Colors, Shift Cells or Schedule Views.</List.Item>
            <List.Item>Context: intended behavior, department, density, theme and whether it is current production or a proposal.</List.Item>
            <List.Item>What should be confirmed: a token value, component anatomy, interaction, accessibility requirement or all of the above.</List.Item>
          </List>
        </Paper>
        <Stepper active={0} orientation="vertical" size="sm" icon={<GitBranch size={15} />}>
          <Stepper.Step label="Map the frame to its tokens" description={<Text size="sm" c="dimmed">Edit the matching data in <Code>src/tokens/*</Code>. Pages and the theme consume those values.</Text>} />
          <Stepper.Step label="Update status after review" description={<Group gap={6}><StatusBadge status="draft" /><ArrowRight size={13} /><StatusBadge status="review" /><ArrowRight size={13} /><StatusBadge status="confirmed" /></Group>} />
          <Stepper.Step label="Record the decision" description={<Text size="sm" c="dimmed">Add a dated entry to <Code>src/content/changelog.ts</Code> with the affected page and a concise summary.</Text>} />
        </Stepper>
      </Section>
    </>
  )
}
