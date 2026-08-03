<svelte:options runes={true} />

<script lang="ts">
  import type TrackerClass from '../../../modules/tracker/TrackerClass'
  import { TrackableStore } from '../../trackable/TrackableStore'
  import { Lang } from '../../../store/lang'

  import List from '../../../components/list/list.svelte'
  import ListItem from '../../../components/list-item/list-item.svelte'
  import Text from '../../../components/text/text.svelte'

  let { tracker = $bindable(), onUseValue } = $props<{
    tracker: TrackerClass,
    onUseValue?: (value: number) => void
  }>()

  // Static helper to get tracker values (no reactivity)
  const getTrackerValues = () => {
    const values: { [tag: string]: number } = {}
    const trackerMap = new Map(Object.entries($TrackableStore.trackables))

    if (tracker.trackerDependencies) {
      for (const tag of tracker.trackerDependencies) {
        const trackable = trackerMap.get(`#${tag}`)
        if (trackable && trackable.type === 'tracker' && trackable.value !== undefined) {
          values[tag] = trackable.value
        } else {
          values[tag] = 0
        }
      }
    }

    return values
  }

  // Static helper to get dependency details (no reactivity)
  const getDependencyDetails = () => {
    const trackerMap = new Map(Object.entries($TrackableStore.trackables))
    const details: Array<{ tag: string; label: string; value: number }> = []

    if (tracker.trackerDependencies) {
      for (const tag of tracker.trackerDependencies) {
        const trackable = trackerMap.get(`#${tag}`)
        if (trackable && trackable.type === 'tracker') {
          details.push({
            tag,
            label: trackable.label,
            value: trackable.value || 0,
          })
        }
      }
    }

    return details
  }
</script>

<div class="flex flex-col h-full overflow-y-auto p-4 space-y-4">
  {#if tracker.formula}
    <!-- Formula Display -->
    <div class="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
      <Text size="xs" className="text-blue-900 dark:text-blue-200 mb-2">Formula</Text>
      <Text bold className="text-blue-900 dark:text-blue-200 font-mono break-words">{tracker.formula}</Text>
    </div>

    <!-- Tracker Dependencies -->
    {#if tracker.trackerDependencies && tracker.trackerDependencies.length > 0}
      <List solo>
        <ListItem title="Tracker Values" className="py-2">
          <div class="w-full space-y-2 mt-2">
            {#each getDependencyDetails() as { tag, label, value }}
              <div class="flex justify-between items-center px-2 py-2 bg-gray-100 dark:bg-gray-700/50 rounded">
                <div>
                  <Text size="sm" className="font-medium">#{tag}</Text>
                  <Text size="xs" className="text-gray-600 dark:text-gray-400">{label}</Text>
                </div>
                <Text bold className="text-primary-600 dark:text-primary-400">{value}</Text>
              </div>
            {/each}
          </div>
        </ListItem>
      </List>
    {/if}

    <!-- Manual Variables Info -->
    {#if tracker.manualVariables && tracker.manualVariables.length > 0}
      <List solo>
        <ListItem title="Manual Variables" className="py-2">
          <div class="w-full space-y-2 mt-2">
            {#each tracker.manualVariables as varName}
              <Text size="sm" className="text-gray-600 dark:text-gray-400">{varName}</Text>
            {/each}
          </div>
        </ListItem>
      </List>
    {/if}

    <div class="text-center py-4 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <Text size="sm" className="text-gray-600 dark:text-gray-400">
        Formula calculation will be performed automatically in the next phase.
      </Text>
    </div>
  {:else}
    <div className="h-full flex items-center justify-center">
      <Text className="text-gray-600 dark:text-gray-400">
        Formula not configured
      </Text>
    </div>
  {/if}
</div>
