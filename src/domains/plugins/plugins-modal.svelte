<svelte:options runes={true} />

<script lang="ts">
  import { onMount } from 'svelte'
  import Avatar from '../../components/avatar/avatar.svelte'

  import BackdropModal from '../../components/backdrop/backdrop-modal.svelte'
  import ButtonGroup from '../../components/button-group/button-group.svelte'
  import Button from '../../components/button/button.svelte'
  import Empty from '../../components/empty/empty.svelte'
  import IonIcon from '../../components/icon/ion-icon.svelte'
  import ListItem from '../../components/list-item/list-item.svelte'
  import List from '../../components/list/list.svelte'
  import Title from '../../components/title/title.svelte'
  import { showToast } from '../../components/toast/ToastStore'
  import ToggleSwitch from '../../components/toggle-switch/toggle-switch.svelte'
  import ToolbarGrid from '../../components/toolbar/toolbar-grid.svelte'
  import Toolbar from '../../components/toolbar/toolbar.svelte'
  import PlusIcon from '../../n-icons/PlusIcon.svelte'
  import TrashOutline from '../../n-icons/TrashOutline.svelte'
  import { Interact } from '../../store/interact'
  import { Lang } from '../../store/lang'
  import { showNomieConnectPopup } from '../settings/settings-helpers'
  import type { PluginClass } from './plugin-helpers'
  import PluginInstaller from './plugin-installer.svelte'
  import { closePluginsModal, openPluginInstaller, PluginStore } from './PluginStore'

  import Badge from '../../components/badge/badge.svelte'

  let officialPlugins = $state([])
  onMount(async () => {
    officialPlugins = []
  })

  let editMode = $state(false)
  let hasLocked = $state(false)

  const toggleEditMode = () => {
    editMode = !editMode
  }

  const togglePlugin = (plugin: PluginClass) => {
    plugin.active = !plugin.active
    PluginStore.upsert(plugin)
  }

  const deletePlugin = async (plugin: PluginClass) => {
    if (plugin.buildin) {
      Interact.error(Lang.t('plugins.this-plugin-cannot-be-removed', 'This plugin cannot be removed'))
      return
    }
    const confirmed = await Interact.confirm(Lang.t('plugins.uninstall-question', { name: plugin.name }))
    if (confirmed) {
      try {
        await PluginStore.remove(plugin)
        showToast({ message: Lang.t('plugins.removed', 'Removed') })
      } catch (e) {
        Interact.error(e.message)
      }
    }
  }

  const getDomain = (_url: string) => {
    if (_url) {
      let url = new URL(_url)
      if (url.origin) return url.origin
    }
    return ''
  }

  let pluginUrl = $state<undefined | string>(undefined)
  const installPlugin = (url?: string) => {
    // pluginUrl = url
    openPluginInstaller(url)
  }

  let tab = $state('installed')
  let showAdd = $state(false)
</script>

