<svelte:options runes={true} />

<script lang="ts">
  import { onMount } from 'svelte'
  import SvelteMarkdown from 'svelte-markdown'

  import Button from '../button/button.svelte'
  import Empty from '../empty/empty.svelte'
  import IonIcon from '../icon/ion-icon.svelte'
  import { CloseOutline } from '../icon/nicons'

  import Spinner from '../spinner/spinner.svelte'

  import type { MarkdownModalStoreProps } from './MarkdownModalStore'
  import { closeModal } from '../backdrop/BackdropStore2'
  import BackdropModal from '../backdrop/backdrop-modal.svelte'
  import ToolbarGrid from '../toolbar/toolbar-grid.svelte'
  import { composeEmail } from '../../utils/text/text'

  let loading = $state(true)
  let content = $state<string>(undefined)

  const getContent = async () => {
    loading = true
    const call = await fetch(props.path)
    const data = await call.text()
    content = data
    loading = false
  }

  onMount(() => {
    getContent()
  })

  const close = () => {
    closeModal(id)
  }

  const { id, props } = $props()
</script>

<BackdropModal className="min-h-75vh">
  <ToolbarGrid slot="header" className="bg-ios-card">
    <Button slot="left" clear primary icon on:click={close}>
      <IonIcon icon={CloseOutline} size={28} />
    </Button>
    <h2 class="text-ios-label text-sm line-clamp-1 font-bold text-center">{props.title}</h2>
    <Button
      slot="right"
      primary
      size="sm"
      clear
      on:click={() => {
        composeEmail(props.replyTo || 'support@happydata.org', `RE: ${props.title}`, '')
      }}
    >
      <span class="text-sm">Reply</span>
    </Button>
  </ToolbarGrid>

  <div class="min-h-full pt-4 pb-6 bg-ios-card">
    {#if loading}
      <Empty>
        <Spinner size={32} />
      </Empty>
    {/if}
    <div class="prose sm px-4 text-ios-label max-w-screen-lg mx-auto">
      <SvelteMarkdown source={content} />
    </div>
  </div>
</BackdropModal>

<style lang="postcss" global>
  .prose {
  }
  .prose h1 {
    @apply text-2xl;
  }
  .prose h1,
  .prose h2,
  .prose h3,
  .prose h4,
  .prose h5 {
    @apply leading-tight;
    @apply font-bold;
    @apply text-ios-label;
  }
  .prose code {
    @apply text-ios-label font-mono;
    @apply bg-ios-fill;
  }
  .prose p {
    @apply text-ios-label;
  }
  .prose strong {
    @apply text-ios-label font-bold;
  }
  .prose img {
    @apply shadow-2xl;
    @apply rounded-lg;
    @apply ring-2 ring-gray-400 ring-opacity-20;
  }
</style>
