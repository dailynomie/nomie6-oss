<svelte:options runes={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import IonIcon from '../icon/ion-icon.svelte'

  import './button-group.css'

  type ButtonGroupButtonType = {
    label: string
    icon?: any
    value?: any
    active?: boolean
    badge?: string
    notify?: boolean
    hide?: boolean
    disabled?: boolean
    click?: Function
  }



  const dispatch = createEventDispatcher()

  let { buttons, size, labelClass, inverse, compact, className, style, id, scrollable, value = $bindable() } = $props()
</script>

<div
  {id}
  class="nbtn-group size-{size} {inverse ? 'inverse' : ''}
  {scrollable ? 'scrollable' : ''}
  {className}"
  class:compact
  {style}
>
  {#if buttons && buttons.length}
    {#each buttons as button, index}
      {#if button.hide !== false}
        <button
          type="menu"
          title={button.label}
          aria-pressed={!!(button.active || (value && value == button.value))}
          disabled={button.disabled}
          class="btn-group-btn btn-{index} {button.active || (value && value == button.value)
            ? 'active'
            : 'text-solid-1'} {button.disabled ? 'opacity-50 cursor-not-allowed' : ''}"
          on:click={() => {
            if (button.disabled) return
            if (button.click) button.click()
            if (!button.click && button.value) {
              value = button.value
            }
            dispatch('change', button)
          }}
        >
          <div class="button-wrapper relative flex">
            {#if button.icon}
              <IonIcon icon={button.icon} />
            {:else if button.label}
              <div class={labelClass}>{button.label}</div>
            {/if}
            {#if button.badge}
              <div
                style="font-size:9px;"
                class="badge text-xs text-ios-ontint bg-ios-tint rounded-full px-2 text-center absolute -right-4 -top-1"
              >
                {button.badge}
              </div>
            {/if}
            {#if button.notify}
              <div class="notify" />
            {/if}
          </div>
        </button>
      {/if}
    {/each}
  {:else}
    <slot />
  {/if}
</div>

<style lang="postcss" global>
  /* iOS look (section 8): the segment keeps its look, and its tap area is at least 44 px high */
  .nbtn-group .btn-group-btn {
    position: relative;
  }
  .nbtn-group .btn-group-btn::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: -7px;
    bottom: -7px;
  }
</style>
