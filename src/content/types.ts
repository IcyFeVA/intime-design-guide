import type { ComponentType, LazyExoticComponent } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { TokenStatus } from '../tokens/types'

export type PageGroup = 'Getting started' | 'Foundations' | 'Components' | 'Patterns' | 'Resources'

export interface PageSection {
  /** Must match the `id` passed to <Section> on the page */
  id: string
  title: string
}

export interface PageDef {
  path: string
  title: string
  group: PageGroup
  icon: LucideIcon
  description: string
  status: TokenStatus
  keywords: string[]
  sections: PageSection[]
  updated: string
  /** Route still works, but the page is left out of the sidebar, search, overview and prev/next links. */
  hidden?: boolean
  component: LazyExoticComponent<ComponentType>
}
