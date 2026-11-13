import { Stack, Text, ThemeIcon } from '@mantine/core'
import { Frame } from 'lucide-react'

interface FigmaSlotProps {
  /** What frame is expected, e.g. "Primary button — all states" */
  title?: string
  notes?: string
}

/** Placeholder for a real Figma frame. Replace with screenshots/specs as they are provided. */
export default function FigmaSlot({ title = 'Awaiting Figma frame', notes }: FigmaSlotProps) {
  return (
    <div className="figma-slot" role="note">
      <Stack gap={6} align="center" maw={420}>
        <ThemeIcon variant="light" color="gray" size={36} radius="md">
          <Frame size={18} />
        </ThemeIcon>
        <Text fw={600} size="sm" ta="center">
          {title}
        </Text>
        <Text size="xs" c="dimmed" ta="center">
          {notes ?? 'Share the production Figma frame and context to replace the draft guidance on this page.'}
        </Text>
      </Stack>
    </div>
  )
}
