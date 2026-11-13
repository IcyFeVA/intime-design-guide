import type { ReactNode } from 'react'
import { Anchor, Avatar, Badge, Button, Divider, Drawer, Group, Modal, Stack, Table, Text, UnstyledButton } from '@mantine/core'
import { coverageWindows, formatHeader, formatHour, hourLevels, type CoverageLevel, type DayCoverage } from './data'
import { formatEmployed, formatTenure, type EmployeeProfile } from './profiles'
import classes from './ScheduleDetails.module.css'

/**
 * Overlays for the schedule. Both render inside the nearest demo frame (`contained`), so the frame needs
 * `transform: translateZ(0)` to hold the fixed-position overlay. In the product they cover the window.
 */
type Variant = 'desktop' | 'mobile'

const levelLabel: Record<CoverageLevel, string> = { under: 'Under', met: 'Met', over: 'Over' }
const levelSpoken: Record<CoverageLevel, string> = { under: 'below target', met: 'on target', over: 'above target' }

function Eyebrow({ children }: { children: ReactNode }) {
  return <Text size="sm" fw={600} c="dimmed" tt="uppercase" lts="0.06em">{children}</Text>
}

/** Drag handle for bottom sheets. Tapping it closes the sheet. */
function SheetHandle({ onClose }: { onClose: () => void }) {
  return <UnstyledButton className={classes.handle} onClick={onClose} aria-label="Close" />
}

/* ------------------------------------------------------------------ */
/* Coverage                                                            */
/* ------------------------------------------------------------------ */

export interface CoverageSelection {
  /** Team or location name, shown above the date */
  title: string
  day: number
  coverage: DayCoverage
}

/** Hour-by-hour coverage for one day: a 24-block bar, then the stretches of the day with required and scheduled staff. */
export function CoverageDetails({ coverage }: { coverage: DayCoverage }) {
  const windows = coverageWindows(coverage)
  const hours = hourLevels(windows)
  const summary = windows.map((window) => `${formatHour(window.from)}–${formatHour(window.to)} ${levelSpoken[window.level]}`).join(', ')
  return (
    <Stack gap="lg">
      <Group gap="md" aria-hidden="true">
        {(['under', 'met', 'over'] as const).map((level) => (
          <Group key={level} gap={6} wrap="nowrap"><span className={classes.dot} data-level={level} /><Text size="sm" c="dimmed">{levelLabel[level]}</Text></Group>
        ))}
      </Group>
      <div>
        <Text size="sm" fw={600} c="dimmed" mb={8}>As scheduled</Text>
        <div className={classes.hours} role="img" aria-label={`As scheduled: ${summary}`}>
          {hours.map((level, hour) => <span key={hour} className={classes.hour} data-level={level} />)}
        </div>
        <div className={`${classes.ticks} tabular`} aria-hidden="true">
          {['00', '06', '12', '18', '24'].map((tick) => <span key={tick}>{tick}</span>)}
        </div>
      </div>
      <Table className={classes.windows} verticalSpacing={10} horizontalSpacing={0}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Time</Table.Th>
            <Table.Th ta="right"><abbr title="Required">Req</abbr></Table.Th>
            <Table.Th ta="right"><abbr title="Scheduled">Act</abbr></Table.Th>
            <Table.Th ta="right">Diff</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {windows.map((window) => {
            const diff = window.actual - window.required
            return (
              <Table.Tr key={window.from}>
                <Table.Td>
                  <span className={classes.marker} data-level={window.level} aria-hidden="true" />
                  <span className="tabular">{windows.length === 1 ? 'All day' : `${formatHour(window.from)}–${formatHour(window.to)}`}</span>
                </Table.Td>
                <Table.Td ta="right" c="dimmed" className="tabular">{window.required}</Table.Td>
                <Table.Td ta="right" fw={600} className="tabular">{window.actual}</Table.Td>
                <Table.Td ta="right" className={`${classes.diff} tabular`} data-level={window.level}>
                  {diff ? <>{diff > 0 ? '+' : ''}{diff}</> : <span aria-label="On target">—</span>}
                </Table.Td>
              </Table.Tr>
            )
          })}
        </Table.Tbody>
      </Table>
    </Stack>
  )
}

