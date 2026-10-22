# Component guardrails

How Svelte components are written in Daily Nomie 7: props, state, events, styles, layering, and the Svelte 5 pitfalls the code has already hit.

Levels: **MUST** and **SHOULD**, as explained in the [README](README.md). Check IDs refer to [checks/code-checks.sh](checks/code-checks.sh). Visual rules (tokens, shapes, controls, icons) are in [ui-design.md](ui-design.md) and are not repeated here.

---

## 1. The model

- **Runes everywhere.** Every `.svelte` file declares `<svelte:options runes={true} />`. State is `$state`, derived values are `$derived`, side effects are `$effect`, and props come from `$props()`.
- **Components are presentation.** A component shows data and calls actions. It gets its data from props, or from a store it is allowed to read, and it changes data only through a store action or a callback prop.
- **Shared components** live in `src/components/<name>/` (93 folders today). Each folder holds one component and its small helpers. Modal, list, button, toolbar, switch and select components are the shared controls (see the UI guardrails, section 6).
- **Layers.** Routes (`src/routes/`) compose domain screens. Domains (`src/domains/`) hold features and their components. Shared components (`src/components/`) know nothing about a domain.

---

## 2. Rules

### 2.1 Svelte 5 runes

- **CMP-01 (MUST)** Every `.svelte` file starts its script with `<svelte:options runes={true} />`. Check: `CMP-01`.
- **CMP-02 (MUST)** Props are read with `$props()` (typed with an inline type or an interface). `export let` and `$:` statements are not used in new code. Check: `CMP-02`.
- **CMP-03 (MUST)** A prop is not assigned in the child. Seed a local `$state` from the prop (`let value = $state(prop)`), or dispatch the change to the parent. The compiler refuses assignment to a prop, and the guide's D-set-state records it.
- **CMP-04 (MUST)** A `{#each}` item is not assigned. Update the list by index, or replace the item in the array.
- **CMP-05 (MUST)** `<slot>` and `{@render}` are not mixed in one component. A component uses one of the two.
- **CMP-06 (MUST)** A value that a component computes from state is `$derived`, not a function called in the template when it is expensive.
- **CMP-07 (MUST)** An event handler on a list that is virtualised (`NvirtualList`) runs inside `untrack(() => ...)` when it writes state the list reads. Without it, the list and the handler feed each other and the screen loops. The timeline fix (14 files use `untrack` today) is the reference.

### 2.2 Layering

- **CMP-08 (MUST)** A component in `src/components/` does not import from `src/domains/`. Pass the data in as props, or make the domain code a pure function the component can take as a prop. A documented exception is a line marked `guardrail-ok: CMP-08 <reason>`. Check: `CMP-08`.
- **CMP-09 (MUST)** A component does not call `Storage`, `LedgerStore` or any store's write functions. It emits an event, or calls an action passed in as a prop. Check: `STO-01` (storage guardrails) covers the calls.
- **CMP-10 (MUST)** A component does not read `window.location` or the router to decide its data. The route passes the data in.
- **CMP-11 (SHOULD)** Global stores that every screen needs (`Prefs`, `FeatureVisible`, `TrackableStore`) may be read directly. Other stores are passed in as props.

### 2.3 Events and interaction

- **CMP-12 (MUST)** Interactive elements are `<button>` or `<a>`. A click handler on a `div` or `span` is not used. Check: `UI-05` (UI guardrails).
- **CMP-13 (SHOULD)** Event handlers follow the file's style: `on:click` (189 files) or `onclick` (16 files). Do not mix the two in one file.
- **CMP-14 (MUST)** A component that is only a visual wrapper does not hold application state.

### 2.4 Styles

- **CMP-15 (MUST)** Component styles are scoped to the component. Global styles (`<style global>`, used in 58 files today) are for tokens, shared controls and the app shell. A new global rule for a single screen is not added; put it in the component.
- **CMP-16 (SHOULD)** Colour, radius and type come from the tokens (UI guardrails section 2), not from literal values in the component.

### 2.5 Testing

- **CMP-17 (SHOULD)** A component with logic beyond display has its logic in a `.ts` file with a spec (see the domain guardrails DOM-10 and DOM-11). The component is then checked in the browser. There are no component specs today (0 in `src/components/`).

---

## 3. Examples

Good: a component takes data and a callback; it does not reach into a store.

```svelte
<svelte:options runes={true} />
<script lang="ts">
  let { units, onEdit } = $props<{ units: Array<Unit>; onEdit: (u: Unit) => void }>()
</script>
{#each units as unit (unit.key)}
  <button onclick={() => onEdit(unit)}>{unit.plural}</button>
{/each}
```

Bad: a component imports a domain store and writes to it (CMP-08, CMP-09).

```svelte
<script lang="ts">
  import { CustomUomStore } from '../../domains/uom/custom-uom-store'
  CustomUomStore.upsert(item)
</script>
```

Bad: assigning a prop (CMP-03).

```svelte
<script lang="ts">
  let { value } = $props()
  value = 3   // the parent does not see this, and Svelte refuses it
</script>
```

---

## 4. Current state (measured, branch)

- **353 Svelte files, all with runes.** 0 files use `export let` or `$:`.
- **Event style:** `on:click` in 189 files, `onclick` in 16. CMP-13 keeps each file consistent.
- **Global styles:** 58 files use `<style global>`.
- **Layering:** 33 component files import from `domains/`. The check `CMP-08` lists them; each needs a prop or a documented exception. The feature badge is one documented exception (its function is a pure rule over the Starter lists).
- **Specs:** 0 specs in `src/components/`.
- **Shared modal wrapper:** 51 files use `backdrop-modal.svelte`.
- **Virtualised lists:** 4 files use `NvirtualList`; 14 files use `untrack`.

---

## 5. Decisions

| ID | Decision |
| --- | --- |
| D-set-state | A prop cannot be assigned in Svelte 5. Seed a local `$state`, or dispatch the value (found while building the app; CMP-03). |
| D-event-style | One event style per file: `on:click` or `onclick` (CMP-13). Current design. |
