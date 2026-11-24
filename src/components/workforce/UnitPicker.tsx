import { useState, type CSSProperties, type ReactNode } from 'react'
import { Button, Combobox, Group, ScrollArea, Text, useCombobox } from '@mantine/core'
import { Check, ChevronDown, History, Search } from 'lucide-react'
import { filterUnits, findUnit, recentUnits, type UnitNode } from './data'
import classes from './Workforce.module.css'

/**
 * Unit picker: search, recently used units, then every unit as an indented tree.
 * A Mantine Combobox, so arrows, Enter and Escape work. Picking a unit calls `onChange`; the demo only shows a hint.
 */
export default function UnitPicker({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const [search, setSearch] = useState('')
  const combobox = useCombobox({
    onDropdownClose: () => { combobox.resetSelectedOption(); setSearch('') },
    onDropdownOpen: () => combobox.focusSearchInput(),
  })
  const current = findUnit(value)
  const units = filterUnits(search)

  // Options are numbered in render order so hovering one highlights it, as the arrow keys do
  let index = 0
  const option = (optionValue: string, depth: number, content: ReactNode) => {
    const optionIndex = index++
    return (
      <Combobox.Option
        key={optionValue}
        value={optionValue}
        active={optionValue.endsWith(`:${value}`)}
        className={classes.unitOption}
        style={{ '--unit-depth': depth } as CSSProperties}
        onMouseEnter={() => combobox.selectOption(optionIndex)}
      >
        <Group gap={8} wrap="nowrap">
          {content}
          {optionValue.endsWith(`:${value}`) && <Check size={16} className={classes.unitCheck} aria-hidden="true" />}
        </Group>
      </Combobox.Option>
    )
  }
  const tree = (nodes: UnitNode[], depth: number): ReactNode[] => nodes.flatMap((node) => [
    option(`unit:${node.key}`, depth, (
      <Text size="sm" fw={node.children ? 600 : 400} span>
        {node.label}
        {node.children && <span className={classes.unitMeta}> {findUnit(node.key)?.children?.length}</span>}
      </Text>
    )),
    ...tree(node.children ?? [], depth + 1),
  ])

  return (
    <Combobox
      store={combobox}
      width={300}
      position="bottom-start"
      offset={4}
      classNames={{ groupLabel: classes.unitGroupLabel, group: classes.unitGroup }}
      onOptionSubmit={(submitted) => {
        onChange(submitted.slice(submitted.indexOf(':') + 1))
        combobox.closeDropdown()
      }}
    >
      <Combobox.Target targetType="button">
        <Button
          variant="default"
          size="sm"
          fw={400}
          rightSection={<ChevronDown size={16} aria-hidden="true" />}
          aria-label={`Unit: ${current?.label}`}
          onClick={() => combobox.toggleDropdown()}
        >
          {current?.label}
        </Button>
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Search
          value={search}
          onChange={(event) => { setSearch(event.currentTarget.value); combobox.updateSelectedOptionIndex() }}
          placeholder="Search units…"
          aria-label="Search units"
          leftSection={<Search size={16} aria-hidden="true" />}
        />
        <Combobox.Options>
          <ScrollArea.Autosize mah={320} type="scroll">
            {!search.trim() && (
              <Combobox.Group label="Recently used">
                {recentUnits.map(({ key, parent }) => option(`recent:${key}`, 0, (
                  <>
                    <History size={16} strokeWidth={1.75} className={classes.unitMeta} aria-hidden="true" />
                    <Text size="sm" span>
                      {findUnit(key)?.label}
                      {parent && <span className={classes.unitMeta}>&ensp;{parent}</span>}
                    </Text>
                  </>
                )))}
              </Combobox.Group>
            )}
            {units.length > 0
              ? <Combobox.Group label="All units">{tree(units, 0)}</Combobox.Group>
              : <Combobox.Empty>No units match “{search.trim()}”</Combobox.Empty>}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
