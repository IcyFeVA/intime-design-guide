import { useState } from 'react'
import { Badge, Button, Code, Group, SimpleGrid, Skeleton, Stack, Table, Text, Title } from '@mantine/core'
import { RotateCcw } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import Section from '../../components/Section'
import Preview from '../../components/Preview'
import DoDont from '../../components/DoDont'
import CopyValue from '../../components/CopyValue'
import PropsTable from '../../components/PropsTable'
import AppNav from '../../components/app-nav/AppNav'
import { navItemsByRole, navTokens, navVariants, type NavRole } from '../../tokens/navigation'
import classes from './Navigation.module.css'

const itemList = (role: NavRole) => navItemsByRole[role].map((item) => item.label).join(', ')

/** App-shell mock: the nav next to page content, so pinned and overlay behavior can be compared. */
function PinningDemo() {
  const [expanded, setExpanded] = useState(true)
  const [pinned, setPinned] = useState(true)
  const floating = expanded && !pinned
  const mode = pinned && expanded ? 'Pinned: the page shifts right' : floating ? 'Unpinned: the nav floats over the page' : 'Collapsed: icons only'
  const reset = () => {
    setExpanded(true)
    setPinned(true)
  }

  return (
    <Preview
      flush
      title="Pinned and overlay"
      code={'<AppNav\n  roles={["employee", "scheduler"]}\n  expanded={expanded}\n  pinned={pinned}\n  floating={expanded && !pinned}\n  onExpandedChange={setExpanded}\n  onPinnedChange={setPinned}\n/>'}
    >
      <Group justify="space-between" px="md" py="xs" style={{ borderBottom: '1px solid var(--intime-border)' }}>
        <Badge variant="light" color={pinned && expanded ? 'cyan' : floating ? 'yellow' : 'gray'} role="status">{mode}</Badge>
        <Button variant="subtle" color="gray" size="compact-xs" leftSection={<RotateCcw size={14} />} onClick={reset}>Reset demo</Button>
      </Group>
      <div className={classes.frame}>
        <div className={classes.slot} style={{ width: pinned && expanded ? 'var(--nav-width)' : 'var(--nav-width-collapsed)' }}>
          <AppNav
            roles={['employee', 'scheduler']}
            defaultRole="scheduler"
            expanded={expanded}
            pinned={pinned}
            floating={floating}
            onExpandedChange={setExpanded}
            onPinnedChange={setPinned}
          />
        </div>
        <div className={classes.content}>
          <Stack gap="xs" mb="lg">
            <Title order={3}>Home</Title>
            <Text size="sm" c="dimmed" maw={480}>Page content. Watch it move when the navigation is pinned, and stay put when the navigation floats over it.</Text>
          </Stack>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
            {[0, 1, 2, 3, 4, 5].map((card) => (
              <div className={classes.card} key={card}>
                <Skeleton height={10} width="60%" animate={false} mb="sm" />
                <Skeleton height={8} animate={false} mb={6} />
                <Skeleton height={8} width="80%" animate={false} />
              </div>
            ))}
          </SimpleGrid>
        </div>
        {floating && <button type="button" className={classes.scrim} aria-label="Close navigation" onClick={() => setExpanded(false)} />}
      </div>
    </Preview>
  )
}

