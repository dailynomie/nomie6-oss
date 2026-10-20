/**
 * iOS look (section 3.1, optional): when the page scrolls down, the row under the large title collapses,
 * and it comes back when the page is near the top again. This only toggles a class on <html>.
 * The thresholds have a gap, so the row does not flicker around one scroll position.
 */
const COLLAPSE_AFTER = 48
const EXPAND_BELOW = 8

export const startCollapseOnScroll = (): (() => void) => {
  if (typeof window === 'undefined') return () => {}
  const root = document.documentElement
  const update = () => {
    const y = window.scrollY
    if (!root.classList.contains('page-scrolled') && y > COLLAPSE_AFTER) {
      root.classList.add('page-scrolled')
    } else if (root.classList.contains('page-scrolled') && y < EXPAND_BELOW) {
      root.classList.remove('page-scrolled')
    }
  }
  window.addEventListener('scroll', update, { passive: true })
  update()
  return () => {
    window.removeEventListener('scroll', update)
    root.classList.remove('page-scrolled')
  }
}
