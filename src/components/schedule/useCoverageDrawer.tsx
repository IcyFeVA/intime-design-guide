import { useState } from 'react'
import { CoverageDrawer, type CoverageSelection } from './ScheduleDetails'
import type { ScheduleSection } from './data'

/**
 * Wires time-of-day cells to the coverage drawer. Pass `onCoverageClick` to ScheduleGrid or MobileSchedule
 * and render `drawer` inside the same demo frame.
 */
export function useCoverageDrawer(variant: 'desktop' | 'mobile') {
  const [selection, setSelection] = useState<CoverageSelection | null>(null)
  return {
    onCoverageClick: (section: ScheduleSection, day: number) => {
      if (section.coverage) setSelection({ title: section.title, day, coverage: section.coverage(day) })
    },
    close: () => setSelection(null),
    drawer: <CoverageDrawer selection={selection} onClose={() => setSelection(null)} variant={variant} contained />,
  }
}
