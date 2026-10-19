<svelte:options runes={true} />

<script lang="ts">
  //utils
  import { createEventDispatcher } from 'svelte'

  // consts
  const dispatch = createEventDispatcher()

  let { value = $bindable(false), locked, className, title } = $props()

  const methods = {
    onChange() {
      if (locked === undefined) {
        value = !value
        dispatch('change', value)
      }
    },
  }
</script>

<div class="onoffswitch {value ? 'on' : 'off'} {className}">
  <button
    type="button"
    class="onoffswitch-btn"
    role="switch"
    aria-checked={value}
    aria-label={title || 'Toggle'}
    on:click={methods.onChange}
  >
    <span class="sr-only">{title || 'Toggle'}</span>
    <span class="ball w-5 h-5 block bg-white rounded-full" />
  </button>
</div>

<style lang="postcss" global>
  .onoffswitch-btn {
    width: 51px;
    height: 31px;
    border-radius: 16px;
    padding: 2px;
    @apply transform transition-all duration-100;
    @apply inline-flex;
    @apply focus:outline-none focus:ring-2 ring-green-500 ring-inset;
    @apply border-none cursor-pointer;
  }

  .onoffswitch {
    @apply transform transition-colors duration-100 inline-block;
  }
  .onoffswitch.on .onoffswitch-btn {
    background: var(--ios-switch-on);
  }

  .onoffswitch-btn .ball {
    width: 27px;
    height: 27px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s ease;
  }
  .onoffswitch.on .onoffswitch-btn .ball {
    @apply transform translate-x-5;
  }
  .onoffswitch.off .onoffswitch-btn {
    background: var(--ios-switch-off);
  }
</style>
