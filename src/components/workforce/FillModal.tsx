import { useMemo, useState } from 'react'
import { Avatar, Button, Checkbox, CloseButton, Group, Modal, Radio, ScrollArea, Select, Text, TextInput, Tooltip, UnstyledButton } from '@mantine/core'
import { ChevronDown, Search, Sparkles, TriangleAlert } from 'lucide-react'
import { formatDuration } from '../schedule/data'
import { findWatch, formatLongDay, rankLabels, shortName, stillNeeded, type OpenShift, type WorkforceMember } from './data'
import { autoFill, fillCandidates, findLists, sortCandidates, type FillCandidate, type FillGroup, type FindList } from './fill'
import { codeFill, formatSpan } from './panel/format'
import classes from './FillModal.module.css'

const groupTitles: Record<FillGroup, string> = { available: 'Available', warnings: 'Available with warnings', busy: 'Not available' }

/**
 * Fill an open shift: pick who gets it from the candidates. Available people come first, then those it would
 * warn about (rest, hours cap, certification), then people who are busy at that time. A find list sets the order;
 * Auto Fill picks the first available people for every place still needed. Pass `contained` for demo frames.
 */
export function FillModal({ shift, people, onFill, onClose, contained = false }: {
  /** The open shift, or null when closed */
  shift: OpenShift | null
  /** Everyone who could take it, as edited */
  people: WorkforceMember[]
  onFill: (shift: OpenShift, ids: string[]) => void
  onClose: () => void
  contained?: boolean
}) {
  return (
    <Modal
      opened={!!shift}
      onClose={onClose}
      title="Fill open shift"
      centered
      size={560}
      withinPortal={!contained}
      lockScroll={!contained}
      overlayProps={{ backgroundOpacity: 0.45, blur: 3 }}
      classNames={{ inner: contained ? classes.inner : undefined, title: classes.title, body: classes.body }}
    >
      {/* Keyed, so the picks start empty for every shift */}
      {shift && <FillForm key={shift.id} shift={shift} people={people} onFill={onFill} onClose={onClose} />}
    </Modal>
  )
}

