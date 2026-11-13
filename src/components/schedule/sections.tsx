import { Text } from '@mantine/core'
import { formatHour, type ScheduleGroup, type ScheduleSection } from './data'
import { fullName, personForChip, type Post, type ScheduleLocation } from './locations'
import LocationPath from './LocationPath'
import classes from './Schedule.module.css'

/** Team View: one row per member. Extra cells on a day go to an overflow line. */
export function teamSections(groups: ScheduleGroup[]): ScheduleSection[] {
  return groups.map((group) => ({
    id: group.id,
    title: group.title,
    name: group.title,
    coverage: group.coverage,
    rows: group.members.map((member) => {
      const shared = group.members.filter((other) => other.name === member.name).length > 1
      return {
        id: member.id,
        name: shared ? `${member.name} (${member.initials})` : member.name,
        label: (
          <>
            <span className={classes.initials} aria-hidden="true">{member.initials}</span>
            <span className={classes.who}>
              <Text component="span" size="md" lh={1.25} truncate>{member.name}</Text>
              <Text component="span" size="sm" c="dimmed" lh={1.25} truncate>{member.rank}</Text>
            </span>
          </>
        ),
        chips: member.chips,
        extraLines: 'overflow' as const,
      }
    }),
  }))
}

export const postTime = (post: Pick<Post, 'start' | 'end'>) => `${formatHour(post.start)}-${formatHour(post.end)}`

/** Location View: one row per post, one line per position. Cells show who is on the post. */
export function locationSections(locations: ScheduleLocation[]): ScheduleSection[] {
  return locations.map((location) => ({
    id: location.id,
    title: <LocationPath path={location.path} />,
    name: location.path.join(', '),
    coverage: location.coverage,
    rows: location.posts.map((post) => ({
      id: post.id,
      name: `${post.name} · ${postTime(post)}`,
      label: (
        <span className={classes.postName}>
          <Text component="span" size="md" lh={1.25} truncate>{post.name}</Text>
          <span className={classes.postTime}>{postTime(post)}</span>
        </span>
      ),
      chips: post.assignments,
      lines: post.positions,
      extraLines: 'position' as const,
    })),
  }))
}

/**
 * Location View on a single day (mobile day view): one row per person on duty at the location,
 * with all their posts there on the timeline. Locations with nobody on duty keep their header.
 */
export function locationPeopleSections(locations: ScheduleLocation[], day: number): ScheduleSection[] {
  return locations.map((location) => {
    const byPerson = new Map<string, { name: string; chips: NonNullable<ReturnType<Post['assignments']>[number]>[] }>()
    for (const post of location.posts) {
      for (const chip of post.assignments(day)) {
        const person = chip && personForChip(chip)
        if (!chip || !person) continue
        const entry = byPerson.get(person.id) ?? { name: fullName(person), chips: [] }
        entry.chips.push(chip)
        byPerson.set(person.id, entry)
      }
    }
    return {
      id: location.id,
      title: <LocationPath path={location.path} />,
      name: location.path.join(', '),
      coverage: location.coverage,
      rows: [...byPerson.entries()].map(([id, entry]) => ({ id, name: entry.name, chips: (d: number) => (d === day ? entry.chips : []) })),
    }
  })
}
