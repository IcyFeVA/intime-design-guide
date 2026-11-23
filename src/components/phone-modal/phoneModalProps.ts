import type { ModalProps } from '@mantine/core'
import classes from './phoneModal.module.css'

/**
 * Modal props for a dialog on a phone: full screen below the status bar, large title,
 * bordered close button. Spread them over a Mantine `Modal` and wrap the body in `PhoneModalBody`.
 */
export const phoneModalProps: Partial<ModalProps> = {
  fullScreen: true,
  centered: false,
  padding: 0,
  transitionProps: { transition: 'slide-up', duration: 220, timingFunction: 'cubic-bezier(0.2, 0, 0, 1)' },
  withOverlay: false,
  closeButtonProps: { 'aria-label': 'Close', size: 'md' } as ModalProps['closeButtonProps'],
  classNames: { inner: classes.inner, content: classes.content, header: classes.header, title: classes.title, close: classes.close, body: classes.body },
}
