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

// Past forms that do not end in -ed: "slept" for sleep, "ran" for run
const IRREGULAR: { [label: string]: Array<string> } = {
  sleep: ['slept'],
  run: ['ran'],
  eat: ['ate', 'eaten'],
  drink: ['drank'],
  feel: ['felt'],
  go: ['went'],
  swim: ['swam'],
}

/** The words a tracker can be named by: its label (one or more words), its tag, and the plural or past forms. */
const namesOf = (name: KnownName): Array<Array<string>> => {
  const words = name.label.toLowerCase().split(/\s+/).filter(Boolean)
  const last = words[words.length - 1] || ''
  const head = words.slice(0, -1)
  const forms: Array<Array<string>> = [words, [...head, `${last}s`], [...head, `${last}ed`], [...head, `${last}d`]]
  ;(IRREGULAR[last] || []).forEach((past) => forms.push([...head, past]))
  forms.push([name.tag.toLowerCase()])
  return forms
}

/** How many words, from position i, name this tracker (0 when they do not). */
const consumedBy = (words: Array<string>, i: number, name: KnownName): number => {
  for (const form of namesOf(name)) {
    if (form.length && words.slice(i, i + form.length).every((w, k) => w === form[k])) return form.length
  }
  return 0
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

    // the longest name first, so "deep work" is taken before a tracker called "deep"
    const normalised = tokens.map(bare)
    const candidates = [...known.trackers].sort((a, b) => b.label.split(/\s+/).length - a.label.split(/\s+/).length)
    let tracker: KnownName | undefined
    let names = 0
    for (const candidate of candidates) {
      names = consumedBy(normalised, i, candidate)
      if (names) {
        tracker = candidate
        break
      }
    }
    if (tracker) {
      i += names - 1
      const nextWord = tokens[i + 1] ? bare(tokens[i + 1]) : ''
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
      const suffix = trailing(tokens[i])
      out.push(`#${tracker.tag}${value !== undefined ? `(${value})` : ''}${suffix}`)
      recognised.push({ tag: `#${tracker.tag}`, value })
      continue
    }

    out.push(token)
  }

  return { text: out.join(' '), recognised }
}
