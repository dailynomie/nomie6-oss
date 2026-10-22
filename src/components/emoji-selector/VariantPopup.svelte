<svelte:options runes={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import IonIcon from '../icon/ion-icon.svelte'
  import { CloseOutline } from '../icon/nicons'
  import Emoji from './Emoji.svelte'
  import { Lang } from '../../store/lang'

  const dispatch = createEventDispatcher()

  function onClickClose() {
    dispatch('close')
  }

  const { variants } = $props()
</script>

<div class="svelte-emoji-picker__variants-container frosted">
  <div class="svelte-emoji-picker__variants">
    {#each Object.keys(variants) as variant}
      <Emoji emoji={variants[variant]} on:emojiclick />
    {/each}
    <button type="button" class="close-button" aria-label={Lang.t('ui.close-popup', 'Close')} on:click={onClickClose}>
      <IonIcon icon={CloseOutline} />
    </button>
  </div>
</div>

<style lang="postcss" global>
  .svelte-emoji-picker__variants-container {
    position: absolute;
    top: 0;
    left: 0;
    @apply w-full;
    @apply h-full;
    @apply flex;
    @apply flex-col;
    @apply justify-center;
    @apply bg-ios-black bg-opacity-25 backdrop-filter backdrop-blur-sm;
  }

  .svelte-emoji-picker__variants {
    @apply relative;
    @apply mx-4;
    @apply p-2;
    @apply text-2xl;
    @apply text-center;
    @apply rounded-lg;
    @apply bg-ios-card;
    @apply shadow-xl;
    @apply z-50;
  }

  .svelte-emoji-picker__variants button {
    @apply m-1;
  }

  .svelte-emoji-picker__variants .close-button {
    position: absolute;
    font-size: 1em;
    right: 20px;
    top: 10px;
    cursor: pointer;
  }
</style>