/** Opens from a time-of-day cell. A side drawer on desktop, a bottom sheet on mobile. */
export function CoverageDrawer({ selection, onClose, variant = 'desktop', contained = false }: {
  selection: CoverageSelection | null
  onClose: () => void
  variant?: Variant
  /** Render inside the demo frame instead of a portal */
  contained?: boolean
}) {
  const mobile = variant === 'mobile'
  return (
    <Drawer
      opened={!!selection}
      onClose={onClose}
      position={mobile ? 'bottom' : 'right'}
      size={mobile ? 'auto' : 440}
      withinPortal={!contained}
      lockScroll={!contained}
      withCloseButton={!mobile}
      overlayProps={{ backgroundOpacity: 0.45, blur: 3 }}
      classNames={{ inner: classes.inner, content: classes.drawerContent, header: classes.drawerHeader, body: classes.drawerBody, title: classes.drawerTitle }}
      data-sheet={mobile || undefined}
      title={selection && (
        <>
          {mobile && <SheetHandle onClose={onClose} />}
          <span className={classes.eyebrow}>{selection.title}</span>
          <span className={classes.heading}>{formatHeader(selection.day)}</span>
        </>
      )}
    >
      {selection && <CoverageDetails coverage={selection.coverage} />}
    </Drawer>
  )
}

/* ------------------------------------------------------------------ */
/* Employee                                                            */
/* ------------------------------------------------------------------ */

/** Who someone is and how to reach them. */
export function EmployeeDetails({ profile }: { profile: EmployeeProfile }) {
  return (
    <Stack gap="lg">
      <Group gap="md" wrap="nowrap" align="center">
        <Avatar size={72} radius="sm" color="intime" variant="light" alt="" className={classes.avatar}>{profile.initials}</Avatar>
        <Stack gap={6} miw={0}>
          <Text size="lg" fw={500} lh={1.2}>{profile.first} {profile.last}</Text>
          <div><Badge variant="outline" color="intime" radius="xl">{profile.rank}</Badge></div>
          <Text size="sm" c="dimmed">{profile.team}</Text>
        </Stack>
      </Group>
      <Stack gap={6}>
        <Eyebrow>First employed</Eyebrow>
        <Text>{formatEmployed(profile.firstEmployed)}</Text>
        <Text size="sm" c="dimmed">{formatTenure(profile.firstEmployed)}</Text>
      </Stack>
      <Divider />
      <Stack gap={10}>
        <Eyebrow>Contact</Eyebrow>
        <dl className={classes.contact}>
          <dt>Work</dt>
          <dd><Anchor href={`mailto:${profile.email}`} c="var(--text-primary-default)">{profile.email}</Anchor></dd>
          <dt>Mobile</dt>
          <dd><Anchor href={`tel:${profile.mobile.replace(/[^\d]/g, '')}`} c="inherit" className="tabular">{profile.mobile}</Anchor></dd>
        </dl>
      </Stack>
      <Divider />
      <Stack gap={6}>
        <Eyebrow>Employee ID</Eyebrow>
        <Text className="tabular">{profile.employeeId}</Text>
      </Stack>
    </Stack>
  )
}

/** Opens from a name in the schedule. A modal on desktop, a bottom sheet on mobile. */
export function EmployeeDetailsModal({ profile, onClose, variant = 'desktop', contained = false }: {
  profile: EmployeeProfile | null
  onClose: () => void
  variant?: Variant
  contained?: boolean
}) {
  const shared = {
    opened: !!profile,
    onClose,
    withinPortal: !contained,
    lockScroll: !contained,
    overlayProps: { backgroundOpacity: 0.45, blur: 3 },
  }
  if (variant === 'mobile') {
    return (
      <Drawer
        {...shared}
        position="bottom"
        size="auto"
        withCloseButton={false}
        classNames={{ inner: classes.inner, content: classes.drawerContent, header: classes.drawerHeader, body: classes.drawerBody, title: classes.drawerTitle }}
        data-sheet
        title={<><SheetHandle onClose={onClose} /><span className={classes.heading}>Employee details</span></>}
      >
        {profile && <EmployeeDetails profile={profile} />}
      </Drawer>
    )
  }
  return (
    <Modal
      {...shared}
      centered
      size={480}
      title="Employee details"
      classNames={{ inner: classes.inner, header: classes.modalHeader, title: classes.modalTitle, body: classes.modalBody }}
    >
      {profile && <EmployeeDetails profile={profile} />}
      <Group justify="flex-end" mt="xl"><Button variant="default" onClick={onClose}>Close</Button></Group>
    </Modal>
  )
}
