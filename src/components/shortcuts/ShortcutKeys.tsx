import { Fragment } from 'react'
import { Kbd, Text, type MantineSize } from '@mantine/core'
import { keyCaps, parseKeys, type Combo, type Platform } from './keys'

/**
 * Key caps for one shortcut, in the platform's order (Ctrl Shift K, ⇧⌘K).
 * Pass `keys` (`mod+shift+K`) or `combo`; several `alternatives` are joined with “or”.
 * Hidden from screen readers: give the parent an accessible name with `spokenKeys`.
 */
export default function ShortcutKeys({ keys, combo, alternatives, platform, size = 'sm' }: {
  keys?: string
  combo?: Combo | Omit<Combo, 'key'>
  alternatives?: string[]
  platform: Platform
  size?: MantineSize
}) {
  const sets = alternatives ?? (keys ? [keys] : [])
  const groups = combo ? [keyCaps(combo, platform)] : sets.map((item) => keyCaps(parseKeys(item), platform))
  return (
    <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
      {groups.map((caps, index) => (
        <Fragment key={index}>
          {index > 0 && <Text span size="xs" c="dimmed" px={2}>or</Text>}
          {caps.map((cap) => <Kbd key={cap} size={size}>{cap}</Kbd>)}
        </Fragment>
      ))}
    </span>
  )
}
