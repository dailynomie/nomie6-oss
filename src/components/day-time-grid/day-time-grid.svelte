<svelte:options runes={true} />

<script lang="ts">
  import { Lang } from '../../store/lang'
</script>

<div class="bg-ios-danger text-ios-white p-4">{Lang.t('ui.needs-fixing', 'Needs fixing')}</div>
