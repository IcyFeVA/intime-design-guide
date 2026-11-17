import { useMemo, useState, type ReactNode } from 'react'
import {
  Badge, ColorSwatch, Group, SegmentedControl, SimpleGrid, Stack, Table, Text, TextInput,
  Tooltip, UnstyledButton, useComputedColorScheme,
} from '@mantine/core'
import { useClipboard } from '@mantine/hooks'
import { Link } from 'react-router'
import { Search } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import CopyValue from '../../components/CopyValue'
import StatusBadge from '../../components/StatusBadge'
import {
  alertExamples, allTokenNames, borderSwatches, findTheme, grayScaleSwatches,
  isColorToken, mainUiSwatches, neutralSwatches, plannedThemes, primitivePalettes, signalGroups,
  textSignalSwatches, textSwatches, themes, type SwatchDef, type ThemeDef,
} from '../../tokens/themes'
import { composite, contrastRatio, isHexColor } from '../../lib/color'
import TokenSwatch, { type CopyFormat } from './TokenSwatch'
import classes from './Colors.module.css'

interface RowProps {
  swatches: SwatchDef[]
  theme: ThemeDef
  copyFormat: CopyFormat
  variant?: 'fill' | 'text' | 'border'
}

function SwatchRow({ swatches, theme, copyFormat, variant }: RowProps) {
  const canvas = theme.tokens['background-body'].value
  return (
    <div className={classes.row}>
      {swatches.map((def) => (
        <TokenSwatch key={def.token} def={def} token={theme.tokens[def.token]} variant={variant} canvas={canvas} copyFormat={copyFormat} />
      ))}
    </div>
  )
}

function ColorGroup({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className={classes.group}>
      <div>
        <h3 className={classes.groupTitle}>{title}</h3>
        {description && <p className={classes.groupDescription}>{description}</p>}
      </div>
      {children}
    </div>
  )
}

function RampStep({ hex, label, copy }: { hex: string; label: string; copy: string }) {
  const clipboard = useClipboard({ timeout: 1500 })
  const darkText = contrastRatio('#111111', hex) > contrastRatio('#ffffff', hex)
  return (
    <Tooltip label={clipboard.copied ? 'Copied' : `Copy ${copy}`}>
      <UnstyledButton
        className={classes.rampStep}
        style={{ background: hex, color: darkText ? '#111111' : '#ffffff' }}
        onClick={() => clipboard.copy(copy)}
        aria-label={`${label} ${hex}. Copy ${copy}`}
      >
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span>{hex.toUpperCase()}</span>
      </UnstyledButton>
    </Tooltip>
  )
}

function Ramp({ shades, varPrefix }: { shades: readonly string[]; varPrefix: string }) {
  return (
    <div className={classes.ramp}>
      {shades.map((hex, index) => (
        <RampStep key={index} hex={hex} label={String(index)} copy={`var(${varPrefix}-${index})`} />
      ))}
    </div>
  )
}

function ValueCell({ theme, name }: { theme: ThemeDef; name: string }) {
  const token = theme.tokens[name]
  if (!token) return <Text size="xs" c="dimmed">Not defined</Text>
  const body = theme.tokens['background-body'].value
  return (
    <Group gap={8} wrap="nowrap">
      <ColorSwatch
        color={isHexColor(token.value) ? composite(token.value, body) : 'transparent'}
        size={22}
        radius="sm"
        withShadow={false}
        style={{ border: '1px solid var(--intime-border)', flex: 'none' }}
      />
      <Stack gap={0} style={{ minWidth: 0 }}>
        <Text size="xs" ff="monospace" tt="uppercase" className="tabular">{token.value}</Text>
        {token.alias && (
          <Text size="xs" c="dimmed" ff="monospace" truncate>
            {token.alias}
            {token.assumed ? ' *' : ''}
          </Text>
        )}
      </Stack>
    </Group>
  )
}

const categories = [
  { value: 'all', label: 'All' },
  { value: 'background', label: 'Background' },
  { value: 'text', label: 'Text' },
  { value: 'border', label: 'Border' },
  { value: 'other', label: 'Gray & neutral' },
]

const categoryOf = (name: string) =>
  name.startsWith('background-') ? 'background' : name.startsWith('text-') ? 'text' : name.startsWith('border-') ? 'border' : 'other'

