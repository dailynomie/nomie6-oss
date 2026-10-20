<svelte:options runes={true} />

<!-- iOS look: a small green "A" marks a setting that only shows in Full mode -->
<span class="advanced-badge" title="Advanced setting" aria-label="Advanced setting">A</span>

<style>
  .advanced-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 9px;
    background: #248a3d;
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    flex-shrink: 0;
  }
</style>
