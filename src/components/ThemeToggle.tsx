import { ActionIcon, Tooltip, useComputedColorScheme, useMantineColorScheme } from '@mantine/core'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme()
  const scheme = useComputedColorScheme('dark')
  const label = scheme === 'dark' ? 'Preview light mode' : 'Back to dark mode'

  return (
    <Tooltip label={label}>
      <ActionIcon
        variant="subtle"
        color="gray"
        size="lg"
        onClick={() => setColorScheme(scheme === 'dark' ? 'light' : 'dark')}
        aria-label={label}
      >
        {scheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </ActionIcon>
    </Tooltip>
  )
}
