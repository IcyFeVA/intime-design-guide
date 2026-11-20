import { useId, useRef, useState, type KeyboardEvent } from 'react'
import {
  ActionIcon, Alert, Button, CloseButton, Group, Modal, ScrollArea, Stack, Switch, Text, TextInput, Tooltip, UnstyledButton, VisuallyHidden,
} from '@mantine/core'
import { CircleAlert, Info, Pencil, Plus, RotateCcw, Search, SearchX, TriangleAlert } from 'lucide-react'
import { shortcutActions, shortcutScopes, standardKeys, type ShortcutAction } from '../../tokens/shortcuts'
import {
  blockedReason, comboToKeys, defaultShortcutSettings, findAction, findConflict, keyCaps, keysText, parseKeys, readKeyPress, sameSettings,
  spokenKeys, type Combo, type Platform, type ShortcutBinding, type ShortcutSettings,
} from './keys'
import ShortcutKeys from './ShortcutKeys'
import classes from './ShortcutsModal.module.css'

export type RowMessage =
  | { kind: 'error'; text: string }
  | { kind: 'conflict'; text: string; keys: string; otherId: string }

/* ------------------------------------------------------------------ */
/* Row                                                                 */
/* ------------------------------------------------------------------ */

/**
 * One action: its name, its keys (a button that records new keys), reset and an on/off switch.
 * Presentational, so the guide can show each state on its own.
 */
