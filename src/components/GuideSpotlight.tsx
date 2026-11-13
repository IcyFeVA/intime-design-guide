import { Button, Stack, Text } from '@mantine/core'
import { Spotlight, spotlight, type SpotlightActionGroupData } from '@mantine/spotlight'
import { Hash, Search } from 'lucide-react'
import { useNavigate } from 'react-router'
import { pages } from '../content/pages'
import { sectionPath } from '../lib/links'

export default function GuideSpotlight() {
  const navigate = useNavigate()

  const actions: SpotlightActionGroupData[] = [
    {
      group: 'Pages',
      actions: pages.map((page) => {
        const Icon = page.icon
        return {
          id: page.path,
          label: page.title,
          description: `${page.group} · ${page.description}`,
          keywords: page.keywords,
          leftSection: <Icon size={18} />,
          onClick: () => navigate(page.path),
        }
      }),
    },
    {
      group: 'Sections',
      actions: pages.flatMap((page) =>
        page.sections.map((section) => ({
          id: `${page.path}::${section.id}`,
          label: section.title,
          description: page.title,
          keywords: [page.title, ...page.keywords],
          leftSection: <Hash size={16} />,
          onClick: () => navigate(sectionPath(page.path, section.id)),
        })),
      ),
    },
  ]

  return (
    <Spotlight
      actions={actions}
      shortcut={['mod + K', '/']}
      limit={14}
      highlightQuery
      scrollable
      maxHeight={440}
      searchProps={{ leftSection: <Search size={18} />, placeholder: 'Search pages, sections, tokens…' }}
      nothingFound={
        <Stack gap="xs" align="center" py="md">
          <Text size="sm">No matches</Text>
          <Button
            variant="light"
            size="xs"
            onClick={() => {
              spotlight.close()
              navigate('/')
            }}
          >
            Browse all pages
          </Button>
        </Stack>
      }
    />
  )
}
