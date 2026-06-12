<svelte:options runes={true} />

<script lang="ts">
  import BackdropModal from '../../components/backdrop/backdrop-modal.svelte'
  import { closeModal } from '../../components/backdrop/BackdropStore2'
  import AIChat from './ai-chat.svelte'
  import Button from '../../components/button/button.svelte'

  interface Props {
    id: string
  }

  const { id } = $props<Props>()

  function closeChat() {
    closeModal(id)
  }
</script>

<BackdropModal
  className="modal-fullscreen"
  headerClass="n-toolbar-grid"
  mainClass="flex flex-col"
>
  <div slot="header" class="n-toolbar-grid">
    <div class="left">
      <Button
        clear
        primary
        on:click={closeChat}
      >
        Close
      </Button>
    </div>
    <div class="main title">💬 AI Chat</div>
    <div class="right" />
  </div>

  <div class="flex-1 flex flex-col overflow-hidden">
    <AIChat />
  </div>
</BackdropModal>
