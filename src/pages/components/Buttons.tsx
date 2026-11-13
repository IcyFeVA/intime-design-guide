import { useState } from 'react'
import { ActionIcon, Button, Group, Stack, Text, Tooltip } from '@mantine/core'
import { CalendarPlus, Download, Pencil, Plus, Trash } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import FigmaSlot from '../../components/FigmaSlot'
import Preview from '../../components/Preview'
import PropsTable from '../../components/PropsTable'
import DoDont from '../../components/DoDont'

export default function Buttons() {
  const [busy, setBusy] = useState(false)
  return (
    <>
      <PageHeader />
      <Section id="variants" title="Variants" description="One primary action per context. Use quieter variants for supporting actions.">
        <Stack gap="lg">
          <Preview title="Action hierarchy" code={'<Button leftSection={<Plus size={16} />}>Add shift</Button>\n<Button variant="light">Duplicate week</Button>\n<Button variant="default">Export roster</Button>\n<Button variant="subtle">Cancel</Button>'}>
            <Button leftSection={<Plus size={16} />}>Add shift</Button>
            <Button variant="light">Duplicate week</Button>
            <Button variant="default">Export roster</Button>
            <Button variant="subtle" color="gray">Cancel</Button>
          </Preview>
          <PropsTable rows={[
            { prop: 'variant', type: 'filled | light | default | subtle | outline', default: 'filled', description: 'Action hierarchy; filled is reserved for the primary action.' },
            { prop: 'color', type: 'MantineColor', default: 'intime', description: 'Use red for irreversible or destructive actions.' },
            { prop: 'leftSection', type: 'ReactNode', description: 'Optional 16px icon, before the label.' },
          ]} />
        </Stack>
      </Section>
      <Section id="sizes" title="Sizes" description="Match action density to the surrounding interface, not the importance of the action.">
        <Preview code={'<Button size="xs">Apply</Button>\n<Button size="sm">Add shift</Button>\n<Button size="md">Submit request</Button>'}>
          <Stack align="center" gap={6}><Button size="xs">Apply</Button><Text size="xs" c="dimmed">xs · dense toolbar</Text></Stack>
          <Stack align="center" gap={6}><Button size="sm">Add shift</Button><Text size="xs" c="dimmed">sm · default</Text></Stack>
          <Stack align="center" gap={6}><Button size="md">Submit request</Button><Text size="xs" c="dimmed">md · standalone form</Text></Stack>
        </Preview>
      </Section>
      <Section id="icon-buttons" title="Icon buttons" description="Every icon-only action needs a descriptive accessible label and a tooltip. Keep touch targets at least 40px in field-facing interfaces.">
        <Preview code={'<Tooltip label="Edit shift">\n  <ActionIcon variant="default" size={40} aria-label="Edit shift">\n    <Pencil size={18} />\n  </ActionIcon>\n</Tooltip>'}>
          <Tooltip label="Add shift"><ActionIcon size={40} aria-label="Add shift"><CalendarPlus size={18} /></ActionIcon></Tooltip>
          <Tooltip label="Edit shift"><ActionIcon variant="default" size={40} aria-label="Edit shift"><Pencil size={18} /></ActionIcon></Tooltip>
          <Tooltip label="Download roster"><ActionIcon variant="subtle" size={40} aria-label="Download roster"><Download size={18} /></ActionIcon></Tooltip>
          <Tooltip label="Delete shift"><ActionIcon color="red" variant="light" size={40} aria-label="Delete shift"><Trash size={18} /></ActionIcon></Tooltip>
        </Preview>
      </Section>
      <Section id="states" title="States" description="Preserve the action label while loading. Explain why an action is disabled nearby.">
        <Preview title="Interactive loading demo" code={'<Button loading={isSaving}>Save schedule</Button>\n<Button disabled>Publish schedule</Button>\n<Button color="red" leftSection={<Trash size={16} />}>Delete shift</Button>'}>
          <Stack align="center">
            <Group justify="center">
              <Button loading={busy}>Save schedule</Button>
              <Button disabled>Publish schedule</Button>
              <Button color="red" variant="light" leftSection={<Trash size={16} />}>Delete shift</Button>
            </Group>
            <Button variant="subtle" size="xs" color="gray" onClick={() => setBusy((value) => !value)}>{busy ? 'Stop loading demo' : 'Show loading state'}</Button>
            <Text size="xs" c="dimmed">Publish is unavailable until all open shifts are filled.</Text>
          </Stack>
        </Preview>
      </Section>
      <Section id="guidelines" title="Guidelines">
        <DoDont doItems={['Start labels with a verb: Add shift, Approve request, Export roster.', 'Keep one filled primary button per panel or form.', 'Confirm destructive actions that remove assignments.']} dontItems={['Use vague labels such as OK or Click here.', 'Use department accent colors as arbitrary action colors.', 'Hide critical actions behind hover-only controls.']} />
      </Section>
      <Section id="figma" title="Figma reference">
        <FigmaSlot title="Buttons — variants, sizes & states" notes="Provide default, hover, focus, disabled, loading and destructive button frames, including toolbar and mobile usage." />
      </Section>
    </>
  )
}
