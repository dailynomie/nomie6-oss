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
})