export default function Navigation() {
  return (
    <>
      <PageHeader />

      <Section id="variants" title="Variants" description="One navigation, four variants. The items depend on the role the user is acting as, and the role switcher only appears when the user holds more than one role. Each variant also exists as a collapsed rail.">
        <Preview flush title="Expanded and collapsed">
          <div className={classes.specimens}>
            {navVariants.map((variant) => (
              <div className={classes.specimen} key={variant.key}>
                <Text size="sm" fw={600} c="dimmed">{variant.title}</Text>
                <div className={classes.pair}>
                  <div className={classes.panel}><AppNav roles={variant.roles} defaultRole={variant.acting} /></div>
                  <div className={classes.panel}><AppNav roles={variant.roles} defaultRole={variant.acting} defaultExpanded={false} defaultPinned={false} /></div>
                </div>
              </div>
            ))}
          </div>
        </Preview>
        <Table.ScrollContainer minWidth={560} className="doc-table" mt="md">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr><Table.Th>Variant</Table.Th><Table.Th>Role switcher</Table.Th><Table.Th>Items</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {navVariants.map((variant) => (
                <Table.Tr key={variant.key}>
                  <Table.Td><Text size="sm" fw={600}>{variant.title}</Text><Text size="xs" c="dimmed">{variant.summary}</Text></Table.Td>
                  <Table.Td><Text size="sm">{variant.roles.length > 1 ? 'Yes' : 'No'}</Text></Table.Td>
                  <Table.Td><Text size="sm">{itemList(variant.acting)}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Section>

      <Section id="switchers" title="Role and unit switchers" description="Two fields sit above the items. “Acting as” changes the role, and with it the items. The unit field changes which unit the user is looking at. Neither changes what the user is permitted to do.">
        <Preview title="Try the role menu" align="start" code={'<AppNav\n  roles={["employee", "scheduler", "administrator"]}\n  defaultRole="scheduler"\n/>'}>
          <div className={classes.panel} style={{ height: 460 }}>
            <AppNav roles={['employee', 'scheduler', 'administrator']} defaultRole="scheduler" />
          </div>
          <Stack gap="xs" maw={320}>
            <Text size="sm" fw={600}>Acting as menu</Text>
            <Text size="sm" c="dimmed">Open the menu and pick another role. The items update straight away.</Text>
            <Text size="sm" c="dimmed">Each option has a name and a one-line description. The current role has a check and the accent color.</Text>
          </Stack>
        </Preview>
        <Stack gap="xs" mt="md">
          <Text size="sm">List only the roles the user holds. A user with a single role gets no “Acting as” field, as in the Employee only variant.</Text>
          <Text size="sm">In the collapsed rail the switchers shrink to their icon and a chevron. The menu opens beside the rail, and a tooltip shows the current value.</Text>
        </Stack>
      </Section>

      <Section id="collapsed" title="Collapsed rail" description="Collapse the navigation to a narrow rail when the page needs the space. Icons stay where they are, so the user never has to relearn the layout.">
        <Preview title="Hover an icon" align="start">
          <div className={classes.panel}><AppNav roles={['employee', 'scheduler']} defaultRole="employee" defaultExpanded={false} defaultPinned={false} /></div>
          <Stack gap="sm" maw={340}>
            <Text size="sm"><strong>Tooltips.</strong> Hovering or focusing an icon shows its label to the right. Items with a count add it, e.g. “Requests, 4 pending”.</Text>
            <Text size="sm"><strong>Dots, not numbers.</strong> A count badge becomes a small dot on the icon. The dot says something needs attention. The tooltip and the accessible name give the number.</Text>
            <Text size="sm"><strong>One control.</strong> Only the expand button remains in the header. Search and pin return when the panel opens.</Text>
          </Stack>
        </Preview>
      </Section>

      <Section id="pinning" title="Pinned and overlay" description="Pinning keeps the navigation open and moves the page to its right. When it is not pinned the navigation floats over the page, and the page keeps the width of the collapsed rail.">
        <PinningDemo />
        <Table.ScrollContainer minWidth={560} className="doc-table" mt="md">
          <Table verticalSpacing="sm" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr><Table.Th>State</Table.Th><Table.Th>Nav width</Table.Th><Table.Th>Page</Table.Th><Table.Th>How to get there</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr><Table.Td>Pinned</Table.Td><Table.Td><Code>--nav-width</Code></Table.Td><Table.Td>Shifts right of the nav</Table.Td><Table.Td>Pin button, top right of the panel</Table.Td></Table.Tr>
              <Table.Tr><Table.Td>Overlay</Table.Td><Table.Td><Code>--nav-width</Code></Table.Td><Table.Td>Stays at the rail width, dimmed behind the nav</Table.Td><Table.Td>Expand from the rail, or unpin. Close with the scrim, <Code>Esc</Code> or the collapse button.</Table.Td></Table.Tr>
              <Table.Tr><Table.Td>Collapsed</Table.Td><Table.Td><Code>--nav-width-collapsed</Code></Table.Td><Table.Td>Stays at the rail width</Table.Td><Table.Td>Collapse button. This also unpins.</Table.Td></Table.Tr>
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Section>

      <Section id="component" title="Using the component" description="The examples on this page use the real component, so other pages can build on it too. Import it, tell it which roles the user holds, and control the state only when the page layout needs it.">
        <PropsTable rows={[
          { prop: 'roles', type: 'NavRole[]', description: 'Roles the user holds. More than one shows the “Acting as” switcher.' },
          { prop: 'role / defaultRole', type: 'NavRole', default: 'roles[0]', description: 'Role the user is acting as. Decides which items are shown.' },
          { prop: 'expanded / defaultExpanded', type: 'boolean', default: 'true', description: 'Full panel when true, icon rail when false.' },
          { prop: 'pinned / defaultPinned', type: 'boolean', default: 'true', description: 'Pinned keeps the panel open in the page flow.' },
          { prop: 'floating', type: 'boolean', default: 'false', description: 'Positions the panel over the page. Pass expanded && !pinned.' },
          { prop: 'active / defaultActive', type: 'string', default: 'first item', description: 'Key of the active item.' },
          { prop: 'onRoleChange, onExpandedChange, onPinnedChange, onActiveChange', type: 'function', description: 'Called when the user changes the matching value.' },
        ]} />
        <Text size="sm" c="dimmed" mt="sm">Items and roles live in <Code>src/tokens/navigation.ts</Code>. Edit them there, not in the component.</Text>
      </Section>

      <Section id="tokens" title="CSS variables" description="Navigation sizes and colors are CSS variables on :root. Colors point at the theme tokens, so they follow the dark and light themes. Use them to build navigation examples on other pages.">
        <Table.ScrollContainer minWidth={640} className="doc-table">
          <Table verticalSpacing="xs" horizontalSpacing="md">
            <Table.Thead>
              <Table.Tr><Table.Th>Variable</Table.Th><Table.Th>Value</Table.Th><Table.Th>Usage</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {navTokens.map((token) => (
                <Table.Tr key={token.name}>
                  <Table.Td><CopyValue value={`var(${token.name})`} display={token.name} /></Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      {token.kind === 'color' && <span className={classes.swatch} style={{ background: `var(${token.name})` }} aria-hidden="true" />}
                      <Text size="xs" ff="monospace" c="dimmed">{token.value}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td><Text size="sm">{token.usage}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Section>

      <Section id="guidelines" title="Guidelines">
        <DoDont
          doItems={[
            'Show only what the acting role can use. Leave out items the user has no access to.',
            'Keep the same icon and order in the expanded panel and in the rail.',
            'Give every rail icon a tooltip and an accessible name that includes its count.',
            'Let Esc and a click on the dimmed page close the overlay.',
          ]}
          dontItems={[
            'Show disabled items for roles the user does not hold.',
            'Use the dot for anything except “needs attention”.',
            'Shift the page while the navigation floats over it.',
            'Rely on the dot alone. Always expose the number through the tooltip.',
          ]}
        />
      </Section>

      <Section id="figma" title="Figma reference" description="Frames the variants and the role menu were taken from.">
        <Stack gap="md">
          <img src="/figma/navigation-variants.png" alt="Navigation in four variants, each expanded and collapsed: Scheduler, Administrator, Employee (and Scheduler), Employee only." style={{ width: '100%', borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--intime-border)' }} />
          <img src="/figma/navigation-role-switcher.png" alt="The Acting as field in its default and hover states, and its open menu listing Employee, Scheduler and Administrator." style={{ width: '100%', borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--intime-border)' }} />
          <Text size="xs" c="dimmed">The Figma search field reads “Search anyting...”. The guide uses the corrected “Search anything...”.</Text>
        </Stack>
      </Section>
    </>
  )
}
