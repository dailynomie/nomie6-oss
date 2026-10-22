<svelte:options runes={true} />

<script lang="ts">
  import IosRange from '../../../../components/ios-range/ios-range.svelte'
  import { untrack } from 'svelte'
  import ButtonGroup from '../../../../components/button-group/button-group.svelte'
  import Button from '../../../../components/button/button.svelte'
  import TinyColorPicker from '../../../../components/color-picker/tiny-color-picker.svelte'
  import Divider from '../../../../components/divider/divider.svelte'
  import IonIcon from '../../../../components/icon/ion-icon.svelte'
  import { AddIcon } from '../../../../components/icon/nicons'
  import Input from '../../../../components/input/input.svelte'
  import ListItem from '../../../../components/list-item/list-item.svelte'
  import List from '../../../../components/list/list.svelte'

  import ToggleSwitch from '../../../../components/toggle-switch/toggle-switch.svelte'
  import ToolbarGrid from '../../../../components/toolbar/toolbar-grid.svelte'
  import { objectHash } from '../../../../modules/object-hash/object-hash'
  import { tokenToTrackable } from '../../../../modules/tokenizer/tokenToTrackable'
  import { Interact } from '../../../../store/interact'
  import { Lang } from '../../../../store/lang'

  import TrackablePill from '../../../trackable/trackable-pill.svelte'
  import { TrackableStore } from '../../../trackable/TrackableStore'
  import { trackableToToken } from '../../../trackable/trackable-utils'
  import { upsertWidget } from '../../DashStore'
  import { WidgetClass } from '../widget-class'
  import { timeFrames } from '../widget-timeframe'
  import { getWidgetTypes, type IWidgetType } from '../widget-types'
  import { canSaveWidget } from '../widget-utils'
  // import { activeTypes } from '../widget-types'
  import type { WidgetEditorProps } from './useWidgetEditorModal'
  import WidgetTypeSelector from './widget-type-selector.svelte'
  import { selectTrackable } from '../../../trackable/trackable-selector/TrackableSelectorStore'
  import { isTruthy } from '../../../../utils/truthy/truthy'
  import { closeModal } from '../../../../components/backdrop/BackdropStore2'
  import BackdropModal from '../../../../components/backdrop/backdrop-modal.svelte'
  import CloseOutline from '../../../../n-icons/CloseOutline.svelte'
  import { PluginStore } from '../../../plugins/PluginStore'
  import { ExperimentStore } from '../../../experiments/ExperimentStore'
  import { readStorageFile } from '../../../storage/storage-files'
  import type { ITrackerType } from '../../../../modules/tracker/TrackerClass'

  let visible = $state(false)
  let editingWidget = $state<WidgetClass | undefined>(undefined)
  let processedWidgetId = $state<string | undefined>(undefined)

  const { props, id } = $props()

  let conditionalStyling = $state(false)
  let canSave = $state(false)

  $effect(() => {
    if (props.widget && props.widget.id !== processedWidgetId) {
      editingWidget = new WidgetClass(props.widget)
      visible = true
      processedWidgetId = props.widget.id
      if (isTruthy(editingWidget.compareValue)) {
        conditionalStyling = true
      }
    }
  })

  let widgetTypes = $state(getWidgetTypes($PluginStore))

  // Callback to handle widget type changes from child
  const handleWidgetTypeChange = (selectedType: IWidgetType) => {
    // Child already mutated widget, but we need to reassign to trigger Svelte 5 reactivity
    if (editingWidget) {
      // Preserve all existing properties and only update type and data
      // Keep conditional coloring settings (compareValue, compareOverColor, compareUnderColor)
      const newData = selectedType.data ? { ...selectedType.data } : editingWidget.data || {}

      // Create new object to trigger binding reactivity, preserving all other properties
      editingWidget = { ...editingWidget, type: selectedType.id, data: newData }

      // Initialize pointer data if this is a pointer widget
      if (selectedType.id === 'pointer' && !editingWidget.data?.pointersamples) {
        editingWidget.data = { ...editingWidget.data, pointersamples: 5 }
      }
    }
    // Force reactivity by incrementing a trigger
    updateTrigger = updateTrigger + 1
  }

  let updateTrigger = $state(0)

  // Compute activeType as derived value (no side effects)
  // Depends on updateTrigger to force re-evaluation when widget type changes
  let activeType = $derived.by(() => {
    const _ = updateTrigger // use trigger to create dependency
    return editingWidget?.type ? widgetTypes.find((wt) => wt.id === editingWidget.type) : undefined
  })

  // Separate effect for plugin side effect
  $effect(() => {
    // Depend on updateTrigger to re-run when widget type changes
    const _ = updateTrigger
    if (editingWidget?.type === 'plugin') {
      pluginGetWidgets(editingWidget?.data?.pluginId)
    }
  })

  // Separate effect for pointer data initialization (fallback)
  $effect(() => {
    if (editingWidget?.type === 'pointer' && (!editingWidget?.data || !editingWidget?.data?.pointersamples)) {
      editingWidget.data = { pointersamples: 5 }
    }
  })

  let lastWidgetHash = $state<string | undefined>(undefined)
  $effect(() => {
    // Explicitly depend on updateTrigger to re-run when widget type changes
    const _ = updateTrigger

    const currentHash = objectHash(editingWidget)
    const prevHash = untrack(() => lastWidgetHash)

    if (currentHash !== prevHash) {
      lastWidgetHash = currentHash
      try {
        canSave = canSaveWidget(editingWidget, widgetTypes)
      } catch (e) {
        console.error(e)
        canSave = false
      }
    }
  })

  let pluginWidgets = $state([])
  async function pluginGetWidgets(pluginId: String) {
    let path = `plugins/${pluginId}/prefs.json`
    let data: any = undefined
    try {
      data = (await readStorageFile(path)) || { widgets: [] }
      pluginWidgets = data.widgets || []
      if (pluginWidgets == undefined || !validateWidgetParams(pluginWidgets)) {
        pluginWidgets = []
      }
    } catch (e) {
      console.error(e)
      pluginWidgets = []
    }
  }

  function validateWidgetParams(widgets) {
    let valid = true
    let i = 0
    while (i < widgets.length) {
      if (
        !widgets[i].emoji ||
        !widgets[i].name ||
        !widgets[i].widgetid ||
        widgets[i].emoji == '' ||
        widgets[i].name == '' ||
        widgets[i].widgetid == ''
      ) {
        valid = false
      }
      i++
    }
    return valid
  }

  const close = async () => {
    closeModal(id)
  }

  const localSelectTrackables = async (multiple: boolean) => {
    let selected
    if (editingWidget.type == 'habit') {
      selected = await selectTrackable('tracker', 'habit')
    } else {
      selected = await selectTrackable()
    }
    let token = trackableToToken(selected)
    editingWidget.token = token
    // Force reactivity update
    updateTrigger = updateTrigger + 1
  }

  const localSelectPointer = async (multiple: boolean) => {
    let selected
    selected = await selectTrackable('pointer')
    let pointer = trackableToToken(selected)
    editingWidget.pointer = pointer
    // Force reactivity update
    updateTrigger = updateTrigger + 1
  }

  const saveWidget = async () => {
    try {
      if ([...activeType.requires, ...activeType.optional].indexOf('timeframe') === -1) {
        editingWidget.timeRange = undefined
      }

      const widget = new WidgetClass($state.snapshot(editingWidget))

      if (props.onSave) {
        props.onSave(widget)
        await upsertWidget(widget).catch((e) => {
          throw e
        })
      } else {
        await upsertWidget(widget).catch((e) => {
          throw e
        })
      }
      close()
    } catch (e) {
      console.error('Save error:', e)
      Interact.error(e)
    }
  }
