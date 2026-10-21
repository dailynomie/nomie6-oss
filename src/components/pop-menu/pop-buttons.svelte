<svelte:options runes={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import CheckmarkCircle from '../../n-icons/CheckmarkCircle.svelte'
  import Avatar from '../avatar/avatar.svelte'

  import { fly } from 'svelte/transition'
  import Button from '../button/button.svelte'

  import IonIcon from '../icon/ion-icon.svelte'

  import List from '../list/list.svelte'

  import type { PopMenuButton } from './usePopmenu'
  import { wait } from '../../utils/tick/tick'
  import { AwardStore } from '../../domains/awards/AwardsStore'
  import { Interact } from '../../store/interact'
  import { getAwardById } from '../../domains/awards/helpers/usage-awards'

  let dispatch = createEventDispatcher()
  const { buttons, listType } = $props()

  let buttonGroup = $derived.by(() => {
    if (buttons) {
      const groups: Array<Array<PopMenuButton>> = [[]]
      let current: number = 0
      buttons.forEach((button: PopMenuButton) => {
        if (button.divider) {
          groups.push([])
          current = groups.length - 1
        }
        groups[current].push(button)
      })
      return groups
    }
    return [[]]
  })
</script>

{#each buttonGroup as group, gIndex}
  <List className="rounded-xl pop-buttons  {listType == 'grid' ? 'list-grid' : ''} overflow-y-auto">
    {#each group as button, index}
      {#if button.title}
        <Button
          role="menuitem"
          id={`${button.id || `button-id-${index}`}`}
          size="lg"
          ariaLabel={button.title}
          disabled={button.disabled}
          on:click={async (evt) => {
            if (button.disabled) {
              // do nothing
            } else if (button.awardRequired && !$AwardStore.awards.find((a) => a.id == button.awardRequired)) {
              Interact.alert(
                `You need the ${getAwardById(button.awardRequired).name} Award before you can use this feature`
              )
            } else {
              await wait(200)
              button.click()
              dispatch('clicked', evt)
              if (!button.skipClosing) {
                dispatch('close')
              }
            }
          }}
          mainClass="flex items-center space-between"
          className="pm2-button h-auto flex items-center {button.awardRequired
            ? $AwardStore.awards.find((a) => a.id == button.awardRequired)
              ? 'unlocked'
              : 'locked'
            : ''}"
        >
          <div slot="left" class="text-ios-label2">
            {#if button.checked}
              <div in:fly|global={{ y: 50 }} class="mr-4">
                <IonIcon className="text-ios-tint" icon={CheckmarkCircle} />
              </div>
            {/if}
          </div>
          <div class="w-full pr-4">
            <div class="title" style={button.danger ? 'color: var(--ios-danger)' : undefined}>
              {button.title}
            </div>
            {#if button.description}
              <div class="text-sm text-ios-label2 leading-tight font-base text-left pr-4 mt-1" aria-label="Description">
                <p class="line-clamp-3 leading-tight">{button.description}</p>
              </div>
            {/if}
          </div>

          <div slot="right" class="flex items-center">
            {#if button.icon}
              <IonIcon icon={button.icon} className="text-ios-label2" />
            {:else if button.emoji}
              <Avatar emoji={button.emoji} size={42} />
            {/if}
          </div>
          {#if button.right}
            <div class="right-text">{button.right}</div>
          {/if}
        </Button>
      {/if}
    {/each}
  </List>
{/each}

<style lang="postcss" global>
  .pm2-button {
    @apply w-full;
    @apply text-left;
    @apply h-auto;
    min-height: 2.6rem;
    @apply py-3;
    @apply rounded-none;
  }
  .pm2-button .button-main {
    @apply flex-col;
    @apply w-full;
  }
  .pm2-button .right-text {
    @apply absolute right-5;
    @apply font-semibold;
    @apply text-ios-label2;
    @apply bg-ios-fill rounded-md;
    min-width: 28px;
    @apply py-1;
    @apply text-center;
    @apply -mr-2;
  }
  .pm2-button .title {
    @apply text-ios-label text-base leading-tight font-medium line-clamp-1 block w-full;
    @apply text-left;
    @apply text-lg;
  }

  .pm2-button.locked::after {
    content: 'Locked';
    @apply absolute right-2;
    @apply bg-ios-danger;
    @apply flex items-center justify-center;
    @apply text-xs font-bold text-ios-ondanger;
    @apply rounded-full;
    @apply py-1 px-2;
  }
  .n-list.pop-buttons {
  }
  .n-list.pop-buttons .nbtn {
    @apply shadow-none;
    @apply rounded-none;
    @apply z-10;
    @apply transition-all transform duration-200 ease-in-out;
    border-bottom: solid 1px rgba(155, 155, 155, 0.3);
    @apply bg-ios-card;
    @apply text-left;
  }
  .n-list.pop-buttons .nbtn:focus {
    @apply ring-4 ring-ios-tint ring-inset;
  }
  .n-list.pop-buttons .nbtn:first-child {
    @apply rounded-t-2xl;
  }
  .n-list.pop-buttons .nbtn:last-child {
    @apply rounded-b-2xl;
    @apply border-none;
  }

  /* iOS look: the 1 px gap between cells is the divider, so the grid's background is the separator token */
  .pop-buttons.list-grid {
    @apply grid grid-cols-2 gap-px;
    background: var(--ios-separator);
  }
  .pop-buttons.list-grid .nbtn {
    @apply flex flex-row-reverse;
    @apply text-center;
    @apply font-light;
    @apply items-center justify-end;
    @apply bg-ios-card;
    @apply rounded-none;
    @apply line-clamp-none;

    border-radius: 0 !important;
    border: none !important;
    border-top: none !important;
    border-left: none !important;
    border-right: none !important;
    border-bottom: none !important;
    @apply border-none;
    @apply shadow-md;
    @apply flex-shrink-0;
  }

  .pop-buttons.list-grid .nbtn:first-child {
    border-top-left-radius: 20px !important;
  }
  .pop-buttons.list-grid .nbtn:last-child {
    border-bottom-right-radius: 20px !important;
  }
  .pop-buttons.list-grid .nbtn:nth-child(2) {
    border-top-right-radius: 20px !important;
  }
  .pop-buttons.list-grid .nbtn:nth-last-child(2) {
    border-bottom-left-radius: 20px !important;
  }

  .pop-buttons.list-grid .nbtn:focus {
    @apply bg-ios-card;
  }
  .pop-buttons.list-grid .nbtn .main {
    @apply text-left;

    @apply text-base;
    @apply w-full;
  }

  .pop-buttons.list-grid .nbtn svg {
    @apply text-ios-label2;
    @apply mr-3;
  }
  .pop-buttons.list-grid .nbtn .main span {
    @apply text-base;
    @apply text-center;
    @apply block w-full line-clamp-1;
    @apply text-ios-label;
  }
</style>
