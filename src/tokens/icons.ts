import type { LucideIcon } from 'lucide-react'
import {
  AlarmClock, ArrowLeftRight, Ambulance, Badge, BadgeCheck, Bell, Building, Calendar, CalendarCheck,
  CalendarClock, CalendarDays, CalendarPlus, CalendarX, Car, ChevronDown, ChevronLeft, ChevronRight,
  CircleAlert, CircleCheck, CircleQuestionMark, Clock, Clock3, Copy, Download, Ellipsis, Funnel, FireExtinguisher,
  Flame, GraduationCap, HeartPulse, House, Info, LayoutDashboard, ListChecks, LogOut, Mail, Map as MapIcon, MapPin,
  Menu, MessageSquare, TreePalm, Pencil, Phone, Plus, Printer, Radio, RefreshCw, Repeat, Search, Settings,
  Shield, ShieldCheck, Siren, SlidersHorizontal, Timer, Trash, TriangleAlert, Upload, User, UserCheck,
  UserMinus, UserPlus, Users, X,
} from 'lucide-react'

export interface IconEntry {
  name: string
  icon: LucideIcon
  keywords: string
}

export interface IconGroup {
  key: string
  title: string
  description: string
  icons: IconEntry[]
}

const e = (name: string, icon: LucideIcon, keywords = ''): IconEntry => ({ name, icon, keywords })

/** Curated draft icon set. Developers may use any Lucide icon, but prefer these for consistency. */
export const iconGroups: IconGroup[] = [
  {
    key: 'scheduling',
    title: 'Scheduling & time',
    description: 'Calendars, shifts, time tracking.',
    icons: [
      e('Calendar', Calendar, 'schedule date'), e('CalendarDays', CalendarDays, 'month roster'),
      e('CalendarClock', CalendarClock, 'scheduled shift'), e('CalendarPlus', CalendarPlus, 'add shift'),
      e('CalendarCheck', CalendarCheck, 'approved confirmed'), e('CalendarX', CalendarX, 'cancel shift'),
      e('Clock', Clock, 'time hours'), e('Clock3', Clock3, 'overtime'), e('Timer', Timer, 'duration'),
      e('AlarmClock', AlarmClock, 'callback recall'), e('Repeat', Repeat, 'rotation recurring pattern'),
      e('ArrowLeftRight', ArrowLeftRight, 'swap trade'),
    ],
  },
  {
    key: 'personnel',
    title: 'Personnel',
    description: 'Members, staffing, availability.',
    icons: [
      e('User', User, 'member officer firefighter'), e('Users', Users, 'team crew platoon'),
      e('UserPlus', UserPlus, 'open shift add member'), e('UserMinus', UserMinus, 'remove'),
      e('UserCheck', UserCheck, 'available on duty'), e('GraduationCap', GraduationCap, 'training certification'),
      e('HeartPulse', HeartPulse, 'sick medical'), e('TreePalm', TreePalm, 'leave vacation pto'),
      e('BadgeCheck', BadgeCheck, 'verified on duty'), e('Badge', Badge, 'rank id'),
    ],
  },
  {
    key: 'departments',
    title: 'Departments & units',
    description: 'Agencies, stations, apparatus.',
    icons: [
      e('Shield', Shield, 'police law'), e('ShieldCheck', ShieldCheck, 'police verified'),
      e('Siren', Siren, 'emergency'), e('Car', Car, 'patrol vehicle'), e('Flame', Flame, 'fire'),
      e('FireExtinguisher', FireExtinguisher, 'fire equipment'), e('Ambulance', Ambulance, 'ems medic'),
      e('Building', Building, 'station precinct'), e('MapPin', MapPin, 'district beat location'),
      e('Map', MapIcon, 'zone area'), e('Radio', Radio, 'dispatch'),
    ],
  },
  {
    key: 'status',
    title: 'Status & feedback',
    description: 'Alerts, confirmations, notices.',
    icons: [
      e('CircleCheck', CircleCheck, 'success'), e('CircleAlert', CircleAlert, 'error'),
      e('TriangleAlert', TriangleAlert, 'warning conflict'), e('Info', Info, 'info'),
      e('CircleQuestionMark', CircleQuestionMark, 'help'), e('Bell', Bell, 'notification'),
    ],
  },
  {
    key: 'actions',
    title: 'Actions',
    description: 'Common commands in toolbars and menus.',
    icons: [
      e('Plus', Plus, 'add create'), e('Pencil', Pencil, 'edit'), e('Trash', Trash, 'delete remove'),
      e('Copy', Copy, 'duplicate'), e('Download', Download, 'export'), e('Upload', Upload, 'import'),
      e('Printer', Printer, 'print roster'), e('RefreshCw', RefreshCw, 'sync reload'),
      e('Funnel', Funnel, 'filter'), e('SlidersHorizontal', SlidersHorizontal, 'settings adjust'),
      e('Search', Search, 'find'), e('ListChecks', ListChecks, 'approve tasks'),
      e('Mail', Mail, 'email'), e('Phone', Phone, 'call'), e('MessageSquare', MessageSquare, 'message note'),
    ],
  },
  {
    key: 'navigation',
    title: 'Navigation',
    description: 'App chrome and wayfinding.',
    icons: [
      e('LayoutDashboard', LayoutDashboard, 'dashboard home'), e('House', House, 'home'),
      e('Menu', Menu, 'hamburger'), e('Settings', Settings, 'settings'),
      e('ChevronLeft', ChevronLeft, 'previous back'), e('ChevronRight', ChevronRight, 'next forward'),
      e('ChevronDown', ChevronDown, 'expand'), e('Ellipsis', Ellipsis, 'more overflow'),
      e('X', X, 'close'), e('LogOut', LogOut, 'sign out'),
    ],
  },
]

export const iconRules = {
  sizes: [
    { name: 'sm', px: 16, usage: 'Inline with text, inputs, table cells, badges.' },
    { name: 'md', px: 20, usage: 'Buttons, navigation, toolbar actions.' },
    { name: 'lg', px: 24, usage: 'Empty states, page headers, feature cards.' },
  ],
  strokeWidth: 1.75,
}
