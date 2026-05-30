<script lang="ts">
  import { useLocation } from '../vendor/svelte-navigator'

  const location = useLocation()

  $: {
    document.body.dataset.path = `${$location.pathname}`;
  }
  
</script>
