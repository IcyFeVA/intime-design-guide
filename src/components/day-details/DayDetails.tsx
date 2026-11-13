import { ActionIcon, CloseButton, Modal, Tooltip } from '@mantine/core'
import { X } from 'lucide-react'
import { TimeGridView } from '../calendar/CalendarViews'
import type { CalendarEvent } from '../calendar/events'
import classes from './DayDetails.module.css'

export interface DayDetailsProps {
  /** Employee name, shown as the title */
  name: string
  day: number
  /** Resolved events for the day. Build them with resolveDay(). */
  events: CalendarEvent[]
  /** Hour of the current-time line, when `day` is today */
  now?: number
  onClose: () => void
  onOpenEvent?: (event: CalendarEvent) => void
  variant?: 'desktop' | 'mobile'
}

/** Title row and a one-day timeline. The modal wraps it; demos can show it inline. */
export function DayDetailsContent({ name, day, events, now, onClose, onOpenEvent, variant = 'desktop' }: DayDetailsProps) {
  const mobile = variant === 'mobile'
  return (
    <div className={classes.root} data-variant={variant}>
      <div className={classes.header}>
        <h2 className={classes.title}>{name}</h2>
        {mobile ? (
          <Tooltip label="Close">
            <ActionIcon variant="default" size={40} aria-label="Close" onClick={onClose}><X size={20} /></ActionIcon>
          </Tooltip>
        ) : (
          <CloseButton aria-label="Close" onClick={onClose} />
        )}
      </div>
      <div className={classes.timeline}>
        <TimeGridView
          days={[day]}
          events={events}
          today={day}
          now={now}
          compact={mobile}
          onOpenEvent={(event) => onOpenEvent?.(event)}
          onOpenSignUps={() => {}}
        />
      </div>
    </div>
  )
}

/** One employee's day. Opens from a shift cell. A 600px modal on desktop, full screen on a phone. */
export function DayDetailsModal({ opened, contained = false, ...props }: DayDetailsProps & { opened: boolean; contained?: boolean }) {
  const mobile = props.variant === 'mobile'
  return (
    <Modal
      opened={opened}
      onClose={props.onClose}
      withCloseButton={false}
      centered
      fullScreen={mobile}
      size={600}
      padding={0}
      withinPortal={!contained}
      lockScroll={!contained}
      overlayProps={{ backgroundOpacity: 0.45, blur: 3 }}
      aria-label={`${props.name}, day details`}
      classNames={{ inner: contained ? classes.inner : undefined, content: classes.modalContent }}
    >
      <DayDetailsContent {...props} />
    </Modal>
  )
}
