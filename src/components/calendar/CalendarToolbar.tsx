import type { Dispatch, SetStateAction } from 'react'
import { ActionIcon, Button, Menu, Tooltip } from '@mantine/core'
import { Calendar1, CalendarCog, CalendarDays, Check, ChevronLeft, ChevronRight, Map as MapIcon } from 'lucide-react'
import { calendarViews, type CalendarView } from '../../tokens/calendar'
import { MOCK_TODAY } from '../schedule/data'
import { stepView, viewLabel } from './events'

const stepName: Record<CalendarView, string> = { month: 'month', week: 'week', day: 'day', agenda: 'week' }

/** Previous, date, next and Today. Arrows move by the view: a month, a week or a day. */
export function CalendarStepper({ view, anchor, onAnchorChange, onPicker, compact }: {
  view: CalendarView
  anchor: number
  onAnchorChange: Dispatch<SetStateAction<number>>
  onPicker: () => void
  /** Phone: shorter date label and Today as an icon */
  compact?: boolean
}) {
  const unit = stepName[view]
  const size = compact ? 38 : 36
  return (
    <>
      <Tooltip label={`Previous ${unit}`}>
        <ActionIcon variant="default" size={size} aria-label={`Previous ${unit}`} onClick={() => onAnchorChange((value) => stepView(view, value, -1))}><ChevronLeft size={18} /></ActionIcon>
      </Tooltip>
      <Button variant="default" size="sm" h={size} fw={400} px={compact ? 10 : undefined} leftSection={<CalendarDays size={18} aria-hidden="true" />} onClick={onPicker} miw={0} style={compact ? { flex: 1 } : undefined}>
        <span className="tabular">{viewLabel(view, anchor, compact)}</span>
      </Button>
      <Tooltip label={`Next ${unit}`}>
        <ActionIcon variant="default" size={size} aria-label={`Next ${unit}`} onClick={() => onAnchorChange((value) => stepView(view, value, 1))}><ChevronRight size={18} /></ActionIcon>
      </Tooltip>
      {compact ? (
        <Tooltip label="Today">
          <ActionIcon variant="default" size={size} aria-label="Today" onClick={() => onAnchorChange(MOCK_TODAY)}><Calendar1 size={18} /></ActionIcon>
        </Tooltip>
      ) : (
        <Button variant="default" size="sm" fw={400} onClick={() => onAnchorChange(MOCK_TODAY)}>Today</Button>
      )}
    </>
  )
}

/** View switcher for phones: an icon button with a menu. Desktop uses a PickerMenu. */
export function CalendarViewMenu({ view, onChange }: { view: CalendarView; onChange: (view: CalendarView) => void }) {
  return (
    <Menu position="bottom-start" offset={4} withinPortal={false}>
      <Menu.Target>
        <Tooltip label="View"><ActionIcon variant="default" size={38} aria-label={`View: ${calendarViews.find((item) => item.key === view)?.label}`}><CalendarCog size={18} /></ActionIcon></Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>View</Menu.Label>
        {calendarViews.map((item) => (
          <Menu.Item key={item.key} onClick={() => onChange(item.key)} rightSection={item.key === view ? <Check size={14} aria-hidden="true" /> : null}>{item.label}</Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}

export function MapButton({ onClick, size = 36 }: { onClick: () => void; size?: number }) {
  return (
    <Tooltip label="Map">
      <ActionIcon variant="default" size={size} aria-label="Show on map" onClick={onClick}><MapIcon size={18} /></ActionIcon>
    </Tooltip>
  )
}