function FillForm({ shift, people, onFill, onClose }: { shift: OpenShift; people: WorkforceMember[]; onFill: (shift: OpenShift, ids: string[]) => void; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [list, setList] = useState<FindList>('best')
  const [picked, setPicked] = useState<string[]>([])
  const [showBusy, setShowBusy] = useState(false)
  const needed = stillNeeded(shift)
  const candidates = useMemo(() => sortCandidates(fillCandidates(shift, people), shift, list), [shift, people, list])
  const q = query.trim().toLowerCase()
  const shown = q ? candidates.filter(({ member }) => `${member.first} ${member.last} ${shortName(member)}`.toLowerCase().includes(q)) : candidates
  const full = picked.length >= needed

  const toggle = (id: string) => setPicked((ids) => {
    if (ids.includes(id)) return ids.filter((item) => item !== id)
    return needed === 1 ? [id] : ids.length < needed ? [...ids, id] : ids
  })

  const groups = (['available', 'warnings', 'busy'] as FillGroup[]).map((group) => ({ group, items: shown.filter((item) => item.group === group) }))
  const watch = findWatch(shift.watch)
  const names = picked.map((id) => candidates.find((item) => item.member.id === id)!.member)

  return (
    <>
      <div className={classes.summary}>
        <span className={classes.code} style={codeFill(shift.code)}>{shift.code}</span>
        <div>
          <Text size="sm" fw={600} className="tabular">{formatSpan(shift.start, shift.end)} · {formatLongDay(shift.day)}</Text>
          <Text size="xs" c="dimmed">{watch.unit} · {shift.location} · {needed} of {shift.needed} still needed</Text>
        </div>
      </div>

      <Group gap={8} wrap="nowrap" className={classes.tools}>
        <TextInput
          aria-label="Search people"
          placeholder="Search people…"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          leftSection={<Search size={16} aria-hidden="true" />}
          rightSection={query ? <CloseButton size="sm" aria-label="Clear search" onClick={() => setQuery('')} /> : null}
          className={classes.search}
          data-autofocus
        />
        <Select
          aria-label="Find list"
          data={findLists.map(({ value, label }) => ({ value, label }))}
          value={list}
          onChange={(value) => value && setList(value as FindList)}
          allowDeselect={false}
          w={150}
          renderOption={({ option }) => (
            <div>
              <Text size="sm">{option.label}</Text>
              <Text size="xs" c="dimmed">{findLists.find((item) => item.value === option.value)?.description}</Text>
            </div>
          )}
        />
        <Tooltip label={`Picks the first ${needed === 1 ? 'available person' : `${needed} available people`} in this list`}>
          <Button variant="default" leftSection={<Sparkles size={16} aria-hidden="true" />} onClick={() => setPicked(autoFill(candidates, shift))}>
            Auto Fill
          </Button>
        </Tooltip>
      </Group>

      <ScrollArea.Autosize mah={380} type="auto" offsetScrollbars className={classes.list}>
        {groups.map(({ group, items }) => {
          if (group === 'busy' && !q && !showBusy) {
            return items.length ? (
              <UnstyledButton key={group} className={classes.more} onClick={() => setShowBusy(true)} aria-expanded={false}>
                <ChevronDown size={14} aria-hidden="true" /> Show {items.length} not available
              </UnstyledButton>
            ) : null
          }
          if (!items.length) return null
          return (
            <div key={group} role="group" aria-label={groupTitles[group]} className={classes.group}>
              <Text size="xs" fw={600} c="dimmed" className={classes.groupTitle}>{groupTitles[group]} ({items.length})</Text>
              {items.map((candidate) => (
                <CandidateRow
                  key={candidate.member.id}
                  candidate={candidate}
                  checked={picked.includes(candidate.member.id)}
                  single={needed === 1}
                  disabled={candidate.group === 'busy' || (!picked.includes(candidate.member.id) && full && needed > 1)}
                  onToggle={() => toggle(candidate.member.id)}
                  sameWatch={candidate.member.watch === shift.watch}
                />
              ))}
            </div>
          )
        })}
        {!shown.length && <Text size="sm" c="dimmed" p="md">Nobody matches “{query.trim()}”.</Text>}
      </ScrollArea.Autosize>

      <div className={classes.footer}>
        <Text size="sm" c="dimmed" role="status" className={classes.picked}>
          {names.length ? `Picked: ${names.map(shortName).join(', ')}` : `Pick ${needed === 1 ? 'one person' : `up to ${needed} people`}.`}
        </Text>
        <Button variant="default" onClick={onClose}>Cancel</Button>
        <Button color="intime" disabled={!picked.length} onClick={() => onFill(shift, picked)}>
          {picked.length > 1 ? `Assign ${picked.length} people` : 'Assign'}
        </Button>
      </div>
    </>
  )
}

function CandidateRow({ candidate, checked, single, disabled, onToggle, sameWatch }: {
  candidate: FillCandidate
  checked: boolean
  single: boolean
  disabled: boolean
  onToggle: () => void
  sameWatch: boolean
}) {
  const { member, busy, warnings, weekHours, sameDay } = candidate
  const Control = single ? Radio : Checkbox
  const watch = findWatch(member.watch)
  return (
    <label className={classes.row} data-disabled={disabled || undefined} data-checked={checked || undefined}>
      <Control checked={checked} onChange={onToggle} disabled={disabled} aria-label={shortName(member)} size="sm" />
      <Avatar size={30} radius="xl" color="intime" variant="light" alt="">{member.initials}</Avatar>
      <span className={classes.who}>
        <Text size="sm" fw={500} span className={classes.name}>{shortName(member)}</Text>
        <Text size="xs" c="dimmed" span>{rankLabels[member.rank]} · {watch.title} watch{sameWatch ? '' : ' (other watch)'}</Text>
        {busy && <Text size="xs" c="dimmed" span className={classes.reason}>{busy}</Text>}
        {warnings.map((warning) => (
          <Text key={warning.title} size="xs" span className={classes.warning}>
            <TriangleAlert size={12} strokeWidth={2} aria-hidden="true" />{warning.title}
          </Text>
        ))}
      </span>
      <span className={classes.facts}>
        <Text size="xs" span className="tabular">{formatDuration(weekHours)} this week</Text>
        {!busy && <Text size="xs" c="dimmed" span>{sameDay ? `Also ${sameDay}` : 'Day off'}</Text>}
      </span>
    </label>
  )
}
