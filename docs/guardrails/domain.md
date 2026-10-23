# Domain guardrails

How the features of Daily Nomie 7 are organised: the domain folders, their stores, the business logic, the editors, and the Starter and Full rules.

Levels: **MUST** and **SHOULD**, as explained in the [README](README.md). Check IDs refer to [checks/code-checks.sh](checks/code-checks.sh).

---

## 1. The model

- **A domain is a folder** under `src/domains/<name>/`. It holds the feature's types, its pure logic, its stores, its Svelte screens and editors, and its specs. There are 48 domains today, for example `tracker`, `trackable`, `goals`, `experiments`, `uom`, `dashboard2`, `timeline`, `storage`.
- **A store is the domain's state.** A store is a Svelte store, built with `createArrayStore` or `createKVStore` (for data that is saved), or with `writable` (for session state). It is named `<Name>Store.ts` (or `<name>-store.ts`), and it exports the state, the actions that change it, and an `init` function when it reads a file.
- **Logic is pure.** Calculations such as totals, streaks, date headings and parsing are plain functions in `.ts` files, with a spec next to them. Svelte files only present and call the logic.
- **Editors are modals.** An editor is opened with `openModal` (`components/backdrop/BackdropStore2.ts`) under an id, and closed with `closeModal(id)`. A domain keeps a small `use<Name>Modal.ts` file that opens its editor.
- **Dialogs are the app's.** Messages and confirmations use `Interact` (`src/store/interact.ts`), never the browser.
- **Starter and Full.** `src/domains/preferences/experience.ts` lists what a Starter does not see (`STARTER_HIDDEN`, `STARTER_WIDGET_TYPES`). A domain checks `$FeatureVisible(id)` to hide an entry, and never filters or deletes data because of it.

---

## 2. Rules

### 2.1 Structure

- **DOM-01 (MUST)** A domain folder holds one feature. Code that serves two features goes to a shared module (`src/modules/`, `src/utils/`), not into one domain's folder that the other imports. Check: `ARC-01` covers the route direction.
- **DOM-02 (MUST)** A domain reaches another domain through its store, or through an exported function. It does not import another domain's Svelte components.
- **DOM-03 (MUST)** Each store is named `<Name>Store` and exported once. A store that a second domain needs is exported from the store file, not copied.
- **DOM-04 (SHOULD)** A new domain has a `spec` next to its pure logic. Currently 20 of 48 domains have a spec. A new domain starts with one.

### 2.2 Stores and state

- **DOM-05 (MUST)** A store that holds saved data is built with `createArrayStore` or `createKVStore`, and its file name comes from `NPaths` (see the storage guardrails, STO-02). Its key is one of the identifier fields listed in STO-09.
- **DOM-06 (MUST)** A store that must be ready at start is initialised in `bootCoreComponents` (`src/BootStore.ts`). A store that belongs to one screen is initialised by that screen. A store is not read from storage at import time. Check: `ARC-02`.
- **DOM-07 (MUST)** Changes to a class instance (`TrackerClass`, `Trackable`, `PivotClass`, `LocationClass` and similar) are not reactive by themselves. A Svelte `$state` does not see a property change on an instance. After a change, bump an explicit counter (`updateTrigger`) that the derived value reads, or replace the instance with a new one (`new Class(...)`). Five files use this pattern today.
- **DOM-08 (MUST)** An editor works on a copy. `Trackable.asObject` (and the matching copy for other classes) creates an independent object, so Cancel discards the edit and Save writes it through the store. An editor never mutates the stored object directly.
- **DOM-09 (MUST)** A registry that the app reads at run time (for example the unit registry, `src/domains/uom/uom-registry.ts`) notifies its readers when it changes. A store subscription updates the registry, and a component that lists the registry reads the store in the same derived value, so the list updates in place.

### 2.3 Logic

- **DOM-10 (MUST)** Business logic does not read the DOM, `window`, `localStorage` or the router. Those belong to components, stores and the storage layer.
- **DOM-11 (MUST)** A new calculation that affects what the user sees (totals, streaks, goal progress, experiment results) has a spec with at least one case per branch.
- **DOM-12 (SHOULD)** Public functions of a domain have types. New code avoids `any` in exported signatures.
- **DOM-13 (MUST)** Notes and logs are stored as written. Derived values (usage, streaks, totals) are computed from them, not stored as a second copy that can drift.

### 2.4 Starter and Full

- **DOM-14 (MUST)** A Full-mode feature is listed in `STARTER_HIDDEN` (or its widget type is left out of `STARTER_WIDGET_TYPES`). Its screens check `$FeatureVisible(id)`, and the entry carries the crown (CROWN-01 in the UI guardrails).
- **DOM-15 (MUST)** Starter mode hides entry points only. It does not hide, delete or change data, and a Full user switching to Starter loses nothing. Check by review: the data stays in its store, only the entry is hidden.

### 2.5 Editors and screens

- **DOM-16 (MUST)** An editor opens with `openModal({ id, position, component, componentProps })` and closes with `closeModal(id)`. The id is unique per open editor.
- **DOM-17 (MUST)** Destructive actions ask first with `Interact.confirm`, and say what will be removed. A delete that another part of the app depends on is refused with a message that says what to change first (see the custom units: a unit in use by a tracker cannot be deleted).
- **DOM-18 (SHOULD)** An editor's name and its sheet follow the dismiss rules in the UI guardrails (D-sheet-dismiss).

---

## 3. Examples

Good: a pure function with a spec; the store owns the file; the component calls the store.

```ts
// src/domains/uom/uom-registry.ts  (pure, DOM-10)
export const formatCustomUom = (value: any, item: CustomUomItem, include = true): string => { ... }
// src/domains/uom/custom-uom-store.ts  (store, DOM-05, STO-02)
export const CustomUomStore = createArrayStore(NPaths.storage.customUoms(), { label: 'Custom units', key: 'key' })
```

Bad: a class instance changed in place without a trigger (DOM-07).

```svelte
<script lang="ts">
  let tracker = $state(trackable.tracker)
  function setMath(v) { tracker.math = v }   // Svelte does not see this change
</script>
```

Good for DOM-07: bump the trigger, or assign a new instance.

```svelte
<script lang="ts">
  let version = $state(0)
  function setMath(v) { tracker.math = v; version++ }
  let summary = $derived((version, tracker.math))
</script>
```

---

## 4. Current state (measured, branch)

- **48 domains, 39 store files.** 16 files use `createArrayStore` or `createKVStore`; 29 files use `writable`.
- **20 of 48 domains have a spec file.** The storage, uom and preferences domains are covered; the others rely on manual checks in the browser.
- **5 files use `updateTrigger`** (DOM-07), and the editors that change class instances follow it.
- **43 files open a modal** through `openModal`.
- **DOM-13 candidates:** the streak and the ledger usage are computed from notes in most places. Review new derived values against this rule.

---

## 5. Decisions

| ID | Decision |
| --- | --- |
| D-starter-no-data | Starter mode hides entries, never data (`experience.ts` header comment). Current design. |
