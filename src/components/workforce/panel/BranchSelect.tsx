import type { CSSProperties } from 'react'
import { Select, Text } from '@mantine/core'
import { Check } from 'lucide-react'
import { branchOptions } from './options'
import classes from '../WorkforcePanel.module.css'

const byValue = new Map(branchOptions.map((option) => [option.value, option]))

/** The panel's Branch field: every branch as an indented tree, like the unit picker. Parents show how many branches they hold. */
export function BranchSelect({ value, onChange, readOnly }: { value: string | null; onChange: (value: string | null) => void; readOnly?: boolean }) {
  return (
    <Select
      label="Branch"
      data={branchOptions.map(({ value, label }) => ({ value, label }))}
      value={value}
      onChange={onChange}
      allowDeselect={false}
      readOnly={readOnly}
      withCheckIcon={false}
      maxDropdownHeight={320}
      renderOption={({ option, checked }) => {
        const branch = byValue.get(option.value)
        return (
          <span className={classes.branchOption} style={{ '--branch-depth': branch?.depth ?? 0 } as CSSProperties}>
            <Text size="sm" fw={branch?.count ? 600 : 400} span>
              {option.label}
              {!!branch?.count && <span className={classes.branchCount}> {branch.count}</span>}
            </Text>
            {checked && <Check size={16} className={classes.branchCheck} aria-hidden="true" />}
          </span>
        )
      }}
    />
  )
}
