# Architecture guardrails

How the whole of Daily Nomie 7 fits together: the layers, the start-up order, the pinned framework, the tests, the build, and how changes reach the repository.

Levels: **MUST** and **SHOULD**, as explained in the [README](README.md). Check IDs refer to [checks/code-checks.sh](checks/code-checks.sh). The narrative description of the app is in `CLAUDEDOCUMENTATION/ARCHITECTURE.md`; this document holds the rules.

---

## 1. The layers

| Layer | Where | Depends on |
| --- | --- | --- |
| Routes (pages) | `src/routes/` (23 routes in `routes.svelte`) | domains, components |
| Domains (features) | `src/domains/<name>/` (48 domains) | stores, modules, components, utils |
| Components (shared UI) | `src/components/<name>/` (93 folders) | utils, n-icons, lang, store (global) |
| Stores (global state) | `src/store/` (7 files) | storage, utils |
| Storage | `src/domains/storage/` | engines |
| Modules (services) | `src/modules/` (import, export, PWA, locate, tokenizer, tracker) | domains, storage |
| Utilities | `src/utils/` (42 files), `src/config/`, `src/lang/` | nothing in the app |
| Vendored | `src/vendor/svelte-navigator` | nothing in the app |
| Icons | `src/n-icons/`, `src/components/icon/nicons.ts` | nothing in the app |

- **ARC-01 (MUST)** Dependencies point down the table. A domain never imports a route; a component never imports a domain (CMP-08); a utility never imports a store or a domain. Check: `ARC-01` covers the route direction; `CMP-08` covers components. Measured: no domain imports a route.
- **ARC-02 (MUST)** A new top-level folder is added to this table in the same commit.

---

## 2. Start-up

- `src/main.ts` starts the PWA service, sets up the date library (dayjs with its plugins), and mounts `App.svelte`.
- `src/BootStore.ts` runs the start-up order. `bootCoreComponents` initialises the stores that the app needs before the first screen: 12 `init` calls today.
- **ARC-03 (MUST)** A store that must be ready at start is initialised in `bootCoreComponents`, in the right order (a store that reads another store comes after it). A store that belongs to one screen is initialised by that screen, not at boot. The domain guardrail DOM-06 covers the store side.
- **ARC-04 (MUST)** A store is not read from storage at import time. Import has no side effects that touch storage; the boot order decides when storage is read.
- **ARC-05 (MUST)** The start-up path does not show a dialog or wait on the network before the first screen. A slow engine shows the boot log (`BootLog`), not a blank screen.

---

## 3. The framework

- **ARC-06 (MUST)** Svelte is pinned at exactly `5.22.0` in `package.json` (no `^`). Later Svelte 5 releases (5.23 and above) corrupt the old-value tracking in effects and make `bootNomie()` hang. Check: `ARC-06`.
- **ARC-07 (MUST)** Moving the Svelte pin needs a check first: the upstream fix (Svelte PR #15469) is merged and released, and the boot path loads in the browser. Record the result in a decision.
- **ARC-08 (MUST)** Tailwind is 2.2 without JIT. Arbitrary values such as `text-[11px]` do not work, and are not used (UI-01). Vite 5 builds the app, and `vite-plugin-pwa` generates the service worker.
- **ARC-09 (SHOULD)** A new runtime dependency is justified in the commit message: what it replaces, its size, and whether it works offline. Dev-only tools need no justification.

---

## 4. Tests

- **ARC-10 (MUST)** The test runner is **Vitest**: `npx vitest run` must exit 0 before a commit. The Jest script (`npm test`) is not used: its configuration fails to start and finds no tests, although there are 70 spec files.
- **ARC-11 (MUST)** A spec is a `*.spec.ts` file next to the code it tests. New logic that affects the user has a spec (DOM-11).
- **ARC-12 (SHOULD)** A bug fix comes with a spec that fails before the fix and passes after it, when the bug is in logic.

---

## 5. Build, run and deploy

- **Node 20.20.2** (`.nvmrc`). Other versions are not tested.
- **Dev server:** `npm run dev` on port 5001. Restart only as a last resort; the hot reload handles most changes.
- **Build:** `npm run vbuild` (Vite). It must succeed before a release.
- **Deploy:** `netlify.toml`, `Dockerfile`, `nginx.conf` and `security-headers.conf` are the deployment set. A change to headers or caching is made in these files and is tested in a build.

---

## 6. Changes and the repository

- **ARC-13 (MUST)** Commit messages follow Conventional Commits (`type(scope): summary`), as enforced by `commitlint` (`commitlint.config.js`, run from the husky `commit-msg` hook). A commit made with AI assistance has the `Co-Authored-By` trailer the session asks for.
- **ARC-14 (MUST)** One logical change per commit. A change that touches storage and UI is two commits.
- **ARC-15 (MUST)** Nothing is pushed, and no pull request is opened, without an explicit go-ahead from the owner.
- **ARC-16 (MUST)** `planning/` is local and not committed. A rule that must survive lives in `docs/guardrails/`, not in `planning/`.
- **ARC-17 (SHOULD)** Formatting follows the file. The Prettier settings (`.prettierrc`: no semicolons, single quotes, width 120) and the ESLint settings (semicolons, double quotes, warnings only) disagree, and the code mixes both. Do not reformat code you are not changing.
- **ARC-18 (SHOULD)** `console.log` is not left in code. Use `console.warn`, `console.error` or `console.info`, which ESLint allows.

---

## 7. Modals, dialogs and the app shell

- **ARC-19 (MUST)** Dialogs use `Interact` (`src/store/interact.ts`): `alert`, `confirm`, `prompt`. The browser's `alert`, `confirm` and `prompt` are not used (UI-03).
- **ARC-20 (MUST)** Full-screen editors open through `openModal` with a unique id, and close through `closeModal(id)`. The backdrop (`BackdropStore2`) owns the stacking order; a component does not set its own `z-index` above the backdrop.
- **ARC-21 (MUST)** Feature visibility (Starter or Full) is decided from `experience.ts` (see the domain guardrails DOM-14 and DOM-15).

---

## 8. Current state (measured, branch)

- **Layering:** no domain imports a route. 33 components import from domains (CMP-08 list).
- **Start-up:** 12 init calls in `bootCoreComponents`; 5 domains export an `init`.
- **Framework:** Svelte 5.22.0, pinned exactly (pass).
- **Tests:** 70 spec files run under Vitest. Jest finds 0 tests and its configuration fails to start.
- **Logging:** 107 `console.log` calls in the tree; 67 in changed files (ARC-18).
- **Types:** 122 files use `any` in TypeScript. New exported signatures are typed (DOM-12).

---

## 9. Decisions

| ID | Decision |
| --- | --- |
| D-svelte-pin | Svelte is pinned at 5.22.0 until the upstream fix is verified (ARC-06, ARC-07). Record any change here. |
| D-vitest | Vitest is the test runner; the Jest script is not used (ARC-10). |
