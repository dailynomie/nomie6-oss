<svelte:options runes={true} />

<script lang="ts">
  import Button from '../../components/button/button.svelte'
  import IonIcon from '../../components/icon/ion-icon.svelte'
  import { AddIcon, CheckmarkOutline, RibbonOutline } from '../../components/icon/nicons'
  import ButtonGroup from '../../components/button-group/button-group.svelte'

  import { Lang } from '../../store/lang'
  import List from '../../components/list/list.svelte'
  import Layout from '../layout/layout.svelte'

  import { GoalClass, type GoalDurationType } from './goal-class'

  import {
    getGoalUsage,
    GoalScoreStore,
    GoalStore,
    type GoalUsageResponseType,
    openGoalDetail,
    openGoalEditor,
  } from './GoalStore'

  import Empty from '../../components/empty/empty.svelte'
  import Spinner from '../../components/spinner/spinner.svelte'
  import ListItem from '../../components/list-item/list-item.svelte'
  import TrackableAvatar from '../../components/avatar/trackable-avatar.svelte'

  import { TrackableStore } from '../trackable/TrackableStore'
  import { Interact } from '../../store/interact'

  import { showTrackablePopmenu } from '../board/boardActions'

  import debounce from 'lodash/debounce'

  import RemoveCircle from '../../n-icons/RemoveCircle.svelte'
  import CreateOutline from '../../n-icons/CreateOutline.svelte'

  import { onDestroy, onMount } from 'svelte'
  import Toolbar from '../../components/toolbar/toolbar.svelte'
  // import DateRangeController from '../../components/date-range-controller/date-range-controller.svelte'
  import dayjs from 'dayjs'
  import { LedgerStore } from '../ledger/LedgerStore'

  let view: GoalDurationType = $state('day')
  let goals: Array<GoalClass> = $state([])
  let goalUsages: Array<GoalUsageResponseType> = $state([])
  // Goal id -> hit (true) or miss (false) for each of the last seven days, oldest first
  let histories: Record<string, Array<boolean>> = $state({})
  let loading: boolean = $state(true)
  let mounted = $state(false)
  let activeDate = $state(dayjs())
  let allowOpen: boolean = $state(true)

  const blockOpen = () => {
    allowOpen = false
    setTimeout(() => {
      allowOpen = true
    }, 500)
  }

  /**
   * Seven-day history for daily goals. One usage pass per day.
   * updateScore is false so the "reached today" count in the header is not changed by past days.
   */
  const loadHistories = async (dailyGoals: Array<GoalClass>) => {
    if (!dailyGoals.length) {
      histories = {}
      return
    }
    const next: Record<string, Array<boolean>> = {}
    for (let offset = 6; offset >= 0; offset--) {
      const day = activeDate.subtract(offset, 'day')
      const results = await getGoalUsage(dailyGoals, $TrackableStore.trackables, day, { updateScore: false })
      results.forEach((gu) => {
        const hit = (!gu.scores.length && gu.goal.isDontDoIt) || (gu.scores.length > 0 && gu.scores[0].success === true)
        next[gu.goal.id] = [...(next[gu.goal.id] || []), !!hit]
      })
    }
    histories = next
  }

  const initialzeGoalPage = debounce(() => {
    try {
      if ($GoalStore.length) {
        loading = true
        goals = [...$GoalStore]
        getGoalUsage(goals, $TrackableStore.trackables, activeDate).then((gu) => {
          goalUsages = gu
          loadHistories(goals.filter((g) => g.duration === 'day')).catch((e) => console.error(e))
        })
      }
      loading = false
    } catch (e) {
      Interact.error(e.message)
      loading = false
    }
    goalUsages = [...goalUsages]

  }, 1000)

  let lastGoalStore = $state('')

  $effect(() => {
    if ($GoalScoreStore.join(',') !== lastGoalStore && mounted) {
      lastGoalStore = $GoalScoreStore.join(',')
      initialzeGoalPage()
    }
  })

  $effect(() => {
    if ($GoalStore) {
      initialzeGoalPage()
    }
  })

  const createGoal = () => {
    const goal = new GoalClass({ duration: view })
    openGoalEditor(goal)
  }
  const usageClicked = (usage) => {
    if (!editMode && allowOpen) {
      openGoalDetail(usage.goal)
    }
  }

  const deleteGoal = async (goal: GoalClass) => {
    const confirmed = await Interact.confirm(`Delete the ${goal.tag} goal?`, 'You can always recreate it')
    if (confirmed) {
      await GoalStore.remove(goal)
      initialzeGoalPage()
    }
  }

  // iOS look: the target line reads "At least 5 km a day" (or "At most" for don't-do goals)
  const targetText = (item: GoalUsageResponseType) => {
    const value = $TrackableStore.trackables[item.goal.tag]?.formatValue(item.goal.target)
    const unit = item.goal.duration || 'day'
    return `${item.goal.isDontDoIt ? 'At most' : 'At least'} ${value} a ${unit}`
  }

  const isDone = (item: GoalUsageResponseType) => {
    return (item.scores && item.scores[0]?.success) || (item.goal.isDontDoIt && !item.scores.length)
  }

  let editMode: boolean = $state(false)

  let newPostListener: any = $state(undefined)

  onMount(() => {
    mounted = true
    newPostListener = LedgerStore.hook('onLogSaved', (res) => {
      initialzeGoalPage()
    })
  })

  onDestroy(() => {
    if (newPostListener) newPostListener()
  })

