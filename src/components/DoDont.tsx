import { List, SimpleGrid, Text, ThemeIcon } from '@mantine/core'
import { Check, X } from 'lucide-react'

interface DoDontProps {
  doItems: string[]
  dontItems: string[]
}

export default function DoDont({ doItems, dontItems }: DoDontProps) {
  const column = (kind: 'do' | 'dont', items: string[]) => (
    <div className="do-dont" data-kind={kind}>
      <Text fw={600} size="sm" mb="sm" c={kind === 'do' ? 'green.4' : 'red.4'}>
        {kind === 'do' ? 'Do' : "Don't"}
      </Text>
      <List
        spacing="xs"
        size="sm"
        icon={
          <ThemeIcon size={18} radius="xl" variant="light" color={kind === 'do' ? 'green' : 'red'}>
            {kind === 'do' ? <Check size={12} /> : <X size={12} />}
          </ThemeIcon>
        }
      >
        {items.map((item) => (
          <List.Item key={item}>{item}</List.Item>
        ))}
      </List>
    </div>
  )

  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
      {column('do', doItems)}
      {column('dont', dontItems)}
    </SimpleGrid>
  )
}
