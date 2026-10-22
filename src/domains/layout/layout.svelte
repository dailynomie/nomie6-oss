<svelte:options runes={true} />

<script lang="ts">
  import AppTabs from '../../domains/layout/tabs.svelte'
  import { Lang } from '../../store/lang'
  import ExperimentCheckInCard from '../experiments/ExperimentCheckInCard.svelte'

  import './layout.css'
  import { onMount } from 'svelte'
  import { showFreshBackupPrompt } from '../backup/fresh-backup-prompt'
  import { startCollapseOnScroll } from './collapse-on-scroll'

  // iOS look (3.1): the row under the title collapses when the page scrolls down
  onMount(() => {
    startCollapseOnScroll()
    // once the stores have loaded their data
    setTimeout(showFreshBackupPrompt, 3000)
  })
  import { AppVersion } from '../../modules/app-version/app-version'
  import BackupMessage from '../../components/backup-message/backup-message.svelte'
  import nid from '../../modules/nid/nid'
  import { getElementPosition } from '../../modules/html-elements/position'
  import CaptureLog from '../capture-log/capture-log.svelte'
  import { Device } from '../../store/device-store'
  import DesktopSidebar from './desktop-sidebar.svelte'
  import { BackupDaysAgo, backupConfirmed, generateBackup } from '../backup/BackupStore'
  import { LaunchCount } from '../preferences/LaunchCount'
  import { hideMenuBlocker, MenuBlockerStore } from '../../components/menu/useDropmenu'
  import appConfig from '../../config/appConfig'

  const {
    style = '',
    className = '',
    pageTitle,
    showTabs = true,
    checkIn = true,
    headerClassNames = '',
    showCapture = true,
  } = $props<{
    style?: string
    className?: string
    pageTitle?: string
    showTabs?: boolean
    checkIn?: boolean
    headerClassNames?: string
    showCapture?: boolean
  }>()

  let mainEle: HTMLElement | undefined = $state(undefined)
  let mainEleHeight: string = $state('100%')

  let id = `layout-${nid()}`

  // Controll Scrolling

  let footerBuffer: HTMLElement | undefined = $state(undefined)
  let footerEle: HTMLElement | undefined = $state(undefined)

  let hasHeader = $derived(!!$$slots.header)
  let hasFooter = $derived(!!$$slots.footer)
  let hasContent = $derived(!!$$slots.content)
  let hasBottom = $derived(!!$$slots.bottom)

  $effect(() => {
    const footerPos = getElementPosition(footerEle)
    if (footerPos && footerBuffer) {
      footerBuffer.style.height = `${footerPos.eleHeight + 70}px`
    }
  })

  $effect(() => {
    if ($Device.height && mainEle) {
      const pos = getElementPosition(mainEle)
      mainEleHeight = `${pos.eleHeight}px`
    }
  })
</script>

<svelte:head>
  <title>{pageTitle ? Lang.t('layout.page-title', { title: pageTitle }) : `Daily Nomie`}</title>
</svelte:head>

<div
  {id}
  class="n-layout z-50 {className ? className : ''}
  {hasFooter ? 'has-footer' : ''}
  {hasHeader ? 'has-header' : ''}
  {showTabs ? 'has-tabs' : 'no-tabs'}"
  {style}
>
  <div class="layout-frame z-10">
    {#if $MenuBlockerStore}
      <div
        on:click={hideMenuBlocker}
        class="menu-blocker bg-transparent fixed w-screen h-screen top-0 left-0 r-0 bottom-0 z-20"
      />
    {/if}
    <section class="xl:ml-56 layout-section-wrap">
      {#if hasHeader}
        <header class=" non-printable z-50 sticky top-0 glass {headerClassNames}">
          <BackupMessage
            daysAgo={$BackupDaysAgo}
            launchCount={$LaunchCount}
            onGenerate={generateBackup}
            onConfirmed={backupConfirmed}
          />
          <slot name="header" />
        </header>
      {/if}
      <main id="nomie-main" bind:this={mainEle} class="layout-main z-20" style="--mainHeight:{mainEleHeight}">
        {#if hasContent}
          <slot name="content" />
        {:else}
          <slot />
        {/if}
      </main>
    </section>
    {#if $Device.width > 899}
      <div class="non-printable">
        <DesktopSidebar loggedIn={showTabs} />
      </div>
    {/if}
  </div>
  <!-- Today's experiment check-ins: main screens only (not pushed screens such as Awards or the file list), and not while a dialogue or modal is open -->
  {#if showTabs && checkIn}
    <ExperimentCheckInCard />
  {/if}

  {#if hasBottom}
    <main id="nomie-main-bottom" class="glass xl:ml-56 non-printable">
      <slot name="bottom" />
    </main>
  {/if}
  <!-- <div id="footer-buffer" class="sticky bottom-0" bind:this={footerBuffer} /> -->
  <footer
    bind:this={footerEle}
    class="non-printable xl:ml-56 sticky self-justify-start left-0 right-0 bottom-0 z-50 border-t border-ios-separator layout-footer glass dark:border-ios-separator"
  >
    <slot name="footer" />

    {#if showTabs}
      {#if showCapture}
        <CaptureLog slot="footer" />
      {/if}
      {#if $Device.width < 900}
        <AppTabs className="{$MenuBlockerStore ? 'pointer-events-none' : ''} " />
      {:else}
        <div class="p-4" />
      {/if}
    {/if}
  </footer>
</div>

<style>
  @media print {
    .non-printable {
      display: none;
    }
  }
</style>
