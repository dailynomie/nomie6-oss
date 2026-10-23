<svelte:options runes={true} />

<script lang="ts">
  import IonIcon from '../../components/icon/ion-icon.svelte'
  import FeatureBadge from '../../components/advanced-badge/feature-badge.svelte'
  import { AddCircleOutline } from '../../components/icon/nicons'
  import { navigate } from '../../vendor/svelte-navigator'
  import { Prefs } from '../preferences/Preferences'
  import { RadialOpenStore } from './radial-store'
  import { Lang } from '../../store/lang'

  type RadialItem = { id: string; label: string; icon: any; link?: string; action?: () => void; notify?: string }

  const {
    items = [],
    label = 'Actions',
    dot = false,
  }: { items: Array<RadialItem>; label?: string; dot?: boolean } = $props()

  // The options fan out on an arc above the button, from upper left to upper right
  const RADIUS = 118
  const ARC_START = 150
  const ARC_END = 30
  const CLOSE_MS = 240

  let open = $state(false)
  $effect(() => {
    RadialOpenStore.set(open)
  })
  let expanded = $state(false)
  let origin = $state({ x: 0, y: 0 })
  let hub: HTMLElement | undefined = $state()

  // A one-time hint above the button, until it is tapped or has been shown for a few seconds
  const HINT_MS = 8000
  let hintVisible = $state(false)

  $effect(() => {
    if ($Prefs && !$Prefs.menuHintSeen) {
      hintVisible = true
      const timer = setTimeout(() => dismissHint(), HINT_MS)
      return () => clearTimeout(timer)
    }
  })

  const dismissHint = () => {
    hintVisible = false
    if (!getSeen()) {
      Prefs.update((p) => {
        p.menuHintSeen = true
        return p
      })
    }
  }

  const getSeen = (): boolean => {
    let seen = false
    Prefs.subscribe((p) => (seen = !!p?.menuHintSeen))()
    return seen
  }

  // Five or more items (Analytics in Full mode) get a wider arc and a larger radius, so the labels don't overlap
  const arcStart = () => (items.length > 4 ? 165 : ARC_START)
  const arcEnd = () => (items.length > 4 ? 15 : ARC_END)
  const radius = () => (items.length > 4 ? 136 : RADIUS)

  const angleFor = (index: number): number =>
    items.length <= 1 ? 90 : arcStart() - ((arcStart() - arcEnd()) * index) / (items.length - 1)

  const offsetFor = (index: number): { x: number; y: number } => {
    const radians = (angleFor(index) * Math.PI) / 180
    return { x: Math.cos(radians) * radius(), y: -Math.sin(radians) * radius() }
  }

  const openMenu = () => {
    dismissHint()
    const rect = hub?.getBoundingClientRect()
    if (rect) origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    open = true
    // Draw the closed state first, then open on the next frame so the options animate out
    requestAnimationFrame(() => requestAnimationFrame(() => (expanded = true)))
  }

  const closeMenu = () => {
    if (!open) return
    expanded = false
    setTimeout(() => (open = false), CLOSE_MS)
  }

  const choose = (item: RadialItem) => {
    closeMenu()
    if (item.action) item.action()
    else if (item.link) navigate(item.link)
  }

  // Move the layer to the page body, so no parent's stacking can hide it
  const toBody = (node: HTMLElement) => {
    document.body.appendChild(node)
    return {
      destroy() {
        node.remove()
      },
    }
  }
</script>

<svelte:window
  onkeydown={(event) => {
    if (open && event.key === 'Escape') closeMenu()
  }}
/>

