<svelte:options runes={true} />

<script lang="ts">


  // onchange runs after the user changes the box; disabled greys it out
  let { checked = $bindable(), className, sm, onchange = undefined, disabled = false } = $props()
</script>

<input type="checkbox" class:sm bind:checked {disabled} class="n-radio {className}" onchange={() => onchange?.(checked)} />

<style lang="postcss" global>
  /* iOS look: a 22 px selection circle. Unselected: a clear outline (3:1 contrast on the card). Selected: tint, with a white tick. */
  .n-radio {
    appearance: none;
    flex-grow: 0;
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 2px solid var(--ios-label2);
    background: transparent;
    display: inline-grid;
    place-content: center;
    cursor: pointer;
  }
  .n-radio.sm {
    width: 18px;
    height: 18px;
  }
  /* the mark is a tick, as in iOS multi-select (Photos, Reminders) */
  .n-radio::before {
    content: '';
    width: 5px;
    height: 9px;
    margin-top: -2px;
    border-right: 2px solid var(--ios-on-tint);
    border-bottom: 2px solid var(--ios-on-tint);
    transform: rotate(45deg) scale(0);
    transition: transform 0.1s ease;
  }
  .n-radio:checked {
    background: var(--ios-tint);
    border-color: var(--ios-tint);
  }
  .n-radio:checked::before {
    transform: rotate(45deg) scale(1);
  }
  .n-radio:focus-visible {
    outline: 2px solid var(--ios-tint);
    outline-offset: 2px;
  }
</style>