</script>

<Layout pageTitle={Lang.t('goals.goals', 'Goals')}>
  <header slot="header" class="glass z-50 px-4 pt-2 pb-3">
    <!-- iOS look: action row, then the large title and today's count -->
    <div class="flex items-center justify-between h-11">
      <button type="button" aria-label="New goal" class="goals-round" on:click={createGoal}>
        <IonIcon icon={AddIcon} size={18} />
      </button>
      {#if editMode}
        <Button
          clear
          primary
          on:click={() => {
            editMode = false
          }}>Done</Button
        >
      {:else if goals.length}
        <Button
          clear
          primary
          on:click={() => {
            editMode = true
          }}>Edit</Button
        >
      {/if}
    </div>
    <h1 class="text-ios-large font-bold text-ios-label mt-1 outline-none">{Lang.t('goals.my-goals', 'My Goals')}</h1>
    {#if $GoalScoreStore[1]}
      <p class="text-ios-subhead text-ios-label2">{$GoalScoreStore[0]} of {$GoalScoreStore[1]} reached today</p>
    {/if}
    <!-- <div class=" items-center justify-center">
      <DateRangeController
        on:next={() => {
          activeDate = activeDate.add(1, 'day')
          initialzeGoalPage()
        }}
        on:previous={() => {
          activeDate = activeDate.subtract(1, 'day')
          initialzeGoalPage()
        }}
        date={activeDate}
        dateClass="text-xl font-bold text-center dark:text-white"
      />
    </div> -->
    <Toolbar>
      <ButtonGroup
        bind:value={view}
        className="max-w-sm mx-auto"
        buttons={[
          { label: Lang.t('general.daily', 'Daily'), value: 'day' },
          { label: Lang.t('general.weekly', 'Weekly'), value: 'week' },
          { label: Lang.t('general.monthly', 'Monthly'), value: 'month' },
        ]}
      />
    </Toolbar>
  </header>
  <main class="py-4 relative z-10 px-2 lg:px-4">
    {#if goals.length}
      <List solo className="max-w-screen-lg mx-auto">
        {#each goalUsages as item, index (item.id)}
        {#if item.goal.duration == view}
          <ListItem
            clickable
            bottomLine={72}
            className="relative transition-all duration-200"
            on:click={(evt) => {
              usageClicked(item)
            }}
          >
            <div slot="left" class="flex items-center stiff">
              <button
                type="button"
                aria-label="Tracker options"
                on:click|preventDefault|stopPropagation|capture={(evt) => {
                  blockOpen()
                  showTrackablePopmenu($TrackableStore.trackables[item.goal.tag])
                }}
              >
                <span class="ios-goal-icon">
                  <TrackableAvatar trackable={$TrackableStore.trackables[item.goal.tag]} size={18} />
                </span>
              </button>
            </div>

            <div class="filler min-w-0">
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <div class="ios-goal-label line-clamp-1">{$TrackableStore.trackables[item.goal.tag]?.label}</div>
                  <div class="text-ios-footnote text-ios-label2 line-clamp-1">{targetText(item)}</div>
                </div>
                {#if !editMode}
                  {#if isDone(item)}
                    <span class="ios-done" aria-label="Goal reached">
                      <IonIcon icon={CheckmarkOutline} size={16} className="text-white" />
                    </span>
                  {:else}
                    <span class="text-ios-footnote font-semibold text-ios-label2 whitespace-nowrap">
                      {item.trackableUsage ? item.trackableUsage.totalOnly : 0} of {$TrackableStore.trackables[item.goal.tag]?.formatValue(item.goal.target)}
                    </span>
                  {/if}
                {/if}
              </div>
              {#if view === 'day' && histories[item.goal.id]}
                {@const days = histories[item.goal.id]}
                <div
                  class="ios-history"
                  role="img"
                  aria-label="Reached on {days.filter(Boolean).length} of the last {days.length} days"
                >
                  {#each days as hit}
                    <span class="ios-hist-bar {hit ? 'hit' : ''}"></span>
                  {/each}
                </div>
              {/if}
            </div>
            <div slot="right" class=" flex items-center">
              {#if editMode}
                <div class="w-4 stiff" />
                <div class="flex items-center space-x-1">
                  <Button
                    clear
                    icon
                    on:click={(evt) => {
                      evt.detail.preventDefault()
                      evt.detail.stopPropagation()
                      openGoalEditor(item.goal)
                    }}
                  >
                    <IonIcon icon={CreateOutline} size={28} className="text-black dark:text-white" />
                  </Button>
                  <Button
                    clear
                    icon
                    on:click={(evt) => {
                      evt.detail.preventDefault()
                      evt.detail.stopPropagation()
                      deleteGoal(item.goal)
                    }}
                  >
                    <IonIcon icon={RemoveCircle} size={28} className="text-red-500" />
                  </Button>
                </div>
              {/if}
            </div>
          </ListItem>
          {/if}
        {/each}
        <ListItem on:click={createGoal}>
          {#if view === 'day'}
          <div class="text-center text-primary">Add Daily Goal</div>
          {:else if view === 'week'}
          <div class="text-center text-primary">Add Weekly Goal</div>
          {:else if view === 'month'}
          <div class="text-center text-primary">Add Monthly Goal</div>
          {:else if view === 'year'}
          <div class="text-center text-primary">Add Yearly Goal</div>
          {/if}
        </ListItem>

      </List>
    {/if}

    <List transparent className="max-w-md mx-auto">
      {#if goals.length === 0 && !loading}
        <Empty icon={RibbonOutline} title="No goals found">
          {#if view === 'day'}
            <Button on:click={createGoal} className="mt-2" clear primary>Create a Daily Goal →</Button>
          {:else if view === 'week'}
            <Button on:click={createGoal} className="mt-2" clear primary>Create a Weekly Goal →</Button>
          {:else if view === 'month'}
            <Button on:click={createGoal} className="mt-2" clear primary>Create a Monthly Goal →</Button>
            {:else if view === 'year'}
            <Button on:click={createGoal} className="mt-2" clear primary>Create a Yearly Goal →</Button>
          {/if}
        </Empty>
      {:else if loading}
        <Empty>
          <Spinner size={32} />
        </Empty>
      {/if}
    </List>
  </main>
</Layout>

<style>
  /* iOS look: round action button (36 px, fill) */
  .goals-round {
    width: 36px;
    height: 36px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ios-fill);
    color: var(--ios-label);
  }
  /* 29 px tracker square */
  .ios-goal-icon {
    width: 29px;
    height: 29px;
    border-radius: 8px;
    background: var(--ios-fill);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ios-goal-label {
    font-size: 17px;
    line-height: 22px;
    color: var(--ios-label);
  }
  /* 26 px green check */
  .ios-done {
    width: 26px;
    height: 26px;
    border-radius: 13px;
    background: var(--ios-good);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  /* Seven 18 x 6 px bars, 5 px apart */
  .ios-history {
    display: flex;
    gap: 5px;
    margin-top: 8px;
  }
  .ios-hist-bar {
    width: 18px;
    height: 6px;
    border-radius: 3px;
    background: var(--ios-fill);
  }
  .ios-hist-bar.hit {
    background: var(--ios-good);
  }
</style>
