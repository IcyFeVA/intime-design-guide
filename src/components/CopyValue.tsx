import { CopyButton, Tooltip, UnstyledButton } from '@mantine/core'
import { Check, Copy } from 'lucide-react'

interface CopyValueProps {
  /** Exact string written to the clipboard */
  value: string
  /** Optional visible text; defaults to `value` */
  display?: string
  /** Describes what is copied, for tooltips and screen readers */
  label?: string
}

/** Inline monospace chip that copies a token value. */
export default function CopyValue({ value, display, label }: CopyValueProps) {
  const description = label ?? value
  return (
    <CopyButton value={value} timeout={1500}>
      {({ copied, copy }) => (
        <Tooltip label={copied ? 'Copied' : `Copy ${description}`}>
          <UnstyledButton
            onClick={copy}
            className="copy-value"
            data-copied={copied || undefined}
            aria-label={`Copy ${description}`}
          >
            <span>{display ?? value}</span>
            {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
          </UnstyledButton>
        </Tooltip>
      )}
    </CopyButton>
  )
}
