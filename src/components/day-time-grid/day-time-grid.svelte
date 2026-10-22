<svelte:options runes={true} />

<script lang="ts">
  import { Lang } from '../../store/lang'
</script>

<div class="bg-red-400 text-white p-4">{Lang.t('ui.needs-fixing', 'Needs fixing')}</div>
