<svelte:options runes={true} />

<script lang="ts">
  import VirtualList from '@sveltejs/svelte-virtual-list'
  import { createEventDispatcher, onMount } from 'svelte'
  import { getElementPosition } from '../../modules/html-elements/position'

  let { items, className, start = $bindable(), end = $bindable(), height = $bindable() } = $props()

  let wrapper: HTMLElement

  const dispatch = createEventDispatcher()

  $effect(() => {
    if (end === items.length) {
      dispatch('end')
    }
    dispatch('topItem', items[start])
  })

  const calculateHeight = () => {
    const size = getElementPosition(wrapper)
    if (height !== undefined) {
      height = `${size.eleHeight}px`
    }
  }

  onMount(() => {
    requestAnimationFrame(() => {
      calculateHeight()
    })
  })
</script>

<div class="virtual-list-wrapper overflow-hidden  {className}" bind:this={wrapper}>
  <VirtualList {items} bind:start {height} let:item bind:end>
    <slot {item} />
  </VirtualList>
</div>
