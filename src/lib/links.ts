/** Hash-router friendly deep link to a section: `#/foundations/colors?section=brand` */
export const sectionPath = (path: string, sectionId: string) => `${path}?section=${encodeURIComponent(sectionId)}`

export const absoluteSectionUrl = (path: string, sectionId: string) =>
  `${window.location.origin}${window.location.pathname}#${sectionPath(path, sectionId)}`
