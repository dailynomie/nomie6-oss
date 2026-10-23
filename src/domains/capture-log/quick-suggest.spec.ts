import { describe, it, expect } from 'vitest'
import { suggestNote, type Known } from './quick-suggest'

const known: Known = {
  trackers: [
    { tag: 'coffee', label: 'Coffee' },
    { tag: 'walk', label: 'Walk' },
    { tag: 'sleep', label: 'Sleep' },
    { tag: 'deepwork', label: 'Deep work' },
  ],
  people: [{ tag: 'em', label: 'Em' }],
  contexts: [{ tag: 'work', label: 'Work' }],
  pointers: [{ tag: 'healthy', label: 'Healthy' }],
}

describe('suggestNote', () => {
  it('turns the words of a sentence into tags, with values and a person', () => {
    const result = suggestNote('slept badly, two coffees, walked with Em', known)
    expect(result.text).toBe('#sleep badly, #coffee(2), #walk @em')
    expect(result.recognised).toEqual([
      { tag: '#sleep', value: undefined },
      { tag: '#coffee', value: 2 },
      { tag: '#walk', value: undefined },
      { tag: '@em' },
    ])
  })

  it('reads a digit after the name as the value', () => {
    expect(suggestNote('coffee 3 with a friend', known).text).toBe('#coffee(3) with a friend')
  })

  it('keeps tags the user already wrote', () => {
    expect(suggestNote('#sleep 7 hours, walk', known).text).toBe('#sleep 7 hours, #walk')
  })

  it('leaves a name that is not a person as it is', () => {
    expect(suggestNote('walked with Sam', known).text).toBe('#walk with Sam')
  })

  it('changes nothing when no word matches a tracker', () => {
    const plain = 'badly and felt tired'
    expect(suggestNote(plain, known)).toEqual({ text: plain, recognised: [] })
  })

  it('keeps the punctuation after a word', () => {
    expect(suggestNote('two coffees.', known).text).toBe('#coffee(2).')
  })

  it('takes a name of more than one word', () => {
    expect(suggestNote('did deep work until noon', known).text).toBe('did #deepwork until noon')
  })

  it('knows the past form of an irregular name', () => {
    expect(suggestNote('slept badly, slept 7 hours', known).text).toBe('#sleep badly, #sleep(7) hours')
  })

  it('keeps the punctuation after a digit value', () => {
    expect(suggestNote('coffee 3, good', known).text).toBe('#coffee(3), good')
  })

  it('finds a person anywhere in the sentence, not only after "with"', () => {
    expect(suggestNote('Em came over, had a nice time', known).text).toBe('@em came over, had a nice time')
  })

  it('finds a context and a pointer with their prefix', () => {
    expect(suggestNote('long day at work, healthy lunch', known).text).toBe('long day at +work, ^healthy lunch')
  })

  it('does not change a word that only looks like a context', () => {
    expect(suggestNote('working late', known).text).toBe('working late')
  })

  it('offers a saved place named in the words, and keeps the words', () => {
    const withPlaces = { ...known, places: [{ name: 'Central Park', lat: 52.1, lng: 5.1 }] }
    const result = suggestNote('walked in central park today', withPlaces)
    expect(result.place).toEqual({ name: 'Central Park', lat: 52.1, lng: 5.1 })
    expect(result.text).toBe('#walk in central park today')
  })

  it('offers no place when no saved place is named', () => {
    const withPlaces = { ...known, places: [{ name: 'Gym', lat: 1, lng: 2 }] }
    expect(suggestNote('walked home', withPlaces).place).toBeUndefined()
  })
})
