import { createContext, useContext } from 'react'
import { allMembers, type WorkforceMember } from '../data'

/** What the employee row needs from the demo: people as edited (for their hours), and Find in schedule */
export interface PanelPeople {
  member: (id: string) => WorkforceMember | undefined
  /** Scrolls the grid to the person's row and highlights it. Missing: preview only. */
  onFind?: (id: string) => void
}

/** Without a provider: the mock people as they are, no Find in schedule */
export const PanelPeopleContext = createContext<PanelPeople>({ member: (id) => allMembers.find((member) => member.id === id) })

export const usePanelPeople = () => useContext(PanelPeopleContext)
