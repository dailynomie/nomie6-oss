<svelte:options runes={true} />

<script lang="ts">
  import BulbSolid from './../../n-icons/BulbSolid.svelte'

  import IonIcon from '../../components/icon/ion-icon.svelte'
  import Container from '../../components/container/container.svelte'
  import { slide } from 'svelte/transition'
  import { quintOut } from 'svelte/easing'
  /**
   * Capture Log
   *
   * The Component used to construct a new log.
   *
   */

  // Svelte
  import { untrack } from 'svelte'

  // import { slide } from "svelte/transition";

  import './capture-log.css'
  //Components

  import dayjs from 'dayjs'

  import { wait } from '../../utils/tick/tick'

  // Stores
  import { Interact } from '../../store/interact'

  import { LedgerStore, LedgerStoreSaving, saveLog } from '../../domains/ledger/LedgerStore'
  import { ActiveLogStore, clearHighlightedTrackers, setCaptureLogDate } from './CaptureLogStore'

  import { Lang } from '../../store/lang'

  import extract from '../../utils/extract/extract'
  import { getEmojiFromScore } from '../../utils/positivity/positivity'

  import { ExpandOutline, ExtensionPuzzleOutline, MapOutline } from '../../components/icon/nicons'

  import CaptureDatePicker from './capture-date-picker.svelte'

  import { Prefs } from '../preferences/Preferences'
  import type { Token } from '../../modules/tokenizer/lite'
  import { loadToday, TodayStore } from '../usage/today/TodayStore'

  import { TrackerStore } from '../tracker/TrackerStore'

  import { openLogEditor } from '../nomie-log/LogEditorStore'
  import ScoreNote from '../../modules/scoring/score-note'
  import MenuInline from '../../components/menu/menu-inline.svelte'
  import { getPositivityButtons } from '../board/boardActions'
  import NLog from '../nomie-log/nomie-log'
  import throttle from 'lodash/throttle'
  import { Device } from '../../store/device-store'

  import { getPromptMenu, WritingPromptStore } from '../writing-prompts/useWritingPrompts'

  import type { PopMenuButton } from '../../components/pop-menu/usePopmenu'
  import CaptureTextarea from './capture-textarea.svelte'
  import { TrackableStore } from '../trackable/TrackableStore'
  import Button from '../../components/button/button.svelte'
  import { openPluginModal, PluginStore } from '../plugins/PluginStore'

  import { offerNewTrackersForNote } from '../trackable/TrackableStore'
  import IosDatetimeField from '../../components/ios-date/ios-datetime-field.svelte'
  import CaptureAddonMenuController from './capture-addon-menu-controller.svelte'
  import NomieAiButton from '../../components/aibutton2/NomieAiButton2.svelte'
  import { navigate } from '../../vendor/svelte-navigator'
  import { openModal } from '../../components/backdrop/BackdropStore2'

  // Consts

  let textarea: any
  let saving = $state(false)
  let saved = $state(false)
  let showDateSelector = $state(false)
  let isFocused = $state(false)
  let showCaptureTextarea = $state(false)

  let promptMenu = $state<Array<PopMenuButton>>([])

  // Only update promptMenu on PluginStore changes, not WritingPromptStore (which getPromptMenu updates)
  $effect(() => {
    if ($PluginStore) {
      const newMenu: Array<PopMenuButton> = untrack(() => {
        return [
          ...getPromptMenu(),
          {
            title: Lang.t('ui.integrated-blockly', 'Integrated Blockly'),
            icon: ExtensionPuzzleOutline,
            divider: true,
            click() {
              navigate('/nomie-blockly')
            },
          },
          ...$PluginStore
            .filter((p) => p.addToCaptureMenu && p.active)
            .map((p, index) => ({
              title: p.name,
              disabled: p.locked,
              divider: false,
              emoji: p.emoji,
              click() {
                openPluginModal(p)
              },
            })),
          {
            divider: true,
            click() {},
            component: CaptureAddonMenuController,
          },
        ]
      })
      // Only update if menu actually changed to avoid circular updates
      if (JSON.stringify(promptMenu) !== JSON.stringify(newMenu)) {
        promptMenu = newMenu
      }
    }
  })

  $effect(() => {
    if ($LedgerStoreSaving) {
      saving = true
    } else {
      saving = false
    }
  })

  /**
   * If TodayStore is on a Different Day
   * Adjust the Active Log end date
   */

  $effect(() => {
    if ($TodayStore.date.format('YYYY-MM-DD') !== dayjs().format('YYYY-MM-DD')) {
      $ActiveLogStore.end = $TodayStore.date.toDate()
    }
  })

  /**
   * Is the Form Populated?
   */
  let isPopulated = $derived($ActiveLogStore.note?.trim().length > 0)

  /**
   * Active Dates Formatted
   */
  let dateTimeFormat = $state($Prefs.use24hour ? 'HH:mm' : 'h:mm a')
  let selectedDateFormated = $derived(
    dayjs(new Date($ActiveLogStore.end || new Date().getTime())).format(dateTimeFormat)
  )

  const setFocused = () => {
    showCaptureTextarea = true
    if (!$ActiveLogStore.end || !isFocused) {
      setCaptureLogDate(new Date().getTime())
    }
    isFocused = true
  }

  // $: if(!showCaptureTextarea && $ActiveLogStore.note?.length) {
  //   showCaptureTextarea = true;
  // }

  /**
   * Toggle a Custom Location
   * Let the user select a custom location
   * for this log, or clear if if the user
   * already has a location selected
   */
  const toggleCustomLocation = async () => {
    if ($ActiveLogStore.lat) {
      ActiveLogStore.update((s: any) => {
        return {
          ...s,
          ...{ lat: undefined, lng: undefined, location: undefined },
        }
      })
    } else {
      let location: any = await Interact.pickLocation()
      if (location) {
        ActiveLogStore.update((s) => {
          s.lat = location.lat
          s.lng = location.lng
          s.location = location.name
          return s
        })
      }
    }
  }

  /**
   * Monitor Note Change
   *
   * Monitor when Note Content Changes
   * Throttle this call so it doesn't get
   * triggered too often
   * */
  let clearMonitor: any
  const monitorNoteChange = (evt) => {
    clearTimeout(clearMonitor)
    clearMonitor = setTimeout(() => {
      showCaptureTextarea = true
      let parsed: Array<Token>
      ActiveLogStore.update((s) => {
        parsed = extract.parse(s.note)
        // Calculate Score
        s.score = ScoreNote(s.note, new Date(), $TrackerStore)
        return s
      })
      // Highligh any visuble tracker buttons
      highlightSelectedTrackers(parsed || [])
    }, 500)
  }

  /**
   * Highlight Any Trackables
   * that are in the current Note
   * @param items
   */
  const highlightSelectedTrackers = (items: Array<Token>) => {
    clearHighlightedTrackers()
    for (let i = 0; i < items.length; i++) {
      const token = items[i]
      try {
        const button = document.querySelector(`button#${token.type}-${token.id}`)
        if (button) button.classList.add('in-note')
      } catch (e) {}
    }
  }

  const methods = {
    /**
     * Save Log
     * Capture Forms Save Log main function
     * This is important!
     */
    async logSave() {
      saving = true

      try {
        // Bug 4 fix: offer a tracker for each unknown #tag before the note is saved (the note is saved either way)
        try {
          const note = new NLog($ActiveLogStore)
          await offerNewTrackersForNote(note)
          await saveLog(note)
        } catch (e) {
          console.error(`Offer new trackers: ${e.message}`)
          await saveLog(new NLog($ActiveLogStore))
        }
        saving = false
        await wait(300)
        methods.clear()
      } catch (e) {
        console.error(`Error in capture-log logSave ${e.message}`)
        saving = false
      }
    },

    /**
     * On Key Press
     * Process each of the events
     * - look for modifier+enter to save
     * - look for +,#,@ to give auto complete
     */
    keyPress(evt) {
      let event = evt.detail
      // If enter + shift
      if (event.key === 'Enter' && event.getModifierState('Shift')) {
        event.preventDefault()
        // If enter + modify er
      } else if (event.key === 'Enter' && (event.getModifierState('Control') || event.getModifierState('Meta'))) {
        methods.logSave()
        // All other keyboard events
      } else if (event.key === 'Escape') {
        confirmClear()
        event.preventDefault()
        event.stopPropagation()
        // All other keyboard events
      }
    },
    async clear(scroll: boolean = false) {
      await wait(100)
      ActiveLogStore.clear()
      showDateSelector = false
      isFocused = false
      showCaptureTextarea = false
      setTimeout(() => {
        showDateSelector = false
        loadToday({
          knownTrackables: $TrackableStore.trackables,
          date: dayjs(),
        })
        // console.log("Scrolling to Top capture log")
        if (scroll) {
          Device.scrollToTop()
        }
      }, 120)
    },
  }

  // Clear the settings when saved
  LedgerStore.hook('onLogSaved', (res) => {
    setTimeout(() => {
      methods.clear()
    }, 100)
  })

  ActiveLogStore.hook('onAddElement', (element) => {
    monitorNoteChange({})
  })

  // When a tag is added by a button or other service
  // ActiveLogStore.hook('onAddTag', (res) => {
  //   // add space to the end.
  //   console.log("Whatt's this?")
  //   setTimeout(() => {
  //     // if (textarea) {
  //     //   textarea.value = textarea.value
  //     // }
  //     // adjust textarea size

  //   }, 10)
  // })
  const confirmClear = async () => {
    if ($ActiveLogStore.note?.length > 0) {
      const confirmed = await Interact.confirm(Lang.t('capture.discard-this-note', 'Discard this note?'))
      if (confirmed) {
        methods.clear(true)
      }
    } else {
      methods.clear()
    }
  }

  const applyCaptureDate = (date: Date) => {
    $ActiveLogStore.end = dayjs(date).toDate()
    loadToday({
      knownTrackables: $TrackableStore.trackables,
      date: dayjs(date),
    })
  }
  const eventDateChange = (e: CustomEvent) => applyCaptureDate(dayjs(e.detail).toDate())

  // iOS look (Phase 4): the pill reads "Today 08:12", or the day and time for another day
  const captureLabel = $derived.by(() => {
    const date = dayjs($TodayStore.date)
    const time = date.format($Prefs.use24hour ? 'HH:mm' : 'h:mm A')
    return date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
      ? `Today ${time}`
      : `${date.format('ddd D MMM')} ${time}`
  })

  // iOS look (Phase 4): the check-in card is hidden while the capture card is being typed in
  $effect(() => {
    const typing = isFocused || isPopulated
    document.body.classList.toggle('capture-typing', typing)
    return () => document.body.classList.remove('capture-typing')
  })

  const { className } = $props()

  async function goToAiInsights() {
    // the AI chat, with its markdown renderer, loads when it opens
    const { default: AIChatModal } = await import('../ai/ai-chat-modal-compliant.svelte')
    openModal({
      id: 'ai-chat-modal',
      position: 'fullscreen',
      component: AIChatModal,
      componentProps: { id: 'ai-chat-modal' },
      tappable: true,
    })
  }
