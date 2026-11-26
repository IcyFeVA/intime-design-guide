import { Button, Text } from '@mantine/core'
import { Copy } from 'lucide-react'
import type { AssignSource } from './model'
import { chipSpanLabel, codeFill } from './panel/format'
import classes from './WorkforceDemo.module.css'

/**
 * Floats over the bottom of the grid while assign mode is on: what each clicked cell gets, where it came from,
 * and Done. Escape ends it too.
 */
export function AssignBar({ source, onDone }: { source: AssignSource; onDone: () => void }) {
  const codes = [...new Set(source.chip.segments.map((segment) => segment.code))]
  return (
    <div className={classes.assignBar} role="region" aria-label="Assign mode">
      <Copy size={18} strokeWidth={1.75} className={classes.assignIcon} aria-hidden="true" />
      <div className={classes.assignText}>
        <Text size="sm" fw={600} c="var(--text-default)" className={classes.assignTitle}>
          Assigning
          {codes.map((code) => <span key={code} className={classes.assignCode} style={codeFill(code)}>{code}</span>)}
          <span className="tabular">{chipSpanLabel(source.chip)}</span>
        </Text>
        <Text size="xs" c="dimmed" truncate>
          From {source.from}. {source.openShift ? 'Click a person on that day.' : 'Click or drag cells to assign it.'} Esc stops.
        </Text>
      </div>
      <Button size="xs" variant="default" onClick={onDone} data-mantine-stop-propagation="true">Done</Button>
    </div>
  )
}
