import { useReducer } from 'react'
import type { Chip } from '../schedule/data'
import { noEdits, type OpenShiftEdit, type ScheduleEdits } from './data'

/** One autosave: people's days replaced as a whole, and open shift changes merged in. */
export interface EditCommit {
  days?: [key: string, chips: Chip[]][]
  open?: [id: string, edit: OpenShiftEdit][]
}

interface State {
  edits: ScheduleEdits
  past: ScheduleEdits[]
  /** Counts saves and undos, so the panel can say "Saved" */
  saves: number
}

type Action = { type: 'commit'; commit: EditCommit } | { type: 'undo' } | { type: 'reset' }

const HISTORY = 50
const initial: State = { edits: noEdits, past: [], saves: 0 }

function reducer(state: State, action: Action): State {
  if (action.type === 'reset') return initial
  if (action.type === 'undo') {
    if (!state.past.length) return state
    return { edits: state.past[state.past.length - 1], past: state.past.slice(0, -1), saves: state.saves + 1 }
  }
  const { days = [], open = [] } = action.commit
  const nextDays = new Map(state.edits.days)
  for (const [key, chips] of days) nextDays.set(key, chips)
  const nextOpen = new Map(state.edits.open)
  for (const [id, edit] of open) nextOpen.set(id, { ...nextOpen.get(id), ...edit })
  return {
    edits: { days: nextDays, open: nextOpen },
    past: [...state.past, state.edits].slice(-HISTORY),
    saves: state.saves + 1,
  }
}

/** The demo's schedule changes with an undo history. Every commit is one undo step. */
export function useScheduleEdits() {
  const [state, dispatch] = useReducer(reducer, initial)
  return {
    edits: state.edits,
    saves: state.saves,
    canUndo: state.past.length > 0,
    commit: (commit: EditCommit) => dispatch({ type: 'commit', commit }),
    undo: () => dispatch({ type: 'undo' }),
    reset: () => dispatch({ type: 'reset' }),
  }
}
