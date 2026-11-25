import { useState } from 'react'
import { ActionIcon, Button, Popover, ScrollArea, Text, Tooltip } from '@mantine/core'
import { Radio, TriangleAlert, UserSearch } from 'lucide-react'
import { formatLongDay } from './data'
import type { UnderAlert } from './model'
import classes from './Workforce.module.css'

/**
 * The Understaffed button and its Coverage alerts popover: every watch-day below the minimum in the range,
 * with Post this shift and Find-Fill actions. Preview only: the actions call `onPreview`.
 */
export default function CoverageAlerts({ alerts, unit, onPreview }: {
  alerts: UnderAlert[]
  /** "Patrol" */
  unit: string
  onPreview: (action: string) => void
}) {
  const [opened, setOpened] = useState(false)
  const count = alerts.length
  const act = (action: string) => {
    setOpened(false)
    onPreview(action)
  }
  return (
    <Popover opened={opened} onChange={setOpened} position="bottom-start" offset={6} width={370} trapFocus returnFocus shadow="md">
      <Popover.Target>
        <Button
          aria-label={`${count} understaffed`}
          aria-haspopup="dialog"
          aria-expanded={opened}
          variant="light"
          color={count ? 'red' : 'gray'}
          className={count ? classes.understaffedButton : undefined}
          size="sm"
          fw={500}
          leftSection={<TriangleAlert size={16} aria-hidden="true" />}
          onClick={() => setOpened((value) => !value)}
        >
          <span className="tabular">{count}</span><span className={classes.collapsibleText}>&nbsp;understaffed</span>
        </Button>
      </Popover.Target>
      <Popover.Dropdown p={0} aria-labelledby="coverage-alerts-title">
        <div className={classes.alertsHeader}>
          <Text id="coverage-alerts-title" fw={600}>Coverage alerts</Text>
          <Text size="sm" c="dimmed">Days below the section minimum for {unit} · full unit</Text>
        </div>
        {count === 0 ? (
          <Text size="sm" c="dimmed" px="md" pb="md">Every day in this range meets the minimum.</Text>
        ) : (
          <ScrollArea.Autosize mah={360} type="scroll">
            <ul className={classes.alertsList}>
              {alerts.map(({ watch, day, have, need }) => {
                const title = `${watch.title} · ${formatLongDay(day)}`
                return (
                  <li key={`${watch.id}@${day}`} className={classes.alertRow}>
                    <TriangleAlert size={16} className={classes.alertIcon} aria-hidden="true" />
                    <div className={classes.alertText}>
                      <Text size="sm" fw={600}>{title}</Text>
                      <Text size="sm" c="dimmed" className="tabular">{have} of {need} minimum scheduled</Text>
                    </div>
                    <Tooltip label="Post this shift">
                      <ActionIcon variant="subtle" color="gray" size={32} className={classes.alertAction} aria-label={`Post this shift: ${title}`} onClick={() => act(`Post this shift (${title})`)}>
                        <Radio size={16} strokeWidth={1.75} aria-hidden="true" />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Find-Fill · Mandatory OT">
                      <ActionIcon variant="subtle" color="gray" size={32} className={classes.alertAction} aria-label={`Find-Fill, mandatory overtime: ${title}`} onClick={() => act(`Find-Fill · Mandatory OT (${title})`)}>
                        <UserSearch size={16} strokeWidth={1.75} aria-hidden="true" />
                      </ActionIcon>
                    </Tooltip>
                  </li>
                )
              })}
            </ul>
          </ScrollArea.Autosize>
        )}
      </Popover.Dropdown>
    </Popover>
  )
}
