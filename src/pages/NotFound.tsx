import { Button, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { MapPinOff } from 'lucide-react'
import { Link } from 'react-router'

export default function NotFound() {
  return (
    <Stack align="center" gap="md" py={96} ta="center">
      <ThemeIcon size={48} radius="md" variant="light" color="gray">
        <MapPinOff size={24} />
      </ThemeIcon>
      <Title order={1}>Page not found</Title>
      <Text c="dimmed" maw={420}>
        This page doesn't exist in the design guide yet. Use search or head back to the overview.
      </Text>
      <Button component={Link} to="/">
        Back to overview
      </Button>
    </Stack>
  )
}
