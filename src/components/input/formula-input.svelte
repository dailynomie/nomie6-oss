<svelte:options runes={true} />

<script lang="ts">
  import NInput from './input.svelte'
  import IonIcon from '../icon/ion-icon.svelte'
  import { CheckmarkCircle, CircleOutline } from '../icon/nicons'

  interface Props {
    value?: string
    label?: string
    placeholder?: string
    isValid?: boolean
    listItem?: boolean
    rows?: number
  }

  let { value = $bindable(), label, placeholder, isValid = false, listItem = true, rows = 3 } = $props<Props>()
</script>

<NInput
  {listItem}
  type="textarea"
  {rows}
  {placeholder}
  {label}
  bind:value
>
  <div slot="right" class="pr-2 pt-1">
    {#if value}
      {#if isValid}
        <IonIcon icon={CheckmarkCircle} class="text-green-400 dark:text-green-300" style="filter: drop-shadow(0 0 4px rgba(34, 197, 94, 0.8)) drop-shadow(0 0 8px rgba(34, 197, 94, 0.4))" size={20} />
      {:else}
        <IonIcon icon={CircleOutline} class="text-red-400 dark:text-red-300" style="filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.8)) drop-shadow(0 0 8px rgba(239, 68, 68, 0.4))" size={20} />
      {/if}
    {/if}
  </div>
</NInput>
