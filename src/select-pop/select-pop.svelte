<svelte:options runes={true} />

<script lang="ts">
import { createEventDispatcher } from 'svelte';

  import IonIcon from '../components/icon/ion-icon.svelte'
  import { openPopMenu, type PopMenuButton } from '../components/pop-menu/usePopmenu'
import CheckmarkOutline from '../n-icons/CheckmarkOutline.svelte';

  import ChevronDownOutline from '../n-icons/ChevronDownOutline.svelte'

  export let options: Array<{ key: string | number; value: any, selected?: boolean }> = []

  const emit = createEventDispatcher();
  const showMenu = () => {
    const buttons:Array<PopMenuButton> = options.map((option) => {
      return {
        title: option.value,
        icon: option.selected ? CheckmarkOutline : undefined,
        click() {
          emit('change', option)
        },
      }
    })
    openPopMenu({
      id,
      buttons,
    })
  }

  const { className, value, placeholder, id } = $props()
</script>

<button on:click={showMenu} class="select-pop {$$restProps.class || ''} {className || ''}" {...$$restProps}>
  <span class="mr-4 font-medium">{value || placeholder}</span>
  <IonIcon icon={ChevronDownOutline} size={16} />
</button>

<style lang="postcss">
  .select-pop {
    @apply flex items-center;
  }
</style>