export function ShortcutRow({
  action, binding, platform, disabled = false, recording = false, held, message,
  onRecord, onKeyDown, onKeyUp, onBlur, onToggle, onReset, onReplace, onDismiss,
}: {
  action: ShortcutAction
  binding: ShortcutBinding
  platform: Platform
  /** All shortcuts are turned off */
  disabled?: boolean
  recording?: boolean
  /** Modifiers held down while recording */
  held?: Omit<Combo, 'key'> | null
  message?: RowMessage | null
  onRecord?: () => void
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void
  onKeyUp?: (event: KeyboardEvent<HTMLButtonElement>) => void
  onBlur?: () => void
  onToggle?: (on: boolean) => void
  onReset?: () => void
  onReplace?: () => void
  onDismiss?: () => void
}) {
  const id = useId()
  const labelId = `${id}-label`
  const messageId = `${id}-message`
  const changed = binding.keys !== action.keys
  const heldCaps = held ? keyCaps(held, platform) : []
  const name = recording
    ? `Recording keys for ${action.label}. Press the new keys, or Escape to cancel.`
    : binding.keys ? `${action.label}: ${spokenKeys(binding.keys, platform)}. Change keys` : `${action.label}: no keys. Add keys`

  return (
    <li className={classes.row} data-off={!binding.on || undefined}>
      <div className={classes.label}>
        <Text size="sm" fw={500} id={labelId}>{action.label}</Text>
        {action.description && <Text size="xs" c="dimmed">{action.description}</Text>}
      </div>
      <UnstyledButton
        className={classes.keys}
        data-recording={recording || undefined}
        data-empty={!binding.keys || undefined}
        // Keeps Esc from closing the modal while recording, so Esc can cancel the recording.
        data-mantine-stop-propagation={recording ? 'true' : undefined}
        aria-label={name}
        aria-describedby={message ? messageId : undefined}
        disabled={disabled}
        onClick={onRecord}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={onBlur}
      >
        {recording ? (
          heldCaps.length ? <span className={classes.held}><ShortcutKeys combo={held!} platform={platform} size="xs" /><span aria-hidden="true">…</span></span>
            : <Text span size="sm">Press keys…</Text>
        ) : binding.keys ? (
          <>
            <span className={classes.caps}><ShortcutKeys keys={binding.keys} platform={platform} size="xs" /></span>
            <Pencil size={14} className={classes.pencil} aria-hidden="true" />
          </>
        ) : (
          <>
            <Text span size="sm" c="dimmed">Add keys</Text>
            <Plus size={14} className={classes.pencil} aria-hidden="true" />
          </>
        )}
      </UnstyledButton>
      <div className={classes.reset}>
        {changed && !recording && (
          <Tooltip label={action.keys ? `Reset to ${keysText(action.keys, platform)}` : 'Reset'}>
            <ActionIcon
              variant="subtle"
              color="gray"
              size={28}
              disabled={disabled}
              aria-label={`Reset ${action.label} to ${spokenKeys(action.keys, platform)}`}
              onClick={onReset}
            >
              <RotateCcw size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </div>
      <Switch
        size="sm"
        checked={binding.on}
        disabled={disabled}
        onChange={(event) => onToggle?.(event.currentTarget.checked)}
        aria-label={`${action.label} shortcut`}
        aria-describedby={labelId}
        classNames={{ root: classes.switch }}
      />
      {(recording || message) && (
        <div className={classes.message} id={messageId}>
          {message?.kind === 'error' && (
            <Group gap={8} wrap="nowrap" align="flex-start">
              <CircleAlert size={16} className={classes.messageIcon} color="var(--text-error-default)" aria-hidden="true" />
              <Text size="sm" c="var(--text-error-default)">{message.text}</Text>
            </Group>
          )}
          {message?.kind === 'conflict' && (
            <div className={classes.conflict}>
              <Group gap={8} wrap="nowrap" align="flex-start">
                <TriangleAlert size={16} className={classes.messageIcon} color="var(--text-warning-default)" aria-hidden="true" />
                <Text size="sm">{message.text}</Text>
              </Group>
              <Group gap={8} wrap="nowrap" className={classes.conflictActions}>
                <Button size="compact-sm" variant="default" onClick={onReplace}>Replace</Button>
                <Button size="compact-sm" variant="subtle" color="gray" onClick={onDismiss}>Cancel</Button>
              </Group>
            </div>
          )}
          {recording && !message && (
            <Text size="sm" c="dimmed">Press the new keys, with {platform === 'mac' ? '⌘ or ⌥' : 'Ctrl or Alt'}. Esc cancels.</Text>
          )}
        </div>
      )}
    </li>
  )
}

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

const normalize = (text: string) => text.toLowerCase().replace(/\+/g, ' ').split(/\s+/).filter(Boolean)

function searchText(action: ShortcutAction, keys: string | null, platform: Platform, scopeLabel: string) {
  const combo = keys ? parseKeys(keys) : null
  return [
    action.label, action.description, scopeLabel,
    keys && keysText(keys, platform), keys && spokenKeys(keys, platform), combo?.key,
    combo?.mod && 'ctrl control cmd command ⌘', combo?.alt && 'alt option opt ⌥', combo?.shift && 'shift ⇧',
  ].filter(Boolean).join(' ').toLowerCase()
}

/** Every term must match. One-character terms (“k”, “/”) match a whole word, so “ctrl k” doesn’t find “keyboard”. */
const matches = (text: string, terms: string[]) => {
  const words = text.split(/\s+/)
  return terms.every((term) => (term.length === 1 ? words.includes(term) : text.includes(term)))
}

/**
 * Look up, change and turn off keyboard shortcuts. Changes apply on Save; Cancel and close discard them.
 * Pass `contained` to keep it inside a demo frame.
 */
export default function ShortcutsModal({ opened, value, platform, onClose, onSave, contained }: {
  opened: boolean
  value: ShortcutSettings
  platform: Platform
  onClose: () => void
  onSave: (value: ShortcutSettings) => void
  contained?: boolean
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Keyboard shortcuts"
      centered
      size={640}
      padding={0}
      withinPortal={!contained}
      lockScroll={!contained}
      overlayProps={{ backgroundOpacity: 0.45, blur: 3 }}
      classNames={{ inner: contained ? classes.inner : undefined, header: classes.header, title: classes.title, body: classes.body }}
    >
      {/* Remount on open so the draft starts from the saved settings */}
      {opened && <ShortcutsForm value={value} platform={platform} onClose={onClose} onSave={onSave} />}
    </Modal>
  )
}

function ShortcutsForm({ value, platform, onClose, onSave }: {
  value: ShortcutSettings
  platform: Platform
  onClose: () => void
  onSave: (value: ShortcutSettings) => void
}) {
  const [draft, setDraft] = useState(value)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const [recording, setRecording] = useState<string | null>(null)
  const [held, setHeld] = useState<Omit<Combo, 'key'> | null>(null)
  const [message, setMessage] = useState<{ id: string; message: RowMessage } | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const clearSearch = () => {
    setQuery('')
    searchRef.current?.focus()
  }

  const defaults = defaultShortcutSettings()
  const terms = normalize(query)
  const ctrl = platform === 'mac' ? '⌘' : 'Ctrl'
  const alt = platform === 'mac' ? '⌥' : 'Alt'

  const setBinding = (id: string, patch: Partial<ShortcutBinding>, settings = draft) =>
    ({ ...settings, bindings: { ...settings.bindings, [id]: { ...settings.bindings[id], ...patch } } })

  const stopRecording = () => {
    setRecording(null)
    setHeld(null)
  }

  /** Gives `keys` to `action`, or asks first when another action uses them. */
  const assign = (action: ShortcutAction, keys: string) => {
    const conflict = findConflict(draft, action, keys)
    if (conflict) {
      const text = `${keysText(keys, platform)} is used by ${conflict.label}${conflict.scope === 'global' ? '' : ` in ${shortcutScopes.find((scope) => scope.key === conflict.scope)!.label}`}. Replace it, and ${conflict.label} will have no keys.`
      setMessage({ id: action.id, message: { kind: 'conflict', text, keys, otherId: conflict.id } })
      setAnnouncement(text)
      return
    }
    setDraft(setBinding(action.id, { keys }))
    setMessage(null)
    setAnnouncement(`${action.label} is now ${spokenKeys(keys, platform)}.`)
  }

  const record = (action: ShortcutAction) => {
    if (recording === action.id) {
      stopRecording()
      setAnnouncement('Recording cancelled.')
      return
    }
    setRecording(action.id)
    setHeld(null)
    setMessage(null)
    setAnnouncement(`Press the new keys for ${action.label}, or Escape to cancel.`)
  }

  const onKeyDown = (action: ShortcutAction) => (event: KeyboardEvent<HTMLButtonElement>) => {
    if (recording !== action.id) return
    // Tab and Shift + Tab move on as usual, so recording never traps focus. Blur cancels it.
    if (event.key === 'Tab' && !event.ctrlKey && !event.metaKey && !event.altKey) return
    event.preventDefault()
    event.stopPropagation()
    if (event.key === 'Escape') {
      stopRecording()
      setMessage(null)
      setAnnouncement(`Recording cancelled. ${action.label} keeps its keys.`)
      return
    }
    const press = readKeyPress(event.nativeEvent)
    if (press.kind === 'modifiers') {
      setHeld(press.combo)
      return
    }
    if (press.kind === 'unsupported') {
      const text = `That key can’t be part of a shortcut. Use a letter, number, symbol, arrow or F-key with ${ctrl} or ${alt}.`
      setMessage({ id: action.id, message: { kind: 'error', text } })
      setAnnouncement(text)
      return
    }
    const keys = comboToKeys(press.combo)
    const reason = blockedReason(keys, platform)
    if (reason) {
      setHeld(null)
      setMessage({ id: action.id, message: { kind: 'error', text: reason } })
      setAnnouncement(reason)
      return
    }
    stopRecording()
    if (keys === draft.bindings[action.id].keys) {
      setMessage(null)
      setAnnouncement(`${action.label} keeps ${spokenKeys(keys, platform)}.`)
      return
    }
    assign(action, keys)
  }

  const onKeyUp = (action: ShortcutAction) => (event: KeyboardEvent<HTMLButtonElement>) => {
    if (recording !== action.id) return
    // Stops Space from pressing the button on key up.
    event.preventDefault()
    const press = readKeyPress(event.nativeEvent)
    if (press.kind === 'modifiers') setHeld(press.combo)
  }

  const onBlur = (action: ShortcutAction) => () => {
    if (recording !== action.id) return
    stopRecording()
    if (message?.id === action.id && message.message.kind === 'error') setMessage(null)
  }

  const replace = () => {
    if (!message || message.message.kind !== 'conflict') return
    const action = findAction(message.id)
    const other = findAction(message.message.otherId)
    const keys = message.message.keys
    setDraft(setBinding(action.id, { keys }, setBinding(other.id, { keys: null })))
    setMessage(null)
    setAnnouncement(`${action.label} is now ${spokenKeys(keys, platform)}. ${other.label} has no keys.`)
  }

  const dismiss = () => {
    if (!message) return
    const action = findAction(message.id)
    setMessage(null)
    setAnnouncement(`${action.label} keeps its keys.`)
  }

  const reset = (action: ShortcutAction) => {
    setMessage(null)
    assign(action, action.keys)
  }

  const resetAll = () => {
    stopRecording()
    setMessage(null)
    setDraft(defaults)
    setAnnouncement('All shortcuts are back to their defaults.')
  }

  const groups = shortcutScopes
    .map((scope) => ({
      scope,
      actions: shortcutActions.filter((action) => action.scope === scope.key
        && matches(searchText(action, draft.bindings[action.id].keys, platform, scope.label), terms)),
    }))
    .filter((group) => group.actions.length)
  const standard = standardKeys.filter((item) => matches(
    `${item.label} standard ${item.keys.map((keys) => `${keysText(keys, platform)} ${spokenKeys(keys, platform)}`).join(' ')}`.toLowerCase(), terms))
  const empty = !groups.length && !standard.length

  return (
    <>
      <div className={classes.top}>
        <Text size="sm" c="dimmed">Find a shortcut, change its keys or turn it off. Your shortcuts follow you to every device.</Text>
        <Group gap="md" mt="md" wrap="wrap" align="center">
          <TextInput
            ref={searchRef}
            className={classes.search}
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search actions or keys"
            aria-label="Search shortcuts"
            leftSection={<Search size={16} aria-hidden="true" />}
            rightSection={query ? <CloseButton size="sm" aria-label="Clear search" onClick={clearSearch} /> : null}
            data-autofocus
          />
          <Switch
            label="Use shortcuts"
            checked={draft.enabled}
            onChange={(event) => {
              stopRecording()
              setMessage(null)
              setDraft({ ...draft, enabled: event.currentTarget.checked })
            }}
          />
        </Group>
        {!draft.enabled && (
          <Alert variant="light" color="gray" icon={<Info size={18} />} mt="md" className={classes.off}>
            All shortcuts are off. Standard keys such as Tab, Enter and Esc still work.
          </Alert>
        )}
      </div>

      <ScrollArea.Autosize mah="min(440px, calc(100dvh - 320px))" type="auto" scrollbarSize={6} className={classes.scroll}>
        <div className={classes.list}>
          {groups.map(({ scope, actions }) => (
            <section key={scope.key} className={classes.group} aria-labelledby={`shortcut-group-${scope.key}`}>
              <Text component="h3" id={`shortcut-group-${scope.key}`} className={classes.eyebrow}>{scope.label}</Text>
              <ul className={classes.rows}>
                {actions.map((action) => (
                  <ShortcutRow
                    key={action.id}
                    action={action}
                    binding={draft.bindings[action.id]}
                    platform={platform}
                    disabled={!draft.enabled}
                    recording={recording === action.id}
                    held={recording === action.id ? held : null}
                    message={message?.id === action.id ? message.message : null}
                    onRecord={() => record(action)}
                    onKeyDown={onKeyDown(action)}
                    onKeyUp={onKeyUp(action)}
                    onBlur={onBlur(action)}
                    onToggle={(on) => {
                      setDraft(setBinding(action.id, { on }))
                      setAnnouncement(`${action.label} shortcut ${on ? 'on' : 'off'}.`)
                    }}
                    onReset={() => reset(action)}
                    onReplace={replace}
                    onDismiss={dismiss}
                  />
                ))}
              </ul>
            </section>
          ))}
          {standard.length > 0 && (
            <section className={classes.group} aria-labelledby="shortcut-group-standard">
              <Text component="h3" id="shortcut-group-standard" className={classes.eyebrow}>Standard keys</Text>
              <Text size="xs" c="dimmed" mb={4}>Built into every page. They can’t be changed or turned off.</Text>
              <ul className={classes.rows}>
                {standard.map((item) => (
                  <li key={item.label} className={classes.standardRow}>
                    <Text size="sm">{item.label}</Text>
                    <ShortcutKeys alternatives={item.keys} platform={platform} size="xs" />
                    <VisuallyHidden>{item.keys.map((keys) => spokenKeys(keys, platform)).join(' or ')}</VisuallyHidden>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {empty && (
            <Stack align="center" gap="xs" py="xl">
              <SearchX size={28} color="var(--text-dimmed)" aria-hidden="true" />
              <Text size="sm">No shortcuts match “{query.trim()}”.</Text>
              <Button variant="subtle" size="compact-sm" onClick={clearSearch}>Clear search</Button>
            </Stack>
          )}
        </div>
      </ScrollArea.Autosize>

      <Group justify="space-between" gap="sm" className={classes.footer}>
        <Button variant="subtle" color="gray" leftSection={<RotateCcw size={16} />} disabled={sameSettings(draft, defaults)} onClick={resetAll}>
          Reset all
        </Button>
        <Group gap="sm">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button variant="default" disabled={sameSettings(draft, value)} onClick={() => { onSave(draft); onClose() }}>Save</Button>
        </Group>
      </Group>
      <VisuallyHidden role="status" aria-live="polite">{announcement}</VisuallyHidden>
    </>
  )
}
