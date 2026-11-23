import { useState, type ReactNode } from 'react'
import { Button, Group, Modal, Radio, SegmentedControl, Stack, Text } from '@mantine/core'
import { ChevronsDown, ChevronsUp } from 'lucide-react'
import classes from './SortModal.module.css'
import { PhoneModalBody } from '../phone-modal/PhoneModalBody'
import { phoneModalProps } from '../phone-modal/phoneModalProps'

export type SortDirection = 'asc' | 'desc'

export interface SortValue<F extends string> {
  field: F
  direction: SortDirection
}

export interface SortField<F extends string> {
  key: F
  label: string
  disabled?: boolean
  /** Shown under the option, e.g. why it is disabled */
  description?: string
}

/**
 * Sort dialog: direction, then one field. Changes apply on Apply; Cancel and close discard them.
 * Pass `contained` to keep it inside a demo frame, and `fullScreen` on a phone.
 */
export function SortModal<F extends string>({ opened, value, fields, onClose, onApply, footnote, contained, fullScreen }: {
  opened: boolean
  value: SortValue<F>
  fields: SortField<F>[]
  onClose: () => void
  onApply: (value: SortValue<F>) => void
  /** Short note under the options */
  footnote?: ReactNode
  contained?: boolean
  /** Full screen below the status bar, for phones */
  fullScreen?: boolean
}) {
  if (fullScreen) {
    return (
      <Modal opened={opened} onClose={onClose} title="Sort" withinPortal={!contained} lockScroll={!contained} {...phoneModalProps}>
        {opened && <SortForm value={value} fields={fields} onClose={onClose} onApply={onApply} footnote={footnote} fullScreen />}
      </Modal>
    )
  }
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Sort"
      centered
      size={400}
      withinPortal={!contained}
      lockScroll={!contained}
      overlayProps={{ backgroundOpacity: 0.45, blur: 3 }}
      classNames={{ inner: classes.inner, title: classes.title }}
    >
      {/* Remount on open so the draft starts from the applied value */}
      {opened && <SortForm value={value} fields={fields} onClose={onClose} onApply={onApply} footnote={footnote} />}
    </Modal>
  )
}

function SortForm<F extends string>({ value, fields, onClose, onApply, footnote, fullScreen }: {
  value: SortValue<F>
  fields: SortField<F>[]
  onClose: () => void
  onApply: (value: SortValue<F>) => void
  footnote?: ReactNode
  fullScreen?: boolean
}) {
  const [draft, setDraft] = useState(value)
  const buttons = (
    <>
      <Button variant="default" onClick={onClose}>Cancel</Button>
      <Button variant="default" onClick={() => { onApply(draft); onClose() }}>Apply</Button>
    </>
  )
  const form = (
    <>
      <SegmentedControl
        fullWidth
        value={draft.direction}
        onChange={(direction) => setDraft((current) => ({ ...current, direction: direction as SortDirection }))}
        aria-label="Direction"
        classNames={{ root: classes.switch, label: classes.switchLabel }}
        data={[
          { value: 'asc', label: <Group gap={8} justify="center" wrap="nowrap"><ChevronsUp size={16} aria-hidden="true" />Ascending</Group> },
          { value: 'desc', label: <Group gap={8} justify="center" wrap="nowrap"><ChevronsDown size={16} aria-hidden="true" />Descending</Group> },
        ]}
      />
      <Radio.Group
        value={draft.field}
        onChange={(field) => setDraft((current) => ({ ...current, field: field as F }))}
        label={<Text size="sm" fw={600} c="dimmed" tt="uppercase" lts="0.06em" className={classes.eyebrow}>Sort by</Text>}
        mt="xl"
      >
        <Stack gap="sm" mt="sm">
          {fields.map((field) => (
            <Radio key={field.key} value={field.key} label={field.label} disabled={field.disabled} description={field.description} />
          ))}
        </Stack>
      </Radio.Group>
      {footnote && <Text size="xs" c="dimmed" mt="md">{footnote}</Text>}
    </>
  )
  if (fullScreen) return <PhoneModalBody footer={buttons}>{form}</PhoneModalBody>
  return (
    <>
      {form}
      <Group justify="flex-end" gap="sm" mt="xl">{buttons}</Group>
    </>
  )
}
