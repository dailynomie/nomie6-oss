<svelte:options runes={true} />

<script lang="ts">
  import { onMount } from 'svelte'

  import BackdropModal from '../../components/backdrop/backdrop-modal.svelte'
  import { closeModal } from '../../components/backdrop/BackdropStore2'
  import Button from '../../components/button/button.svelte'
  import Divider from '../../components/divider/divider.svelte'
  import { openPopMenu } from '../../components/pop-menu/usePopmenu'
  import IonIcon from '../../components/icon/ion-icon.svelte'
  import { AddCircleOutline, ChevronDownOutline } from '../../components/icon/nicons'
  import Input from '../../components/input/input.svelte'
  import ListItem from '../../components/list-item/list-item.svelte'
  import List from '../../components/list/list.svelte'
  import ToggleSwitch from '../../components/toggle-switch/toggle-switch.svelte'

  import { showToast } from '../../components/toast/ToastStore'
  import ToolbarGrid from '../../components/toolbar/toolbar-grid.svelte'

  import { Interact } from '../../store/interact'

  import { Lang } from '../../store/lang'
  import { parseNumber } from '../../utils/parseNumber/parseNumber'
  import { wait } from '../../utils/tick/tick'

  import TrackablePill from '../trackable/trackable-pill.svelte'
  import { selectTrackable } from '../trackable/trackable-selector/TrackableSelectorStore'
  import type { Trackable } from '../trackable/Trackable.class'
  import { TrackableStore } from '../trackable/TrackableStore'
  import { getTrackableInputValue } from '../tracker/input/TrackerInputStore'
  import { GoalClass, type GoalComparisonType } from './goal-class'
  import { GoalComparisonItems } from './goal-utils'
  import { GoalStore } from './GoalStore'
  import is from '../../utils/is/is'

  const { id, goal } = $props<{
    id: string
    goal: GoalClass
  }>()

  let goalTargetValue: number | undefined = $state(undefined)
  let comparison: GoalComparisonType | undefined = $state(undefined)
  let trackable: Trackable | undefined = $state(undefined)
  let workingGoal: GoalClass | undefined = $state(undefined)
  let average = $state(false)
  let goalUseDailyAverage: boolean | undefined = $state(undefined)

  let mounted = $state(false)
  const isSaved = $derived(!!goal?.id && $GoalStore.some((g: GoalClass) => g.id === goal.id))
  // Phase 7: Save stays off until the goal is complete; this line says what is still missing
  const stillNeeded = $derived(
    [!trackable && 'a tracker', !comparison && 'how it should compare', !goalTargetValue && 'a target'].filter(Boolean)
  )

  $effect(() => {
    if (goal && mounted && !workingGoal) {
      workingGoal = new GoalClass(goal)
      comparison = workingGoal.comparison
      trackable = $TrackableStore.trackables[workingGoal.tag]
      goalTargetValue = workingGoal.target
      goalUseDailyAverage = workingGoal.usedailyaverage
    }
  })

  onMount(() => {
    mounted = true
  })

  const deleteGoal = async () => {
    const confirmed = await Interact.confirm(
      Lang.t('goals.delete-this-goal', 'Delete this goal?'),
      Lang.t('goals.you-can-always-recreate-it-later', 'You can always recreate it later.')
    )
    if (confirmed) {
      await GoalStore.remove(workingGoal)
      closeModal(id)
    }
  }

  const save = async () => {
    let newGoal = new GoalClass({
      id: workingGoal.id,
      comparison: comparison,
      tag: trackable.tag,
      duration: workingGoal.duration,
      target: goalTargetValue,
      usedailyaverage: goalUseDailyAverage,
    })
    Interact.blocker(`Saving ${trackable.label} goal...`)
    await GoalStore.upsert(newGoal)
    Interact.stopBlocker()
    showToast({ message: Lang.t('goals.goal-saved', 'Goal Saved') })
    close()
  }

  const select = async () => {
    await wait(100)
    trackable = await selectTrackable()
  }

  const selectTargetValue = async () => {
    // let tracker = trackable?.tracker || new TrackerClass({ emoji: '🎛', tag: 'Input', type: 'value' })
    const response = await getTrackableInputValue(trackable, $TrackableStore.trackables)
    const value = parseNumber(response.value)
    if (is.number(value)) goalTargetValue = value
  }

  const close = () => {
    closeModal(id)
  }
</script>

