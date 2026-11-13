/** Parses #rgb, #rrggbb or #rrggbbaa into channels 0–255 and alpha 0–1. */
export function parseHex(hex: string) {
  let value = hex.replace('#', '').trim()
  if (value.length === 3) value = value.split('').map((char) => char + char).join('')
  if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value)) return null
  const channel = (start: number) => parseInt(value.slice(start, start + 2), 16)
  return { r: channel(0), g: channel(2), b: channel(4), a: value.length === 8 ? channel(6) / 255 : 1 }
}

/** Flattens a translucent color over an opaque background. */
export function composite(foreground: string, background: string) {
  const fg = parseHex(foreground)
  const bg = parseHex(background)
  if (!fg || !bg) return foreground
  const mix = (a: number, b: number) => Math.round(a * fg.a + b * (1 - fg.a))
  const hex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${hex(mix(fg.r, bg.r))}${hex(mix(fg.g, bg.g))}${hex(mix(fg.b, bg.b))}`
}

function luminance(hex: string) {
  const rgb = parseHex(hex)
  if (!rgb) return 0
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return r * 0.2126 + g * 0.7152 + b * 0.0722
}

/** WCAG 2.x contrast ratio. Translucent foregrounds are composited over the background first. */
export function contrastRatio(foreground: string, background: string) {
  const values = [luminance(composite(foreground, background)), luminance(background)].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

export const isHexColor = (value: string) => parseHex(value) !== null