function AllTokens() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase().replace(/^-+/, '')
    return allTokenNames
      .filter(isColorToken)
      .filter((name) => category === 'all' || categoryOf(name) === category)
      .filter((name) => name.includes(needle))
  }, [query, category])

  return (
    <Stack gap="md">
      <Group gap="sm" wrap="wrap">
        <TextInput
          leftSection={<Search size={15} />}
          placeholder="Filter tokens, e.g. warning"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          aria-label="Filter color tokens"
          w={{ base: '100%', xs: 260 }}
        />
        <SegmentedControl size="xs" data={categories} value={category} onChange={setCategory} aria-label="Token category" />
        <Text size="xs" c="dimmed" ml="auto">
          {rows.length} tokens · * assumed primitive
        </Text>
      </Group>
      <Table.ScrollContainer minWidth={720} className="doc-table" maxHeight={560}>
        <Table verticalSpacing={8} horizontalSpacing="md" stickyHeader>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Token</Table.Th>
              {themes.map((theme) => (
                <Table.Th key={theme.id}>{theme.label}</Table.Th>
              ))}
              <Table.Th>Contrast on body</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((name) => (
              <Table.Tr key={name}>
                <Table.Td>
                  <CopyValue value={`var(--${name})`} display={`--${name}`} label={`--${name}`} />
                </Table.Td>
                {themes.map((theme) => (
                  <Table.Td key={theme.id}>
                    <ValueCell theme={theme} name={name} />
                  </Table.Td>
                ))}
                <Table.Td>
                  {name.startsWith('text-') ? (
                    <Group gap={6} wrap="nowrap">
                      {themes.map((theme) => {
                        const token = theme.tokens[name]
                        if (!token || !isHexColor(token.value)) return null
                        const ratio = contrastRatio(token.value, theme.tokens['background-body'].value)
                        const verdict = ratio >= 4.5 ? 'passes AA' : ratio >= 3 ? 'AA large text only' : 'fails AA'
                        return (
                          <Tooltip key={theme.id} label={`${theme.label}: ${ratio.toFixed(2)}:1, ${verdict}`}>
                            <Badge size="sm" variant="light" color={ratio >= 4.5 ? 'teal' : ratio >= 3 ? 'yellow' : 'red'} className="tabular">
                              {theme.label[0]} {ratio.toFixed(1)}
                            </Badge>
                          </Tooltip>
                        )
                      })}
                    </Group>
                  ) : (
                    <Text size="xs" c="dimmed">—</Text>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      {rows.length === 0 && (
        <Text size="sm" c="dimmed" ta="center" py="md">
          No tokens match “{query}”.
        </Text>
      )}
    </Stack>
  )
}

function ThemeCards({ themeId, onSelect }: { themeId: string; onSelect: (id: string) => void }) {
  return (
    <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="md">
      {themes.map((item) => {
        const t = (name: string) => item.tokens[name].value
        return (
          <UnstyledButton
            key={item.id}
            className={classes.themeCard}
            data-active={item.id === themeId || undefined}
            onClick={() => onSelect(item.id)}
            aria-pressed={item.id === themeId}
          >
            <div className={classes.themePreview} style={{ border: `1px solid ${t('border-default')}` }} aria-hidden="true">
              <div style={{ background: t('background-framework') }}>
                <div className={classes.themeBar} style={{ background: t('text-dimmed'), width: '80%', opacity: 0.5 }} />
                <div className={classes.themeBar} style={{ background: t('background-primary-filled'), width: '60%' }} />
              </div>
              <div style={{ background: t('background-body') }}>
                <div className={classes.themeBar} style={{ background: t('text-title'), width: '50%' }} />
                <div className={classes.themeBar} style={{ background: t('background-default'), height: 28 }} />
                <Group gap={4}>
                  {['success', 'warning', 'error'].map((key) => (
                    <span key={key} className={classes.themeBar} style={{ background: t(`background-${key}-filled`), width: 18, margin: 0 }} />
                  ))}
                </Group>
              </div>
            </div>
            <Group justify="space-between" wrap="nowrap">
              <Text fw={600} size="sm">{item.label}</Text>
              <StatusBadge status={item.status} />
            </Group>
            <Text size="xs" c="dimmed">{item.description}</Text>
          </UnstyledButton>
        )
      })}
      {plannedThemes.map((item) => (
        <div key={item.id} className={classes.themeCard} data-planned>
          <div className={classes.themePreview} style={{ border: '1px dashed var(--intime-border)', display: 'grid', placeItems: 'center' }}>
            <Badge variant="outline" color="gray" size="sm">Planned</Badge>
          </div>
          <Text fw={600} size="sm">{item.label}</Text>
          <Text size="xs" c="dimmed">{item.description}</Text>
        </div>
      ))}
    </SimpleGrid>
  )
}

export default function Colors() {
  const siteScheme = useComputedColorScheme('dark')
  const [themeId, setThemeId] = useState<string>(siteScheme)
  const [copyFormat, setCopyFormat] = useState<CopyFormat>('var')
  const theme = findTheme(themeId)
  const token = (name: string) => theme.tokens[name]

  return (
    <>
      <div className={classes.note} role="note">
        <h4 className={classes.noteTitle}>Important Notes</h4>
        <p className={classes.noteItem}>
          <span>
            All tokens can be copied or downloaded on the <Link to="/resources/theme-export">Theme Export page</Link>
          </span>
        </p>
      </div>

      <PageHeader />

      <div className={classes.toolbar}>
        <Group gap="sm" wrap="wrap">
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" lts="0.06em">Theme</Text>
          <SegmentedControl
            size="xs"
            value={themeId}
            onChange={setThemeId}
            aria-label="Preview theme"
            data={[
              ...themes.map((item) => ({ value: item.id, label: item.label })),
              ...plannedThemes.map((item) => ({ value: item.id, label: `${item.label} · soon`, disabled: true })),
            ]}
          />
        </Group>
        <Group gap="sm" wrap="nowrap">
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" lts="0.06em">Copy</Text>
          <SegmentedControl
            size="xs"
            value={copyFormat}
            onChange={(value) => setCopyFormat(value as CopyFormat)}
            aria-label="Copy format"
            data={[
              { value: 'var', label: 'var(--token)' },
              { value: 'hex', label: 'Hex' },
            ]}
          />
        </Group>
      </div>

      <Section
        id="themes"
        title="Themes"
        description="Every theme defines the same semantic token names with different values. Build against tokens, never hex, and new themes (including the upcoming color-blind mode) work without code changes. The selector above previews any theme, independent of the site's light/dark toggle."
      >
        <ThemeCards themeId={themeId} onSelect={setThemeId} />
      </Section>

      <Section
        id="main-ui"
        title="Main UI colors"
        description="Use sparingly. The accent is a signal, not a surface. Framework colors build navigation, body is the canvas, default is for cards and inputs."
      >
        <SwatchRow swatches={mainUiSwatches} theme={theme} copyFormat={copyFormat} />
      </Section>

      <Section id="signalling" title="Signalling Colors" size="display">
        {signalGroups.map((group, index) => (
          <div key={group.key}>
            {index === 1 && <p className={classes.kicker}>Meaningful color reserved for state and feedback.</p>}
            <ColorGroup title={group.title} description={group.description}>
              <SwatchRow swatches={group.swatches} theme={theme} copyFormat={copyFormat} />
            </ColorGroup>
          </div>
        ))}
      </Section>

      <Section
        id="in-context"
        title="Signalling colors with example"
        size="display"
        description="Text tokens paired with their light background. Alerts tint the light token over the body color."
      >
        <SwatchRow swatches={textSignalSwatches} theme={theme} copyFormat={copyFormat} variant="text" />
        <div className={classes.alerts}>
          {alertExamples.map((alert) => (
            <div
              key={alert.key}
              className={classes.alert}
              style={{
                background: `color-mix(in srgb, ${token(alert.background).value} 12%, ${token('background-body').value})`,
                color: token(alert.text).value,
              }}
            >
              <p className={classes.alertTitle}>Bummer!</p>
              <p className={classes.alertBody}>
                Something terrible happened! You made a mistake and there is no going back, your data was lost forever!
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="text" title="Text" size="display">
        <SwatchRow swatches={textSwatches} theme={theme} copyFormat={copyFormat} variant="text" />
      </Section>

      <Section id="borders" title="Borders" size="display">
        <Stack gap={16}>
          <SwatchRow swatches={borderSwatches.slice(0, 2)} theme={theme} copyFormat={copyFormat} variant="border" />
          <SwatchRow swatches={borderSwatches.slice(2, 6)} theme={theme} copyFormat={copyFormat} variant="border" />
          <SwatchRow swatches={borderSwatches.slice(6)} theme={theme} copyFormat={copyFormat} variant="border" />
        </Stack>
      </Section>

      <Section
        id="grays"
        title="Gray scale & neutrals"
        description="Gray steps are theme-relative: gray-10 is the deepest step in dark and the lightest in light, so gray-80 text on gray-10 stays readable in every theme."
      >
        <Stack gap={32}>
          <SwatchRow swatches={grayScaleSwatches} theme={theme} copyFormat={copyFormat} />
          <SwatchRow swatches={neutralSwatches} theme={theme} copyFormat={copyFormat} />
        </Stack>
      </Section>

      <Section
        id="primitives"
        title="Primitive palettes"
        description="Raw ramps that semantic tokens point to. They resolve to Mantine's default palettes with primary = cyan. Do not use primitives directly in product code."
      >
        <Stack gap="xl">
          {primitivePalettes.map((palette) => (
            <Stack key={palette.key} gap="xs">
              <Group gap="sm">
                <Text fw={600}>{palette.name}</Text>
                <Text size="xs" c="dimmed" ff="monospace">--{palette.prefixes[0]}-0…9</Text>
              </Group>
              <Ramp shades={palette.shades} varPrefix={`--${palette.prefixes[0]}`} />
            </Stack>
          ))}
        </Stack>
      </Section>

      <Section
        id="all-tokens"
        title="All color tokens"
        description="Every color variable from the export, side by side across themes. Use it to spot gaps when a new theme is added."
      >
        <AllTokens />
      </Section>
    </>
  )
}
