import type { TokenStatus } from './types'

/**
 * Patterns drawn on schedule and calendar cells. The CSS modules use the same geometry
 * (Schedule.module.css, Mobile.module.css, Calendar.module.css); change both together.
 */

/** Diagonal stripes from top left to bottom right: a `line`px line every `period`px. */
export const stripes = (color: string, line: number, period: number) =>
  `repeating-linear-gradient(135deg, ${color} 0 ${line}px, transparent ${line}px ${period}px)`

/** Two fills split from bottom left to top right. `a` takes the bottom-left half. */
export const diagonalSplit = (a: string, b: string) => `linear-gradient(to top right, ${a} 50%, ${b} 50%)`

/** Stripes per cell kind that has a `hatch` in cellColors. */
export const hatchStripes: Record<string, (color: string) => string> = {
  'activity-out': (color) => stripes(color, 2, 9),
  expired: (color) => stripes(color, 1, 8),
}

export type CellPatternKey = 'mixed' | 'out-of-unit' | 'expired'

export interface CellPattern {
  key: CellPatternKey
  label: string
  usage: string
  /** Variables the pattern reads */
  tokens: `--schedule-${string}`[]
  status: TokenStatus
  /** The pattern as plain CSS, without the variable definitions */
  css: string
}

export const cellPatterns: CellPattern[] = [
  {
    key: 'mixed',
    label: 'Mixed day',
    usage: 'A day that mixes kinds, such as a shift that runs into overtime. The first kind takes the bottom-left half.',
    tokens: ['--schedule-regular', '--schedule-leave', '--schedule-overtime'],
    status: 'confirmed',
    css: `/* Mixed day: two kinds split diagonally. --cell-a takes the bottom-left half.
   Set each to --schedule-regular, --schedule-leave or --schedule-overtime. */
.shift-cell {
  --cell-a: var(--schedule-regular);
  --cell-b: var(--schedule-overtime);
  background: ${diagonalSplit('var(--cell-a)', 'var(--cell-b)')};
}`,
  },
  {
    key: 'out-of-unit',
    label: 'Out of unit',
    usage: 'Stripes over the fill when the member works for another unit. Always paired with the OU tag.',
    tokens: ['--schedule-regular', '--schedule-hatch'],
    status: 'confirmed',
    css: `/* Out of unit: stripes over the shift fill. Pair with the OU tag. */
.shift-cell {
  position: relative;
  overflow: hidden;
  background: var(--schedule-regular);
}

.shift-cell[data-out-of-unit]::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: ${hatchStripes['activity-out']('var(--schedule-hatch)')};
}`,
  },
  {
    key: 'expired',
    label: 'Expired',
    usage: 'Thin stripes on the empty cell from the employee’s expiry day on. Only the first day carries the “Expired” label.',
    tokens: ['--schedule-expired-hatch', '--schedule-expired-text'],
    status: 'confirmed',
    css: `/* Expired: thin stripes on the empty cell, from the expiry day on. */
.schedule-cell[data-expired] {
  background-image: ${hatchStripes.expired('var(--schedule-expired-hatch)')};
}

/* The "Expired" label on the first expired day */
.expired-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px 3px 6px;
  border-radius: 2px;
  font-size: 13px;
  font-weight: 500;
  color: var(--schedule-expired-text);
  background: var(--background-body);
}`,
  },
]