</script>

<div class="capture-wrapper {className} relative" id="note-capture">
  <!-- 
    AUTO COMPLETE RESULTS
  -->
  <Container>
    <div
      class="save-progress {saved ? 'saved' : ''}
        {saving ? 'saving' : ''}
        {$LedgerStoreSaving ? 'saving' : ''}"
    />

    <div class="capture-log" class:negative={$ActiveLogStore.score < 0} class:positive={$ActiveLogStore.score > 0}>
      <div class="p-0 relative">
        {#if !isPopulated}
          <div class="absolute right-1 -top-1 flex items-center gap-0">
            <MenuInline
              compact
              buttonStyle="width:40px !important;{!$Prefs.ai?.enabled ? 'position: relative; top: 8px;' : ''}"
              y="top"
              x="right"
              id="prompt-button"
              title={Lang.t('capture.writing-prompts', 'Writing prompts')}
              buttonClass="stiff block max-w-8 h-8 w-8 z-40  text-ios-tint bg-transparent rounded-full"
              menuButtons={promptMenu}
            >
              <IonIcon icon={BulbSolid} size={22} />
            </MenuInline>
            {#if $Prefs.ai?.enabled}
              <div class="-ml-3">
                <NomieAiButton
                  size="36px"
                  label={Lang.t('capture.ai-insights', 'AI Insights')}
                  onclick={goToAiInsights}
                />
              </div>
            {/if}
          </div>
        {/if}

        <!-- Note Input -->
        <div
          class="mask-textarea min-h-10 {isFocused ? 'focused' : 'blurred'}
          {isPopulated ? 'populated' : 'empty'}"
        >
          <!-- Date Time Selection -->

          <div
            data-placeholder={Lang.t('general.whats-up', "What's up?")}
            class=" mask-textarea-wrapper top-section mock-textarea"
          >
            <CaptureTextarea
              bind:value={$ActiveLogStore.note}
              aria-label={Lang.t('capture.note-entry-field', 'Note entry field')}
              id="textarea-capture-note"
              class="overflow-y-scroll"
              placeholder={isPopulated || isFocused ? Lang.t('general.whats-up', "What's up?") : ''}
              disabled={saving || saved}
              bind:this={textarea}
              on:input={monitorNoteChange}
              on:keydown={methods.keyPress}
              on:focus={() => {
                setFocused()
              }}
              on:blur={() => {
                // isFocused = false
              }}
              on:paste={methods.keyPress}
            />
          </div>

          <!-- Toolbar for advanced options -->
          <!-- transition:fly={{ y: -47, duration: 200, opacity: 0, easing: quadInOut }} -->
          {#if isFocused || isPopulated}
            <section aria-label={Lang.t('capture.note-tools', 'Note tools')} class="bottom-section">
              <div class="flex-grow flex items-center space-x-1 py-1 px-0">
                <!-- Positivity Selector -->
                <div>
                  <MenuInline
                    id="pos-menu"
                    buttonClass="text-xl rounded-full flex-shrink-0 focus:bg-ios-fill rounded-md flex items-center justify-center"
                    menuButtons={getPositivityButtons($ActiveLogStore.score, (score) => {
                      $ActiveLogStore.score = score.score
                    })}
                    y="bottom"
                  >
                    <span class="w-8 text-ios-label">{getEmojiFromScore($ActiveLogStore.score, true)}</span>
                  </MenuInline>
                </div>

                <!-- Pick a custom location -->
                <button
                  class="flex relative px-1 rounded-lg items-center mx-0 text-2xl {$ActiveLogStore.lat
                    ? ''
                    : 'opacity-50'}"
                  aria-label={Lang.t('capture.location-and-date-settings', 'Location and Date settings')}
                  on:click={toggleCustomLocation}
                >
                  <IonIcon icon={MapOutline} size={16} />
                  {#if $ActiveLogStore.lat}<span class="dot far-right positive -right-2" />{/if}
                </button>

                <button
                  aria-label={Lang.t('capture.expand-note', 'Expand Note')}
                  class="clear-button flex items-center"
                  on:click={async (evt) => {
                    evt.preventDefault()
                    evt.stopPropagation()
                    openLogEditor($ActiveLogStore)
                    // confirmClear()
                  }}
                >
                  <IonIcon icon={ExpandOutline} size={22} className="text-ios-label2" />
                </button>
              </div>

              <button
                type="button"
                class="time-pill"
                aria-expanded={showDateSelector}
                aria-label={Lang.t('capture.change-date-and-time', 'Change date and time')}
                on:click={() => {
                  showDateSelector = !showDateSelector
                }}
              >
                {captureLabel}
              </button>

              <!-- {#if $LedgerStoreSaving}
                <button disabled id="save-log-button" aria-label="Save Note" class="save-button">
                  <span class="md:text-lg mr-2">Saving</span>
                  <NSpinner size={20} />
                </button>
              {:else}
                <button id="save-log-button" aria-label="Save Note" class="save-button" on:click={methods.logSave}>
                  <span class="md:text-lg">Save</span>
                  <IonIcon icon={PaperPlaneSolid} size={18} className="ml-1 text-ios-ontint" />
                </button>
              {/if} -->
            </section>
          {/if}
          {#if showDateSelector}
            <div transition:slide|global={{ delay: 250, duration: 300, easing: quintOut }}>
              <CaptureDatePicker
                bind:time={$TodayStore.date}
                is24Hour={$Prefs.use24hour}
                on:change={(e) => eventDateChange(e)}
              />
              <div class="capture-time-row">
                <IosDatetimeField
                  value={$TodayStore.date.format('YYYY-MM-DDTHH:mm')}
                  onchange={(v) => applyCaptureDate(dayjs(v).toDate())}
                />
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </Container>
  {#if isFocused || isPopulated}
    <!-- transition:slide|global={{ delay: 75, duration: 75, easing: quintOut }} -->
    <div class="glass relative z-40 w-full pt-2 pb-2">
      <Container>
        <div class=" xl:ml-auto xl:w-80 grid grid-cols-2 justify-center gap-4 items-center px-4">
          <Button className="bg-ios-fill text-ios-label" on:click={() => confirmClear()}
            >{Lang.t('general.cancel', 'Cancel')}</Button
          >
          {#if $LedgerStoreSaving}
            <Button className="bg-ios-save text-ios-onsave" disabled>{Lang.t('general.saving', 'Saving')}...</Button>
          {:else}
            <Button className="bg-ios-save text-ios-onsave" on:click={methods.logSave}
              >{Lang.t('general.save', 'Save')}</Button
            >
          {/if}
        </div>
      </Container>
    </div>
  {/if}
</div>

<!-- <Backdrop id="positivty-selector" visible={showPositivitySelector}>
  <PositivitySelector
    className="bg-ios-tint text-ios-ontint shadow-2xl"
    size="lg"
    id="score"
    showClose={true}
    on:close={() => {
      showPositivitySelector = false
      refocus()
    }}
    bind:score={$ActiveLogStore.score}
    on:change={(evt) => {
      ActiveLogStore.update((s) => {
        s.score = evt.detail
        return s
      })
      showPositivitySelector = false
      refocus()
    }}
  />
</Backdrop> -->
<style global>
  .tribute-container {
    z-index: 8000;
  }
  .tribute-container ul {
    @apply bg-ios-card shadow-md rounded-md;
    @apply overflow-hidden;
  }
  .tribute-container ul li {
    @apply px-2 py-1;
    @apply cursor-pointer;
  }
  .tribute-container ul li:hover,
  .tribute-container ul li.highlight {
    @apply bg-ios-tint text-ios-ontint;
  }
</style>
