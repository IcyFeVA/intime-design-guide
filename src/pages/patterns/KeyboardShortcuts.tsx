import { useEffect, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import {
  ActionIcon, Button, Code, Group, List, Menu, SegmentedControl, Select, SimpleGrid, Spoiler, Stack, Switch, Table, Text, Tooltip,
} from '@mantine/core'
import {
  ChevronDown, ChevronLeft, ChevronRight, Keyboard, LogOut, MousePointer2, RotateCcw, Search, Settings, Smartphone, UserRound,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import Preview from '../../components/Preview'
import DoDont from '../../components/DoDont'
import CopyValue from '../../components/CopyValue'
import PropsTable from '../../components/PropsTable'
import FigmaSlot from '../../components/FigmaSlot'
import ShortcutsModal, { ShortcutRow, type RowMessage } from '../../components/shortcuts/ShortcutsModal'
import ShortcutKeys from '../../components/shortcuts/ShortcutKeys'
import {
  activeKeys, ariaKeyShortcuts, blockedReason, comboToKeys, defaultShortcutSettings, detectPlatform, findAction, keysText, matchAction,
  readKeyPress, type Platform, type ShortcutBinding, type ShortcutSettings,
} from '../../components/shortcuts/keys'
import { reservedFunctionKeys, reservedKeys, shortcutActions, shortcutScopes, type ShortcutScope } from '../../tokens/shortcuts'
import { themes } from '../../tokens/themes'
import classes from './KeyboardShortcuts.module.css'

const platformOptions = [
  { value: 'windows', label: 'Windows' },
  { value: 'mac', label: 'Mac' },
]

/** Shortcut hint for a tooltip or menu: the label, then the keys. Nothing extra when the shortcut is off. */
function WithKeys({ label, keys, platform }: { label: string; keys: string | null; platform: Platform }) {
  if (!keys) return <>{label}</>
  return <span className={classes.withKeys}><span>{label}</span><ShortcutKeys keys={keys} platform={platform} size="xs" /></span>
}

/* ------------------------------------------------------------------ */
/* Mocks                                                               */
/* ------------------------------------------------------------------ */

/** The user menu in the top bar. On touch-only devices the shortcuts item and the key hints are left out. */
function UserMenuMock({ settings, platform, touch = false, onOpen, onHint }: {
  settings: ShortcutSettings
  platform: Platform
  touch?: boolean
  onOpen: () => void
  onHint: (hint: string) => void
}) {
  const keys = touch ? null : activeKeys(settings, 'show-shortcuts')
  const notInDemo = () => onHint('That item is not part of this demo.')
  return (
    <Menu position="bottom-end" width={260} offset={4}>
      <Menu.Target>
        <Button variant="subtle" color="gray" leftSection={<UserRound size={18} strokeWidth={1.75} aria-hidden="true" />} rightSection={<ChevronDown size={16} aria-hidden="true" />}>
          John B. McLane
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item leftSection={<UserRound size={16} aria-hidden="true" />} onClick={notInDemo}>Profile</Menu.Item>
        <Menu.Item leftSection={<Settings size={16} aria-hidden="true" />} onClick={notInDemo}>Preferences</Menu.Item>
        {!touch && (
          <Menu.Item
            leftSection={<Keyboard size={16} aria-hidden="true" />}
            rightSection={keys ? <ShortcutKeys keys={keys} platform={platform} size="xs" /> : undefined}
            aria-keyshortcuts={keys ? ariaKeyShortcuts(keys, platform) : undefined}
            onClick={onOpen}
          >
            Keyboard shortcuts
          </Menu.Item>
        )}
        <Menu.Divider />
        <Menu.Item leftSection={<LogOut size={16} aria-hidden="true" />} onClick={notInDemo}>Sign out</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

function PreferenceRow({ title, description, control }: { title: string; description: string; control: ReactNode }) {
  return (
    <div className={classes.prefRow}>
      <div>
        <Text size="sm" fw={500}>{title}</Text>
        <Text size="xs" c="dimmed">{description}</Text>
      </div>
      {control}
    </div>
  )
}

/** The Preferences page, with Keyboard shortcuts next to the theme and color settings. */
function PreferencesMock({ touch = false, onOpen }: { touch?: boolean; onOpen: () => void }) {
  const [theme, setTheme] = useState<string | null>('Dark')
  const [safeColors, setSafeColors] = useState(false)
  return (
    <div className={classes.prefs}>
      <Text fw={600} size="lg" mb="xs">Preferences</Text>
      <PreferenceRow
        title="Theme"
        description="Colors for the whole app."
        control={<Select size="sm" w={150} data={themes.map((item) => item.label)} value={theme} onChange={setTheme} allowDeselect={false} aria-label="Theme" />}
      />
      <PreferenceRow
        title="Color-blind friendly colors"
        description="Shift and coverage colors that stay distinct."
        control={<Switch checked={safeColors} onChange={(event) => setSafeColors(event.currentTarget.checked)} aria-label="Color-blind friendly colors" />}
      />
      {!touch && (
        <PreferenceRow
          title="Keyboard shortcuts"
          description="Look up, change or turn off shortcuts."
          control={<Button variant="default" size="sm" leftSection={<Keyboard size={16} aria-hidden="true" />} onClick={onOpen}>Customize</Button>}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Demos                                                               */
/* ------------------------------------------------------------------ */

const binding = (keys: string | null, on = true): ShortcutBinding => ({ keys, on })

/** Each state of a row, drawn in place. `inert` keeps the examples out of the tab order. */
function RowStates({ platform }: { platform: Platform }) {
  const search = findAction('search')
  const home = findAction('go-home')
  const conflict: RowMessage = {
    kind: 'conflict',
    keys: 'mod+K',
    otherId: 'search',
    text: `${keysText('mod+K', platform)} is used by Search. Replace it, and Search will have no keys.`,
  }
  const states: { title: string; text: string; row: ReactNode }[] = [
    { title: 'Default', text: 'The keys, then reset (empty until the keys change) and the on/off switch.', row: <ShortcutRow action={search} binding={binding('mod+K')} platform={platform} /> },
    { title: 'Recording', text: 'Click the keys or press Enter. Held modifiers show as they are pressed.', row: <ShortcutRow action={search} binding={binding('mod+K')} platform={platform} recording held={{ mod: true, alt: false, shift: true }} /> },
    { title: 'Not allowed', text: 'Recording goes on, so the user can try again straight away.', row: <ShortcutRow action={search} binding={binding('mod+K')} platform={platform} recording message={{ kind: 'error', text: blockedReason('mod+W', platform)! }} /> },
    { title: 'Already used', text: 'Nothing changes until the user picks Replace. Cancel keeps both as they were.', row: <ShortcutRow action={home} binding={binding('alt+shift+H')} platform={platform} message={conflict} /> },
    { title: 'Changed', text: 'Reset appears, with the default in its tooltip.', row: <ShortcutRow action={search} binding={binding('alt+shift+S')} platform={platform} /> },
    { title: 'Turned off', text: 'The keys stay visible but faded, so the user knows what they would get back.', row: <ShortcutRow action={search} binding={binding('mod+K', false)} platform={platform} /> },
  ]
  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
      {states.map((state) => (
        <div key={state.title} className={classes.state}>
          <Text size="sm" fw={600}>{state.title}</Text>
          <Text size="xs" c="dimmed" mb="xs">{state.text}</Text>
          <div inert className={classes.stateRow}>
            <ul className={classes.bare}>{state.row}</ul>
          </div>
        </div>
      ))}
    </SimpleGrid>
  )
}

const pageScopes = shortcutScopes.filter((scope) => scope.key !== 'global')

/** Toolbar whose tooltips show the current keys, and a pad that reports which shortcut a key press runs. */
function RevealDemo({ settings, platform }: { settings: ShortcutSettings; platform: Platform }) {
  const [scope, setScope] = useState<ShortcutScope>('schedule')
  const [result, setResult] = useState('Click the box, then press a shortcut.')
  const button = (id: string, label: string, icon: ReactNode) => {
    const keys = activeKeys(settings, id)
    return (
      <Tooltip label={<WithKeys label={label} keys={keys} platform={platform} />}>
        <ActionIcon variant="default" size={36} aria-label={label} aria-keyshortcuts={keys ? ariaKeyShortcuts(keys, platform) : undefined}>{icon}</ActionIcon>
      </Tooltip>
    )
  }
  const scoped = (suffix: string) => `${scope}-${suffix}`
  const todayKeys = scope === 'approvals' ? null : activeKeys(settings, scoped('today'))

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const press = readKeyPress(event.nativeEvent)
    if (press.kind !== 'combo') return
    const keys = comboToKeys(press.combo)
    const action = matchAction(settings, keys, scope)
    if (action) {
      // Only matched keys are taken over. Everything else, including Tab, works as usual.
      event.preventDefault()
      event.stopPropagation()
      setResult(`${keysText(keys, platform)} runs “${action.label}”.`)
    } else if (press.combo.mod || press.combo.alt) {
      setResult(`${keysText(keys, platform)} isn’t a shortcut here.`)
    }
  }

  return (
    <Stack gap="lg" w="100%">
      <Group gap="sm">
        {button('search', 'Search', <Search size={18} />)}
        {scope !== 'approvals' && (
          <>
            {button(scoped('previous'), 'Previous period', <ChevronLeft size={18} />)}
            <Tooltip label={<WithKeys label="Go to today" keys={todayKeys} platform={platform} />}>
              <Button variant="default" size="sm" aria-keyshortcuts={todayKeys ? ariaKeyShortcuts(todayKeys, platform) : undefined}>Today</Button>
            </Tooltip>
            {button(scoped('next'), 'Next period', <ChevronRight size={18} />)}
          </>
        )}
        {scope === 'approvals' && (
          <>
            {button('approvals-previous', 'Previous request', <ChevronLeft size={18} />)}
            {button('approvals-next', 'Next request', <ChevronRight size={18} />)}
          </>
        )}
      </Group>
      <Stack gap="xs">
        <SegmentedControl value={scope} onChange={(value) => setScope(value as ShortcutScope)} data={pageScopes.map((item) => ({ value: item.key, label: item.label }))} aria-label="Page" w="fit-content" />
        <div className={classes.pad} tabIndex={0} role="group" aria-label={`Shortcut test area, ${shortcutScopes.find((item) => item.key === scope)!.label}`} onKeyDown={onKeyDown}>
          <Keyboard size={20} aria-hidden="true" />
          <Text size="sm">Click here, then press a shortcut. Browser keys such as {keysText('mod+W', platform)} still go to the browser.</Text>
        </div>
        <Text size="xs" c="dimmed" role="status">{result}</Text>
      </Stack>
    </Stack>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

export default function KeyboardShortcuts() {
  const [settings, setSettings] = useState(defaultShortcutSettings)
  const [platform, setPlatform] = useState<Platform>(detectPlatform)
  const [opened, setOpened] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [menuHint, setMenuHint] = useState<string | null>(null)
  const [device, setDevice] = useState<'pointer' | 'touch'>('pointer')
  const openKeys = activeKeys(settings, 'show-shortcuts')

  // The demo listens for "Show keyboard shortcuts", as the product would. Ctrl/⌘ K stays with the guide's search.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (opened || !openKeys || openKeys === 'mod+K' || event.defaultPrevented || isTyping(event.target)) return
      const press = readKeyPress(event)
      if (press.kind === 'combo' && comboToKeys(press.combo) === openKeys) {
        event.preventDefault()
        setOpened(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [opened, openKeys])

  const reset = () => {
    setSettings(defaultShortcutSettings())
    setPlatform(detectPlatform())
    setHint(null)
    setMenuHint(null)
  }

  const save = (next: ShortcutSettings) => {
    const changed = shortcutActions.filter((action) =>
      next.bindings[action.id].keys !== settings.bindings[action.id].keys || next.bindings[action.id].on !== settings.bindings[action.id].on).length
    setSettings(next)
    setHint(changed ? `Saved. ${changed} ${changed === 1 ? 'shortcut' : 'shortcuts'} changed.` : 'Saved.')
  }

  const open = () => setOpened(true)
  const platformControl = (
    <SegmentedControl size="xs" value={platform} onChange={(value) => setPlatform(value as Platform)} data={platformOptions} aria-label="Show keys for" />
  )

  return (
    <>
      <PageHeader />

      <Section id="modal" title="Shortcuts modal" description="One place to look up every shortcut, change its keys or turn it off. It opens from Preferences, the user menu or its own shortcut, and lists shortcuts by the page they work on.">
        <Preview title="Try the modal" align="start" code={'const [settings, setSettings] = useState(defaultShortcutSettings)\n\n<ShortcutsModal\n  opened={opened}\n  value={settings}\n  platform={detectPlatform()}\n  onClose={close}\n  onSave={setSettings}\n/>'}>
          <Stack gap="md" w="100%">
            <Group justify="space-between" gap="sm">
              <Group gap="sm">
                <Button leftSection={<Keyboard size={16} aria-hidden="true" />} onClick={open} aria-keyshortcuts={openKeys ? ariaKeyShortcuts(openKeys, platform) : undefined}>Open keyboard shortcuts</Button>
                {openKeys && openKeys !== 'mod+K' && <Group gap={6}><Text size="sm" c="dimmed">or press</Text><ShortcutKeys keys={openKeys} platform={platform} /></Group>}
              </Group>
              <Group gap="sm">
                {platformControl}
                <Button variant="subtle" color="gray" size="compact-xs" leftSection={<RotateCcw size={14} />} onClick={reset}>Reset demo</Button>
              </Group>
            </Group>
            <Text size="xs" c="dimmed" role="status">{hint ?? 'Preview only. Changes last until you leave this page and are used in the demos below.'}</Text>
          </Stack>
        </Preview>
        <List size="sm" spacing="xs" mt="md">
          <List.Item><Text span fw={600}>Search</Text> matches action names and keys: “team”, “ctrl k” or “shift” all work.</List.Item>
          <List.Item><Text span fw={600}>Use shortcuts</Text> turns every shortcut off at once. Standard keys such as Tab and Esc keep working.</List.Item>
          <List.Item><Text span fw={600}>Groups</Text> follow where a shortcut works: Everywhere, then each page. The same keys can do different things on different pages.</List.Item>
          <List.Item><Text span fw={600}>Each row</Text> has the action, its keys (a button that records new keys), reset, and a switch to turn that shortcut off.</List.Item>
          <List.Item><Text span fw={600}>Standard keys</Text> close the list, for reference. They can’t be changed.</List.Item>
          <List.Item><Text span fw={600}>Save</Text> applies the changes and stores them on the account, so they follow the user to every device. Cancel, Esc and the close button discard them. Reset all goes back to the defaults, and still needs Save.</List.Item>
        </List>
      </Section>

      <Section id="changing" title="Changing a shortcut" description="The user clicks the keys and presses new ones. There is no separate confirm step: valid keys are taken on the spot, anything else is explained in the row.">
        <Group justify="flex-end" mb="sm">{platformControl}</Group>
        <RowStates platform={platform} />
        <List size="sm" spacing="xs" mt="md">
          <List.Item><Text span fw={600}>Start.</Text> Click the keys, or focus them and press Enter or Space. The row says “Press keys…”.</List.Item>
          <List.Item><Text span fw={600}>Cancel.</Text> Esc cancels and keeps the old keys. It does not close the modal while recording. Tab or a click elsewhere also cancels, so focus is never trapped.</List.Item>
          <List.Item><Text span fw={600}>Same page only.</Text> Keys only clash with shortcuts that can run on the same page. “Previous period” in Team View and in Calendar share keys on purpose.</List.Item>
          <List.Item><Text span fw={600}>Replace.</Text> Taking keys from another action leaves that action with no keys. Its row says “Add keys” until the user gives it new ones or resets it.</List.Item>
          <List.Item><Text span fw={600}>Screen readers.</Text> Every step is announced in a polite live region: recording, the new keys, why keys aren’t allowed, and conflicts.</List.Item>
        </List>
      </Section>

      <Section id="allowed-keys" title="Allowed keys" description="A shortcut needs Ctrl/⌘ or Alt/⌥, or is a function key. This meets WCAG 2.1.4 (Character Key Shortcuts) without asking the user to do anything.">
        <Table.ScrollContainer minWidth={640} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th>Keys</Table.Th><Table.Th>Allowed</Table.Th><Table.Th>Why</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {[
                { keys: 'Ctrl/⌘ or Alt/⌥, plus a letter, number, symbol, arrow or Enter. Shift may be added.', allowed: 'Yes', why: 'Doesn’t type text, so it can’t go off while someone types or dictates.' },
                { keys: 'F2, F4, F8 and F9, with or without Shift', allowed: 'Yes', why: 'Function keys don’t type text.' },
                { keys: 'A single letter, number or symbol', allowed: 'No', why: 'Types text, and goes off by accident with voice control and some assistive tech.' },
                { keys: 'Shift plus a letter, number or symbol', allowed: 'No', why: 'Still types a character.' },
                { keys: 'Arrows, Enter, Home, End, Page Up, Page Down on their own', allowed: 'No', why: 'They move and select in lists, menus and fields.' },
                { keys: 'Tab, Esc, Space', allowed: 'No', why: 'Standard keys. Space and Backspace also can’t be part of a shortcut.' },
                { keys: 'Ctrl + Alt (⌘⌥ on Mac)', allowed: 'No', why: 'On Windows this is AltGr, which types @, € and other characters on many keyboards. Shortcuts follow the user to every device, so it is blocked on Mac too.' },
                { keys: 'Ctrl/⌘ + 1 to 9', allowed: 'No', why: 'Switches browser tabs.' },
                { keys: 'Browser and system keys', allowed: 'No', why: 'See the list below. Taking them over breaks what users and assistive tech rely on.' },
              ].map((row) => (
                <Table.Tr key={row.keys}>
                  <Table.Td><Text size="sm">{row.keys}</Text></Table.Td>
                  <Table.Td><Text size="sm" fw={600} c={row.allowed === 'Yes' ? 'var(--text-success-default)' : 'var(--text-error-default)'}>{row.allowed}</Text></Table.Td>
                  <Table.Td><Text size="sm">{row.why}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Text size="sm" fw={600} mt="xl" mb="xs">Browser and system keys</Text>
        <Text size="sm" c="dimmed" mb="md">Blocked on every platform. Keys marked with one platform are blocked on both, because shortcuts follow the user to every device. Screen readers use Insert, Caps Lock and Ctrl + ⌥ as their own keys, which shortcuts can’t use either.</Text>
        <Spoiler maxHeight={360} showLabel="Show all keys" hideLabel="Show fewer">
          <Table.ScrollContainer minWidth={560} className="doc-table">
            <Table verticalSpacing={6} horizontalSpacing="md">
              <Table.Thead><Table.Tr><Table.Th>Windows</Table.Th><Table.Th>Mac</Table.Th><Table.Th>What it does</Table.Th></Table.Tr></Table.Thead>
              <Table.Tbody>
                {[...reservedFunctionKeys.map((item) => ({ keys: item.key, usedFor: item.usedFor, platform: undefined })), ...reservedKeys].map((item) => (
                  <Table.Tr key={item.keys}>
                    <Table.Td><ShortcutKeys keys={item.keys} platform="windows" size="xs" /></Table.Td>
                    <Table.Td><ShortcutKeys keys={item.keys} platform="mac" size="xs" /></Table.Td>
                    <Table.Td><Text size="sm">{item.usedFor[0].toUpperCase() + item.usedFor.slice(1)}{item.platform && <Text span size="xs" c="dimmed"> · {item.platform === 'mac' ? 'Mac' : 'Windows'}</Text>}</Text></Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Spoiler>
      </Section>

      <Section id="entry-points" title="Where to find it" description="Keyboard shortcuts is a row in Preferences, next to the theme and color settings. The user menu and the shortcut itself open the same modal.">
        <Preview title="Preferences and the user menu" align="start">
          <PreferencesMock onOpen={open} />
          <Stack gap="sm" maw={320}>
            <Group justify="flex-end" className={classes.topBar}>
              <UserMenuMock settings={settings} platform={platform} onOpen={open} onHint={setMenuHint} />
            </Group>
            <Text size="sm" c="dimmed">Open the user menu. The Keyboard shortcuts item shows its keys on the right, like every menu item that has a shortcut.</Text>
            <Text size="xs" c="dimmed" role="status">{menuHint ?? 'Preview only.'}</Text>
          </Stack>
        </Preview>
        <Table.ScrollContainer minWidth={560} className="doc-table" mt="md">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th>Way in</Table.Th><Table.Th>Where</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              <Table.Tr><Table.Td><Text size="sm" fw={600}>Preferences</Text></Table.Td><Table.Td><Text size="sm">A Keyboard shortcuts row with a Customize button. This is the home of the setting.</Text></Table.Td></Table.Tr>
              <Table.Tr><Table.Td><Text size="sm" fw={600}>User menu</Text></Table.Td><Table.Td><Text size="sm">Keyboard shortcuts, under Preferences, with its keys on the right.</Text></Table.Td></Table.Tr>
              <Table.Tr><Table.Td><Text size="sm" fw={600}>Shortcut</Text></Table.Td><Table.Td><Group gap={6}><ShortcutKeys keys="mod+/" platform={platform} size="xs" /><Text size="sm">on any page, the convention for a shortcuts list.</Text></Group></Table.Td></Table.Tr>
              <Table.Tr><Table.Td><Text size="sm" fw={600}>Search</Text></Table.Td><Table.Td><Text size="sm">Typing “shortcuts” or “keyboard” in search offers the modal.</Text></Table.Td></Table.Tr>
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Section>

      <Section id="revealing" title="Showing shortcuts" description="Users learn shortcuts where they use the controls. Tooltips and menu items show the current keys, and the control announces them with aria-keyshortcuts.">
        <Preview title="Hover or focus a control" align="start">
          <RevealDemo settings={settings} platform={platform} />
        </Preview>
        <List size="sm" spacing="xs" mt="md">
          <List.Item>Show the user’s keys, not the defaults. A shortcut that is off or has no keys shows no hint.</List.Item>
          <List.Item>Set <Code>aria-keyshortcuts</Code> on the control the shortcut acts on, from the same value as the handler, e.g. <CopyValue value={`aria-keyshortcuts="${ariaKeyShortcuts('mod+K', platform)}"`} />. Leave it out when the control is disabled or the shortcut is off.</List.Item>
          <List.Item>Every shortcut has a visible control that does the same thing. Shortcuts are faster, never the only way.</List.Item>
          <List.Item>Shortcuts don’t run while the user types in a field, except Esc.</List.Item>
        </List>
      </Section>

      <Section id="touch" title="Touch devices" description="Phones and tablets without a keyboard don’t show anything about shortcuts. A tablet with a keyboard or trackpad does.">
        <Preview title="Compare devices" align="start">
          <Stack gap="md" w="100%">
            <SegmentedControl
              value={device}
              onChange={(value) => setDevice(value as 'pointer' | 'touch')}
              aria-label="Device"
              w="fit-content"
              data={[
                { value: 'pointer', label: <Group gap={6} wrap="nowrap"><MousePointer2 size={14} aria-hidden="true" />Mouse or trackpad</Group> },
                { value: 'touch', label: <Group gap={6} wrap="nowrap"><Smartphone size={14} aria-hidden="true" />Touch only</Group> },
              ]}
            />
            <Group align="flex-start" gap="lg">
              <PreferencesMock touch={device === 'touch'} onOpen={open} />
              <UserMenuMock settings={settings} platform={platform} touch={device === 'touch'} onOpen={open} onHint={setMenuHint} />
            </Group>
          </Stack>
        </Preview>
        <Table.ScrollContainer minWidth={560} className="doc-table" mt="md">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Tbody>
              <Table.Tr><Table.Td w={180}><Text size="sm" fw={600}>Shown when</Text></Table.Td><Table.Td><Text size="sm">The device has a fine pointer, <CopyValue value="(any-pointer: fine)" />, or the user has pressed Ctrl, ⌘ or Alt during the session. Software keyboards don’t send those keys.</Text></Table.Td></Table.Tr>
              <Table.Tr><Table.Td><Text size="sm" fw={600}>Hidden</Text></Table.Td><Table.Td><Text size="sm">The Preferences row, the user menu item and the key hints in tooltips and menus.</Text></Table.Td></Table.Tr>
              <Table.Tr><Table.Td><Text size="sm" fw={600}>Unchanged</Text></Table.Td><Table.Td><Text size="sm">The saved settings. Shortcuts keep working if a keyboard is connected later.</Text></Table.Td></Table.Tr>
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Section>

      <Section id="defaults" title="Default shortcuts" description="Every default uses Ctrl/⌘ or Alt/⌥ and avoids browser, system and screen reader keys. Most use Alt + Shift, which browsers leave free.">
        <Table.ScrollContainer minWidth={720} className="doc-table">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead><Table.Tr><Table.Th>Action</Table.Th><Table.Th>Works in</Table.Th><Table.Th>Windows</Table.Th><Table.Th>Mac</Table.Th><Table.Th>aria-keyshortcuts</Table.Th></Table.Tr></Table.Thead>
            <Table.Tbody>
              {shortcutActions.map((action) => (
                <Table.Tr key={action.id}>
                  <Table.Td><Text size="sm" fw={500}>{action.label}</Text></Table.Td>
                  <Table.Td><Text size="sm" c="dimmed">{shortcutScopes.find((scope) => scope.key === action.scope)!.label}</Text></Table.Td>
                  <Table.Td><ShortcutKeys keys={action.keys} platform="windows" size="xs" /></Table.Td>
                  <Table.Td><ShortcutKeys keys={action.keys} platform="mac" size="xs" /></Table.Td>
                  <Table.Td><Text size="xs" ff="monospace" c="dimmed">{ariaKeyShortcuts(action.keys, 'windows')}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        <Text size="sm" c="dimmed" mt="sm">On Mac, <Code>aria-keyshortcuts</Code> uses <Code>Meta</Code> in place of <Code>Control</Code>. Key caps follow each platform’s order: Ctrl Alt Shift on Windows, ⌥⇧⌘ on Mac.</Text>
      </Section>

      <Section id="component" title="Using the components" description="The modal, a single row and the key caps are separate, so other pages can show shortcuts the same way.">
        <PropsTable rows={[
          { prop: 'opened, onClose', type: 'boolean, () => void', description: 'ShortcutsModal. Open state.' },
          { prop: 'value', type: 'ShortcutSettings', description: 'Saved settings. The modal edits a copy and returns it through onSave.' },
          { prop: 'onSave', type: '(value: ShortcutSettings) => void', description: 'Called on Save. Store the value on the account.' },
          { prop: 'platform', type: "'windows' | 'mac'", description: 'Decides key caps and names. Use detectPlatform().' },
          { prop: 'contained', type: 'boolean', default: 'false', description: 'Renders inside a demo frame instead of a portal.' },
          { prop: 'keys / alternatives / combo', type: 'string / string[] / Combo', description: 'ShortcutKeys. Key caps for mod+shift+K-style keys, hidden from screen readers.' },
        ]} />
        <Text size="sm" c="dimmed" mt="sm">Actions, standard keys and blocked keys live in <Code>src/tokens/shortcuts.ts</Code>. Reading, checking and matching key presses is in <Code>src/components/shortcuts/keys.ts</Code>: <Code>readKeyPress</Code>, <Code>blockedReason</Code>, <Code>findConflict</Code>, <Code>matchAction</Code>, <Code>ariaKeyShortcuts</Code> and <Code>spokenKeys</Code>.</Text>
      </Section>

      <Section id="guidelines" title="Guidelines">
        <DoDont
          doItems={[
            'Give every shortcut Ctrl/⌘ or Alt/⌥, and let users change it or turn it off.',
            'Show the user’s current keys in tooltips and menus, and set aria-keyshortcuts to match.',
            'Explain in the row why keys aren’t allowed, and let the user try again straight away.',
            'Ask before taking keys from another action, and name that action.',
            'Keep a visible control for everything a shortcut does.',
            'Hide shortcut settings and key hints on touch-only devices.',
          ]}
          dontItems={[
            'Ship a single-letter or Shift-plus-letter shortcut, even as an option.',
            'Take over browser, system or screen reader keys such as Ctrl/⌘ W, Alt ← or F6.',
            'Let Esc close the modal while a row is recording.',
            'Trap focus in the recorder. Tab always moves on.',
            'Run shortcuts while the user types in a field, except Esc.',
            'Show default keys in a hint after the user has changed them.',
          ]}
        />
      </Section>

      <Section id="figma" title="Figma reference">
        <FigmaSlot title="Keyboard shortcuts: Preferences row and modal" notes="Share the modal at rest, while recording, with a blocked key and with a conflict, plus the Preferences row and the user menu item." />
      </Section>

      <ShortcutsModal opened={opened} value={settings} platform={platform} onClose={() => setOpened(false)} onSave={save} />
    </>
  )
}

