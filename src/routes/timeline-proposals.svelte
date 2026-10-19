<svelte:options runes={true} />

<script lang="ts">
  // TEMPORARY (DEV only): compares three layouts for a timeline entry.
  // Static sample data, no stores. Delete this file and its route once a proposal is chosen.
  import IonIcon from '../components/icon/ion-icon.svelte'
  import MapOutline from '../n-icons/MapOutline.svelte'
  import More from '../n-icons/More.svelte'

  const sample = {
    time: '08:00',
    ago: '3 days ago',
    mood: '🟠',
    note: '#sleep_aw Sleepaw',
    chip: { emoji: '🛌', label: 'Sleep_aw', value: '8h 40m' },
    location: 'Thuis',
  }
</script>

<div class="proto-page">
  <h1 class="proto-title">Timeline entry proposals</h1>
  <p class="proto-note">Temporary page. Same sample entry in each proposal.</p>

  <!-- Proposal 1: one meta line on top, no time column -->
  <section class="proto-section">
    <h2 class="proto-label">1. One meta line on top (recommended)</h2>
    <div class="proto-entry p1">
      <div class="p1-meta">
        <span class="p1-time">{sample.time}</span>
        <span class="p1-ago">{sample.ago}</span>
        <span class="p1-mood">{sample.mood}</span>
        <span class="filler"></span>
        <button type="button" class="p1-more" aria-label="More options"><IonIcon size={20} icon={More} /></button>
      </div>
      <div class="p1-note">{sample.note}</div>
      <div class="p1-chips">
        <span class="chip"><span class="chip-emoji">{sample.chip.emoji}</span><span>{sample.chip.label}</span><strong>{sample.chip.value}</strong></span>
        <span class="chip chip-add">+</span>
      </div>
      <div class="p1-loc"><IonIcon icon={MapOutline} size={13} /> {sample.location}</div>
    </div>
  </section>

  <!-- Proposal 2: time column kept, everything on one baseline grid -->
  <section class="proto-section">
    <h2 class="proto-label">2. Time column, one baseline grid</h2>
    <div class="proto-entry p2">
      <div class="p2-time">{sample.time}</div>
      <div class="p2-head">
        <span class="p2-mood">{sample.mood}</span>
        <span class="p2-ago">{sample.ago}</span>
        <span class="filler"></span>
        <button type="button" class="p2-more" aria-label="More options"><IonIcon size={20} icon={More} /></button>
      </div>
      <div class="p2-note">{sample.note}</div>
      <div class="p2-chips">
        <span class="chip"><span class="chip-emoji">{sample.chip.emoji}</span><span>{sample.chip.label}</span><strong>{sample.chip.value}</strong></span>
        <span class="chip chip-add">+</span>
        <span class="p2-loc"><IonIcon icon={MapOutline} size={13} /> {sample.location}</span>
      </div>
    </div>
  </section>

  <!-- Proposal 3: note first, meta line at the bottom -->
  <section class="proto-section">
    <h2 class="proto-label">3. Meta line at the bottom</h2>
    <div class="proto-entry p3">
      <div class="p3-head">
        <span class="p3-note">{sample.note}</span>
        <span class="filler"></span>
        <button type="button" class="p3-more" aria-label="More options"><IonIcon size={20} icon={More} /></button>
      </div>
      <div class="p3-chips">
        <span class="chip"><span class="chip-emoji">{sample.chip.emoji}</span><span>{sample.chip.label}</span><strong>{sample.chip.value}</strong></span>
        <span class="chip chip-add">+</span>
      </div>
      <div class="p3-meta">
        <span class="p3-time">{sample.time}</span>
        <span>·</span>
        <span>{sample.ago}</span>
        <span>·</span>
        <span>{sample.mood}</span>
        <span>·</span>
        <IonIcon icon={MapOutline} size={12} />
        <span>{sample.location}</span>
      </div>
    </div>
  </section>
</div>

<style>
  .proto-page {
    min-height: 100vh;
    background: var(--ios-bg);
    color: var(--ios-label);
    padding: 16px;
    max-width: 430px;
    margin: 0 auto;
    font-family: inherit;
  }
  .proto-title {
    font-size: 28px;
    font-weight: 700;
    line-height: 34px;
    margin-top: 8px;
  }
  .proto-note {
    font-size: 13px;
    color: var(--ios-label2);
    margin-bottom: 8px;
  }
  .proto-section {
    margin-top: 20px;
  }
  .proto-label {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: var(--ios-label2);
    margin-bottom: 6px;
    padding-left: 4px;
  }
  .proto-entry {
    background: var(--ios-card);
    border-radius: 16px;
    padding: 16px;
  }
  .filler {
    flex: 1 1 auto;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 24px;
    padding: 0 9px;
    border-radius: 12px;
    background: var(--ios-fill);
    font-size: 13px;
    color: var(--ios-label);
    white-space: nowrap;
  }
  .chip strong {
    font-weight: 700;
  }
  .chip-emoji {
    font-size: 16px;
    line-height: 1;
  }
  .chip-add {
    color: var(--ios-label2);
    padding: 0 12px;
  }

  /* Proposal 1 */
  .p1-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    line-height: 20px;
    color: var(--ios-label2);
    margin: -4px -4px 6px 0;
  }
  .p1-time {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--ios-label);
  }
  .p1-mood {
    font-size: 13px;
    line-height: 20px;
  }
  .p1-more {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ios-label);
  }
  .p1-note {
    font-size: 17px;
    line-height: 22px;
    color: var(--ios-label);
    margin-bottom: 8px;
  }
  .p1-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 6px;
  }
  .p1-loc {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    line-height: 16px;
    color: var(--ios-label2);
  }

  /* Proposal 2 */
  .p2 {
    display: grid;
  }
  .p2 {
    grid-template-columns: 40px minmax(0, 1fr);
    column-gap: 12px;
    row-gap: 6px;
  }
  .p2-time {
    grid-column: 1;
    grid-row: 1;
    font-size: 13px;
    line-height: 22px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--ios-label2);
  }
  .p2-head {
    grid-column: 2;
    grid-row: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    line-height: 22px;
    color: var(--ios-label2);
    margin: -6px -8px -6px 0;
  }
  .p2-mood {
    font-size: 15px;
    line-height: 22px;
  }
  .p2-more {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ios-label);
  }
  .p2-note {
    grid-column: 2;
    grid-row: 2;
    font-size: 15px;
    line-height: 22px;
    color: var(--ios-label);
  }
  .p2-chips {
    grid-column: 2;
    grid-row: 3;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
  .p2-loc {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: var(--ios-label2);
  }
  .p2 .p2-note + .p2-chips {
    margin-top: 0;
  }
  .proto-entry.p2 {
    padding: 14px 16px;
  }

  /* Proposal 3 */
  .p3-head {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin: -4px -4px 8px 0;
  }
  .p3-note {
    font-size: 17px;
    line-height: 22px;
    color: var(--ios-label);
  }
  .p3-more {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ios-label);
    flex-shrink: 0;
  }
  .p3-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
  }
  .p3-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    line-height: 18px;
    color: var(--ios-label2);
  }
  .p3-time {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
</style>
