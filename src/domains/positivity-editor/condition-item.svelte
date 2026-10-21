<svelte:options runes={true} />

<script lang="ts">
  import dayjs from 'dayjs'

  import { createEventDispatcher } from 'svelte'
  import IosSelect from '../../components/ios-select/ios-select.svelte'

  import appConfig from '../../config/appConfig'
  import { ConditionIfs, type ICondition, type IConditionIfUnit, type IConditionIsUnit } from '../../modules/scoring/score-tracker'
  import { ConditionIs } from '../../modules/scoring/score-tracker'
  import Ordinal from '../../utils/ordinal/ordinal'
  import { parseNumber } from '../../utils/parseNumber/parseNumber'
  import { Prefs } from '../preferences/Preferences'
  import type { Trackable } from '../trackable/Trackable.class'
  import { TrackableStore } from '../trackable/TrackableStore'
  import { getTrackableInputValue } from '../tracker/input/TrackerInputStore'

  const { condition, index, trackable } = $props()

  let workingCondition = $state<ICondition>(undefined)
  const dispatch = createEventDispatcher()

  $effect(() => {
    if (!workingCondition && condition) {
      workingCondition = { ...condition }
    }
  })

  $effect(() => {
    if (workingCondition) {
      dispatch('change', workingCondition)
    }
  })

  const getTrackableValue = async () => {
    const res = await getTrackableInputValue(trackable, $TrackableStore.trackables, 'Add Condition →', {
      value: condition.v,
    })

    workingCondition.v = res.value
  }

  const convertValueType = (type: IConditionIfUnit) => {
    if (type == 'value') return 'Value'
    if (type == 'hour') return 'Hour'
    if (type == 'month') return 'Day'
    return 'Value'
  }

  const convertCondition = (is: IConditionIsUnit) => {
    if (is === 'gt') return `>`
    if (is === 'gte') return `>=`
    if (is === 'lt') return '<'
    if (is === 'lte') return `<=`
    if (is === 'eq') return '='
    return '='
  }

  const getDays = () => {
    let days = []
    for (let i = 0; i < 31; i++) {
      days.push({
        value: Ordinal(i + 1),
        index: i + 1,
      })
    }
    return days
  }
  const getHours = () => {
    let hours = []
    for (let i = 0; i < 24; i++) {
      let date = dayjs().startOf('day').add(i, 'hour')

      hours.push({
        value: $Prefs.use24hour ? date.format('HH:mm') : date.format('h:mm a'),
        index: i + 1,
      })
    }
    return hours
  }
</script>

<div class="w-full py-2 flex flex-col items-center text-ios-label">
  <header class="header px-2 flex w-full items-center justify-center">
    <slot name="left" />
    {#if index === 0}
      <div class="filler text-lg font-bold">If this:</div>
    {:else}
      <div class="filler text-lg font-bold">else this:</div>
    {/if}
    <div class="filler flex justify-end">
      <slot name="right" />
    </div>
  </header>
  {#if workingCondition}
  <main class="condition-group px-8 w-full">
    <IosSelect
      ariaLabel="Compare to What?"
      title="Compare to What?"
      bind:value={workingCondition.if}
      compact
      options={ConditionIfs.map((cif) => ({ value: cif, label: convertValueType(cif) }))}
    />
    <IosSelect
      ariaLabel="Comparison Value IS"
      title="Comparison Value IS"
      bind:value={workingCondition.is}
      compact
      options={ConditionIs.map((is) => ({ value: is, label: convertCondition(is) }))}
    />
    {#if workingCondition.if === 'value'}
      {#if trackable?.type == 'tracker' && trackable?.tracker?.type == 'timer'}
        <input
          aria-label="Value to Compare against"
          class="condition-select w-12 lg:w-14"
          on:click={() => getTrackableValue()}
          readonly
          value={trackable.formatValue(workingCondition.v)}
        />
      {:else}
        <input
          class="condition-select w-12 lg:w-14"
          aria-label="Value to Compare against"
          bind:value={workingCondition.v}
        />
      {/if}
    {:else if workingCondition.if === 'hour'}
      <IosSelect
        ariaLabel="Hour of the Day"
        title="Hour of the Day"
        bind:value={workingCondition.v}
        compact
        options={getHours().map((hour) => ({ value: hour.index, label: `${hour.value}` }))}
      />
    {:else if workingCondition.if === 'month'}
      <IosSelect
        ariaLabel="Day of the Month"
        title="Day of the Month"
        bind:value={workingCondition.v}
        compact
        options={getDays().map((day) => ({ value: day.index, label: `${day.value}` }))}
      />
    {/if}
    <IosSelect
      value={`${workingCondition.sc}`}
      title="Positivity"
      compact
      onchange={(next) => {
        workingCondition.sc = parseNumber(`${next}`)
      }}
      options={appConfig.positivity.map((positivity) => ({ value: `${positivity.score}`, label: positivity.emoji }))}
    />
  </main>
  {/if}
</div>

<style lang="postcss" global>
  .condition-select {
    @apply text-base lg:text-lg appearance-none font-bold bg-ios-fill;
    @apply text-center;
    @apply rounded-lg py-1 px-1 lg:px-2 text-ios-tint;
    @apply focus:outline-none;
    @apply focus:ring-2 ring-ios-tint ring-opacity-75;
  }
  .condition-select.emoji {
    @apply text-2xl lg:text-3xl;
    @apply leading-none;
  }
  .condition-group {
    @apply space-x-2;
    @apply w-full;
    @apply flex items-center;
    @apply rounded-lg;
  }
</style>
