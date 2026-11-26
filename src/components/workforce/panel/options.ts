import { shiftCodeMap, shiftCodes } from '../../../tokens/schedule'
import { navUnits } from '../../../tokens/navigation'
import { HOME_BRANCH, OTHER_BRANCH, watches, shortName, type SegmentDetails, type TimeBank, type WorkforceSegment } from '../data'

/* Mock options for the details panel's fields */

export const activities = ['Patrol', 'Court', 'Training', 'Special detail', 'Special event', 'Office duty', 'Leave']
export const locations = ['Sector A', 'Sector B', 'Sector C', 'Sector D', 'Kings County Court', 'Training center', 'Station house', 'Barclays Center']
export const modifiers = ['None', 'Overtime 1.5×', 'Overtime 2×', 'Holiday pay', 'Comp time']
export const actingRanks = ['None', 'Corporal', 'Sergeant', 'Lieutenant']
export const customers = ['City of New York', 'NYC Transit', 'Barclays Center']
export const units = [...watches.map((watch) => watch.unit), 'Special Ops', 'K9 Unit', 'Training']
/** Branches (precincts) people can work at. The demo's unit is in the first one. */
export const branches = [...new Set([HOME_BRANCH, OTHER_BRANCH, ...navUnits])]
export const timeBanks: TimeBank[] = ['Overtime', 'Comp Time', 'Holiday']
/** Hours each bank can still take this period (mock) */
export const bankAvailable: Record<TimeBank, number> = { Overtime: 16, 'Comp Time': 40, Holiday: 8 }

/** Leave types: the leave codes, by name */
export const leaveOptions = shiftCodes.filter((code) => code.kind === 'leave').map((code) => ({ value: code.code, label: code.label }))

/** Shift codes for the code picker: the field shows the code, the list adds its name */
export const codeOptions = shiftCodes.map((code) => ({ value: code.code, label: code.code }))

/** Working shift codes (no leave, which has its own entry): the bulk panel's shift picker */
export const workingCodeOptions = codeOptions.filter((option) => shiftCodeMap[option.value].kind !== 'leave')

export const employeeOptions = watches.map((watch) => ({
  group: `${watch.title} watch`,
  items: watch.members.map((member) => ({ value: member.id, label: shortName(member) })),
}))

export const activityOf = (code: string) => {
  if (code.startsWith('Pat') || code === 'ExP') return 'Patrol'
  if (code.startsWith('C-') || code === 'Court') return 'Court'
  if (code === 'Train') return 'Training'
  if (code === 'Spe') return 'Special detail'
  if (shiftCodeMap[code]?.kind === 'leave') return 'Leave'
  return 'Office duty'
}

export const locationOf = (activity: string, seed: string) => {
  if (activity === 'Court') return 'Kings County Court'
  if (activity === 'Training') return 'Training center'
  if (activity === 'Office duty') return 'Station house'
  if (activity === 'Leave') return null
  return locations[[...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4]
}

/** A segment's fields: what was saved, or defaults from its code. `seed` picks a stable mock location. */
export function segmentDetails(segment: WorkforceSegment, unit: string, seed: string, location?: string): SegmentDetails {
  if (segment.details) return segment.details
  const activity = activityOf(segment.code)
  return {
    activity,
    location: location ?? locationOf(activity, seed),
    modifier: segment.overtime ? 'Overtime 1.5×' : 'None',
    bank: null,
    customer: customers[0],
    unit,
    acting: segment.code === 'Act Sup' ? 'Sergeant' : 'None',
    actual: null,
  }
}
