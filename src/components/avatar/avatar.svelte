<svelte:options runes={true} />

<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { initials } from '../../utils/text/text'
  import { strToColor } from '../dymoji/dymoji'
  import emojiCount from '../../modules/emoji-count/emoji-count'

  const { size = 32, label = undefined, src = undefined, emoji = undefined, transparent = false, style = '', color = undefined, circle = false, className = '' } = $props<{ size?: number; label?: string; src?: string; emoji?: string; transparent?: boolean; style?: string; color?: string; circle?: boolean; className?: string }>()

  const dispatch = createEventDispatcher()

  // iOS look (contrast): the initials are black or white, whichever reads better on the avatar colour (4.5:1 for text)
  const readableText = (color: string) => {
    const match = /^#?([0-9a-f]{6})$/i.exec(color || '')
    if (!match) return '#FFF'
    const n = parseInt(match[1], 16)
    const channel = (v: number) => {
      const c = v / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    }
    const luminance = 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
    return luminance > 0.179 ? '#000' : '#FFF'
  }

  let styles = $derived.by(() => {
    const arr: Array<string> = [`--avatar-size:${size}px`, `height:${size}px; min-width:${size}px; width:${size}px`]
    if (src && src.length) {
      arr.push(`background-image:url(${src})`)
    } else if (emoji && emoji.length) {
      if (color) {
        arr.push(`color:${color}`)
      }
    } else if (label && label.length) {
      const thisColor = color || strToColor(label)
      arr.push(`background-color:${thisColor}; text-shadow:0px 2px 2px rgba(0,0,0,0.2); color:${readableText(thisColor)} !important`)
      arr.push(`font-size: ${size * 0.5}px`)
    }
    return arr
  })

  let classList = $derived.by(() => {
    const arr: Array<string> = [className]
    if (src && src.length) {
      arr.push('src')
    } else if (emoji && emoji.length) {
      arr.push('emoji')
    } else if (label && label.length) {
      arr.push('label')
    }
    if (transparent) {
      arr.push('transparent')
    }
    if (circle) {
      arr.push('circle')
    } else {
      arr.push('rounded')
    }
    return arr
  })

  function click() {
    dispatch('click')
  }
</script>

<div
  class="n-avatar {emoji ? `emolen-${emojiCount(emoji)}` : 'no-emoji'}
  {size}
  {classList.join(' ')}"
  style={`${styles.join('; ')}; ${style}`}
  on:click|preventDefault={click}
>
  {#if emoji}{emoji}{:else if label && !src}{initials(label)}{/if}
</div>

<style lang="postcss" global>
  .n-avatar {
    /* box-shadow: var(--box-shadow-tight); */
    display: inline-flex;
    flex-grow: 0;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    background-size: cover;
    background-position: center;
    overflow: hidden;
    letter-spacing: normal;
    @apply rounded-xl;
    @apply text-ios-label;
  }

  .n-avatar.rounded {
    width: var(--avatar-size);
    height: var(--avatar-size);
    border-radius: calc(var(--avatar-size) * 0.33 + 1px);
  }

  .n-avatar.circle {
    border-radius: 50% !important;
    width: var(--avatar-size);
    height: var(--avatar-size);
  }
  .n-avatar.label {
    color: #fff;
    text-shadow: 0px 2px 3px rgba(0, 0, 0, 0.1);
    font-size: calc(var(--avatar-size) * 0.55);
    font-weight: bold;
  }
  .n-avatar.emoji {
    font-size: calc(var(--avatar-size) * 1);
    box-shadow: none;
    white-space: nowrap;
    overflow: visible;
  }
  .n-avatar.src {
    color: transparent;
  }
  .n-avatar.emolen-0 {
    letter-spacing: -0.05em;
    font-size: calc(var(--avatar-size) * 0.75);
    font-weight: 500;
  }
  .n-avatar.emolen-2 {
    letter-spacing: -0.5em;
    text-indent: -0.5em;
    font-size: calc(var(--avatar-size) * 0.86);
  }
  .n-avatar.emolen-3 {
    letter-spacing: -0.51em;
    text-indent: -0.42em;
    font-size: calc(var(--avatar-size) * 0.6);
  }
</style>
