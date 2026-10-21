// iOS look (contrast): black or white text, whichever reads better on a user colour (4.5:1 for text).
// Only hex colours are measured; anything else gets white text with the existing shadow.
export const readableTextOn = (color?: string): string => {
  const match = /^#?([0-9a-f]{6})$/i.exec(color || '')
  if (!match) return '#FFF'
  const n = parseInt(match[1], 16)
  const channel = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  const luminance = 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  return luminance > 0.179 ? '#000' : '#FFF'
}

// iOS look (common practice for user-chosen colours): text in a user colour keeps 4.5:1 on the surface.
// The colour is shifted toward black (light surface) or white (dark surface) only as far as needed; a colour
// that already passes is returned unchanged. Non-hex colours are returned as they are.
const toRgb = (hex: string): [number, number, number] | undefined => {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex || '')
  if (!match) return undefined
  const n = parseInt(match[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const luminanceOf = ([r, g, b]: [number, number, number]) => {
  const channel = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

const contrastOf = (a: [number, number, number], b: [number, number, number]) => {
  const la = luminanceOf(a)
  const lb = luminanceOf(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

const isDarkSurface = () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

export const accessibleTint = (color: string, surface?: string): string => {
  const rgb = toRgb(color)
  if (!rgb) return color
  const bg = toRgb(surface || (isDarkSurface() ? '#1C1C1E' : '#FFFFFF'))
  if (!bg) return color
  if (contrastOf(rgb, bg) >= 4.5) return color
  const target: [number, number, number] = luminanceOf(bg) > 0.179 ? [0, 0, 0] : [255, 255, 255]
  for (let step = 1; step <= 20; step++) {
    const t = step / 20
    const mixed = rgb.map((v, i) => Math.round(v + (target[i] - v) * t)) as [number, number, number]
    if (contrastOf(mixed, bg) >= 4.5) {
      return '#' + mixed.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()
    }
  }
  return luminanceOf(bg) > 0.179 ? '#000000' : '#FFFFFF'
}
