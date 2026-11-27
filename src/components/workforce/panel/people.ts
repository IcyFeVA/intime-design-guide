import { createContext, useContext } from 'react'
import { allMembers, type OpenShift, type WorkforceMember } from '../data'

/** Where an assignment went after a move or a reassign: the person, the day, and one of its segments */
export interface MovedTo {
  member: string
  day: number
  segment: string
}

/**
 * What the panel needs from the demo: people as edited (for their hours), Find in schedule, filling open shifts and
 * following an assignment that moved.
 */
export interface PanelPeople {
  member: (id: string) => WorkforceMember | undefined
  /** Scrolls the grid to the person's row and highlights it. Missing: preview only. */
  onFind?: (id: string) => void
  /** Gives the open shift to these people (one save). Missing: preview only. */
  onFill?: (shift: OpenShift, ids: string[]) => void
  /** Opens the Fill dialog (candidates for the shift). Missing: preview only. */
  onFindFill?: (shift: OpenShift) => void
  /** An assignment moved to another day or person (already saved): select its new cell and say so in the status line */
  onMoved?: (to: MovedTo, status: string) => void
}

/** Without a provider: the mock people as they are, no Find in schedule */
export const PanelPeopleContext = createContext<PanelPeople>({ member: (id) => allMembers.find((member) => member.id === id) })

export const usePanelPeople = () => useContext(PanelPeopleContext)
