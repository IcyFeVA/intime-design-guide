import type { Dispatch, SetStateAction } from 'react'
import { ActionIcon, Button, Menu } from '@mantine/core'
import { Calendar1, CalendarCog, CalendarDays, Check, ChevronLeft, ChevronRight, Map as MapIcon } from 'lucide-react'
import { calendarViews, type CalendarView } from '../../tokens/calendar'
import { MOCK_TODAY } from '../schedule/data'
import { PeriodPicker, type PeriodMode } from '../date-picker/DatePickers'
import { stepView, viewLabel } from './events'

/** Month view picks a month, Week a week, Agenda seven days from any day, Day a single day. */
const pickerMode: Record<CalendarView, PeriodMode> = {
  month: { kind: 'month' },
  week: { kind: 'block', length: 7, align: 'week' },
  agenda: { kind: 'block', length: 7, align: 'day' },
  day: { kind: 'day' },
}

const stepName: Record<CalendarView, string> = { month: 'month', week: 'week', day: 'day', agenda: 'week' }

/** Previous, date, next and Today. Arrows move by the view: a month, a week or a day. The date button opens a picker that fits the view. */
export function CalendarStepper({ view, anchor, onAnchorChange, compact }: {
  view: CalendarView
  anchor: number
  onAnchorChange: Dispatch<SetStateAction<number>>
  /** Phone: shorter date label and Today as an icon */
  compact?: boolean
}) {
  const unit = stepName[view]
  const size = compact ? 38 : 36
  return (
    <>
      <ActionIcon variant="default" size={size} aria-label={`Previous ${unit}`} onClick={() => onAnchorChange((value) => stepView(view, value, -1))}><ChevronLeft size={18} /></ActionIcon>
      <PeriodPicker
        mode={pickerMode[view]}
        anchor={anchor}
        onChange={onAnchorChange}
        target={
          <Button variant="default" size="sm" h={size} fw={400} px={compact ? 10 : undefined} leftSection={<CalendarDays size={18} aria-hidden="true" />} miw={0} style={compact ? { flex: 1 } : undefined}
            aria-label={`${viewLabel(view, anchor)}. Pick a ${view === 'agenda' ? 'start day' : unit}`}>
            <span className="tabular">{viewLabel(view, anchor, compact)}</span>
          </Button>
        }
      />
      <ActionIcon variant="default" size={size} aria-label={`Next ${unit}`} onClick={() => onAnchorChange((value) => stepView(view, value, 1))}><ChevronRight size={18} /></ActionIcon>
      {compact ? (
        <ActionIcon variant="default" size={size} aria-label="Today" onClick={() => onAnchorChange(MOCK_TODAY)}><Calendar1 size={18} /></ActionIcon>
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
        <ActionIcon variant="default" size={38} aria-label={`View: ${calendarViews.find((item) => item.key === view)?.label}`}><CalendarCog size={18} /></ActionIcon>
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

/** Map button. Pass `pressed` to use it as a toggle (the phone uses it to show and hide the legend). */
export function MapButton({ onClick, size = 36, pressed, label = 'Show on map' }: { onClick: () => void; size?: number; pressed?: boolean; label?: string }) {
  return (
    <ActionIcon
        variant={pressed ? 'light' : 'default'}
        color={pressed ? 'intime' : undefined}
        size={size}
        aria-label={label}
        aria-pressed={pressed}
        onClick={onClick}
      >
        <MapIcon size={18} aria-hidden="true" />
    </ActionIcon>
  )
}
