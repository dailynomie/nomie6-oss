<svelte:options runes={true} />

<script lang="ts">
  import VirtualList from '@sveltejs/svelte-virtual-list'
  import { createEventDispatcher, onMount } from 'svelte'
  import { getElementPosition } from '../../modules/html-elements/position'

  let wrapper: HTMLElement

  const dispatch = createEventDispatcher()

  $: {
    if (end === items.length) {
      dispatch('end')
    }
    dispatch('topItem', items[start])
  }
  const calculateHeight = () => {
    const size = getElementPosition(wrapper)
    height = `${size.eleHeight}px`
  }

  onMount(() => {
    requestAnimationFrame(() => {
      calculateHeight()
    })
  })

  const { items, className, start, end, height } = $props()
</script>

<div class="virtual-list-wrapper overflow-hidden  {className}" bind:this={wrapper}>
  <VirtualList {items} bind:start {height} let:item bind:end>
    <slot {item} />
  </VirtualList>
</div>