<BackdropModal>
  <header slot="header">
    <ToolbarGrid>
      <div slot="left">
        {#if !hasLocked}
          <Button on:click={() => installPlugin()} icon clear primary>
            <IonIcon icon={PlusIcon} />
          </Button>
        {/if}
      </div>
      <h1 class="ntitle text-sm md:text-base">{Lang.t('general.plugins', 'Plugins')}</h1>
      <Button slot="right" on:click={closePluginsModal} clear primary>{Lang.t('general.done', 'Done')}</Button>
    </ToolbarGrid>
    <!-- <Toolbar>
      <ButtonGroup
        buttons={[
          {
            label: Lang.t('plugins.installed', 'Installed'),
            active: tab == 'installed',
            click() {
              tab = 'installed'
            },
          },
          {
            label: Lang.t('plugins.available', 'Available'),
            active: tab == 'avail',
            click() {
              tab = 'avail'
            },
          },
        ]}
      />
    </Toolbar> -->
  </header>
  <section class="px-2 lg:px-4 py-4">
    {#if showAdd}
      <PluginInstaller
        bind:url={pluginUrl}
        on:cancel={() => {
          showAdd = false
        }}
      />
    {/if}
    {#if tab == 'installed'}
      <List solo outside title={$PluginStore.length > 0 ? Lang.t('plugins.my-plugins', 'Installed Plugins') : ''}>
        <div slot="header-right">
          {#if $PluginStore.length}
            <Button shape="round" size="sm" on:click={toggleEditMode}>
              {#if editMode}
                <span class="text-ios-tint font-bold">{Lang.t('plugins.done', 'Done')}</span>
              {:else}
                <span class="text-primary">{Lang.t('plugins.edit', 'Edit')}</span>
              {/if}
            </Button>
          {/if}
        </div>
        {#each $PluginStore as plugin}
          <ListItem bottomLine={15} disabled={plugin.locked}>
            <div class="flex space-x-2 items-center">
              <Avatar size={20} emoji={plugin.emoji} />
              <Title className="flex items-center space-x-1 text-ios-body font-semibold" style="text-align:left">
                <span>{plugin.name}</span>
                <div class="faded-badge">
                  {plugin.version}
                </div>
              </Title>
            </div>
            <div class="description line-clamp-3">
              <div class="line-clamp-3">
                {plugin.description}
              </div>
              <div class="text-ios-label2 text-xs line-clamp-1">{getDomain(plugin.url)}</div>
            </div>
            <div class="description opacity-40 line-clamp-1" />

            <div slot="right" class="flex items-center space-x-2">
              {#if !plugin.locked}
                <ToggleSwitch
                  on:change={() => togglePlugin(plugin)}
                  title={Lang.t('plugins.status-title', { name: plugin.name })}
                  value={plugin.active}
                />
              {/if}
              {#if editMode && !plugin.buildin}
                <Button on:click={() => deletePlugin(plugin)} icon
                  ><IonIcon className="text-ios-danger" icon={TrashOutline} /></Button
                >
              {/if}
            </div>
          </ListItem>
        {/each}

        {#if hasLocked}
          <ListItem
            on:click={showNomieConnectPopup}
            clickable
            titleClass="text-primary"
            title={Lang.t('plugins.upgrade', 'Upgrade')}
            description={Lang.t('plugins.plugin-limit-reached', 'Plugin limit reached.')}
          />
        {/if}
      </List>

      {#if $PluginStore.length === 0}
        <div class="h-4 stiff w-full min-h-4" />
        <List solo>
          <Empty emoji="🔌" title={Lang.t('plugins.no-plugins-installed', 'No Plugins Installed')}>
            <p class="text-xs text-center text-ios-label2 leading-snug">
              {Lang.t(
                'plugins.plugins-allow-others-to-create-entirely-new-ways',
                'Plugins allow others to create entirely new ways of tracking and monitoring your data within Nomie.'
              )}
              <strong
                >{Lang.t(
                  'plugins.warning-this-feature-is-under-heavy-development',
                  'WARNING: This feature is under heavy development.'
                )}</strong
              >
            </p>
          </Empty>
          <ListItem
            clickable
            on:click={() => {
              openPluginInstaller()
            }}
            titleClass="text-center text-primary"
            title={Lang.t('plugins.add-a-custom-plugin', 'Add a Custom Plugin')}
          />
        </List>
      {/if}

      <!-- Installable Plugins   -->
    {:else if tab == 'avail'}
      <List solo outside title={Lang.t('plugins.official-plugins', 'Official Plugins')}>
        {#each officialPlugins as plugin}
          <ListItem
            disabled={$PluginStore.find((p) => p.url == plugin.url)}
            bottomLine={72}
            detail
            on:click={() => {
              if (!$PluginStore.find((p) => p.url == plugin.url)) {
                installPlugin(plugin.url)
              }
            }}
          >
            <Avatar size={50} emoji={plugin.emoji} slot="left" />
            <Title className="text-ios-body font-semibold" style="text-align:left">{plugin.name}</Title>
            <div class="description">
              {#if $PluginStore.find((p) => p.url == plugin.url)}
                <Badge pad className="bg-ios-good text-ios-ontint">{Lang.t('plugins.installed', 'Installed')}</Badge>
              {/if}
              {plugin.description}
            </div>
            <div class="lineclamp-1 text-xs text-ios-label2">{new URL(plugin.url).origin}</div>
          </ListItem>
        {/each}
      </List>
    {/if}

    <div class="pt-10 px-4 text-center text-ios-label2 text-sm">
      {Lang.t('plugins.want-to-create-a-plugin', 'Want to create a Plugin?')} <br />
      <a class="text-primary underline" href="https://github.com/open-nomie/plugins" target="_blank" rel="nofollow"
        >{Lang.t('plugins.read-the-plugin-docs', 'Read the Plugin Docs →')}</a
      >
    </div>
  </section>
</BackdropModal>
