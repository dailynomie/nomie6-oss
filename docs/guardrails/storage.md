# Storage guardrails

How Daily Nomie 7 keeps the user's data: where it is written, how files are named, how backups and sync merge it, and what must not change when storage changes.

Levels: **MUST** and **SHOULD**, as explained in the [README](README.md). Check IDs refer to [checks/code-checks.sh](checks/code-checks.sh).

---

## 1. The model

- **One facade.** All file storage goes through `Storage` in `src/domains/storage/storage.ts`. It has `get`, `getStrict`, `put`, `putBinary`, `delete` and `list`. Each call goes to the engine the user chose.
- **Three engines** are registered in `StorageEngines` (same file):
  - `local`: localForage (IndexedDB) on this device.
  - `pouchdb`: CouchDB sync, through PouchDB (`engines/pouchdb/engine.pouchdb.ts`).
  - `nomie-server`: the Nomie server, over HTTP (`engines/nomie-server/engine.nomie-server.ts`).
- **Every file is a path.** A path is a string such as `trackers.json`, `context.json` or `books/2026-10`. The engine maps the path to its storage: a localForage key, a PouchDB document `_id`, or an HTTP route `n6storage/<path>`. The contract is the same for all three: `get`, `put`, `list`, `delete` by path.
- **Device settings are not files.** They live in `SideStore` (`side-storage.ts`), which keeps a JSON object under `data/localDB/<name>` in `localStorage`. Preferences use it: `new SideStore('preferences')`.
- **Stores hold the state.** A store (see the domain guardrails) reads its file once, keeps it in memory, and writes the whole file on each change. Two stores are provided: `createArrayStore` (`src/store/ArrayStore.ts`, a list of records with a key) and `createKVStore` (`src/store/KVStore.ts`, a map).
- **Backups are archives of files.** `buildStorageArchive` reads every path the engine lists. `writeStorageArchive` writes them back, merging with what is on the device (`smartMerge`).

---

## 2. Rules

### 2.1 Who may touch storage

- **STO-01 (MUST)** Only the storage layer, the stores (`*Store.ts`) and the module layer (`modules/import`, `modules/export`, `domains/storage`) call `Storage.get`, `put`, `getStrict`, `delete` or `list`. Components (`.svelte`) and other domain files do not. A component that needs data reads it from a store and writes it through a store action. Check: `STO-01`.
- **STO-02 (MUST)** File names come from `NPaths` in `src/paths.ts` (`NPaths.storage.<name>()`), not from a string literal. A new file gets a new `NPaths.storage` entry. Check: `STO-02`.
- **STO-03 (MUST)** A file is owned by one store. Two stores never write the same path. If a second writer is needed, the owner exposes a function and the second writer calls it.

### 2.2 Reading and writing

- **STO-04 (MUST)** Engine writes are awaited inside their `try`, so a failed write reaches the caller. A bare `return this.db.put(...)` inside a `try` skips the `catch`. Check: `STO-04`.
- **STO-05 (MUST)** Backup and restore read with `getStrict`. A failed read throws; it is never taken for an empty file. `get` (which returns `null` on failure) is for normal app reads only.
- **STO-06 (SHOULD)** Device-only settings (theme, last-used tab, launch count, font size, language) go through `store/device-settings.ts`, which keeps every key unchanged. A component or store does not call `localStorage` directly. Documented exceptions, all in the storage layer or in the device-settings module itself: the storage engines' own configuration (`Storage.local`, the CouchDB remote), the generic device stores (`SideStore`, `LSStore`), the reset that clears everything (`settings-functions.ts`), and the nomie-server address and token, which wait until that engine is active.
- **STO-07 (MUST)** A store that changes what it has written calls `put` with the whole array or object. It does not write a partial change to a file that other code reads whole.

### 2.3 Shape, merge and backups

- **STO-08 (MUST)** The shape of a file is fixed. A file is either a list or an object, and it stays that way. `smartMerge` refuses to merge a list with an object and reports the file as failed, so changing the shape breaks restores.
- **STO-09 (MUST)** Every list of records has an identifier field: `_id`, `key`, `id` or `tag` (the `KEYS` in `smart-merge.ts`). Restores merge records by that field, so a record without one is merged by value and can duplicate.
- **STO-10 (MUST)** A new file is added to a restore path. The archive picks it up automatically (`buildStorageArchive` reads every path), so the rule is: a new file must merge correctly on restore, and the merge is tested in `smart-merge.spec.ts` and `backup-roundtrip.spec.ts`, or in the store's own spec.
- **STO-11 (MUST)** A change to the archive format bumps `STORAGE_ARCHIVE_SCHEMA` in `import-export.ts`, and the import handles the old schema.
- **STO-12 (SHOULD)** The storage archive is the only backup export. The older JSON export was removed (decided by Ronald, Oct 2026). Old JSON backups can still be imported: the import loader reads the shape it defines (`IBackupItems`).

### 2.4 Engines

- **STO-13 (MUST)** Engine-specific code stays in its engine folder. The facade does not branch on the engine except to pick one.
- **STO-14 (MUST)** A new engine implements `get`, `getStrict`, `put`, `delete` and `list` by path, and must not change what a path means.
- **STO-15 (SHOULD)** A sync engine does not write local state that the user did not ask for. Sync conflicts are resolved by the merge rules above, not by the engine.

---

## 3. Examples

Good: a store owns its file, and a component calls the store.

```ts
// src/domains/uom/custom-uom-store.ts
export const CustomUomStore = createArrayStore(NPaths.storage.customUoms(), { label: 'Custom units', key: 'key' })
export const saveCustomUom = (item: CustomUomItem) => CustomUomStore.upsert(item)
```

Bad: a literal file name, and a write from a component.

```svelte
<!-- a component (STO-01, STO-02) -->
<script lang="ts">
  import Storage from '../../domains/storage/storage'
  Storage.put('open-streak.json', streak)   // use a store and NPaths
</script>
```

---

## 4. Current state (measured, branch)

Run `bash docs/guardrails/checks/code-checks.sh --all` for the full list.

- **STO-01:** 13 Storage calls sit in components or in non-store files. Examples: the file browser, the mass editor, the widget editor.
- **STO-02:** 5 literal file names in stores: `open-streak.json` (`AwardsStore.ts`) and `chart-options.json` (`ChartOptionsStore.ts`). Move them to `NPaths`.
- **STO-04:** 2 un-awaited writes in `engine.pouchdb.ts` (lines around 182 and 184). A failed write does not reach the caller's catch. **Known bug, not yet fixed:** fixing it changes what the user sees on a failed save, so it needs a decision.
- **STO-06:** the call sites outside the exceptions above now go through the device settings module. Remaining raw calls are the documented exceptions only.
- **STO-12:** the legacy JSON export is removed, so the custom units gap no longer applies. Custom units are in the storage archive.

---

## 5. Decisions

| ID | Decision |
| --- | --- |
| D-storage-facade | Current design (not a recorded decision yet): all persistence goes through the `Storage` facade, and stores own their files. Record a decision here before changing it. |
