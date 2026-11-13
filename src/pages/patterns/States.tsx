import { useState } from 'react'
import { Alert, Button, Group, Paper, Skeleton, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { CalendarPlus, CalendarX, CircleAlert, LockKeyhole, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import Preview from '../../components/Preview'
import DoDont from '../../components/DoDont'

export default function States() {
  const [created, setCreated] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  return (
    <>
      <PageHeader />
      <Section id="empty" title="Empty" description="Explain why nothing is here and give the user one useful next action. Empty is not the same as an error.">
        <Preview title="No shifts scheduled" code={'<EmptyState\n  icon={CalendarX}\n  title="No shifts scheduled"\n  description="Start building your roster for May 4–10."\n  action={<Button leftSection={<CalendarPlus />}>Create shift</Button>}\n/>'}>
          <Stack gap="sm" align="center" ta="center" py="lg" maw={380}>
            <ThemeIcon size={48} radius="xl" color="intime" variant="light"><CalendarX size={24} /></ThemeIcon>
            <Title order={3}>{created ? 'Ready to build your roster' : 'No shifts scheduled'}</Title>
            <Text size="sm" c="dimmed">{created ? 'The shift editor would open here in the scheduling app.' : 'There are no assignments for May 4–10. Add the first shift or apply a rotation template.'}</Text>
            <Button size="sm" leftSection={<CalendarPlus size={16} />} onClick={() => setCreated(!created)}>{created ? 'Reset demo' : 'Create shift'}</Button>
            {created && <Text role="status" size="xs" c="dimmed">Preview only · no schedule data is saved</Text>}
          </Stack>
        </Preview>
        <div style={{ marginTop: 16 }}><DoDont doItems={['Use a clear title, one short explanation and a primary action.', 'Distinguish “no data yet” from “no results match filters.”']} dontItems={['Blame the user for an empty result.', 'Show a large illustration that pushes the next action off-screen.']} /></div>
      </Section>
      <Section id="loading" title="Loading" description="Preserve the shape of the content while it loads. Skeletons reduce layout shift without implying that data is available.">
        <Preview title="Roster skeleton" align="start" code={'<Stack aria-busy="true" aria-label="Loading roster">\n  <Skeleton height={32} />\n  {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} height={48} />)}\n</Stack>'}>
          <Stack gap="md" w="100%" aria-busy="true" aria-label="Loading roster">
            <Group justify="space-between"><Skeleton width={160} height={20} /><Skeleton width={90} height={30} /></Group>
            {[0, 1, 2, 3].map((row) => <Group key={row} gap="md" wrap="nowrap"><Skeleton circle height={32} /><Stack gap={6} style={{ flex: 1 }}><Skeleton height={10} width={`${70 - row * 8}%`} /><Skeleton height={8} width="32%" /></Stack><Skeleton height={24} width={84} /></Group>)}
          </Stack>
        </Preview>
        <Text size="sm" c="dimmed" mt="md">Use <code>aria-busy</code> on the region and a concise accessible label. Keep refreshing data visible when possible; do not replace the whole screen with a spinner.</Text>
      </Section>
      <Section id="error" title="Error" description="State what failed, what is safe, and what the user can do next. Keep existing schedule data visible during a failed refresh.">
        <Preview title="Recoverable load error" align="start" code={'<Alert color="red" icon={<CircleAlert />} title="Could not refresh the roster">\n  Your current schedule is still visible. Try again.\n  <Button variant="light" color="red">Retry</Button>\n</Alert>'}>
          <Alert w="100%" color={retrying ? 'cyan' : 'red'} icon={<CircleAlert size={18} />} title={retrying ? 'Retry requested' : 'Could not refresh the roster'} variant="light">
            <Text size="sm" mb="md">{retrying ? 'This preview does not make a network request. The app would retry the failed operation here.' : 'Your current schedule is still visible. Check your connection and try again.'}</Text>
            <Button variant="light" color={retrying ? 'cyan' : 'red'} size="xs" leftSection={<RefreshCw size={13} />} onClick={() => setRetrying(!retrying)}>{retrying ? 'Reset demo' : 'Retry'}</Button>
          </Alert>
        </Preview>
        <div style={{ marginTop: 16 }}><DoDont doItems={['Use plain language and preserve user-entered data.', 'Offer a retry when the action is safe to repeat.']} dontItems={['Expose stack traces or raw API messages to users.', 'Automatically retry destructive actions.']} /></div>
      </Section>
      <Section id="permission" title="No permission" description="Access boundaries should be clear and calm. Explain the required role without revealing protected schedule information.">
        <Preview title="Role-restricted action">
          <Paper p="xl" withBorder maw={440} w="100%" style={{ background: 'var(--intime-surface)', borderColor: 'var(--intime-border)' }}>
            <Stack align="center" ta="center" gap="sm"><ThemeIcon color="gray" variant="light" size={44} radius="xl"><LockKeyhole size={22} /></ThemeIcon><Title order={3}>Supervisor access required</Title><Text size="sm" c="dimmed">Only supervisors can approve overtime assignments. Contact your department administrator if you need access.</Text><Button variant="default" size="sm" onClick={() => setRequestSent(!requestSent)}>{requestSent ? 'Reset demo' : 'Request access'}</Button>{requestSent && <Text role="status" size="xs" c="dimmed">Preview only · an access request would be sent to your administrator.</Text>}</Stack>
          </Paper>
        </Preview>
      </Section>
    </>
  )
}
