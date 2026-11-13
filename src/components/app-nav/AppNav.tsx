import { useState, type ReactNode } from 'react'
import { ActionIcon, Divider, Indicator, Menu, NavLink, ScrollArea, TextInput, Tooltip, UnstyledButton } from '@mantine/core'
import { useUncontrolled } from '@mantine/hooks'
import { ArrowLeftRight, Check, ChevronDown, Network, PanelLeftClose, PanelLeftOpen, Pin, Search } from 'lucide-react'
import { navItemsByRole, navRoles, navUnits, type NavItemDef, type NavRole } from '../../tokens/navigation'
import classes from './AppNav.module.css'

export interface AppNavProps {
  /** Roles the user holds. More than one shows the "Acting as" switcher. */
  roles: NavRole[]
  role?: NavRole
  defaultRole?: NavRole
  onRoleChange?: (role: NavRole) => void
  /** Expanded panel (true) or icon-only rail (false) */
  expanded?: boolean
  defaultExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  /** Pinned keeps the panel open and in the page flow */
  pinned?: boolean
  defaultPinned?: boolean
  onPinnedChange?: (pinned: boolean) => void
  /** Key of the active item */
  active?: string
  defaultActive?: string
  onActiveChange?: (key: string) => void
  /** Position over the page instead of in the flow. Set when expanded and not pinned. */
  floating?: boolean
  height?: number | string
}

const itemLabel = (item: NavItemDef) => (item.count ? `${item.label}, ${item.count} pending` : item.label)

function NavItem({ item, collapsed, active, onSelect }: { item: NavItemDef; collapsed: boolean; active: boolean; onSelect: () => void }) {
  const Icon = item.icon
  const icon = <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
  const link = (
    <NavLink
      component="button"
      type="button"
      active={active}
      aria-current={active ? 'page' : undefined}
      aria-label={collapsed ? itemLabel(item) : undefined}
      label={collapsed ? undefined : item.label}
      leftSection={collapsed ? (
        <Indicator disabled={!item.count} size={8} offset={1} color="var(--nav-indicator)">{icon}</Indicator>
      ) : icon}
      rightSection={!collapsed && item.count ? <span className={classes.count} aria-hidden="true">{item.count}</span> : undefined}
      onClick={onSelect}
      classNames={{ root: classes.item, label: classes.itemLabel, section: classes.itemSection }}
    />
  )
  return (
    <>
      <Tooltip label={itemLabel(item)} position="right" disabled={!collapsed}>{link}</Tooltip>
      {item.dividerAfter && <Divider className={classes.divider} />}
    </>
  )
}

interface SwitcherOption {
  key: string
  title: string
  description?: string
}

function Switcher({ collapsed, icon, tooltip, options, value, onChange, children, label }: {
  collapsed: boolean
  icon: ReactNode
  tooltip: string
  options: SwitcherOption[]
  value: string
  onChange: (key: string) => void
  children: ReactNode
  label: string
}) {
  return (
    <Menu position={collapsed ? 'right-start' : 'bottom-start'} width={collapsed ? 280 : 'target'} offset={4} classNames={{ dropdown: classes.menuDropdown, item: classes.menuItem }}>
      <Menu.Target>
        <Tooltip label={tooltip} position="right" disabled={!collapsed}>
          <UnstyledButton className={classes.switcher} aria-label={collapsed ? tooltip : label}>
            {icon}
            {!collapsed && children}
            <ChevronDown size={16} className={classes.chevron} aria-hidden="true" />
          </UnstyledButton>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        {options.map((option) => {
          const selected = option.key === value
          return (
            <Menu.Item
              key={option.key}
              role="menuitemradio"
              aria-checked={selected}
              data-selected={selected || undefined}
              rightSection={selected ? <Check size={16} aria-hidden="true" /> : undefined}
              onClick={() => onChange(option.key)}
            >
              <div className={classes.menuTitle}>{option.title}</div>
              {option.description && <div className={classes.menuDescription}>{option.description}</div>}
            </Menu.Item>
          )
        })}
      </Menu.Dropdown>
    </Menu>
  )
}

/**
 * Primary app navigation. Items depend on the role the user is acting as.
 * Collapses to an icon rail with tooltips, and can be pinned in the flow or float over the page.
 */
