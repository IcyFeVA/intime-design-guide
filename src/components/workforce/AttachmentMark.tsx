import type { ReactNode } from 'react'
import classes from './Workforce.module.css'

/** The cell's assignment has tags, assets, tasks or a note: a folded corner on its bottom right (like a spreadsheet's comment mark) */
export const AttachmentMark = () => <span className={classes.attachMark} aria-hidden="true" />

/** A chip with the attachments corner on it */
export const WithAttachmentMark = ({ attached, children }: { attached: boolean; children: ReactNode }) => (
  attached ? <span className={classes.attached}>{children}<AttachmentMark /></span> : children
)