{#if hintVisible && !open}
  <div class="radial-hint" role="note">{Lang.t('layout.tap-for-more', 'Tap for more')}</div>
{/if}

<button
  bind:this={hub}
  class="radial-hub"
  style="opacity: {open ? 0 : 1}"
  aria-label={label}
  aria-expanded={open}
  onclick={openMenu}
>
  <img src="/app-icons/nomie6-head-192.png" alt="" draggable="false" />
  {#if dot}
    <span class="radial-dot" aria-hidden="true"></span>
  {/if}
</button>

{#if open}
  <div use:toBody class="radial-layer">
    <button type="button" class="radial-backdrop" style="z-index: 9998" aria-label={Lang.t('ui.close-menu', 'Close menu')} onclick={closeMenu}></button>

    {#each items as item, index (item.id)}
      {@const offset = offsetFor(index)}
      <button
        class="radial-item"
        style="z-index: 9999; left: {origin.x}px; top: {origin.y}px; opacity: {expanded
          ? 1
          : 0}; transform: translate(calc(-50% + {expanded ? offset.x : 0}px), calc(-50% + {expanded
          ? offset.y
          : 0}px)) scale({expanded ? 1 : 0.4}); transition-delay: {index * 35}ms"
        onclick={() => choose(item)}
      >
        <span class="radial-icon">
          <IonIcon icon={item.icon} size={22} />
          <FeatureBadge feature={item.feature} />
          {#if item.notify}
            <span class="radial-notify">{item.notify}</span>
          {/if}
        </span>
        <span class="radial-label">{item.label}</span>
      </button>
    {/each}

    <button
      class="radial-hub is-open"
      style="z-index: 10000; left: {origin.x}px; top: {origin.y}px"
      aria-label={Lang.t('layout.close-label', { label })}
      onclick={closeMenu}
    >
      <IonIcon icon={AddCircleOutline} size={30} />
    </button>
  </div>
{/if}

<style>
  .radial-hub {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 58px;
    height: 58px;
    padding: 0;
    border: none;
    border-radius: 9999px;
    overflow: hidden;
    background: none;
    box-shadow:
      0 0 0 3px #f9f9f9,
      var(--ios-shadow-hub);
    transition:
      opacity 0.2s ease,
      transform 0.15s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .radial-hub img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
  }

  .radial-hub.is-open {
    position: fixed;
    color: var(--ios-on-tint);
    background: var(--ios-tint);
    transform: translate(-50%, -50%) rotate(45deg);
    transition: transform 0.24s ease;
    opacity: 1;
  }

  .radial-hint {
    position: absolute;
    top: -58px;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 12px;
    border-radius: 9999px;
    background: var(--ios-label);
    color: var(--ios-card);
    font-size: calc(12px * var(--text-scale));
    font-weight: 600;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    pointer-events: none;
    animation: radial-hint-in 0.4s ease both;
  }

  .radial-hint::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -4px;
    width: 8px;
    height: 8px;
    background: var(--ios-label);
    transform: translateX(-50%) rotate(45deg);
  }

  @keyframes radial-hint-in {
    from {
      opacity: 0;
      transform: translate(-50%, 6px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }

  .radial-hub:active {
    transform: scale(0.92);
  }

  /* Dark mode: the hint, the badge and the ring use the inverted colours from the design guide */
  :global(html.dark) .radial-hub {
    box-shadow:
      0 0 0 3px #161618,
      var(--ios-shadow-hub);
  }
  :global(html.dark) .radial-notify {
    background: var(--ios-label2);
    color: var(--ios-black);
  }

  .radial-dot {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 10px;
    height: 10px;
    border-radius: 9999px;
    background: var(--ios-danger);
    border: 2px solid var(--ios-card);
  }

  .radial-backdrop {
    position: fixed;
    inset: 0;
    background: var(--ios-scrim);
    backdrop-filter: blur(3px);
  }

  .radial-item {
    position: fixed;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    border: none;
    background: none;
    padding: 0;
    transition:
      transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1),
      opacity 200ms ease;
    -webkit-tap-highlight-color: transparent;
  }

  .radial-icon {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 54px;
    height: 54px;
    background: var(--ios-card);
    color: var(--ios-tint);
    border-radius: 9999px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
  }

  /* The crown sits at 2 o'clock on the button's edge, half over the button and in front of it. The centre is
     60 degrees from the top on the 27 px radius: x = 27 + 27 sin 60 = 50.4, y = 27 - 27 cos 60 = 13.5. A 16 px
     badge is then 8 px either side of that point. */
  .radial-icon :global(.advanced-badge) {
    z-index: 1;
    top: 5.5px;
    right: auto;
    left: 42.4px;
  }

  .radial-notify {
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    min-width: 22px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: var(--ios-label2);
    color: var(--ios-white);
    font-size: calc(12px * var(--text-scale));
    font-weight: 700;
    line-height: 20px;
    white-space: nowrap;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  .radial-label {
    background: var(--ios-label);
    color: var(--ios-card);
    font-size: calc(12px * var(--text-scale));
    font-weight: 600;
    line-height: 1;
    padding: 3px 9px;
    border-radius: 10px;
    white-space: nowrap;
  }
</style>