<BackdropModal mainClass="px-2 lg:px-4 py-2 lg:py-4">
  <ToolbarGrid slot="header">
    <Button slot="left" primary clear on:click={close}>
      {Lang.t('general.cancel', 'Cancel')}
    </Button>

    <h1 class="ntitle capitalize">
      {Lang.t('goals.goal-title', { duration: goal.durationLabel, label: trackable?.label || '' })}
    </h1>

    <Button slot="right" primary clear disabled={!goalTargetValue || !trackable || !comparison} on:click={save}>
      {Lang.t('general.save', 'Save')}
    </Button>
  </ToolbarGrid>

  {#if stillNeeded.length}
    <p class="px-6 pt-3 text-ios-footnote text-ios-label2">
      {Lang.t('goals.still-needed', { list: stillNeeded.join(', ') })}
    </p>
  {/if}
  <List solo>
    <ListItem clickable on:click={select}>
      <div class="py-2">{Lang.t('goals.which-tracker', 'Which tracker?')}</div>
      <div slot="right">
        {#if trackable?.label}
          <TrackablePill {trackable} size={32} hideValue />
        {:else}
          <span class="text-ios-tint">{Lang.t('goals.select', 'Select')}</span>
        {/if}
      </div>
    </ListItem>
    <Divider left={16} />
    <ListItem
      clickable
      on:click={() => {
        // iOS look: the comparison is an action sheet with a tick on the current choice
        openPopMenu({
          id: `goal-comparison-${goal.duration}`,
          title: Lang.t('goals.should-be', 'Should be...'),
          show: true,
          buttons: GoalComparisonItems.map((item) => ({
            title: item.label,
            checked: item.id == comparison,
            click() {
              comparison = item.id
            },
          })),
        })
      }}
    >
      <div class="py-2">
        {#if comparison}
          {GoalComparisonItems.find((g) => g.id == comparison).label}
        {:else}
          {Lang.t('goals.should-be', 'Should be...')}
        {/if}
      </div>
      <IonIcon slot="right" icon={ChevronDownOutline} className="opacity-40 pointer-events-none" />
    </ListItem>

    <Divider left={16} />
    <Input
      type="number"
      value={goalTargetValue}
      on:input={(evt) => (goalTargetValue = evt.detail)}
      listItem
      label={Lang.t('goals.target', 'Target')}
      placeholder={Lang.t('goals.goal-target', 'Goal Target')}
    >
      <div slot="right" class="flex items-center space-x-2 whitespace-nowrap text-xs">
        {#if goalTargetValue && trackable}
          <div class="text-ios-label2">{trackable.formatValue(goalTargetValue)}</div>
        {/if}
        <Button
          clear
          primary
          icon
          on:click={() => {
            selectTargetValue()
          }}
        >
          <IonIcon icon={AddCircleOutline} />
        </Button>
      </div>
    </Input>
    {#if goal.duration == undefined}
      <Divider left={16} />
      <ListItem>
        <div class="py-2">{Lang.t('goals.use-daily-average', 'Use Daily Average')}</div>
        <div slot="right">
          <ToggleSwitch
            title={Lang.t('goals.daily-average', 'Daily Average')}
            bind:value={goalUseDailyAverage}
            on:change={(event) => {
              if (event.detail == false) {
                goalUseDailyAverage = false
              } else if (event.detail === true) {
                goalUseDailyAverage = true
              }
            }}
          />
        </div>
      </ListItem>
    {/if}
  </List>

  <!-- iOS look (Phase 7 bug fix): a goal that is not saved yet has nothing to delete -->
  {#if isSaved}
    <Button clear className="text-ios-danger mt-10 mx-auto text-sm" on:click={() => deleteGoal()}>
      {#if goal.duration === 'day'}
        <div class="text-center text-ios-danger">{Lang.t('goals.delete-daily-goal', 'Delete Daily Goal')}</div>
      {:else if goal.duration === 'week'}
        <div class="text-center text-ios-danger">{Lang.t('goals.delete-weekly-goal', 'Delete Weekly Goal')}</div>
      {:else if goal.duration === 'month'}
        <div class="text-center text-ios-danger">{Lang.t('goals.delete-monthly-goal', 'Delete Monthly Goal')}</div>
      {:else if goal.duration === 'year'}
        <div class="text-center text-ios-danger">{Lang.t('goals.delete-yearly-goal', 'Delete Yearly Goal')}</div>
      {/if}</Button
    >
  {/if}
</BackdropModal>
