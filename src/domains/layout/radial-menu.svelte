<svelte:options runes={true} />

<script lang="ts">
  import IonIcon from '../../components/icon/ion-icon.svelte'
  import { AddCircleOutline } from '../../components/icon/nicons'
  import { navigate } from '../../vendor/svelte-navigator'

  type RadialItem = { id: string; label: string; icon: any; link?: string; action?: () => void; notify?: string }

  const { items = [], label = 'Actions', dot = false }: { items: Array<RadialItem>; label?: string; dot?: boolean } =
    $props()

  // The options fan out on an arc above the button, from upper left to upper right
  const RADIUS = 118
  const ARC_START = 150
  const ARC_END = 30
  const CLOSE_MS = 240

  let open = $state(false)
  let expanded = $state(false)
  let origin = $state({ x: 0, y: 0 })
  let hub: HTMLElement | undefined = $state()

  const angleFor = (index: number): number =>
    items.length <= 1 ? 90 : ARC_START - ((ARC_START - ARC_END) * index) / (items.length - 1)

  const offsetFor = (index: number): { x: number; y: number } => {
    const radians = (angleFor(index) * Math.PI) / 180
    return { x: Math.cos(radians) * RADIUS, y: -Math.sin(radians) * RADIUS }
  }

  const openMenu = () => {
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
    <div class="radial-backdrop" style="z-index: 9998" role="presentation" onclick={closeMenu}></div>

    {#each items as item, index (item.id)}
      {@const offset = offsetFor(index)}
      <button
        class="radial-item"
        style="z-index: 9999; left: {origin.x}px; top: {origin.y}px; opacity: {expanded ? 1 : 0}; transform: translate(calc(-50% + {expanded ? offset.x : 0}px), calc(-50% + {expanded ? offset.y : 0}px)) scale({expanded ? 1 : 0.4}); transition-delay: {index * 35}ms"
        onclick={() => choose(item)}
      >
        <span class="radial-icon bg-white dark:bg-gray-800 text-primary-500">
          <IonIcon icon={item.icon} size={22} />
          {#if item.notify}
            <span class="radial-notify bg-gray-600 dark:bg-gray-400 text-white dark:text-gray-800">{item.notify}</span>
          {/if}
        </span>
        <span class="radial-label bg-gray-900 text-white">{item.label}</span>
      </button>
    {/each}

    <button
      class="radial-hub is-open"
      style="z-index: 10000; left: {origin.x}px; top: {origin.y}px"
      aria-label="Close {label}"
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
    width: 56px;
    height: 56px;
    padding: 0;
    border: none;
    border-radius: 9999px;
    overflow: hidden;
    background: none;
    box-shadow: 0 6px 16px rgba(0, 131, 212, 0.35);
    transition: opacity 0.2s ease;
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
    color: #ffffff;
    background: linear-gradient(145deg, #2cbdff, #0083d4);
    transform: translate(-50%, -50%) rotate(45deg);
    transition: transform 0.24s ease;
    opacity: 1;
  }

  .radial-dot {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 10px;
    height: 10px;
    border-radius: 9999px;
    background: #ef4444;
    border: 2px solid #ffffff;
  }

  .radial-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
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
    transition: transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 200ms ease;
    -webkit-tap-highlight-color: transparent;
  }

  .radial-icon {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 9999px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  }

  .radial-notify {
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    height: 16px;
    padding: 0 6px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 600;
    line-height: 16px;
    white-space: nowrap;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  .radial-label {
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    padding: 4px 8px;
    border-radius: 9999px;
    white-space: nowrap;
  }
</style>
