import { useState, type Dispatch, type SetStateAction } from 'react'
import { EventDetailsModal, SignUpsModal, TaskFormModal } from './CalendarModals'
import { eventLabel, formatShortDate, type CalendarEvent, type SignUp } from './events'

/* ------------------------------------------------------------------ */
/* Wiring for demos                                                    */
/* ------------------------------------------------------------------ */

/**
 * Opens the right modal for an event, sign-ups or a new task, and keeps the demo's events up to date.
 * Your own tasks open in the edit form; a scheduler’s task, leave and assignments open read-only details.
 */
export function useCalendarModals({ setEvents, signUps, onHint }: {
  setEvents: Dispatch<SetStateAction<CalendarEvent[]>>
  signUps: SignUp[]
  onHint: (hint: string) => void
}) {
  const [detail, setDetail] = useState<CalendarEvent | null>(null)
  const [signUpsDay, setSignUpsDay] = useState<number | null>(null)
  const [form, setForm] = useState<{ key: number; day: number; task?: CalendarEvent; opened: boolean }>({ key: 0, day: 0, opened: false })

  const addTask = (day: number) => setForm((value) => ({ key: value.key + 1, day, opened: true }))
  const openEvent = (event: CalendarEvent) => {
    if (event.kind === 'task' && !event.assignedBy) setForm((value) => ({ key: value.key + 1, day: event.day, task: event, opened: true }))
    else setDetail(event)
  }
  const closeForm = () => setForm((value) => ({ ...value, opened: false }))

  const modals = (
    <>
      <EventDetailsModal event={detail} onClose={() => setDetail(null)} />
      <SignUpsModal day={signUpsDay} signUps={signUps} onClose={() => setSignUpsDay(null)} onHint={onHint} />
      <TaskFormModal
        state={form}
        onClose={closeForm}
        onSave={(task, recurrence) => {
          setEvents((list) => (list.some((item) => item.id === task.id) ? list.map((item) => (item.id === task.id ? task : item)) : [...list, task]))
          onHint(`${form.task ? 'Saved' : 'Added'} “${eventLabel(task)}” on ${formatShortDate(task.day)}.${recurrence !== 'None' ? ' Recurrence is not part of this demo.' : ''} Preview only.`)
          closeForm()
        }}
        onDelete={(task) => {
          setEvents((list) => list.filter((item) => item.id !== task.id))
          onHint(`Deleted “${task.title}”. Preview only.`)
          closeForm()
        }}
      />
    </>
  )

  return { openEvent, openSignUps: setSignUpsDay, addTask, modals }
}
