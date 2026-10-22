const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Remove one tag, with an optional value such as #walk(3), from a note, as a whole word. No other imports: it is unit tested. */
export const removeTagFromNote = (note: string, key: string): string => {
  const pattern = new RegExp(`(^|\\s)${escapeRegExp(key)}(\\([^)]*\\))?(?=\\s|$|[.,!?;:])`, 'g')
  return note
    .replace(pattern, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ +\n/g, '\n')
    .trim()
}
