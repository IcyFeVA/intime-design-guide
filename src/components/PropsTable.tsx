import { Code, Table, Text } from '@mantine/core'

export interface PropRow {
  prop: string
  type: string
  default?: string
  description: string
}

export default function PropsTable({ rows }: { rows: PropRow[] }) {
  return (
    <Table.ScrollContainer minWidth={560} className="doc-table">
      <Table verticalSpacing="sm" horizontalSpacing="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Prop</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Default</Table.Th>
            <Table.Th>Description</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={row.prop}>
              <Table.Td>
                <Code>{row.prop}</Code>
              </Table.Td>
              <Table.Td>
                <Text size="xs" ff="monospace" c="intime.3">
                  {row.type}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="xs" ff="monospace" c="dimmed">
                  {row.default ?? '—'}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{row.description}</Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
