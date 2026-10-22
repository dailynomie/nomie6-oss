<svelte:options runes={true} />

<script lang="ts">
  import { onMount } from 'svelte'

  import ToolbarGrid from '../../components/toolbar/toolbar-grid.svelte'

  import Layout from '../../domains/layout/layout.svelte'

  import BaseLang from '../../lang/base'

  import download from '../../modules/download/download'
  import { SideStore } from '../../domains/storage/side-storage'

  import { Device } from '../../store/device-store'
  import { Interact } from '../../store/interact'

  import defaultsDeep from 'lodash/defaultsDeep'
  import BackButton from '../../components/back-button/back-button.svelte'
  import { Lang } from '../../store/lang'
  import { showToast } from '../../components/toast/ToastStore'

  const sideStore = new SideStore('language-editor')

  let baseLang = BaseLang
  let activeLang = { ...BaseLang }

  async function save() {
    sideStore.put('active-lang', activeLang)
    showToast({ message: Lang.t('routes.saved', 'Saved') })
  }

  async function reset() {
    const confirmed = await Interact.confirm(Lang.t('language.clear-and-start-over', { name: activeLang.name }))
    if (confirmed) {
      activeLang = { ...BaseLang }
      Device.scrollToTop()
    }
  }

  async function main() {
    let working = sideStore.get('active-lang')
    if (working) {
      activeLang.name = working.name || activeLang.name
      activeLang.author = working.author || activeLang.author
      activeLang.translation = defaultsDeep(working.translation || {}, activeLang.translation)
    }
  }

  async function send() {
    showToast({ message: Lang.t('routes.downloading', 'Downloading...') })
    await download.json(`${activeLang.name}.lang.json`, activeLang)
    let confirmed = await Interact.confirm(
      'Compose Email to Brandon',
      `Shall I open an email to Brandon so you can send the file?`
    )
    if (confirmed) {
      window.open(`mailto:support@happydata.org?subject=New Language File&body=Attach downloaded file`, '_system')
    }
  }

  onMount(main)
</script>

<!-- iOS look: nav bar with back and Save, grouped cards with a section header each, 44 px fields -->
<Layout showTabs={false} checkIn={false}>
  <div slot="header">
    <ToolbarGrid>
      <div slot="left">
        <BackButton to="/settings" />
      </div>
      <div slot="right">
        <button type="button" class="ios-text-action" on:click={save}>{Lang.t('routes.save', 'Save')}</button>
      </div>
    </ToolbarGrid>
  </div>
  <main class="p-4 space-y-5 text-ios-label">
    <h1 class="text-ios-large font-bold text-ios-label px-1 -mb-3">
      {Lang.t('routes.nomie-language', 'Nomie Language')}
    </h1>
    <p class="px-1 text-ios-subhead text-ios-label2">
      {Lang.t(
        'routes.want-to-help-translate-nomie-fill-in-the-fields-',
        'Want to help translate Nomie? Fill in the fields below. Save keeps your progress on this device. When you are finished, send the file.'
      )}
    </p>

    {#if activeLang}
      <section>
        <h2 class="ios-section-title">{Lang.t('routes.language-details', 'Language details')}</h2>
        <div class="ios-card">
          <label class="ios-field-row">
            <span class="ios-field-label">{Lang.t('routes.language-name', 'Language name')}</span>
            <input
              class="ios-field"
              placeholder={Lang.t('routes.language-name', 'Language name')}
              bind:value={activeLang.name}
            />
          </label>
          <label class="ios-field-row">
            <span class="ios-field-label">{Lang.t('routes.author-2', 'Author')}</span>
            <input class="ios-field" placeholder={Lang.t('routes.author-2', 'Author')} bind:value={activeLang.author} />
          </label>
        </div>
      </section>

      {#each Object.keys(baseLang.translation) as parentId}
        <section>
          <h2 class="ios-section-title">{parentId}</h2>
          <div class="ios-card">
            {#each Object.keys(baseLang.translation[parentId]) as key}
              <label class="ios-field-row">
                <span class="ios-field-label">{key}</span>
                <span class="ios-field-hint">{baseLang.translation[parentId][key]}</span>
                {#if (baseLang.translation[parentId][key] || '').length > 20}
                  <textarea class="ios-field" rows="3" bind:value={activeLang.translation[parentId][key]}></textarea>
                {:else}
                  <input class="ios-field" bind:value={activeLang.translation[parentId][key]} />
                {/if}
              </label>
            {/each}
          </div>
        </section>
      {/each}
    {/if}

    <div class="ios-card overflow-hidden">
      <button type="button" class="ios-action font-semibold text-ios-tint" on:click={send}
        >{Lang.t('routes.send-to-brandon', 'Send to Brandon')}</button
      >
      <button type="button" class="ios-action text-ios-danger" on:click={reset}
        >{Lang.t('routes.reset-language', 'Reset language')}</button
      >
    </div>
  </main>

  <div slot="footer" />
</Layout>

<style>
  .ios-section-title {
    font-size: 13px;
    line-height: 18px;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: var(--ios-label2);
    padding: 0 16px 6px;
  }
  .ios-field-row {
    display: block;
    padding: 10px 16px;
    border-top: 0.5px solid var(--ios-separator);
  }
  .ios-field-row:first-child {
    border-top: 0;
  }
  .ios-field-label {
    display: block;
    font-size: 13px;
    line-height: 18px;
    color: var(--ios-label2);
  }
  .ios-field-hint {
    display: block;
    font-size: 13px;
    line-height: 18px;
    color: var(--ios-label2);
    font-style: italic;
  }
  .ios-field {
    display: block;
    width: 100%;
    margin-top: 4px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--ios-label);
    font-size: 17px;
    line-height: 22px;
    outline: none;
    resize: vertical;
  }
  .ios-action {
    display: block;
    width: 100%;
    min-height: 48px;
    padding: 12px 16px;
    text-align: center;
    font-size: 17px;
    line-height: 22px;
    border-top: 0.5px solid var(--ios-separator);
  }
  .ios-action:first-child {
    border-top: 0;
  }
  .ios-text-action {
    color: var(--ios-tint);
    font-size: 17px;
    line-height: 22px;
    padding: 8px 4px;
  }
</style>