</script>

<BackdropModal mainClass="bg-ios-bg" className="bg-ios-card h-full">
  <div slot="header" class="bg-ios-card w-full">
    <ToolbarGrid>
      <Button slot="left" clear primary on:click={close}>{Lang.t('general.cancel', 'Cancel')}</Button>
      <h1 class="ntitle">{Lang.t('dashboard.widget-settings', 'Widget Settings')}</h1>
      <div slot="right">
        {#if canSave}
          <Button clear primary on:click={saveWidget}>
            {Lang.t('general.save', 'Save')}
          </Button>
        {:else}
          <Button clear primary disabled>
            {Lang.t('general.save', 'Save')}
          </Button>
        {/if}
      </div>
    </ToolbarGrid>

    <!-- Widget Type Selector -->
    <WidgetTypeSelector bind:widget={editingWidget} onWidgetTypeChange={handleWidgetTypeChange} {updateTrigger} />
  </div>

  <div class="h-4" />

  <main class="px-2">
    {#key updateTrigger}
      <!-- Select the Trackable if its required the by the active ttype  -->
      <List solo>
        {#if activeType?.requires?.indexOf('token') > -1 || activeType?.optional?.indexOf('token') > -1}
          <ListItem
            on:click={() => {
              localSelectTrackables(activeType?.requires?.indexOf('tokens') > -1)
            }}
            className="h-16"
          >
            {Lang.t('dashboard.trackable', 'Trackable')}
            {#if !editingWidget?.token}
              <span class="opacity-50 text-ios-label">
                {#if activeType?.requires?.indexOf('token') > -1}
                  {Lang.t('dashboard.required', '(required)')}
                {:else}
                  {Lang.t('dashboard.optional', '(optional)')}
                {/if}
              </span>
            {/if}
            <div slot="right" class="flex items-center space-x-2">
              {#if editingWidget?.token}
                <TrackablePill
                  size={28}
                  hideValue
                  trackable={tokenToTrackable(editingWidget.token, $TrackableStore.trackables)}
                />
                {#if activeType?.requires?.indexOf('token') === -1}
                  <button
                    class="flex items-center justify-center"
                    on:click={() => {
                      editingWidget.token = undefined
                    }}
                  >
                    <IonIcon icon={CloseOutline} />
                  </button>
                {/if}
              {:else}
                <!-- no trackable yet (or an empty list): the row always offers Select, so it never looks empty -->
                <div class="text-ios-tint">{Lang.t('general.select', 'Select')}</div>
              {/if}
            </div>
          </ListItem>
        {/if}

        <!-- Select Pointer if required-->
        {#if activeType && [...activeType.requires, ...activeType.optional].indexOf('pointer') > -1}
          <Divider left={18} />
          <ListItem
            on:click={() => {
              localSelectPointer(false)
            }}
            className="h-16"
          >
            {Lang.t('dashboard.pointer', 'Pointer')}
            {#if !editingWidget?.pointer}
              <span class="opacity-50 text-ios-label">
                {#if activeType?.requires?.indexOf('token') > -1}
                  {Lang.t('dashboard.required', '(required)')}
                {:else}
                  {Lang.t('dashboard.optional', '(optional)')}
                {/if}
              </span>
            {/if}
            <div slot="right" class="flex items-center space-x-2">
              {#if !editingWidget?.pointer}
                <div class="text-ios-tint">{Lang.t('general.select', 'Select')}</div>
              {:else if editingWidget.pointer}
                <TrackablePill
                  size={28}
                  hideValue
                  trackable={tokenToTrackable(editingWidget.pointer, $TrackableStore.trackables)}
                />
                {#if activeType?.requires?.indexOf('token') === -1}
                  <button
                    class="flex items-center justify-center"
                    on:click={() => {
                      editingWidget.pointer = undefined
                    }}
                  >
                    <IonIcon icon={CloseOutline} />
                  </button>
                {/if}
              {/if}
            </div>
          </ListItem>
        {/if}

        <!-- Select the timeframe if required -->
        {#if activeType && [...activeType.requires, ...activeType.optional].indexOf('timeframe') > -1}
          <Divider left={18} />
          {#if editingWidget}
            <Input
              type="select"
              listItem
              bind:value={editingWidget.timeRange}
              label={Lang.t('dashboard.timeframe', 'Timeframe')}
              placeholder={`${Lang.t('dashboard.select-a-timeframe', 'Select a Timeframe')}`}
              options={[...timeFrames.map((timeFrame) => ({ value: timeFrame.id, label: `${timeFrame.label}` }))]}
            />
            {#if activeType && activeType.id == 'value' && editingWidget.timeRange && ['today', 'yesterday'].indexOf(editingWidget.timeRange) == -1}
              <Divider left={18} />
              <ListItem
                bg="transparent"
                title={Lang.t('dashboard.include-daily-average', 'Include Daily Average')}
                className="pl-6"
              >
                <div slot="right">
                  <ToggleSwitch bind:value={editingWidget.includeAvg} />
                </div>
              </ListItem>
            {/if}
            {#if editingWidget?.type == 'pointer'}
              <Divider left={18} />
              <ListItem>
                {Lang.t('dashboard.samples-count', { num: editingWidget?.data?.pointersamples || 5 })}
                <div
                  slot="right"
                  style="flex: 0 0 200px; padding-right: 1rem; display: flex; align-items: center; min-height: 48px;"
                >
                  {#if editingWidget?.data}
                    <IosRange
                      min={1}
                      max={8}
                      step={1}
                      label={Lang.t('dashboard.samples', 'Samples')}
                      value={editingWidget.data.pointersamples ?? 5}
                      onchange={(next) => {
                        editingWidget.data.pointersamples = next
                        updateTrigger = updateTrigger + 1
                      }}
                    />
                  {:else}
                    <span style="color: #999; font-size: 12px;"
                      >{Lang.t('dashboard.initializing', 'initializing...')}</span
                    >
                  {/if}
                </div>
              </ListItem>
            {/if}
            {#if activeType?.id != 'text'}
              <Divider left={18} />
              <ListItem>
                {Lang.t('dashboard.size', 'Size')}
                <ButtonGroup
                  bind:value={editingWidget.size}
                  buttons={[
                    { value: 'sm', label: Lang.t('dashboard.small', 'Small') },
                    { value: 'md', label: Lang.t('dashboard.medium', 'Medium') },
                    { value: 'lg', label: Lang.t('dashboard.large', 'Large') },
                  ]}
                  slot="right"
                />
              </ListItem>
            {/if}
          {/if}
        {/if}
      </List>

      <!-- Just Note -->
      {#if activeType?.id == 'text'}
        <List solo className="mt-4">
          <Input
            listItem
            placeholder={Lang.t('dashboard.message', 'Message')}
            type="textarea"
            rows={2}
            bind:value={editingWidget.description}
          />
          <div class="text-ios-label2 leading-tight px-4 text-sm pb-4">
            {Lang.t(
              'dashboard.leave-yourself-a-positive-message-or-something',
              'Leave yourself a positive message or something!'
            )}
          </div>
        </List>
      {/if}

      <!-- Plugins -->
      {#if activeType?.id == 'plugin'}
        <List solo className="mt-4">
          {#if pluginWidgets.length > 0}
            <Input
              type="select"
              listItem
              bind:value={editingWidget.data.widgetindex}
              label={Lang.t('dashboard.widget', 'Widget')}
              placeholder={'Select a Widget'}
              options={[
                ...pluginWidgets.map((pluginWidget) => ({
                  value: pluginWidget.widgetid,
                  label: `${pluginWidget.emoji} ${pluginWidget.name}`,
                })),
              ]}
            />
            <div class="text-ios-label2 leading-tight px-4 text-sm pb-4">
              {Lang.t('dashboard.select-your-widget-for-this-plugin', 'Select your Widget for this Plugin')}
            </div>
          {:else}
            <div class="text-ios-label2 leading-tight px-4 text-sm pb-4">
              {Lang.t(
                'dashboard.no-widget-options-available-for-this-plugin',
                'No widget options available for this plugin'
              )}
            </div>
          {/if}
        </List>
      {/if}

      <!-- Experiment -->
      {#if activeType?.id == 'experiment'}
        <List solo className="mt-4">
          {#if $ExperimentStore.length > 0}
            <Input
              type="select"
              listItem
              bind:value={editingWidget.data.experimentId}
              label={Lang.t('dashboard.experiment', 'Experiment')}
              placeholder={'Select an experiment'}
              options={[
                ...$ExperimentStore.map((experiment) => ({ value: experiment.id, label: `${experiment.title}` })),
              ]}
            />
            <div class="text-ios-label2 leading-tight px-4 text-sm pb-4">
              {Lang.t(
                'dashboard.shows-the-progress-and-result-of-this-experiment',
                'Shows the progress and result of this experiment'
              )}
            </div>
          {:else}
            <div class="text-ios-label2 leading-tight px-4 text-sm pb-4">
              {Lang.t('dashboard.no-experiments-yet-start-one-from-goals', 'No experiments yet. Start one from Goals.')}
            </div>
          {/if}
        </List>
      {/if}

      <!-- AI Insight Widget Configuration -->
      {#if activeType?.id == 'insight'}
        <List solo className="mt-4">
          <!-- Prompt Type Selection -->
          <ListItem>
            {Lang.t('dashboard.prompt-type', 'Prompt Type')}
            <!-- iOS look: the widget is a class instance, so the group reads and writes through updateTrigger to re-render -->
            <ButtonGroup
              value={(updateTrigger, editingWidget.data.promptType ?? 'predefined')}
              on:change={(evt) => {
                editingWidget.data.promptType = evt.detail.value
                updateTrigger = updateTrigger + 1
              }}
              buttons={[
                { value: 'predefined', label: Lang.t('dashboard.predefined', 'Predefined') },
                { value: 'custom', label: Lang.t('dashboard.custom', 'Custom') },
              ]}
              slot="right"
            />
          </ListItem>

          <Divider left={18} />

          <!-- Predefined Prompts Dropdown -->
          {#if (updateTrigger, editingWidget.data.promptType ?? 'predefined') === 'predefined'}
            <Input
              type="select"
              listItem
              bind:value={editingWidget.data.promptValue}
              label={Lang.t('dashboard.select-prompt', 'Select Prompt')}
              placeholder={`${Lang.t('dashboard.select-prompt', 'Select a prompt')}`}
              options={[
                { value: 'patterns', label: Lang.t('dashboard.patterns', 'Patterns') },
                { value: 'progress', label: Lang.t('dashboard.progress', 'Progress') },
                { value: 'insights', label: Lang.t('dashboard.insights', 'Insights') },
                { value: 'recommendations', label: 'Recommendations' },
                { value: 'trends', label: Lang.t('dashboard.trends', 'Trends') },
                { value: 'wellbeing', label: Lang.t('dashboard.wellbeing', 'Wellbeing') },
                { value: 'productivity', label: Lang.t('dashboard.productivity', 'Productivity') },
                { value: 'health', label: Lang.t('dashboard.health', 'Health') },
                { value: 'mood', label: Lang.t('dashboard.mood-emotions', 'Mood & Emotions') },
                { value: 'correlation', label: Lang.t('dashboard.correlations', 'Correlations') },
              ]}
            />
          {/if}

          <!-- Custom Prompt Textarea -->
          {#if (updateTrigger, editingWidget.data.promptType) === 'custom'}
            <Divider left={18} />
            <Input
              listItem
              placeholder={Lang.t('dashboard.enter-your-custom-prompt', 'Enter your custom prompt')}
              type="textarea"
              rows={4}
              bind:value={editingWidget.data.promptValue}
            />
            <div class="text-ios-label2 leading-tight px-4 text-sm pb-4">
              {Lang.t(
                'dashboard.describe-what-insight-you-d-like-claude-to-provi',
                "Describe what insight you'd like Claude to provide based on your tracking data"
              )}
            </div>
          {/if}
        </List>
      {/if}

      <!-- Start Conditional Styling -->
      {#if activeType && [...activeType.requires, ...activeType.optional].indexOf('cond-style') > -1}
        <List solo className="mt-4">
          <ListItem title={Lang.t('dashboard.conditional-coloring', 'Conditional Coloring')}>
            <ToggleSwitch
              slot="right"
              bind:value={conditionalStyling}
              on:change={(evt) => {
                if (evt.detail === false) {
                  editingWidget.compareUnderColor = undefined
                  editingWidget.compareOverColor = undefined
                  editingWidget.compareValue = undefined
                } else {
                  // Set default colors when turning ON conditional coloring
                  if (!editingWidget.compareOverColor) {
                    editingWidget.compareOverColor = 'green'
                  }
                  if (!editingWidget.compareUnderColor) {
                    editingWidget.compareUnderColor = 'red'
                  }
                }
                editingWidget = editingWidget
              }}
            />
          </ListItem>
          {#if conditionalStyling}
            <ListItem bg="transparent" title={Lang.t('dashboard.compare-value', 'Compare Value')}>
              <div slot="right" class="flex items-center justify-end">
                <input
                  class="bg-ios-card2 rounded-md px-2 py-1"
                  pattern="[0-9]*"
                  inputmode="numeric"
                  placeholder={activeType.id == 'value'
                    ? Lang.t('dashboard.value', Lang.t('dashboard.value', 'Value'))
                    : activeType.id == 'last-used'
                      ? Lang.t('dashboard.days', 'Days')
                      : Lang.t('dashboard.value', Lang.t('dashboard.value', 'Value'))}
                  style="max-width:140px;"
                  bind:value={editingWidget.compareValue}
                />
              </div>
            </ListItem>
            <Divider center />
            <ListItem>
              {Lang.t('dashboard.widget-above-value-color', 'Above value color')}
              <TinyColorPicker
                slot="right"
                size={16}
                colors={['green', 'orange', 'red', 'blue']}
                value={editingWidget.compareOverColor}
                on:change={(evt) => {
                  editingWidget.compareOverColor = evt.detail
                  updateTrigger = updateTrigger + 1
                }}
              />
            </ListItem>

            <ListItem>
              {Lang.t('dashboard.widget-under-value-color', 'Under value color')}
              <TinyColorPicker
                slot="right"
                size={16}
                colors={['green', 'orange', 'red', 'blue']}
                value={editingWidget.compareUnderColor}
                on:change={(evt) => {
                  editingWidget.compareUnderColor = evt.detail
                  updateTrigger = updateTrigger + 1
                }}
              />
            </ListItem>
          {/if}
        </List>
      {/if}
      <!-- </div>
      {/if} -->

      <!-- End Conditional Styling -->

      <!-- Styling -->

      <List solo className="mt-4" />
    {/key}
  </main>
</BackdropModal>
