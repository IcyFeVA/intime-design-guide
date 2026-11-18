import { useState } from 'react'
import { ActionIcon, Alert, Button, Group, Modal, Notification, Stack, Text, Tooltip } from '@mantine/core'
import { CircleCheck, Info, Trash, TriangleAlert, X } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import Preview from '../../components/Preview'
import FigmaSlot from '../../components/FigmaSlot'
import DoDont from '../../components/DoDont'
import styles from './ComponentDemos.module.css'
import classes from './Feedback.module.css'

type Tone = 'error' | 'warning' | 'info'

/** Alert colored with the theme's tone tokens: `--background-<tone>-light` behind, the tone text color in front. */
const tone = (value: Tone) => ({
  'data-tone': value,
  classNames: { root: classes.alert, title: classes.title, icon: classes.icon, message: classes.message },
})

export default function Feedback() {
  const [opened, setOpened] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [notification, setNotification] = useState(true)
  return (
    <>
      <PageHeader />
      <Section id="alerts" title="Alerts" description="Inline alerts explain a persistent condition that affects the current task. Keep them close to the relevant content.">
        <Stack gap="lg">
          <Preview align="start" code={'<Alert {...tone(\'warning\')} title="Coverage below minimum"\n  icon={<TriangleAlert size={18} />}>\n  Patrol D4 needs 1 more qualified officer for 19:00–07:00.\n</Alert>'}>
            <Stack w="100%"><Alert {...tone('warning')} title="Coverage below minimum" icon={<TriangleAlert size={18} />}>Patrol D4 needs 1 more qualified officer for <span className="tabular">19:00–07:00</span>.</Alert><Alert {...tone('error')} title="Rest period conflict" icon={<TriangleAlert size={18} />}>Taylor Brooks has less than 8 hours of rest before this assignment. Review the shift before publishing.</Alert><Alert {...tone('info')} title="Agency local time" icon={<Info size={18} />}>Schedules use the timezone configured by your agency administrator.</Alert></Stack>
          </Preview>
        </Stack>
      </Section>
      <Section id="notifications" title="Notifications" description="Transient feedback confirms completed actions. Avoid placing critical, unresolved problems in a disappearing toast.">
        <Preview title="Dismissible demo" code={'<Notification color="green" title="Schedule published"\n  icon={<CircleCheck size={18} />} onClose={dismiss}>\n  24 members have been notified.\n</Notification>'}>
          <Stack className={styles.notification}>
            {notification ? <Notification color="green" title="Schedule published" icon={<CircleCheck size={18} />} onClose={() => setNotification(false)}>24 members have been notified.</Notification> : <Button variant="light" onClick={() => setNotification(true)}>Show notification again</Button>}
            <Text size="xs" c="dimmed" ta="center">Demo only. No notifications are sent.</Text>
          </Stack>
        </Preview>
      </Section>
      <Section id="modals" title="Modals & confirmation" description="Use a confirmation for consequential changes. State what will happen and name the affected assignment.">
        <Stack gap="lg">
          <Preview code={'<Modal opened={opened} onClose={close} title="Delete this shift?">\n  <Text>Alex Morgan · Patrol D4 · May 4, 07:00–19:00</Text>\n  <Group justify="flex-end">\n    <Button variant="default" onClick={close}>Keep shift</Button>\n    <Button color="red" onClick={remove}>Delete shift</Button>\n  </Group>\n</Modal>'}>
            <Stack align="center"><Button color="red" variant="light" leftSection={<Trash size={16} />} onClick={() => { setOpened(true); setDeleted(false) }}>Open delete confirmation</Button><Text size="xs" c="dimmed" role="status">{deleted ? 'Demo shift deleted. No real data was changed.' : 'Try the modal to inspect focus and keyboard behavior.'}</Text></Stack>
          </Preview>
          <DoDont doItems={['Use a specific title and show the assignment being changed.', 'Provide a safe, clearly labeled cancel action.', 'Return focus to the trigger when the modal closes.']} dontItems={['Ask “Are you sure?” without explaining the consequence.', 'Use a modal for routine confirmations such as a successful save.', 'Allow background interaction while a blocking dialog is open.']} />
        </Stack>
        <Modal opened={opened} onClose={() => setOpened(false)} title="Delete this shift?" centered>
          <Stack gap="lg"><Alert {...tone('error')} icon={<TriangleAlert size={18} />}>This removes the assignment from the schedule. The member will need to be notified.</Alert><Stack gap={4}><Text fw={600}>Alex Morgan · Patrol D4</Text><Text c="dimmed" size="sm" className="tabular">May 4 · 07:00–19:00</Text></Stack><Group justify="flex-end"><Button variant="default" onClick={() => setOpened(false)}>Keep shift</Button><Button color="red" onClick={() => { setOpened(false); setDeleted(true) }}>Delete shift</Button></Group></Stack>
        </Modal>
      </Section>
      <Section id="tooltips" title="Tooltips" description="Tooltips clarify controls, not essential instructions. Trigger them on focus as well as hover.">
        <Preview code={'<Tooltip label="Close details" events={{ hover: true, focus: true, touch: false }}>\n  <ActionIcon aria-label="Close details"><X size={18} /></ActionIcon>\n</Tooltip>'}>
          <Group gap="xl"><Tooltip label="About staffing minimums" events={{ hover: true, focus: true, touch: false }}><ActionIcon variant="subtle" color="gray" aria-label="About staffing minimums" size={40}><Info size={18} /></ActionIcon></Tooltip><Tooltip label="Close details" events={{ hover: true, focus: true, touch: false }}><ActionIcon variant="default" aria-label="Close details" size={40}><X size={18} /></ActionIcon></Tooltip></Group>
        </Preview>
      </Section>
      <Section id="figma" title="Figma reference"><FigmaSlot title="Feedback — alerts, toasts & dialogs" notes="Share severity variants, dismiss behavior, notification placement/duration, confirmation dialogs, and tooltip timing and positioning." /></Section>
    </>
  )
}
