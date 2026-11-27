import { useId, useState, type ReactNode } from 'react'
import {
  ActionIcon, Button, Group, isOptionsGroup, Pill, Select, Text, Textarea, TextInput, Tooltip, UnstyledButton, type ComboboxParsedItem, type OptionsFilter,
} from '@mantine/core'
import { Bell, ListChecks, Package, Paperclip, Plus, Repeat, StickyNote, Tag, X } from 'lucide-react'
import { formatHeader } from '../../schedule/data'
import { formatTime } from '../../calendar/events'
import { TaskFormModal } from '../../calendar/CalendarModals'
import {
  assetCategories, CUSTOM_CATEGORY, tagCategories, type AttachedTask, type AttachmentPick, type Attachments,
} from '../attachments'
import classes from '../WorkforcePanel.module.css'

const newId = (prefix: string) => `${prefix}${Math.random().toString(36).slice(2, 8)}`
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/** "Vehicle · Car 4417", or just the text of a custom tag */
const pickLabel = (item: AttachmentPick) => (item.category === CUSTOM_CATEGORY ? item.value : `${item.category} · ${item.value}`)

const SEPARATOR = '␟'
const CUSTOM = '__custom'

/** Matches every typed word against the category or the value, so "vehicle 44" and "lambo" both find "Vehicle › …". Custom… always stays. */
const groupedFilter: OptionsFilter = ({ options, search }) => {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return options
  return options.flatMap((entry): ComboboxParsedItem[] => {
    if (!isOptionsGroup(entry)) return entry.value === CUSTOM || words.every((word) => entry.label.toLowerCase().includes(word)) ? [entry] : []
    const group = String(entry.group).toLowerCase()
    const items = entry.items.filter((item) => words.every((word) => group.includes(word) || item.label.toLowerCase().includes(word)))
    return items.length ? [{ ...entry, items }] : []
  })
}

/**
 * Tags, assets, tasks and a note on one assignment. All four sections always show, with their count (no empty text). Every change
 * saves at once (one Undo step); the note saves when you leave it. `readOnly`: shown, not changed (an assignment set outside scheduling).
 */
export function AttachmentsTab({ value, onChange, day, readOnly = false, header }: {
  value: Attachments
  onChange: (next: Attachments) => void
  /** The assignment's day: a new task starts on it */
  day: number
  readOnly?: boolean
  /** Above the sections, e.g. which assignment of the day this is */
  header?: ReactNode
}) {
  const [task, setTask] = useState<{ key: number; task?: AttachedTask; opened: boolean }>({ key: 0, opened: false })
  const set = <K extends keyof Attachments>(key: K, list: Attachments[K]) => onChange({ ...value, [key]: list })

  const saveTask = (saved: AttachedTask, recurrence: string) => {
    const next = { ...saved, recurrence: recurrence === 'None' ? task.task?.recurrence : recurrence }
    set('tasks', task.task ? value.tasks.map((item) => (item.id === saved.id ? next : item)) : [...value.tasks, next])
    setTask((state) => ({ ...state, opened: false }))
  }

  return (
    <div className={classes.body} data-gap="lg">
      {header}

      <AttachmentSection icon={<Tag size={14} aria-hidden="true" />} title="Tags" count={value.tags.length}>
        <Picks items={value.tags} readOnly={readOnly} onRemove={(id) => set('tags', value.tags.filter((item) => item.id !== id))} />
        {!readOnly && <PickField kind="tag" categories={tagCategories} items={value.tags} onAdd={(item) => set('tags', [...value.tags, item])} />}
      </AttachmentSection>

      <AttachmentSection icon={<Package size={14} aria-hidden="true" />} title="Assets" count={value.assets.length}>
        <Picks items={value.assets} readOnly={readOnly} onRemove={(id) => set('assets', value.assets.filter((item) => item.id !== id))} />
        {!readOnly && <PickField kind="asset" categories={assetCategories} items={value.assets} onAdd={(item) => set('assets', [...value.assets, item])} />}
      </AttachmentSection>

      <AttachmentSection icon={<ListChecks size={14} aria-hidden="true" />} title="Tasks" count={value.tasks.length}>
        {value.tasks.map((item) => (
          <TaskRow key={item.id} task={item} day={day} onOpen={readOnly ? undefined : () => setTask((state) => ({ key: state.key + 1, task: item, opened: true }))} />
        ))}
        {!readOnly && (
          <Button variant="subtle" size="xs" leftSection={<Plus size={14} aria-hidden="true" />} className={classes.linkButton} onClick={() => setTask((state) => ({ key: state.key + 1, opened: true }))}>
            Add task
          </Button>
        )}
      </AttachmentSection>

      <AttachmentSection icon={<StickyNote size={14} aria-hidden="true" />} title="Note" count={value.note.trim() ? 1 : 0}>
        {readOnly
          ? value.note.trim() && <NoteText text={value.note} />
          : <NoteField key={value.note} value={value.note} onSave={(note) => set('note', note)} />}
      </AttachmentSection>

      <TaskFormModal
        state={{ key: task.key, day, task: task.task, opened: task.opened }}
        onClose={() => setTask((state) => ({ ...state, opened: false }))}
        onSave={saveTask}
        onDelete={(removed) => {
          set('tasks', value.tasks.filter((item) => item.id !== removed.id))
          setTask((state) => ({ ...state, opened: false }))
        }}
        contained
      />
    </div>
  )
}

