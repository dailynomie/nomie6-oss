// I2: a suggested note from plain words. Nothing is saved here; the user confirms the suggestion first.
// The words are matched against the user's own trackers and people. Unknown words stay as they are.

export type KnownName = { tag: string; label: string }
export type Known = { trackers: Array<KnownName>; people: Array<KnownName> }
export type Recognised = { tag: string; value?: number }
export type Suggestion = { text: string; recognised: Array<Recognised> }

const NUMBER_WORDS: { [word: string]: number } = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
}

const bare = (word: string): string => word.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')
const trailing = (word: string): string => (word.match(/[^a-zA-Z0-9]*$/) || [''])[0]

/** A word that is the tracker's tag or label, or its plural or past form: coffee, coffees, walk, walked. */
const matchesName = (word: string, name: KnownName): boolean => {
  const label = name.label.toLowerCase()
  const tag = name.tag.toLowerCase()
  return word === tag || word === label || word === `${label}s` || word === `${label}ed` || word === `${label}d`
}

export const suggestNote = (text: string, known: Known): Suggestion => {
  const tokens = text.trim().split(/\s+/).filter(Boolean)
  const out: Array<string> = []
  const recognised: Array<Recognised> = []

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    const word = bare(token)
    // a tag the user already wrote stays as it is
    if (/^[#@]/.test(token) || !word) {
      out.push(token)
      continue
    }

    // "with Em" becomes @em when Em is a person
    const nextWord = tokens[i + 1] ? bare(tokens[i + 1]) : ''
    if (word === 'with' && nextWord) {
      const person = known.people.find((p) => p.tag.toLowerCase() === nextWord || p.label.toLowerCase() === nextWord)
      if (person) {
        out.push(`@${person.tag}${trailing(tokens[i + 1])}`)
        recognised.push({ tag: `@${person.tag}` })
        i++
        continue
      }
    }

    const tracker = known.trackers.find((t) => matchesName(word, t))
    if (tracker) {
      // a number word before the name ("two coffees") or a digit after it ("coffee 2") is the value
      let value: number | undefined
      const before = out.length ? bare(out[out.length - 1]) : ''
      if (before in NUMBER_WORDS) {
        value = NUMBER_WORDS[before]
        out.pop()
      } else if (nextWord && /^\d+$/.test(nextWord)) {
        value = parseInt(nextWord, 10)
        i++
      }
      const suffix = trailing(token)
      out.push(`#${tracker.tag}${value !== undefined ? `(${value})` : ''}${suffix}`)
      recognised.push({ tag: `#${tracker.tag}`, value })
      continue
    }

    out.push(token)
  }

  return { text: out.join(' '), recognised }
}
