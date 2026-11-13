import { Fragment } from 'react'
import { ChevronRight } from 'lucide-react'
import classes from './Schedule.module.css'

/** Location breadcrumb for section headers: "Convention Centre › North › Entrances › A". The last level is brightest. */
export default function LocationPath({ path }: { path: string[] }) {
  return (
    <span className={classes.path}>
      {path.map((level, index) => (
        <Fragment key={index}>
          {index > 0 && <ChevronRight className={classes.pathSeparator} size={16} strokeWidth={2} aria-hidden="true" />}
          <span>{level}</span>
        </Fragment>
      ))}
    </span>
  )
}
