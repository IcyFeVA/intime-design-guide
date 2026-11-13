import { Badge, Group, Indicator, Stack, Table, Text } from '@mantine/core'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import Preview from '../../components/Preview'
import FigmaSlot from '../../components/FigmaSlot'
import PropsTable from '../../components/PropsTable'
import DoDont from '../../components/DoDont'
import { requestStates } from '../../tokens/status'
import RequestStatusBadge from './RequestStatusBadge'

export default function StatusBadges() {
  return (
    <>
      <PageHeader />
      <Section id="shift-states" title="Status badges" description="Status badges pair an icon with a short, unambiguous label. The palette is provisional; the meaning is never conveyed by color alone.">
        <Stack gap="lg">
          <Preview code={'<Badge variant="light" color="teal" radius="xl"\n  leftSection={<CircleCheck size={14} />}>Approved</Badge>'}>
            {requestStates.map((state) => <RequestStatusBadge key={state.key} stateKey={state.key} />)}
          </Preview>
          <Table.ScrollContainer minWidth={500} className="doc-table">
            <Table verticalSpacing="sm" horizontalSpacing="md"><Table.Thead><Table.Tr><Table.Th>State</Table.Th><Table.Th>Meaning</Table.Th></Table.Tr></Table.Thead>
              <Table.Tbody>{requestStates.map((state) => <Table.Tr key={state.key}><Table.Td><RequestStatusBadge stateKey={state.key} /></Table.Td><Table.Td><Text size="sm">{state.meaning}</Text></Table.Td></Table.Tr>)}</Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          <PropsTable rows={[
            { prop: 'variant', type: 'light | outline | filled', default: 'light', description: 'Light pills keep status legible without overpowering the roster.' },
            { prop: 'leftSection', type: 'ReactNode', description: 'Use the icon assigned by the status token.' },
            { prop: 'size', type: 'xs | sm | md', default: 'sm', description: 'xs for calendar cells, sm for tables, md for detail headers.' },
          ]} />
        </Stack>
      </Section>
      <Section id="outline-dot" title="Outline & dot badges" description="Mantine's own outline and dot variants. Use dot badges for a live or closed state and outline badges for roles and labels.">
        <Stack gap="lg">
          <Preview code={'<Badge variant="dot" color="intime">Live</Badge>\n<Badge variant="dot" color="red">Closed</Badge>\n<Badge variant="outline" color="intime">Sergeant</Badge>'}>
            <Badge variant="dot" color="intime" size="lg">Live</Badge>
            <Badge variant="dot" color="red" size="lg">Closed</Badge>
            <Badge variant="outline" color="intime" size="lg">Sergeant</Badge>
          </Preview>
          <PropsTable rows={[
            { prop: 'variant', type: 'dot | outline', description: 'dot shows a colored dot before a neutral label; outline colors both border and label.' },
            { prop: 'color', type: 'intime | red', description: 'intime for live and roles, red for closed.' },
            { prop: 'size', type: 'sm | md | lg', default: 'md', description: 'lg for list cards and profile headers.' },
          ]} />
        </Stack>
      </Section>
      <Section id="counts" title="Counts & indicators" description="Use counts for quantity, status labels for meaning, and a dot only as a supplemental cue.">
        <Preview code={'<Badge variant="default">12 members</Badge>\n<Badge color="yellow" variant="light">3 open shifts</Badge>\n<Indicator color="green" size={8}><Text>Dispatch online</Text></Indicator>'}>
          <Group gap="xl"><Badge variant="default">12 members</Badge><Badge color="yellow" variant="light">3 open shifts</Badge><Indicator color="green" size={8} offset={-6}><Text size="sm">Dispatch online</Text></Indicator></Group>
        </Preview>
      </Section>
      <Section id="guidelines" title="Guidelines"><DoDont doItems={['Use the shared shift-state token for label, icon and color.', 'Use sentence case and concise labels.', 'Keep status badges non-interactive unless they open clearly labeled details.']} dontItems={['Use a red or green dot without a text alternative.', 'Invent different labels for the same state in different views.', 'Use a badge as a substitute for an action button.']} /></Section>
      <Section id="figma" title="Figma reference"><FigmaSlot title="Badges — states, departments & counts" notes="Provide the confirmed state inventory, labels, icon mapping, colors, size variants and any interactive badge behavior." /></Section>
    </>
  )
}
