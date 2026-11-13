import { useState } from 'react'
import { Button, Checkbox, Group, NumberInput, Radio, Select, SimpleGrid, Stack, Switch, Text, Textarea, TextInput } from '@mantine/core'
import { Search } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import FigmaSlot from '../../components/FigmaSlot'
import Preview from '../../components/Preview'
import PropsTable from '../../components/PropsTable'
import DoDont from '../../components/DoDont'

export default function Forms() {
  const [submitted, setSubmitted] = useState(false)
  return (
    <>
      <PageHeader />
      <Section id="text-inputs" title="Text inputs" description="Visible labels are required. Placeholders show an example, not the field name.">
        <Stack gap="lg">
          <Preview align="start" code={'<TextInput label="Shift title" placeholder="e.g. Night patrol" required />\n<TextInput label="Search personnel" leftSection={<Search size={16} />} />'}>
            <SimpleGrid cols={{ base: 1, sm: 2 }} w="100%">
              <TextInput label="Shift title" placeholder="e.g. Night patrol" required />
              <TextInput label="Search personnel" placeholder="Name, badge or unit" leftSection={<Search size={16} />} />
              <Textarea label="Assignment notes" placeholder="Add context for the incoming crew" minRows={3} />
              <NumberInput label="Required staffing" description="Minimum qualified members on shift" defaultValue={4} min={1} max={30} />
            </SimpleGrid>
          </Preview>
          <PropsTable rows={[
            { prop: 'label', type: 'ReactNode', description: 'Always visible; never rely on a placeholder alone.' },
            { prop: 'description', type: 'ReactNode', description: 'Short helper text below the label.' },
            { prop: 'error', type: 'ReactNode', description: 'Actionable inline validation message.' },
            { prop: 'required', type: 'boolean', default: 'false', description: 'Shows a required marker and applies native required validation.' },
          ]} />
        </Stack>
      </Section>
      <Section id="selection" title="Selection controls" description="Use a select for long lists, radio controls for a few mutually exclusive options, and a switch for immediate on/off settings.">
        <Preview align="start" code={'<Select label="Unit" data={["Patrol D4", "Engine 12", "Medic 3"]} searchable />\n<Checkbox label="Include overtime hours" />\n<Switch label="Notify assigned members" defaultChecked />'}>
          <Stack w="100%" gap="lg">
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <Select label="Unit" placeholder="Choose a unit" data={['Patrol D4', 'Engine 12', 'Medic 3']} searchable />
              <Select label="Platoon" defaultValue="A" data={['A', 'B', 'C']} />
            </SimpleGrid>
            <Group align="start" gap="xl">
              <Stack gap="sm"><Checkbox label="Include overtime hours" defaultChecked /><Checkbox label="Only show available members" /></Stack>
              <Radio.Group label="Assignment type" defaultValue="regular"><Group mt={8}><Radio value="regular" label="Regular" /><Radio value="callback" label="Callback" /></Group></Radio.Group>
            </Group>
            <Switch label="Notify assigned members" description="Send a notification after publishing." defaultChecked />
          </Stack>
        </Preview>
      </Section>
      <Section id="date-time" title="Date & time" description="Draft native date/time fields. Confirm picker behavior, timezone handling and 12h/24h preferences from Figma.">
        <Preview align="start" code={'<TextInput label="Shift date" type="date" />\n<TextInput label="Start time" type="time" />\n<TextInput label="End time" type="time" />'}>
          <Stack w="100%">
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <TextInput label="Shift date" type="date" defaultValue="2026-05-04" />
              <TextInput label="Start time" type="time" defaultValue="07:00" className="tabular" />
              <TextInput label="End time" type="time" defaultValue="19:00" className="tabular" />
            </SimpleGrid>
            <Text size="xs" c="dimmed">All times shown in agency local time. Overnight shifts must show the next-day date.</Text>
          </Stack>
        </Preview>
      </Section>
      <Section id="validation" title="Validation" description="Validate on submit or after a field has been visited. State the problem and how to fix it.">
        <Preview align="start" code={'<TextInput label="Badge number" error="Enter a badge number, for example 0421." />\n<TextInput label="Agency" value="Metro Police Department" disabled />'}>
          <SimpleGrid cols={{ base: 1, sm: 2 }} w="100%">
            <TextInput label="Badge number" placeholder="0421" error="Enter a badge number, for example 0421." required />
            <TextInput label="Agency" defaultValue="Metro Police Department" description="Managed by your agency administrator." disabled />
          </SimpleGrid>
        </Preview>
      </Section>
      <Section id="layout" title="Form layout" description="Group related fields. Keep the primary action at the end of the form and use a logical keyboard order.">
        <Stack gap="lg">
          <Preview align="start" code={'<form onSubmit={handleSubmit}>\n  <Stack gap="md">\n    <TextInput label="Shift title" required />\n    <Select label="Unit" data={units} required />\n    <Group justify="flex-end"><Button type="submit">Create shift</Button></Group>\n  </Stack>\n</form>'}>
            <form style={{ width: '100%' }} onSubmit={(event) => { event.preventDefault(); setSubmitted(true) }}>
              <Stack gap="md">
                <TextInput label="Shift title" defaultValue="Day patrol" required />
                <Select label="Unit" defaultValue="Patrol D4" data={['Patrol D4', 'Engine 12']} required />
                <Group justify="space-between">
                  <Text size="xs" c="dimmed" role="status">{submitted ? 'Demo only — no shift was created.' : 'All fields are required.'}</Text>
                  <Button type="submit">Create shift</Button>
                </Group>
              </Stack>
            </form>
          </Preview>
          <DoDont doItems={['Place labels above fields for predictable scanning.', 'Use one column for complex forms; pair short related fields.', 'Keep helper and error text close to the field.']} dontItems={['Use placeholder text as the only label.', 'Clear entered data after a validation error.', 'Ask for information the system already knows.']} />
        </Stack>
      </Section>
      <Section id="figma" title="Figma reference"><FigmaSlot title="Forms — fields, validation & layout" notes="Share input states, pickers, field spacing, multi-step workflows, timezone rules and mobile form frames." /></Section>
    </>
  )
}
