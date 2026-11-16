/**
 * Developer-facing content is hidden for now. Set to `true` to bring back the
 * "Using the components" / "Usage in code" sections and the Preview "Show code" toggles.
 */
export const SHOW_CODE = false

/** Set to `true` to bring back the "Figma reference" sections. */
export const SHOW_FIGMA = false

/** Section ids that only render (and appear in the TOC and search) when `SHOW_CODE` is on. */
export const CODE_SECTION_IDS = ['component', 'usage']

/** Section ids that only render (and appear in the TOC and search) when `SHOW_FIGMA` is on. */
export const FIGMA_SECTION_IDS = ['figma']

export const isHiddenSection = (id: string) =>
  (!SHOW_CODE && CODE_SECTION_IDS.includes(id)) || (!SHOW_FIGMA && FIGMA_SECTION_IDS.includes(id))
