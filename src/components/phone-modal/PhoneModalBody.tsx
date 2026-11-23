import type { ReactNode } from 'react'
import classes from './phoneModal.module.css'

/** The phone dialog's content in a bordered card, with the buttons pinned to the bottom. */
export function PhoneModalBody({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  return (
    <>
      <div className={classes.card}>{children}</div>
      <div className={classes.footer}>{footer}</div>
    </>
  )
}