function AttachmentSection({ icon, title, count, children }: { icon: ReactNode; title: string; count: number; children: ReactNode }) {
  const id = useId()
  return (
    <section className={classes.attachSection} aria-labelledby={id}>
      <h5 className={classes.attachHeading} id={id}>
        {icon}
        {title}
        <span className={classes.attachCount}>({count})</span>
      </h5>
      {children}
    </section>
  )
}

function Picks({ items, readOnly, onRemove }: { items: AttachmentPick[]; readOnly: boolean; onRemove: (id: string) => void }) {
  if (!items.length) return null
  return (
    <Pill.Group>
      {items.map((item) => (
        <Pill
          key={item.id}
          size="md"
          className={classes.pick}
          withRemoveButton={!readOnly}
          onRemove={() => onRemove(item.id)}
          removeButtonProps={{ 'aria-label': `Remove ${pickLabel(item)}` }}
        >
          {pickLabel(item)}
        </Pill>
      ))}
    </Pill.Group>
  )
}

/**
 * One grouped, searchable picker: values by category. Picking one adds it at once. Tags end with "Custom…", which
 * turns the field into a text input (what was typed carries over).
 */
function PickField({ kind, categories, items, onAdd }: {
  kind: 'tag' | 'asset'
  categories: Record<string, string[]>
  items: AttachmentPick[]
  onAdd: (item: AttachmentPick) => void
}) {
  const [search, setSearch] = useState('')
  const [custom, setCustom] = useState<string | null>(null)
  const taken = new Set(items.map((item) => `${item.category}${SEPARATOR}${item.value}`))
  const data = [
    ...Object.entries(categories).map(([group, values]) => ({
      group,
      items: values.filter((value) => !taken.has(`${group}${SEPARATOR}${value}`)).map((value) => ({ value: `${group}${SEPARATOR}${value}`, label: value })),
    })).filter((group) => group.items.length),
    ...(kind === 'tag' ? [{ value: CUSTOM, label: 'Custom…' }] : []),
  ]

  if (custom !== null) {
    const add = () => {
      const text = custom.trim()
      if (!text) return
      onAdd({ id: newId('t'), category: CUSTOM_CATEGORY, value: text })
      setCustom(null)
    }
    return (
      <Group gap={8} wrap="nowrap" align="flex-start">
        <TextInput
          className={classes.grow}
          aria-label="Custom tag"
          placeholder="e.g. Police file #24-1187"
          value={custom}
          onChange={(event) => setCustom(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') { event.preventDefault(); add() }
            if (event.key === 'Escape') { event.stopPropagation(); setCustom(null) }
          }}
          data-mantine-stop-propagation="true"
          autoFocus
        />
        <Button variant="default" onClick={add} disabled={!custom.trim()}>Add</Button>
        <Tooltip label="Back to the list">
          <ActionIcon variant="subtle" color="gray" size={36} aria-label="Cancel custom tag" onClick={() => setCustom(null)}><X size={16} /></ActionIcon>
        </Tooltip>
      </Group>
    )
  }

  return (
    <Select
      aria-label={kind === 'tag' ? 'Add a tag' : 'Add an asset'}
      placeholder={kind === 'tag' ? 'Search tags…' : 'Search assets…'}
      data={data}
      value={null}
      searchable
      searchValue={search}
      onSearchChange={setSearch}
      filter={groupedFilter}
      nothingFoundMessage={kind === 'asset' ? 'No asset matches. Assets come from the inventory.' : 'Nothing found'}
      maxDropdownHeight={280}
      leftSection={<Plus size={16} aria-hidden="true" />}
      onChange={(picked) => {
        if (!picked) return
        if (picked === CUSTOM) setCustom(search)
        else {
          const [category, value] = picked.split(SEPARATOR)
          onAdd({ id: newId(kind === 'tag' ? 't' : 'a'), category, value })
        }
        setSearch('')
      }}
    />
  )
}

