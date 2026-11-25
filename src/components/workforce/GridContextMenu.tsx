import { useMemo, type ReactElement } from 'react'
import { Menu } from '@mantine/core'
import { ClipboardPaste, Copy, Eraser, ListPlus, PaintBucket } from 'lucide-react'
import ShortcutKeys from '../shortcuts/ShortcutKeys'
import { detectPlatform } from '../shortcuts/keys'

const items = [
  { label: 'Copy', icon: Copy, keys: 'mod+C' },
  { label: 'Paste', icon: ClipboardPaste, keys: 'mod+V' },
  { label: 'Fill', icon: PaintBucket, keys: 'mod+D' },
  { label: 'Clear', icon: Eraser, keys: 'Delete' },
]

/**
 * Right-click menu for the grid. Wraps the grid element (`children`); `useGridSelection`'s `onContextMenu`
 * selects what was clicked and decides where the menu may open. Mantine's `Menu.ContextMenu` puts it at the cursor.
 * Preview only: every item calls `onPreview`.
 */
export default function GridContextMenu({ title, onPreview, children }: {
  /** What the menu acts on, e.g. "Fri, Jun 5" or "3 people" */
  title: string
  onPreview: (action: string) => void
  /** The grid element. It must accept a ref and keep its own `onContextMenu`. */
  children: ReactElement
}) {
  const platform = useMemo(() => detectPlatform(), [])
  return (
    <Menu width={240} shadow="md" position="bottom-start" returnFocus>
      <Menu.ContextMenu>{children}</Menu.ContextMenu>
      <Menu.Dropdown>
        <Menu.Label>{title}</Menu.Label>
        {items.map(({ label, icon: Icon, keys }) => (
          <Menu.Item
            key={label}
            leftSection={<Icon size={16} strokeWidth={1.75} aria-hidden="true" />}
            rightSection={<ShortcutKeys keys={keys} platform={platform} size="xs" />}
            onClick={() => onPreview(label)}
          >
            {label}
          </Menu.Item>
        ))}
        <Menu.Divider />
        <Menu.Item leftSection={<ListPlus size={16} strokeWidth={1.75} aria-hidden="true" />} onClick={() => onPreview('Add new rule')}>
          Add new rule…
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
