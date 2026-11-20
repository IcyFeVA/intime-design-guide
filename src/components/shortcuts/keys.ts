import { reservedFunctionKeys, reservedKeys, shortcutActions, type ShortcutAction, type ShortcutScope } from '../../tokens/shortcuts'

/**
 * Keyboard shortcut helpers. Keys are stored as `mod+alt+shift+K`: modifiers in that order, then one key.
 * `mod` is Ctrl on Windows and Linux and ⌘ on Mac, so one stored value works on every device.
 */
export type Platform = 'windows' | 'mac'

export interface Combo {
  mod: boolean
  alt: boolean
  shift: boolean
  key: string
}

export const parseKeys = (keys: string): Combo => {
  const parts = keys.split('+')
  const key = parts.pop() ?? ''
  return { mod: parts.includes('mod'), alt: parts.includes('alt'), shift: parts.includes('shift'), key }
}

export const comboToKeys = ({ mod, alt, shift, key }: Combo) =>
  [mod && 'mod', alt && 'alt', shift && 'shift', key].filter(Boolean).join('+')

export function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'windows'
  const data = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
  return /mac|iphone|ipad/i.test(data?.platform || navigator.platform || navigator.userAgent) ? 'mac' : 'windows'
}

/* ------------------------------------------------------------------ */
/* Reading key presses                                                 */
/* ------------------------------------------------------------------ */

