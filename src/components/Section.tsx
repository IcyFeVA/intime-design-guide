import type { ReactNode } from 'react'
import { ActionIcon, CopyButton, Group, Stack, Text, Title, Tooltip } from '@mantine/core'
import { Check, Link2 } from 'lucide-react'
import { useLocation } from 'react-router'
import { absoluteSectionUrl } from '../lib/links'

interface SectionProps {
  /** Must match a section id in `src/content/pages.ts` for TOC + search */
  id: string
  title: string
  description?: ReactNode
  children: ReactNode
  /** `display` renders a large group heading (44px), used for top-level color groups */
  size?: 'default' | 'display'
}

export default function Section({ id, title, description, children, size = 'default' }: SectionProps) {
  const { pathname } = useLocation()

  return (
    <section id={id} data-section data-size={size} className="doc-section" aria-labelledby={`${id}-title`}>
      <Stack gap={6} mb="lg">
        <Group gap={6} className="doc-section__heading" wrap="nowrap">
          <Title order={2} id={`${id}-title`} className="doc-section__title">
            {title}
          </Title>
          <CopyButton value={absoluteSectionUrl(pathname, id)} timeout={1500}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? 'Link copied' : 'Copy link to section'}>
                <ActionIcon
                  variant="subtle"
                  color={copied ? 'green' : 'gray'}
                  size="sm"
                  onClick={copy}
                  className="doc-section__anchor"
                  aria-label={`Copy link to ${title}`}
                >
                  {copied ? <Check size={14} /> : <Link2 size={14} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        </Group>
        {description && (
          <Text c="dimmed" size="sm" maw={680}>
            {description}
          </Text>
        )}
      </Stack>
      {children}
    </section>
  )
}
