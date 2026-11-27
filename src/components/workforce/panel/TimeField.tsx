import { TextInput, type TextInputProps } from '@mantine/core'
import { parseTime, timeValue } from './format'
import classes from '../WorkforcePanel.module.css'

/**
 * A plain text field for a 24-hour time, typed rather than picked: "0830", "830", "8:30" or "17" all work.
 * Leaving the field tidies a valid time to "08:30"; anything else stays as typed so the form can say what's wrong.
 * Focus selects the whole value, so typing replaces it.
 */
export function TimeField({ value, onChange, onBlur, placeholder = 'HH:MM', ...props }: Omit<TextInputProps, 'value' | 'onChange'> & { value: string; onChange: (value: string) => void }) {
  return (
    <TextInput
      size="sm"
      {...props}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      onFocus={(event) => event.currentTarget.select()}
      onBlur={(event) => {
        const hours = parseTime(value)
        const tidy = hours === 24 ? '24:00' : hours !== null ? timeValue(hours) : value
        if (tidy !== value) onChange(tidy)
        onBlur?.(event)
      }}
      placeholder={placeholder}
      inputMode="numeric"
      autoComplete="off"
      spellCheck={false}
      maxLength={5}
      classNames={{ input: classes.mono }}
    />
  )
}