const symbolCodes: Record<string, string> = {
  Slash: '/', Backslash: '\\', Period: '.', Comma: ',', Semicolon: ';', Quote: "'",
  BracketLeft: '[', BracketRight: ']', Minus: '-', Equal: '=', Backquote: '`',
}
const namedCodes = ['Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'Tab', 'Escape', 'Space', 'Backspace', 'Delete']
const modifierCodes = /^(Shift|Control|Alt|Meta|OS)(Left|Right)?$|^(CapsLock|Fn|FnLock|AltGraph)$/

/**
 * The key a press stands for, by physical position (`event.code`), so Shift and ⌥ don't change it.
 * Returns `null` for modifier keys and `undefined` for keys a shortcut can't use.
 */
function keyFromCode(code: string): string | null | undefined {
  if (modifierCodes.test(code)) return null
  const letter = /^Key([A-Z])$/.exec(code)
  if (letter) return letter[1]
  const digit = /^(?:Digit|Numpad)(\d)$/.exec(code)
  if (digit) return digit[1]
  const fn = /^F(\d{1,2})$/.exec(code)
  if (fn && Number(fn[1]) >= 1 && Number(fn[1]) <= 12) return code
  if (code === 'NumpadEnter') return 'Enter'
  if (symbolCodes[code]) return symbolCodes[code]
  if (namedCodes.includes(code)) return code
  return undefined
}

export type KeyPress =
  | { kind: 'modifiers'; combo: Omit<Combo, 'key'> }
  | { kind: 'unsupported' }
  | { kind: 'combo'; combo: Combo }

/** Turns a keydown into modifiers held so far, a full combo, or a key that can't be used. */
export function readKeyPress(event: Pick<KeyboardEvent, 'code' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>): KeyPress {
  const modifiers = { mod: event.ctrlKey || event.metaKey, alt: event.altKey, shift: event.shiftKey }
  const key = keyFromCode(event.code)
  if (key === null) return { kind: 'modifiers', combo: modifiers }
  if (key === undefined || ['Space', 'Backspace', 'Delete'].includes(key)) return { kind: 'unsupported' }
  return { kind: 'combo', combo: { ...modifiers, key } }
}

/* ------------------------------------------------------------------ */
/* Showing keys                                                        */
/* ------------------------------------------------------------------ */

const keyLabels: Record<string, [windows: string, mac: string]> = {
  ArrowUp: ['↑', '↑'], ArrowDown: ['↓', '↓'], ArrowLeft: ['←', '←'], ArrowRight: ['→', '→'],
  Enter: ['Enter', 'Return'], Escape: ['Esc', 'Esc'], PageUp: ['Page Up', 'Page Up'], PageDown: ['Page Down', 'Page Down'],
}
const keySpoken: Record<string, string> = {
  '/': 'Slash', '\\': 'Backslash', '.': 'Period', ',': 'Comma', ';': 'Semicolon', "'": 'Quote', '[': 'Left bracket',
  ']': 'Right bracket', '-': 'Minus', '=': 'Equals', '`': 'Backtick', ArrowUp: 'Up arrow', ArrowDown: 'Down arrow',
  ArrowLeft: 'Left arrow', ArrowRight: 'Right arrow', Escape: 'Escape', PageUp: 'Page Up', PageDown: 'Page Down',
}

const keyLabel = (key: string, platform: Platform) => keyLabels[key]?.[platform === 'mac' ? 1 : 0] ?? key

/**
 * Labels for each key cap, in the platform's order:
 * Windows Ctrl, Alt, Shift, key; Mac ⌥, ⇧, ⌘, key (Apple's order).
 */
export function keyCaps(combo: Combo | Omit<Combo, 'key'>, platform: Platform): string[] {
  const key = 'key' in combo ? [keyLabel(combo.key, platform)] : []
  if (platform === 'mac') return [combo.alt && '⌥', combo.shift && '⇧', combo.mod && '⌘', ...key].filter(Boolean) as string[]
  return [combo.mod && 'Ctrl', combo.alt && 'Alt', combo.shift && 'Shift', ...key].filter(Boolean) as string[]
}

/** Keys in words, for accessible names: "Control + Shift + K", "Command + Slash". */
export function spokenKeys(keys: string, platform: Platform): string {
  const combo = parseKeys(keys)
  const mac = platform === 'mac'
  const key = combo.key === 'Enter' ? (mac ? 'Return' : 'Enter') : keySpoken[combo.key] ?? combo.key
  const names = mac
    ? [combo.alt && 'Option', combo.shift && 'Shift', combo.mod && 'Command', key]
    : [combo.mod && 'Control', combo.alt && 'Alt', combo.shift && 'Shift', key]
  return names.filter(Boolean).join(' + ')
}

/** Short text form for messages: "Ctrl Shift K", "⌥⇧K". */
export function keysText(keys: string, platform: Platform) {
  const caps = keyCaps(parseKeys(keys), platform)
  if (platform === 'windows') return caps.join(' ')
  const key = caps.pop() ?? ''
  return `${caps.join('')}${caps.length && key.length > 1 ? ' ' : ''}${key}`
}

/** Value for `aria-keyshortcuts`: modifiers first, KeyboardEvent.key names. */
export function ariaKeyShortcuts(keys: string, platform: Platform): string {
  const combo = parseKeys(keys)
  return [combo.mod && (platform === 'mac' ? 'Meta' : 'Control'), combo.alt && 'Alt', combo.shift && 'Shift', combo.key]
    .filter(Boolean).join('+')
}

/* ------------------------------------------------------------------ */
/* Rules                                                               */
/* ------------------------------------------------------------------ */

const navigationKeys = ['Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'Tab', 'Escape']

/**
 * Why keys can't be a shortcut, or `null` when they can.
 * Order: needs a modifier (WCAG 2.1.4), AltGr, browser tab keys, then the reserved list.
 */
export function blockedReason(keys: string, platform: Platform): string | null {
  const combo = parseKeys(keys)
  const ctrl = platform === 'mac' ? '⌘' : 'Ctrl'
  const alt = platform === 'mac' ? '⌥' : 'Alt'
  const isFunctionKey = /^F\d{1,2}$/.test(combo.key)
  const text = keysText(keys, platform)

  if (isFunctionKey && !combo.mod && !combo.alt) {
    const reserved = reservedFunctionKeys.find((item) => item.key === combo.key)
    return reserved && !combo.shift ? `${text} ${reserved.usedFor}. Choose other keys.` : checkReserved(keys, text)
  }
  if (combo.key === 'Tab' || combo.key === 'Escape') return `${keyLabel(combo.key, platform)} is a standard key and can’t be changed.`
  if (!combo.mod && !combo.alt) {
    if (navigationKeys.includes(combo.key)) return `${text} moves and selects in lists and fields. Add ${ctrl} or ${alt}.`
    if (combo.shift) return `Shift plus a key still types a character. Add ${ctrl} or ${alt}.`
    return `A single key types text, and can go off by accident, for example with voice control. Add ${ctrl} or ${alt}.`
  }
  if (combo.mod && combo.alt) {
    return platform === 'mac'
      ? '⌘⌥ is Ctrl Alt on Windows, which types characters such as @ and € on many keyboards. Use ⌘ or ⌥ on its own.'
      : 'Ctrl Alt types characters such as @ and € on many keyboards. Use Ctrl or Alt on its own.'
  }
  if (combo.mod && !combo.shift && /^[1-9]$/.test(combo.key)) return `${text} switches browser tabs. Choose other keys.`
  return checkReserved(keys, text)
}

function checkReserved(keys: string, text: string): string | null {
  const reserved = reservedKeys.find((item) => item.keys === keys)
  return reserved ? `${text} ${reserved.usedFor}. Choose other keys.` : null
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export interface ShortcutBinding {
  /** `null` when the user removed the keys, e.g. by giving them to another action */
  keys: string | null
  on: boolean
}

export interface ShortcutSettings {
  /** Turns every shortcut off. Standard keys keep working. */
  enabled: boolean
  bindings: Record<string, ShortcutBinding>
}

export const defaultShortcutSettings = (): ShortcutSettings => ({
  enabled: true,
  bindings: Object.fromEntries(shortcutActions.map((action) => [action.id, { keys: action.keys, on: true }])),
})

export const findAction = (id: string) => shortcutActions.find((action) => action.id === id)!

/** Two actions clash when they can run on the same page. */
export const scopesOverlap = (a: ShortcutScope, b: ShortcutScope) => a === 'global' || b === 'global' || a === b

/** The action that already uses these keys where `action` works, if any. */
export function findConflict(settings: ShortcutSettings, action: ShortcutAction, keys: string): ShortcutAction | undefined {
  return shortcutActions.find((other) => other.id !== action.id
    && settings.bindings[other.id]?.keys === keys
    && scopesOverlap(other.scope, action.scope))
}

/** The action these keys run on a page with `scope`, if the shortcut is on. */
export function matchAction(settings: ShortcutSettings, keys: string, scope: ShortcutScope): ShortcutAction | undefined {
  if (!settings.enabled) return undefined
  return shortcutActions.find((action) => {
    const binding = settings.bindings[action.id]
    return binding?.on && binding.keys === keys && (action.scope === 'global' || action.scope === scope)
  })
}

/** Keys of an action when its shortcut can run, for tooltips, menus and `aria-keyshortcuts`. */
export function activeKeys(settings: ShortcutSettings, id: string): string | null {
  const binding = settings.bindings[id]
  return settings.enabled && binding?.on ? binding.keys : null
}

export const sameSettings = (a: ShortcutSettings, b: ShortcutSettings) =>
  a.enabled === b.enabled && shortcutActions.every((action) =>
    a.bindings[action.id]?.keys === b.bindings[action.id]?.keys && a.bindings[action.id]?.on === b.bindings[action.id]?.on)
