<svelte:options runes={true} />

<script lang="ts">
  import Button from '../../components/button/button.svelte'
  import IonIcon from '../../components/icon/ion-icon.svelte'
  import { AddIcon, CheckmarkCircle, ChevronForwardOutline, RibbonOutline } from '../../components/icon/nicons'
  import ButtonGroup from '../../components/button-group/button-group.svelte'

  import { Lang } from '../../store/lang'
  import List from '../../components/list/list.svelte'
  import Layout from '../layout/layout.svelte'

  import { GoalClass, type GoalDurationType } from './goal-class'

  import { goalTargetText } from './goal-utils'
  import {
    getGoalHistory,
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

  import ProgressBar from '../../components/progress-bar/progress-bar.svelte'

  import { TrackableStore } from '../trackable/TrackableStore'
  import { Interact } from '../../store/interact'

  import { showTrackablePopmenu } from '../board/boardActions'

  import debounce from 'lodash/debounce'

  import RemoveCircle from '../../n-icons/RemoveCircle.svelte'

  import { onDestroy, onMount } from 'svelte'
  import Toolbar from '../../components/toolbar/toolbar.svelte'
  // import DateRangeController from '../../components/date-range-controller/date-range-controller.svelte'
  import dayjs from 'dayjs'
  import { LedgerStore } from '../ledger/LedgerStore'

  let view: GoalDurationType = $state('day')
  let goals: Array<GoalClass> = $state([])
  let goalUsages: Array<GoalUsageResponseType> = $state([])
  let goalHistory: { [goalId: string]: Array<boolean> } = $state({})
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

  const initialzeGoalPage = debounce(() => {
    try {
      if ($GoalStore.length) {
        loading = true
        goals = [...$GoalStore]
        getGoalUsage(goals, $TrackableStore.trackables, activeDate).then((gu) => {
          goalUsages = gu
        })
        getGoalHistory(goals, $TrackableStore.trackables).then((history) => {
          goalHistory = history
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
  <header slot="header" class="glass z-50 px-4 pt-1 pb-1">
    <!-- on desktop the header sits in the same centred column as the list -->
    <div class="ios-desktop-column">
    <!-- iOS look: action row, then the large title and today's count (compact on phones) -->
    <!-- iOS look: Edit or Done on the leading side, the add action on the trailing side -->
    <div class="flex items-center justify-between h-9">
      <div>
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
      <button type="button" aria-label="New goal" class="goals-round" on:click={createGoal}>
        <IonIcon icon={AddIcon} size={18} />
      </button>
    </div>
    <h1 class="text-ios-large font-bold text-ios-label outline-none">{Lang.t('goals.my-goals', 'My Goals')}</h1>
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
        dateClass="text-xl font-bold text-center text-ios-label"
      />
    </div> -->
    <div class="collapsible-row">
    <Toolbar className="h-11 max-h-11 min-h-11">
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
    </div>
    </div>
  </header>
  <main class="py-4 relative z-10 px-2 lg:px-4">
    {#if goals.length}
      <List solo className="max-w-screen-lg mx-auto">
        {#each goalUsages as item, index (item.id)}
        {#if item.goal.duration == view}
          <ListItem
            clickable
            bottomLine={72}
            className="relative transition-all duration-200 ios-goal-row"
            on:click={(evt) => {
              // iOS edit mode: the row opens its editor, as the chevron shows
              if (editMode) openGoalEditor(item.goal)
              else usageClicked(item)
            }}
          >
            <div slot="left" class="flex items-center stiff">
              {#if editMode}
                <!-- iOS edit mode: the red delete control sits on the leading edge -->
                <button
                  type="button"
                  aria-label="Delete goal"
                  class="mr-3"
                  on:click|preventDefault|stopPropagation={() => deleteGoal(item.goal)}
                >
                  <IonIcon icon={RemoveCircle} size={24} className="text-ios-danger" />
                </button>
              {/if}
              <button
                type="button"
                aria-label="Tracker options"
                on:click|preventDefault|stopPropagation|capture={(evt) => {
                  blockOpen()
                  showTrackablePopmenu($TrackableStore.trackables[item.goal.tag])
                }}
              >
                <!-- iOS look: a 29 px tracker square, as on the other lists -->
                <span class="ios-goal-icon">
                  <!-- iOS look (guide 5.8, exception by Ronald): the glyph is 21 px inside the 29 px square -->
                  <TrackableAvatar trackable={$TrackableStore.trackables[item.goal.tag]} size={21} />
                </span>
              </button>
            </div>

            <div class="title-progress filler">
              <div class="flex items-center justify-between mb-2">
                <h1 class="ios-goal-label font-semibold flex items-center space-x-2">
                  <div class="line-clamp-1">{$TrackableStore.trackables[item.goal.tag]?.label}</div>
                  {#if (item.scores && item.scores[0]?.success) || (item.goal.isDontDoIt && !item.scores.length)}
                    <IonIcon icon={CheckmarkCircle} className="text-ios-good" />
                  {/if}
                </h1>
                {#if !editMode}
                  <div class="filler whitespace-nowrap text-right text-ios-footnote text-ios-label2">
                    <span>
                      <span class="usage-value font-semibold text-ios-label">
                        {#if !item.trackableUsage}
                          0
                        {:else}
                          {item.trackableUsage.totalOnly}
                        {/if}
                      </span>
                      <span class="opacity-40">/</span>
                      <span class="target-value">
                        {$TrackableStore.trackables[item.goal.tag]?.formatValue(item.goal.target)}
                      </span>
                    </span>
                    <IonIcon icon={ChevronForwardOutline} size={14} className="opacity-50" />
                  </div>
                {/if}
              </div>
              <p class="text-ios-footnote text-ios-label2 -mt-1 mb-1">
                {goalTargetText(item.goal, $TrackableStore.trackables[item.goal.tag]?.formatValue(item.goal.target) ?? `${item.goal.target}`)}
              </p>
              <div class="progress pb-2">
                {#if !item.scores.length}
                  <ProgressBar percentage={0} className="ios-bar" barClass="ios-bar-fill" />
                {/if}
                {#each item.scores || [] as score}
                  {#if score.failure}
                    <ProgressBar className="ios-bar" barClass="ios-bar-bad" r2l={item.goal.isDontDoIt} percentage={score.percent || 0} />
                  {:else if item.goal.isDontDoIt && score.percent > 80}
                    <ProgressBar className="ios-bar" r2l={item.goal.isDontDoIt} barClass="ios-bar-warn" percentage={score.percent || 0} />
                  {:else if score.success}
                    <ProgressBar className="ios-bar" percentage={score.percent || 0} r2l={item.goal.isDontDoIt} barClass="ios-bar-good" />
                  {:else}
                    <ProgressBar className="ios-bar" r2l={item.goal.isDontDoIt} barClass="ios-bar-fill" percentage={score.percent || 0} />
                  {/if}
                {/each}
              </div>
              {#if goalHistory[item.goal.id]}
                <!-- iOS look (guide 5.8): 7 days, 4 weeks or 12 months, one 18 x 6 px bar per period -->
                <div
                  class="flex items-center pb-1"
                  style="gap: {goalHistory[item.goal.id].length > 7 ? 3 : 5}px"
                  role="img"
                  aria-label="Reached on {goalHistory[item.goal.id].filter(Boolean).length} of the last {goalHistory[item.goal.id].length} {item.goal.duration === 'month' ? 'months' : item.goal.duration === 'week' ? 'weeks' : 'days'}"
                >
                  {#each goalHistory[item.goal.id] as hit}
                    <span class="history-bar {hit ? 'hit' : ''}"></span>
                  {/each}
                </div>
              {/if}
            </div>
            <div slot="right" class=" flex items-center">
              {#if editMode}
                <IonIcon icon={ChevronForwardOutline} size={14} className="opacity-50" />
              {/if}
            </div>
          </ListItem>
          {/if}
        {/each}
        <ListItem on:click={createGoal}>
          {#if view === 'day'}
          <div class="text-center text-ios-tint text-ios-body">Add Daily Goal</div>
          {:else if view === 'week'}
          <div class="text-center text-ios-tint text-ios-body">Add Weekly Goal</div>
          {:else if view === 'month'}
          <div class="text-center text-ios-tint text-ios-body">Add Monthly Goal</div>
          {:else if view === 'year'}
          <div class="text-center text-ios-tint text-ios-body">Add Yearly Goal</div>
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
  /* iOS look: round add button (36 px, fill) */
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
  /* iOS look: 29 px tracker square, with a 17 px label */
  /* iOS look: the first goal row has room above its title, like the other grouped rows */
  :global(.ios-goal-row) {
    padding-top: 14px !important;
    padding-bottom: 10px !important;
    padding-left: 16px !important;
    padding-right: 16px !important;
  }
  .ios-goal-icon {
    width: 29px;
    height: 29px;
    border-radius: 8px;
    background: var(--ios-fill);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .history-bar {
    width: 18px;
    height: 6px;
    border-radius: 3px;
    background: var(--ios-fill);
  }
  .history-bar.hit {
    background: var(--ios-good);
  }
  .ios-goal-label {
    font-size: 17px;
    line-height: 22px;
    color: var(--ios-label);
  }

  /* iOS look: 6 px progress bars on a fill track (guide 4.6). The bar classes are applied inside ProgressBar, hence :global */
  :global(.n-progress-bar.ios-bar) {
    height: 6px;
    border-radius: 3px;
    background: var(--ios-fill);
  }
  :global(.n-progress-bar.ios-bar > .progress-bar) {
    border-radius: 3px;
  }
  :global(.ios-bar-fill) {
    background: var(--ios-tint) !important;
  }
  :global(.ios-bar-good) {
    background: var(--ios-good) !important;
  }
  /* warning for a don't-do goal near its limit: iOS orange, which is readable in both modes */
  :global(.ios-bar-warn) {
    background: #ff9f0a !important;
  }
  /* iOS look (decision 3): a goal that failed is a neutral bar, not red; red is only for destructive actions */
  :global(.ios-bar-bad) {
    background: var(--ios-label2) !important;
  }
</style>