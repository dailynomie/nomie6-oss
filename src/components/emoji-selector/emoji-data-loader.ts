// The emoji list is about 18 kB gzipped, so it loads when an emoji picker opens, and only once.
let emojiData: Promise<Array<any>> | undefined

export const loadEmojiData = (): Promise<Array<any>> => {
  if (!emojiData) {
    emojiData = import('./data/emoji-light').then((mod) => mod.default)
  }
  return emojiData
}