export default function AppNav(props: AppNavProps) {
  const { roles, floating = false, height } = props
  const [role, setRole] = useUncontrolled({ value: props.role, defaultValue: props.defaultRole, finalValue: roles[0], onChange: props.onRoleChange })
  const [expanded, setExpanded] = useUncontrolled({ value: props.expanded, defaultValue: props.defaultExpanded, finalValue: true, onChange: props.onExpandedChange })
  const [pinned, setPinned] = useUncontrolled({ value: props.pinned, defaultValue: props.defaultPinned, finalValue: true, onChange: props.onPinnedChange })
  const items = navItemsByRole[role]
  const [active, setActive] = useUncontrolled({ value: props.active, defaultValue: props.defaultActive, finalValue: items[0].key, onChange: props.onActiveChange })
  const [unit, setUnit] = useState(navUnits[0])
  const collapsed = !expanded
  const activeKey = items.some((item) => item.key === active) ? active : items[0].key
  const heldRoles = navRoles.filter((option) => roles.includes(option.key))
  const roleLabel = navRoles.find((option) => option.key === role)!.label

  const collapse = () => {
    setExpanded(false)
    setPinned(false)
  }

  return (
    <nav
      aria-label="Main navigation"
      className={classes.root}
      data-collapsed={collapsed || undefined}
      data-floating={floating || undefined}
      style={height === undefined ? undefined : { height }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && expanded && !pinned && !event.defaultPrevented) collapse()
      }}
    >
      <div className={classes.header}>
        <Tooltip label={collapsed ? 'Expand navigation' : 'Collapse navigation'} position="right">
          <ActionIcon
            variant="transparent"
            size={36}
            className={classes.iconButton}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            onClick={() => (collapsed ? setExpanded(true) : collapse())}
          >
            {collapsed ? <PanelLeftOpen size={20} strokeWidth={1.75} /> : <PanelLeftClose size={20} strokeWidth={1.75} />}
          </ActionIcon>
        </Tooltip>
        {!collapsed && (
          <>
            <TextInput
              className={classes.search}
              classNames={{ input: classes.searchInput }}
              placeholder="Search anything..."
              aria-label="Search"
              leftSection={<Search size={18} strokeWidth={1.75} aria-hidden="true" />}
            />
            <Tooltip label={pinned ? 'Unpin navigation' : 'Pin navigation'}>
              <ActionIcon
                variant="transparent"
                size={36}
                className={classes.iconButton}
                data-pressed={pinned || undefined}
                aria-pressed={pinned}
                aria-label="Pin navigation"
                onClick={() => setPinned(!pinned)}
              >
                <Pin size={18} strokeWidth={1.75} fill={pinned ? 'currentColor' : 'none'} />
              </ActionIcon>
            </Tooltip>
          </>
        )}
      </div>
      <ScrollArea className={classes.body} type="auto" scrollbarSize={6} style={{ flex: 1 }}>
        <div className={classes.switchers}>
          {heldRoles.length > 1 && (
            <Switcher
              collapsed={collapsed}
              icon={<ArrowLeftRight size={18} strokeWidth={1.75} aria-hidden="true" />}
              tooltip={`Acting as ${roleLabel}`}
              label={`Acting as ${roleLabel}. Change role`}
              options={heldRoles.map((option) => ({ key: option.key, title: option.label, description: option.description }))}
              value={role}
              onChange={(key) => setRole(key as NavRole)}
            >
              <span className={classes.switcherText}>
                <span className={classes.switcherLabel}>Acting as</span>
                <span className={classes.switcherValue}>{roleLabel}</span>
              </span>
            </Switcher>
          )}
          <Switcher
            collapsed={collapsed}
            icon={<Network size={18} strokeWidth={1.75} aria-hidden="true" />}
            tooltip={unit}
            label={`Unit: ${unit}. Change unit`}
            options={navUnits.map((name) => ({ key: name, title: name }))}
            value={unit}
            onChange={setUnit}
          >
            <span className={classes.switcherText}>
              <span className={classes.switcherValue}>{unit}</span>
            </span>
          </Switcher>
        </div>
        <div className={classes.list}>
          {items.map((item) => (
            <NavItem key={item.key} item={item} collapsed={collapsed} active={item.key === activeKey} onSelect={() => setActive(item.key)} />
          ))}
        </div>
      </ScrollArea>
    </nav>
  )
}
