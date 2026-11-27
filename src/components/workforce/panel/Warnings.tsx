import { useState } from 'react'
import { Text, UnstyledButton } from '@mantine/core'
import { ChevronRight, TriangleAlert } from 'lucide-react'
import type { ScheduleWarning } from '../warnings'
import classes from '../WorkforcePanel.module.css'

/**
 * Warnings about the person's day, under the employee row. One shows as it is; several collapse to "2 warnings".
 * A warning about an assignment selects it. Warnings never block a change.
 */
export function WarningStack({ warnings, onSelectBlock }: { warnings: ScheduleWarning[]; onSelectBlock: (block: number) => void }) {
  const [open, setOpen] = useState(false)
  if (!warnings.length) return null

  const rows = warnings.map((warning) => (
    <WarningRow key={`${warning.kind}:${warning.title}:${warning.detail}`} warning={warning} onSelect={warning.kind === 'hours' ? undefined : () => onSelectBlock(warning.blocks[0])} />
  ))

  if (warnings.length === 1) return <div className={classes.warnings}>{rows}</div>
  return (
    <div className={classes.warnings}>
      <UnstyledButton className={classes.warningsToggle} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <TriangleAlert size={16} strokeWidth={2} className={classes.warningIcon} aria-hidden="true" />
        <Text span size="sm" fw={600}>{warnings.length} warnings</Text>
        <ChevronRight size={16} className={classes.warningsChevron} data-open={open || undefined} aria-hidden="true" />
      </UnstyledButton>
      {open && <div className={classes.warningList}>{rows}</div>}
    </div>
  )
}

function WarningRow({ warning, onSelect }: { warning: ScheduleWarning; onSelect?: () => void }) {
  const body = (
    <>
      <TriangleAlert size={16} strokeWidth={2} className={classes.warningIcon} aria-hidden="true" />
      <span className={classes.warningText}>
        <Text span size="sm" fw={600} display="block">{warning.title}</Text>
        <Text span size="xs" c="dimmed" display="block">{warning.detail}</Text>
      </span>
    </>
  )
  if (!onSelect) return <div className={classes.warningRow}>{body}</div>
  return (
    <UnstyledButton className={classes.warningRow} onClick={onSelect} aria-label={`${warning.title}. ${warning.detail}. Select the assignment`}>
      {body}
    </UnstyledButton>
  )
}
