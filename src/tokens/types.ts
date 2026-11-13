/** Lifecycle of every documented value. Flip to `confirmed` once matched to a real Figma frame. */
export type TokenStatus = 'draft' | 'confirmed' | 'review'

export const statusMeta: Record<TokenStatus, { label: string; color: string; description: string }> = {
  draft: {
    label: 'Draft',
    color: 'yellow',
    description: 'Provisional starter value. Will be replaced once real Figma frames are provided.',
  },
  review: {
    label: 'Needs review',
    color: 'orange',
    description: 'Updated from Figma but awaiting sign-off from design.',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'green',
    description: 'Matches the production Figma source of truth. Safe to build against.',
  },
}
