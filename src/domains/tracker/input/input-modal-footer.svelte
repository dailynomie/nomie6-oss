<svelte:options runes={true} />

<script lang="ts">
  import Button from '../../../components/button/button.svelte'
  import ToolbarGrid from '../../../components/toolbar/toolbar-grid.svelte'
  import { createEventDispatcher } from 'svelte'
  import IonIcon from '../../../components/icon/ion-icon.svelte'
  import { StopSolid } from '../../../components/icon/nicons'
  import { Lang } from '../../../store/lang'
  import type { ITracker } from '../../../modules/tracker/TrackerClass'
  import Spinner from '../../../components/spinner/spinner.svelte'
  import type TrackerClass from '../../../modules/tracker/TrackerClass'

  const dispatch = createEventDispatcher()

  const {
    tracker,
    value = $bindable(),
    allowSave = $bindable(),
    saving = $bindable(),
    saveLabel = $bindable(),
    nextLabel = $bindable(),
  } = $props()
</script>

<footer class=" tracker-input-footer py-3 stiff glass-lite z-50 w-full rounded-b-2xl">
  <ToolbarGrid>
    <div slot="left" class="pr-2">
      <Button
        type="clear"
        size="lg"
        className="px-2 -ml-2 text-lg md:text-xl text-ios-tint"
        on:click={() => {
          dispatch('cancel')
        }}
      >
        {Lang.t('general.cancel', 'Cancel')}
      </Button>
    </div>
    <!-- end left toolbar -->
    <div class="flex items-center justify-center w-full px-2">
      {#if !saving}
        <!-- {#if (tracker.type == "timer" && value && $TrackerInputStore.allowSave !== false) || (tracker.type != "timer" && $TrackerInputStore.allowSave !== false)} -->
        {#if tracker.type === 'timer' && allowSave !== false}
          {#if tracker.started}
            <!-- Stop Button -->
            <!-- svelte-ignore a11y-autofocus -->
            <button
              type="button"
              aria-label={Lang.t('tracker.save', 'Save')}
              autofocus
              on:click={() => dispatch('stopTimer')}
              class="action-button action-stop"
            >
              <IonIcon icon={StopSolid} size={32} className="text-ios-white" />
            </button>
          {:else if !tracker.started && !value}
            <button
              aria-label={Lang.t('tracker.start-timer', 'Start Timer')}
              type="button"
              on:click={() => {
                dispatch('startTimer')
              }}
              autofocus
              class="action-button action-save"
            >
              {Lang.t('general.start', 'Start')}
            </button>
          {:else if !tracker.started && value}
            <button
              aria-label={Lang.t('tracker.save', 'Save')}
              autofocus
              type="button"
              on:click={() => {
                dispatch('save')
              }}
              class="action-button action-save"
            >
              {saveLabel}
            </button>
          {/if}
        {:else if allowSave}
          <button
            aria-label={Lang.t('tracker.save', 'Save')}
            type="button"
            on:click={() => {
              dispatch('save')
            }}
            class="action-button action-save"
          >
            {saveLabel}
          </button>
        {/if}
      {:else}
        <Spinner />
      {/if}
      <!-- end if timer -->
    </div>
    <!-- end main toolbar-grid-->

    <div slot="right">
      {#if value !== undefined && !tracker.started}
        <Button
          id="input-insert-button"
          clear
          autofocus
          primary={!allowSave}
          size="lg"
          title={Lang.t(
            'tracker.add-this-to-the-note-without-immediately-saving',
            'Add this to the note without immediately saving.'
          )}
          className="-mr-2 whitespace-nowrap text-lg md:text-xl 
                {!allowSave ? '' : 'text-ios-label'}
                {tracker.started ? 'hidden' : ''}"
          on:click={() => {
            dispatch('add')
          }}
        >
          {#if !allowSave}
            {nextLabel || Lang.t('general.next', 'Next')}
          {:else}
            {Lang.t('general.Insert', 'Insert')}
          {/if}
        </Button>
      {:else}
        <Button className="w-16" clear />
      {/if}
    </div>
  </ToolbarGrid>
</footer>

<style lang="postcss" global>
  /* iOS look: buttons are tint (save) or danger (stop) pills, with the on-colour text. No focus box for taps. */
  .tracker-input-footer button {
    @apply focus:outline-none;
  }
  .tracker-input-footer button:focus-visible {
    outline: 2px solid var(--ios-tint);
    outline-offset: 2px;
  }
  .tracker-input-footer .action-button.action-save {
    background: var(--ios-tint);
    color: var(--ios-on-tint);
  }
  .tracker-input-footer .action-button.action-stop {
    background: var(--ios-danger);
    color: #ffffff;
  }
  .tracker-input-footer .action-button {
    border-radius: 999px;
    padding: 8px 22px;
    font-size: 17px;
    font-weight: 600;
    line-height: 22px;
    min-width: 96px;
  }
</style>
