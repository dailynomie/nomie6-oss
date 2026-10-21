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
