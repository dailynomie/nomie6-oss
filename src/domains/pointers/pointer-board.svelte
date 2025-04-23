<script lang="ts">

export let pointers

</script>

<div class="flex flex-col gap-y-2">
    <div class="inline-flex flex-wrap gap-2">
  {#each pointers as pointer, index}
  <div>
  <span class="max-w-3 truncate whitespace-nowrap inline-flex items-center gap-x-1.5 py-1.5 ps-3 pe-2 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-500">
    {pointer.ctx.emoji} {pointer.ctx.label}
    <button type="button" class="shrink-0 size-2 inline-flex items-center justify-center rounded-full hover:bg-blue-200 focus:outline-hidden focus:bg-blue-200 focus:text-blue-500 dark:hover:bg-blue-900">
      <span class="sr-only">Remove badge</span>
      <svg class="shrink-0 size-3" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 6 6 18"></path>
        <path d="m6 6 12 12"></path>
      </svg>
    </button>
  </span>
</div>
{/each}
  </div>
  </div>