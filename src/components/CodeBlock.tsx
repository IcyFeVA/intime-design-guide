import { ActionIcon, CopyButton, Group, Text, Tooltip } from '@mantine/core'
import { Check, Copy } from 'lucide-react'

interface CodeBlockProps {
  code: string
  /** Shown in the header bar, e.g. a file name or "TSX" */
  title?: string
}

export default function CodeBlock({ code, title = 'TSX' }: CodeBlockProps) {
  return (
    <div className="code-block">
      <Group justify="space-between" className="code-block__bar" wrap="nowrap">
        <Text size="xs" c="dimmed" ff="monospace">
          {title}
        </Text>
        <CopyButton value={code} timeout={1500}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? 'Copied' : 'Copy code'}>
              <ActionIcon
                variant="subtle"
                color={copied ? 'green' : 'gray'}
                size="sm"
                onClick={copy}
                aria-label="Copy code"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>
      <pre className="code-block__body">
        <code>{code.trim()}</code>
      </pre>
    </div>
  )
}
