<svelte:options runes={true} />

<script lang="ts">
  import { getDateFormats } from '../../domains/preferences/Preferences'
  import { getEmojiFromScore, selectPositivity, selectPositivityPopmenu } from '../../utils/positivity/positivity'
  import { getTrackerInputAsString } from '../../domains/tracker/input/TrackerInputStore'
  import { Interact } from '../../store/interact'
  import { objectHash } from '../../modules/object-hash/object-hash'
  import { onLogNoteChange } from '../../domains/ledger/LedgerStore'
  import { openLocationViewer } from '../../domains/map/LocationModalStore'
  import { parseNumber } from '../../utils/parseNumber/parseNumber'
  import { selectTrackable } from '../../domains/trackable/trackable-selector/TrackableSelectorStore'
  import { showTrackablePopmenu } from '../../domains/board/boardActions'
  import { tokenToTrackable } from '../../modules/tokenizer/tokenToTrackable'
  import { TrackableStore } from '../../domains/trackable/TrackableStore'
  import { wait } from '../../utils/tick/tick'
  import IonIcon from '../icon/ion-icon.svelte'
  import MapOutline from '../../n-icons/MapOutline.svelte'
  import More from '../../n-icons/More.svelte'
  import NLog from '../../domains/nomie-log/nomie-log'
  import NoteTextualizer from '../note-textualizer/note-textualizer.svelte'
  import TinyTrackable from '../tiny-trackable/tiny-trackable.svelte'
  import type { Token } from '../../modules/tokenizer/lite'
  import type { Trackable } from '../../domains/trackable/Trackable.class'
  import is from '../../utils/is/is'

  // props
  // export let trackers = {};


  // consts

  let displayLog = $state<NLog>(undefined)
  let displayScore = $state<number | undefined>(undefined)
  // let editMode:boolean = true;

  let lastLog = $state<string | undefined>(undefined)
  let logElements = $state<Array<{ token: Token; trackable: Trackable; value: number }>>([])

  const { log, fullDate, hideTrackables, className } = $props()

  /**
   * Watches for a Log Change
   * If the log changes then do this
   * expensive function, otherwise don't
   * do it!
   */
  $effect(() => {
    if (log && objectHash(log) !== lastLog) {
      lastLog = objectHash(log)
      // Setup the display log
      displayLog = new NLog(log)

      // Convert trackables to ITrackers format (map keyed by tag)
      const knownTrackers = {}
      if ($TrackableStore.trackables) {
        // Handle both object and array formats
        const trackablesArray = Array.isArray($TrackableStore.trackables)
          ? $TrackableStore.trackables
          : Object.values($TrackableStore.trackables)

        trackablesArray.forEach((trackable: any) => {
          if (trackable && trackable.type === 'tracker' && trackable.tracker) {
            // Store by tag without # prefix
            const cleanTag = trackable.tag ? trackable.tag.replace(/^#/, '') : trackable.tag
            if (cleanTag) {
              knownTrackers[cleanTag] = trackable.tracker
            }
          }
        })
      }

      // Recalculate score using custom conditions
      const calculated = displayLog.calculateScore(knownTrackers)
      displayScore = calculated

      // Format the log Elements
      logElements = log.elements
        .filter((t) => t.type !== 'generic')
        .map((token, index) => {
          const trk = tokenToTrackable(token, $TrackableStore.trackables)
          return {
            trackable: trk,
            token,
            value: parseNumber(token.value || trk?.value || 0),
          }
        })
        .filter((le) => le.trackable)
    }
  })

  const changePositivity = async (log: NLog) => {
    const results: any = await selectPositivityPopmenu(log.score)
    if (results && is.truthy(results.score)) {
      log.score = results.score
      await onLogNoteChange(log.note, log)
    }
  }

  /**
   * Add an Item
   * This will let the user seleect a trackable and add it to the
   * this note
   */
  const addItem = async () => {
    const trackable = await selectTrackable()
    let inputResults: string
    await wait(100)
    if (trackable && trackable.type == 'tracker') {
      const res = await getTrackerInputAsString({
        allowSave: false,
        expandNote: true,
        trackables: $TrackableStore.trackables,
        tracker: trackable.tracker,
        nextLabel: 'Add',
      })

      if (res?.raw) {
        inputResults = res.raw
      }
    } else if (trackable.type == 'person') {
      inputResults = trackable.tag
    } else if (trackable.type == 'context') {
      inputResults = trackable.tag
    } else if (trackable.type == 'pointer') {
      inputResults = trackable.tag
    }
    if (inputResults) {
      let newNote = `${displayLog.note} ${inputResults}`
      displayLog = await onLogNoteChange(newNote, displayLog)
    }
  }

  let dateFormats = getDateFormats()
</script>

{#if displayLog}
  <div id="log-{displayLog._id}" class:pinned={displayLog.pinned} class="note-bubble space-y-2 bubble {className}">
    <div class="flex items-center justify-between text-xs  space-x-3 -mt-2">
      <button on:click={() => changePositivity(log)} class="text-base text-ios-label2"
        >{getEmojiFromScore(log.score !== undefined && log.score !== null && log.score !== 0 ? log.score : displayScore).emoji}</button
      >
      <div class="ios-time text-ios-label2 stiff line-clamp-1">
        {#if fullDate}
          {log.endDayjs().format(`${dateFormats.date} ${dateFormats.time}`)}
        {:else}
          <span class="ios-time-col">{log.endDayjs().format(dateFormats.time)}</span>
          <span class="pl-2 ios-ago text-ios-label2">{log.endDayjs().fromNow()}</span>
        {/if}
      </div>
      <div class="text-right flex items-center  filler text-ios-label2">
        <button
          aria-label="View Location"
          on:click={() => {
            return openLocationViewer([log.geoType], [log])
          }}
          class="w-full text-right flex items-center justify-end"
        >
          {#if log.location}
            <div class="line-clamp-1 text-ios-good">{log.location}</div>
          {:else if log.lng}
            <IonIcon icon={MapOutline} className="text-green-500" size={16} />
          {/if}
        </button>
      </div>
      <button
        type="button"
        style="margin-right:-10px"
        class="text-ios-label h-7 w-7 rounded-full  flex items-center justify-center"
        on:click={() => {
          Interact.logOptions(log, {
            description: log.note,
          })
        }}><IonIcon size={22} icon={More} /></button
      >
    </div>

    {#if log.hasNote}
      <p class="text-base leading-5">
        <NoteTextualizer
          note={log.note}
          on:noteChange={(evt) => {
            onLogNoteChange(evt.detail, log)
          }}
          className=" dark:text-gray-300 text-gray-700 leading-snug"
          on:textClick={(evt) => {
            const trackable = tokenToTrackable(evt.detail, $TrackableStore.trackables)
            showTrackablePopmenu(trackable)
          }}
        />
      </p>
    {/if}

    {#if !hideTrackables}
      <div class="trackables -px-1 w-full flex flex-wrap">
        {#each logElements as logElement, index (`${logElement.trackable.tag}-${index}`)}
        {#if logElement.trackable.type != "pointer"}
          <TinyTrackable
            trackable={logElement.trackable}
            value={logElement.value}
            date={log.end}
            on:click={() => {
              showTrackablePopmenu(logElement.trackable, { date: log.endDayjs() })
            }}
          />
          {/if}
        {/each}
        {#each logElements as logElement, index (`${logElement.trackable.tag}-${index}`)}
        {#if logElement.trackable.type == "pointer"}
        <TinyTrackable
          trackable={logElement.trackable}
          value={logElement.value}
          date={log.end}
          on:click={() => {
            showTrackablePopmenu(logElement.trackable, { date: log.endDayjs() })
          }}
        />
        {/if}
      {/each}
        <button on:click={() => addItem()} class="tiny-trackable bg-transparent">
          <span class="value w-5">+</span>
        </button>
      </div>
    {/if}
    <slot name="item-footer" />
  </div>
{/if}

<style global lang="postcss">
  /* iOS look: the entry time uses tabular figures; the "ago" text is regular weight */
  .ios-time {
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  /* The time sits in a fixed 40 px column, so the "ago" text lines up across entries */
  .ios-time-col {
    display: inline-block;
    min-width: 40px;
  }
  .ios-ago {
    font-size: 13px;
    font-weight: 400;
  }

  .note-bubble.pinned {
    @apply ring ring-ios-tint;
  }
  .note-bubble {
    background: var(--ios-card);
    border-radius: 12px;
    box-shadow: none;
    @apply p-4;
    @apply font-medium;
  }
</style>
