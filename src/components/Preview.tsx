import { useState, type ReactNode } from 'react'
import { Button, Collapse, Group, Text } from '@mantine/core'
import { Code2 } from 'lucide-react'
import CodeBlock from './CodeBlock'
import { SHOW_CODE } from '../content/flags'

interface PreviewProps {
  children: ReactNode
  /** Optional caption above the demo */
  title?: string
  /** Optional snippet revealed with "Show code" */
  code?: string
  /** Center demo content (default) or align to start */
  align?: 'center' | 'start'
  /** Remove inner padding, e.g. for full-bleed tables */
  flush?: boolean
}

/** Framed live demo area with optional code toggle. */
export default function Preview({ children, title, code: codeProp, align = 'center', flush = false }: PreviewProps) {
  const [showCode, setShowCode] = useState(false)
  const code = SHOW_CODE ? codeProp : undefined

  return (
    <div className="preview">
      {(title || code) && (
        <Group justify="space-between" className="preview__bar" wrap="nowrap">
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" lts="0.06em">
            {title ?? 'Preview'}
          </Text>
          {code && (
            <Button
              variant="subtle"
              color="gray"
              size="compact-xs"
              leftSection={<Code2 size={14} />}
              onClick={() => setShowCode((value) => !value)}
              aria-expanded={showCode}
            >
              {showCode ? 'Hide code' : 'Show code'}
            </Button>
          )}
        </Group>
      )}
      <div className="preview__stage" data-align={align} data-flush={flush || undefined}>
        {children}
      </div>
      {code && (
        <Collapse expanded={showCode}>
          <div className="preview__code">
            <CodeBlock code={code} />
          </div>
        </Collapse>
      )}
    </div>
  )
}