/** A task: name, then its date (when not the assignment's day), time, recurrence and reminders. Opens the task form. */
function TaskRow({ task, day, onOpen }: { task: AttachedTask; day: number; onOpen?: () => void }) {
  const when = [task.day !== day && formatHeader(task.day), task.start === undefined ? 'All day' : formatTime(task.start)].filter(Boolean).join(' · ')
  const reminders = task.reminders?.length ?? 0
  const content = (
    <>
      <span className={classes.taskTitle}>{task.title}</span>
      <span className={classes.taskMeta}>
        <span className="tabular">{when}</span>
        {task.recurrence && <span className={classes.taskMetaItem}><Repeat size={12} aria-hidden="true" />{task.recurrence}</span>}
        {reminders > 0 && <span className={classes.taskMetaItem}><Bell size={12} aria-hidden="true" />{plural(reminders, 'reminder')}</span>}
      </span>
    </>
  )
  return onOpen
    ? <UnstyledButton className={classes.taskRow} onClick={onOpen} aria-label={`Edit task: ${task.title}`}>{content}</UnstyledButton>
    : <div className={classes.taskRow}>{content}</div>
}

/** The note as text: in the Details tab and on a locked assignment */
export function NoteText({ text }: { text: string }) {
  return <Text size="sm" className={classes.noteCard}>{text.trim()}</Text>
}

/** One note per assignment: a plain textarea that saves when you leave it */
function NoteField({ value, onSave }: { value: string; onSave: (note: string) => void }) {
  const [text, setText] = useState(value)
  return (
    <Textarea
      aria-label="Note"
      data-note
      placeholder="Add a note for this assignment…"
      autosize
      minRows={2}
      maxRows={8}
      value={text}
      onChange={(event) => setText(event.currentTarget.value)}
      onBlur={() => { if (text.trim() !== value.trim()) onSave(text.trim()) }}
    />
  )
}

/** Attachments need an assignment: what the tab shows on an empty day */
export function NoAttachments() {
  return (
    <div className={classes.empty}>
      <Paperclip size={28} strokeWidth={1.5} aria-hidden="true" />
      <Text size="sm" fw={600} c="var(--text-default)">No assignment yet</Text>
      <Text size="sm" maw={280}>Tags, assets, tasks and a note belong to an assignment. Add one on the Details tab first.</Text>
    </div>
  )
}
