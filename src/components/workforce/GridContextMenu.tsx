import { useMemo, useState, type ReactElement } from 'react'
import { Menu, Text } from '@mantine/core'
import { ClipboardPaste, Copy, Files, History, Megaphone, Plane, Ruler, SquarePlus, UserPlus, type LucideIcon } from 'lucide-react'
import { detectPlatform, keyCaps, parseKeys } from '../shortcuts/keys'

interface Item {
  label: string
  icon: LucideIcon
  /** Shown on the right, e.g. "Ctrl C" or "⌘C" */
  keys?: string
}

/** Groups, split by dividers */
const groups: Item[][] = [
  [
    { label: 'Copy', icon: Copy, keys: 'mod+C' },
    { label: 'Paste', icon: ClipboardPaste, keys: 'mod+V' },
    { label: 'Load from template…', icon: Files },
    { label: 'Pre-fill', icon: SquarePlus },
  ],
  [
    { label: 'Leave', icon: Plane },
    { label: 'Post', icon: Megaphone },
    { label: 'Fill', icon: UserPlus },
  ],
  [
    // A schedule ruler for the selected days
    { label: 'Add new ruler', icon: Ruler },
    { label: 'History', icon: History },
  ],
]

/**
 * Right-click menu for the grid. Wraps the grid element (`children`); `useGridSelection`'s `onContextMenu`
 * selects what was clicked and decides where the menu may open. Mantine's `Menu.ContextMenu` puts it at the cursor.
 * Paste stays disabled until something is copied. Preview only: every item calls `onPreview`.
 */
export default function GridContextMenu({ title, onPreview, children }: {
  /** What the menu acts on, e.g. "Fri, Jun 5" or "3 days": the menu's accessible name */
  title: string
  onPreview: (action: string) => void
  /** The grid element. It must accept a ref and keep its own `onContextMenu`. */
  children: ReactElement
}) {
  const platform = useMemo(() => detectPlatform(), [])
  const [copied, setCopied] = useState(false)
  const keyText = (keys: string) => keyCaps(parseKeys(keys), platform).join(platform === 'mac' ? '' : ' ')
  return (
    <Menu width={240} shadow="md" position="bottom-start" returnFocus>
      <Menu.ContextMenu>{children}</Menu.ContextMenu>
      <Menu.Dropdown aria-label={title}>
        {groups.map((items, index) => [
          index > 0 && <Menu.Divider key={`divider-${index}`} />,
          ...items.map(({ label, icon: Icon, keys }) => (
            <Menu.Item
              key={label}
              disabled={label === 'Paste' && !copied}
              leftSection={<Icon size={16} strokeWidth={1.75} aria-hidden="true" />}
              rightSection={keys && <Text span size="xs" c="dimmed" aria-hidden="true">{keyText(keys)}</Text>}
              onClick={() => {
                if (label === 'Copy') setCopied(true)
                onPreview(label.replace('…', ''))
              }}
            >
              {label}
            </Menu.Item>
          )),
        ])}
      </Menu.Dropdown>
    </Menu>
  )
}
