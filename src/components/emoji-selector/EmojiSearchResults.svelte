<svelte:options runes={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import EmojiList from './EmojiList.svelte'
  import { loadEmojiData } from './emoji-data-loader'

  import Empty from '../empty/empty.svelte'
  import { Lang } from '../../store/lang'

  const dispatch = createEventDispatcher()
  const { searchText } = $props()

  let emojiData = $state<Array<any>>([])
  loadEmojiData().then((data) => (emojiData = data))

  let searchResults = $derived(emojiData.filter((emoji) => emoji.n.indexOf((searchText || '').toLowerCase()) >= 0))
</script>

<div class="">
  {#if searchResults.length}
    <EmojiList emojis={searchResults} withTabs={false} on:emojihover on:emojiclick />
  {:else}
    <Empty title={Lang.t('ui.no-emojis-found', 'No emojis found')} emoji="😭" />
  {/if}
</div>

<style lang="postcss" global>
  .svelte-emoji-picker__search-results {
    padding: 0.25em;
    height: 15rem;
  }

  .svelte-emoji-picker__search-results h3 {
    margin: 0;
    font-size: 0.9em;
    margin: 0 auto;
    color: var(--ios-label2);
  }

  .svelte-emoji-picker__no-results {
    height: 15rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .svelte-emoji-picker__no-results .icon {
    margin: 0 auto;
    font-size: 3em;
    color: var(--ios-label2);
  }
</style>
