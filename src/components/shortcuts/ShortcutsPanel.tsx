import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { ActionIcon, Button, Group, Portal, ScrollArea, Tabs, Text, Tooltip, Transition, VisuallyHidden } from '@mantine/core'
import { useReducedMotion } from '@mantine/hooks'
import { CircleSlash, Settings2, X } from 'lucide-react'
import ShortcutKeys from './ShortcutKeys'
import { findAction, spokenKeys, type Platform, type ShortcutSettings } from './keys'
import { shortcutPanelGroups, shortcutScopes, standardKeys, type ShortcutScope } from '../../tokens/shortcuts'
import classes from './ShortcutsPanel.module.css'

export type PanelTab = ShortcutScope | 'standard'

const tabs: { value: PanelTab; label: string }[] = [
  ...shortcutScopes.map((scope) => ({ value: scope.key as PanelTab, label: scope.label })),
  { value: 'standard', label: 'Standard keys' },
]

function Row({ label, keys, alternatives, off, platform }: {
  label: string
  keys?: string | null
  alternatives?: string[]
  off?: boolean
  platform: Platform
}) {
  const sets = alternatives ?? (keys ? [keys] : [])
  return (
    <li className={classes.row} data-off={off || undefined}>
      <span className={classes.label}>{label}</span>
      {off ? (
        <Text span size="sm" c="dimmed">Off</Text>
      ) : sets.length === 0 ? (
        <Text span size="sm" c="dimmed">No keys</Text>
      ) : (
        <>
          <ShortcutKeys alternatives={sets} platform={platform} />
          <VisuallyHidden>: {sets.map((item) => spokenKeys(item, platform)).join(' or ')}</VisuallyHidden>
        </>
      )}
    </li>
  )
}

/**
 * Quick reference for the most used shortcuts: one tab per place they work, laid out in columns.
 * Shows the user's current keys. Changing them happens in ShortcutsModal, through `onCustomize`.
 */
export function ShortcutsPanel({ value, platform, tab, defaultTab = 'global', onTabChange, onCustomize, onClose }: {
  value: ShortcutSettings
  platform: Platform
  /** Controlled tab. Leave out and set `defaultTab` to the scope of the page the user is on. */
  tab?: PanelTab
  defaultTab?: PanelTab
  onTabChange?: (tab: PanelTab) => void
  onCustomize: () => void
  onClose: () => void
}) {
  const [innerTab, setInnerTab] = useState<PanelTab>(defaultTab)
  const active = tab ?? innerTab
  const change = (next: string | null) => {
    if (!next) return
    setInnerTab(next as PanelTab)
    onTabChange?.(next as PanelTab)
  }

  const onKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
    }
  }

  return (
    <section className={classes.panel} aria-label="Keyboard shortcuts" onKeyDown={onKeyDown}>
      <Tabs value={active} onChange={change} classNames={{ root: classes.tabs, list: classes.list, tab: classes.tab }}>
        <div className={classes.header}>
          <Tabs.List aria-label="Where shortcuts work">
            {tabs.map((item) => <Tabs.Tab key={item.value} value={item.value}>{item.label}</Tabs.Tab>)}
          </Tabs.List>
          <Group gap={4} wrap="nowrap" className={classes.actions}>
            <Button visibleFrom="sm" variant="subtle" color="gray" size="compact-sm" leftSection={<Settings2 size={16} strokeWidth={1.75} aria-hidden="true" />} onClick={onCustomize}>
              Customize
            </Button>
            <Tooltip label="Customize">
              <ActionIcon hiddenFrom="sm" variant="subtle" color="gray" aria-label="Customize shortcuts" onClick={onCustomize}>
                <Settings2 size={18} strokeWidth={1.75} aria-hidden="true" />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={<Group gap={6} wrap="nowrap">Close<ShortcutKeys keys="Escape" platform={platform} size="xs" /></Group>}>
              <ActionIcon variant="subtle" color="gray" aria-label="Close keyboard shortcuts" aria-keyshortcuts="Escape" onClick={onClose}>
                <X size={18} strokeWidth={1.75} aria-hidden="true" />
              </ActionIcon>
            </Tooltip>
          </Group>
        </div>

        {!value.enabled && (
          <div className={classes.notice}>
            <CircleSlash size={16} aria-hidden="true" />
            <Text size="sm">Shortcuts are turned off. Turn them on in Customize. Standard keys still work.</Text>
          </div>
        )}

        <ScrollArea.Autosize mah={300} type="auto" className={classes.scroll}>
          {shortcutScopes.map((scope) => (
            <Tabs.Panel key={scope.key} value={scope.key} className={classes.body}>
              {shortcutPanelGroups[scope.key].map((group) => (
                <div key={group.title} className={classes.group}>
                  <h3 className={classes.groupTitle}>{group.title}</h3>
                  <ul className={classes.rows}>
                    {group.ids.map((id) => {
                      const binding = value.bindings[id]
                      return <Row key={id} label={findAction(id).label} keys={binding?.keys} off={!value.enabled || !binding?.on} platform={platform} />
                    })}
                  </ul>
                </div>
              ))}
            </Tabs.Panel>
          ))}
          <Tabs.Panel value="standard" className={classes.body}>
            <div className={classes.group}>
              <h3 className={classes.groupTitle}>Built into every page. These can’t be changed.</h3>
              <ul className={classes.rows}>
                {standardKeys.map((item) => <Row key={item.label} label={item.label} alternatives={item.keys} platform={platform} />)}
              </ul>
            </div>
          </Tabs.Panel>
        </ScrollArea.Autosize>
      </Tabs>
    </section>
  )
}

/**
 * The panel docked to the bottom of the window. It doesn't block the page: the user keeps working
 * and can try shortcuts while it is open. Focus moves to the selected tab and returns on close.
 */
export default function DockedShortcutsPanel({ opened, ...props }: Parameters<typeof ShortcutsPanel>[0] & { opened: boolean }) {
  const reduceMotion = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (opened) {
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    } else if (returnTo.current) {
      returnTo.current.focus()
      returnTo.current = null
    }
  }, [opened])

  const focusTab = () => rootRef.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus()

  return (
    <Portal>
      <Transition mounted={opened} transition="slide-up" duration={reduceMotion ? 0 : 220} timingFunction="cubic-bezier(0.2, 0, 0, 1)" onEntered={focusTab}>
        {(styles) => (
          <div ref={rootRef} className={classes.dock} style={styles}>
            <ShortcutsPanel {...props} />
          </div>
        )}
      </Transition>
    </Portal>
  )
}
