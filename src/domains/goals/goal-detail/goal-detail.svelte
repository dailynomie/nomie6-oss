<svelte:options runes={true} />

<script lang="ts">
  import Empty from '../../../components/empty/empty.svelte'
  import Spinner from '../../../components/spinner/spinner.svelte'
  import type { GoalClass } from '../goal-class'

  import DayGoal from './day-goal.svelte'
  import MonthGoal from './month-goal.svelte'
  import WeekGoal from './week-goal.svelte'

  const { goal } = $props<{ goal: GoalClass }>()

  let boundGoal = $state(goal)

  $effect(() => {
    boundGoal = goal
  })
</script>

<div class="goal-detail flex flex-col h-full filler ">
  {#if boundGoal}
    {#if boundGoal.duration === 'day'}
      <DayGoal bind:goal={boundGoal} />
    {:else if boundGoal.duration === 'week'}
      <WeekGoal bind:goal={boundGoal} />
    {:else if boundGoal.duration === 'month'}
      <MonthGoal bind:goal={boundGoal} />
    {/if}
  {:else}
    <Empty>
      <Spinner size={32} />
    </Empty>
  {/if}
</div>
