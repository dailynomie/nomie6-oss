<svelte:options runes={true} />

<script lang="ts">
  import { Template } from './templates-utils.ts'
  import { openTemplateEditor, TemplateStore } from './templates-svelte-helpers'
  import BackdropModal from '../../components/backdrop/backdrop-modal.svelte'
  import Button from '../../components/button/button.svelte'
  import Title from '../../components/title/title.svelte'
  import ToolbarGrid from '../../components/toolbar/toolbar-grid.svelte'
  import { closeModal } from '../../components/backdrop/BackdropStore2'
  import TemplateEditor from './template-editor.svelte'

  import { showToast } from '../../components/toast/ToastStore'
  import { Lang } from '../../store/lang'

  const close = () => {
    closeModal(id)
  }

  const save = async () => {
    await TemplateStore.upsert(template)
    await TemplateStore.init()
    showToast({ message: Lang.t('templates.template-saved', 'Template saved') })
    close()
  }

  const remove = async () => {
    await TemplateStore.remove(template)
    showToast({ message: Lang.t('templates.template-removed', 'Template removed') })
  }

  let { id, template = $bindable() } = $props()

  let templateVersion = $state(0)

  let isValidName = $derived.by(() => {
    // Access version to track changes
    templateVersion
    return template.name && template.name.trim().length > 0
  })
</script>

<BackdropModal className="h-full" mainClass="bg-ios-bg">
  <ToolbarGrid slot="header">
    <Button slot="left" primary clear on:click={() => close()}>{Lang.t('templates.cancel', 'Cancel')}</Button>
    <Title>{template.name || 'Create a Template'}</Title>
    <Button slot="right" primary clear on:click={() => save()} disabled={!isValidName}
      >{Lang.t('templates.save', 'Save')}</Button
    >
  </ToolbarGrid>
  <main class="lg:p-6 p-4">
    <TemplateEditor bind:template onNameChange={() => templateVersion++} />
  </main>
</BackdropModal>
