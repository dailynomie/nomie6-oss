# Daily Nomie 7: quick-start briefing (Experiments + Starter mode)

This is a handoff for Claude working in VS Code on the Daily Nomie repo (`dailynomie/nomie6-oss`), with the maintainer, Ronald. It describes the two headline features of **Daily Nomie 7** and how to build them in this codebase. It was written from the `dev` branch at `873e5bc` (version `dn6.8.0v20261017`). The backup and restore fix is already merged there.

**How to work with Ronald on this**
- Read this whole file before writing code.
- Build in the phases listed for each feature. Finish one phase, with its tests passing, before starting the next.
- Write the pure logic (statistics, data shaping, feature rules) and its tests first, then the UI.
- Section 6 lists decisions that are Ronald's. Ask about them when you reach them; don't guess.
- File paths and function names here were checked against the code. If something has moved, search for it rather than recreating it.

---

## 1. The release in one paragraph

Daily Nomie 6.x became very good at **collecting** data: trackers, habits, goals, pointers, pivots and AI chat. Version 7 is about turning that data into **answers**, and about making the app less overwhelming for new users. It has two features:

1. **Experiments.** The user tests whether one change ("no coffee after 14:00") affects something they track ("sleep quality"). They get an honest, plain-language result: what changed, by how much, and how sure we can be.
2. **Starter mode.** New users see a smaller, simpler app: core tracking, timeline, dashboard, goals and experiments. Everything else stays one switch away, and no data is ever hidden or deleted.

---

## 2. Codebase orientation (verified facts)

- **Stack:** Svelte 5 (every component opts into runes with `<svelte:options runes={true} />`; follow that in new components), Vite 5, TypeScript, Tailwind, Vitest.
- **Commands:**
  - `npm run dev` (port 5001)
  - `npx vitest run`: 261 of 262 pass on `dev`. `src/domains/goals/goals.spec.ts › DONTDOIT goal` was already failing and is unrelated.
  - `npm run vbuild`
  - `npx tsc --noEmit`: the repo already has about 1,550 type errors, so compare the count before and after a change rather than expecting zero.
- **Tests** sit next to the code as `*.spec.ts` and run in plain Node. There is no `localStorage` or `window`; see `src/domains/storage/backup-roundtrip.spec.ts` for how to fake them with `vi.mock` and `vi.stubGlobal`.
- **Feature folders:** `src/domains/<feature>/`. Page wrappers are in `src/routes/`, registered in `src/routes/routes.svelte`.

**Key APIs to reuse**

| Need | Use | Where |
| --- | --- | --- |
| Persisted list of objects (included in backups automatically) | `createArrayStore(path, { label, key: 'id', itemInitializer, itemSerializer })` | `src/store/ArrayStore.ts`; example: `GoalStore` in `src/domains/goals/GoalStore.ts` |
| Storage file names and route paths | `NPaths.storage.*()`, `NPaths.routes.*()` | `src/paths.ts` |
| Logs for a date range | `LedgerStore.query({ start, end })` | `src/domains/ledger/LedgerStore.ts` |
| Values per tracker for a date range | `queryToUsageMap({ start, end }, knownTrackables)` returns `{ [tag]: TrackableUsage }` | `LedgerStore.ts` (line ~657); `getGoalUsage()` in `GoalStore.ts` shows the pattern |
| One value per day | `usage.byDay`: groups by `YYYY-MM-DD` using `trackable.tallyValues()`, which **sums**, or **averages** when `tracker.math === 'mean'`. Days with no log are absent. | `src/domains/usage/trackable-usage.class.ts`, `src/domains/trackable/Trackable.class.ts` |
| Cut a usage to a window | `usage.truncate(start, end)` | `trackable-usage.class.ts` |
| Save a log | `saveLog(new NLog({ note, end }))` | `LedgerStore.ts` (line ~616), `src/domains/nomie-log/nomie-log.ts` |
| Create or save a tracker | `saveTrackable({ trackable, known, permissions, prompt = true, saveToActiveBoard = true })`, `MasterTrackables` | `src/domains/trackable/TrackableStore.ts` |
| Pick trackers | `selectTrackable(type?, subtype?)`, `selectTrackables(…)` | `src/domains/trackable/trackable-selector/TrackableSelectorStore.ts` |
| Full-screen modal | `openModal({ id, position: 'fullscreen', component, componentProps })` | `src/components/backdrop/BackdropStore2.ts`; examples: `openGoalEditor()` and `openGoalDetail()` in `GoalStore.ts` |
| Preferences | `Prefs` writable store, `PreferencesStateType` | `src/domains/preferences/Preferences.ts` |
| Translated text | `Lang.t('key', 'English default')` | `src/store/lang.ts` |
| Dashboard widget types | list in `src/domains/dashboard2/widget/widget-types.ts`; rendered by `widget-display-type.svelte`, configured in `widget-editor/widget-editor-modal.svelte` | `src/domains/dashboard2/widget/` |
| AI requests | profiles in `src/domains/ai/profiles/*.ts`, registered in `src/domains/ai/engine.svelte.ts`; the `ProfileName` union is in `profiles/types.ts` | `src/domains/ai/` |
| What's new | `src/config/whatsNew.json` | |

**Habit trackers** (`type: 'habit'`, `math: 'mean'`) record **1** for the first choice and **-1** for the second (`src/domains/tracker/input/habit.svelte`). The labels come from `tracker.habitChoice`, default `["Done","Failed"]`. The defaults are inconsistent between files: `habit.svelte` falls back to "Missed" for the first choice, while `widget-habit.svelte` falls back to "Achieved". **Always set `habitChoice` explicitly** for trackers you create. Fixing those fallbacks is a small separate bug fix.

---

## 3. Feature 1: Experiments

### 3.1 User story
> "I think coffee after 2pm hurts my sleep. For two weeks I'll stop, check in each day, and Daily Nomie will tell me whether my sleep quality really changed compared with before."

### 3.2 Scope of version 1
- Create an experiment from a **preset** or from scratch:
  - **the change:** a short description
  - **1 to 3 outcomes:** existing trackers to watch
  - **duration:** 7, 14, 21 or 28 days; default 14
  - **expected direction** for each outcome: up, down, or either
- **Baseline taken from existing history:** the same number of days immediately before the start. There's nothing to wait for if the user already tracks the outcome.
- **Daily check-in:** "Did you stick to it today?" One tap, recorded with an automatically created habit tracker.
- **Live progress:** day X of N, how often they kept to it, and a before-and-during chart for each outcome.
- **Result:** for each outcome, the means before and during, the difference in units and as a percentage, a 95% confidence interval, an effect size, and a verdict in plain words. An honest caveat is always shown.
- **When finished:** the result is frozen into the experiment record, and a summary log is written to the journal.
- **Not in version 1:** randomised on/off days (ABAB designs), several changes at once, sharing results, and the AI explanation (that's phase 4).

### 3.3 Data model
Create `src/domains/experiments/experiment-class.ts`:

```ts
export type ExperimentStatus = 'running' | 'completed' | 'stopped'
export type ExpectedDirection = 'up' | 'down' | 'either'
export type MissingDayRule = 'zero' | 'skip'

export type ExperimentOutcome = {
  tag: string                 // tracker tag without '#', e.g. 'sleep_quality'
  direction: ExpectedDirection
  missingAs?: MissingDayRule  // default from tracker: math 'mean' → 'skip', otherwise 'zero'
  lagDays?: 0 | 1             // 1 = the effect shows the next day (e.g. evening coffee → sleep logged next morning)
}

export type ExperimentType = {
  id?: string
  title: string               // "No coffee after 14:00"
  change: string              // what the user does differently
  adherenceTag: string        // habit tracker created for check-ins, e.g. 'exp_no_late_coffee'
  outcomes: Array<ExperimentOutcome>
  start: string               // 'YYYY-MM-DD', first day of the experiment
  durationDays: number        // 7 | 14 | 21 | 28
  baselineDays?: number       // default = durationDays
  status: ExperimentStatus
  presetId?: string
  result?: ExperimentResultSnapshot  // frozen when completed or stopped
  created?: string
  updated?: string
}
```

Follow `GoalClass` for the class and its `asObject` getter.

**Store:** create `src/domains/experiments/ExperimentStore.ts` with `createArrayStore(NPaths.storage.experiments(), { label: 'Experiments', key: 'id', … })`. Add `experiments() { return 'experiments.json' }` to `NPaths.storage` and `experiments() { return '/experiments' }` to `NPaths.routes`.

**Backups:** because the store saves through the storage engine, `experiments.json` and the check-in logs are included in v6 backups automatically. Add one test to `backup-roundtrip.spec.ts` that proves it.

### 3.4 How the numbers are built (`experiment-data.ts`)

**Windows.** `E` is the experiment window: from `start`, `durationDays` long, ending today if the experiment is still running. `B` is the baseline window: the `baselineDays` days immediately before `start`.

**Active days.** A day is *active* if the user saved at least one log that day. Find them with `LedgerStore.query` over B and E, collecting each log's `YYYY-MM-DD`. Inactive days are always skipped: if the user didn't use the app, we know nothing about that day.

**Daily value for an outcome.** Take `queryToUsageMap(...)[tag]?.byDay` over B and E. Then for each active day:
- If the day has a value, use it.
- If it has no value and `missingAs === 'zero'`, use 0. This suits counts: "no #headache logged" means no headache.
- If it has no value and `missingAs === 'skip'`, leave it out. This suits ratings such as mood or sleep quality.

**Lag.** With `lagDays: 1`, compare the change on day *d* with the outcome on day *d+1*. Shift both windows by one day for that outcome.

**Which experiment days count.** Use only the days in E whose adherence check-in is **1** (kept to it).
- Days marked -1 are left out of the outcome comparison but still count towards the adherence percentage.
- Days with no check-in are left out too. Show "You checked in on 9 of 14 days" with a way to fill in past days; a check-in is just a log with an earlier date.

**Code structure.** Keep the shaping logic pure and testable:
- `toDailySeries(dailyUsage, activeDays, missingAs): number[]`
- `selectExperimentDays(series, adherenceByDay)`

Give the async wrapper that queries the ledger a different name, and keep it thin.

### 3.5 Statistics (`experiment-stats.ts`, pure, no dependencies)

For each outcome, compare baseline values `b` with experiment values `e`:

| Output | Formula |
| --- | --- |
| `meanB`, `meanE` | arithmetic mean |
| `sdB`, `sdE` | sample standard deviation (n−1) |
| `diff` | `meanE − meanB` |
| `pct` | `diff / meanB × 100` (`undefined` if `meanB` is 0) |
| Welch t | `t = diff / sqrt(sdB²/nB + sdE²/nE)` |
| Welch df | `(vB+vE)² / (vB²/(nB−1) + vE²/(nE−1))` with `vB = sdB²/nB`, `vE = sdE²/nE` |
| `p` (two-sided) | `2 × (1 − tCdf(|t|, df))` |
| 95% CI of `diff` | `diff ± tInv(0.975, df) × sqrt(vB + vE)` |
| Cohen's d | `diff / pooledSd`, `pooledSd = sqrt(((nB−1)sdB² + (nE−1)sdE²) / (nB+nE−2))` |

**Implementing the t distribution:**
- `tCdf(t, df)`: use the regularized incomplete beta function. For t ≥ 0, `1 − 0.5 × I_x(df/2, 1/2)` with `x = df/(df+t²)`; for t < 0, use `1 − tCdf(−t, df)`. Compute `I_x` with the standard continued-fraction method (the Lentz algorithm, as in Numerical Recipes `betacf`) plus a log-gamma function (Lanczos).
- `tInv(p, df)`: bisection on `tCdf` between −1000 and 1000 to 1e-10.
- This method was checked in Node against every reference value below before this briefing was written. Converge the continued fraction to about 3e-16 and allow up to 300 iterations.
- **Zero variance:** if `sqrt(vB+vE) === 0`, then `diff === 0` gives `p = 1, d = 0`, and otherwise `p = 0, d = ±Infinity`. Never return NaN to the UI.

**Verdict for each outcome, in this order:**
1. `nB < 7 || nE < 7` → `'not-enough-data'`: "Not enough data yet: 5 of 7 days needed."
2. `p < 0.05` → `'clear'`. Compare the direction with `direction`: "as you hoped", "the opposite of what you hoped", or neutral for `either`.
3. `p < 0.20` → `'hint'`: "Possibly a difference. Keep going to be sure."
4. Otherwise → `'no-clear-difference'`.

**Effect size label** from |d|: below 0.2 "negligible", below 0.5 "small", below 0.8 "medium", otherwise "large".

**Caveat**, always shown in the UI: *"This compares your own days before and during the experiment. Other things in your life change too, and one day affects the next, so treat this as a strong hint, not proof."*

**Reference values for tests** (computed with SciPy 1.18; check to 1e-6 unless noted):

*Example A, clear effect.*
`b = [6,7,6,5,7,6,7,6,6,7,5,6,7,6]`, `e = [7,8,7,7,8,6,8,7,8,7,7,8,7,8]`

| Value | Expected |
| --- | --- |
| `meanB` | 6.214286 |
| `meanE` | 7.357143 |
| `sdB` | 0.699293 |
| `sdE` | 0.633324 |
| `diff` | 1.142857 |
| `pct` | 18.3908 |
| `t` | 4.532462 |
| `df` | 25.748830 |
| `p` | 0.00011780 (check to 1e-7) |
| 95% CI | [0.624311, 1.661404] |
| `d` | 1.713110 |
| verdict | `clear`, effect "large" |

*Example B, no effect.*
`b = [5,6,7,6,5,7,6,6,5,7]`, `e = [6,5,7,6,6,5,7,6,6,6]`

| Value | Expected |
| --- | --- |
| `diff` | 0 |
| `t` | 0 |
| `df` | 17.307692 |
| `p` | 1 |
| 95% CI | [−0.702321, 0.702321] |
| `d` | 0 |
| verdict | `no-clear-difference` |

*Example C, too few days.* Any 5 baseline values → `not-enough-data`.

*Spot checks.*

| Call | Expected |
| --- | --- |
| `tCdf(2.0, 5)` | 0.9490302606 |
| `tCdf(1.0, 10.5)` | 0.8301008037 |
| `tCdf(−2.5, 13.7)` | 0.0128923282 |
| `tCdf(4.0, 25)` | 0.9997522782 |
| `tInv(0.975, 5)` | 2.57058184 |
| `tInv(0.975, 30)` | 2.04227246 |
| `tInv(0.975, 25.74883)` | 2.05650575 |

**Result type** (frozen into `experiment.result` when the experiment ends):
```ts
export type OutcomeResult = {
  tag: string; direction: ExpectedDirection
  nB: number; nE: number; meanB: number; meanE: number; sdB: number; sdE: number
  diff: number; pct?: number; ciLow: number; ciHigh: number; p: number; d: number
  verdict: 'not-enough-data' | 'clear' | 'hint' | 'no-clear-difference'
  matchesExpectation?: boolean
  effect: 'negligible' | 'small' | 'medium' | 'large'
}
export type ExperimentResultSnapshot = {
  computedAt: string; adherence: { kept: number; missed: number; unchecked: number }
  outcomes: Array<OutcomeResult>
}
```

### 3.6 Screens and flows
- **Where it lives:**
  - Route `/experiments`: add `src/routes/Experiments.svelte` and a `<Route>` in `routes.svelte`.
  - Desktop: an item in the `navigation` array in `src/domains/layout/desktop-sidebar.svelte`, placed after Goals.
  - Mobile: the bottom tabs in `src/domains/layout/tabs.svelte` are full (Timeline, Dash, Track, Goals, More). Add an **"Experiments"** entry at the top of the Goals page (`src/domains/goals/GoalsPage.svelte`) and a row on the More page instead.
- **Experiments page:** a "Running" section with progress cards, a "Finished" section with result cards, and a "New experiment" button.
- **New experiment** (`experiment-editor-modal.svelte`, full screen, three short steps):
  1. *What will you change?* Pick a preset or write your own.
  2. *What should it affect?* Pick 1 to 3 trackers with `selectTrackables`, set the direction for each, and show a **baseline preview**: "You logged sleep quality on 12 of the last 14 days. Good baseline." If it's under 7 days, warn but allow it.
  3. *How long?* Choose 7, 14, 21 or 28 days and a start date (today or tomorrow). On confirm:
     - Create the adherence habit tracker `#exp_<slug>` with `type: 'habit'`, `habitChoice: ['Kept to it', "Didn't"]`, and the experiment's emoji or label.
     - Add it to the user's current board. `saveTrackable()` already does this through its `saveToActiveBoard` option, which defaults to `true`; pass `prompt: false` to skip its confirmation.
     - Save the experiment.
- **Experiment detail** (`experiment-detail-modal.svelte`):
  - progress ("Day 6 of 14"), an adherence bar, and missing check-ins with a "fill in" action
  - for each outcome, a before-and-during chart (reuse the existing chart components in `src/components/charts/`) and the live result
  - actions: Stop early, Finish (shown once the duration is over), Delete
- **When finished:**
  - Compute and freeze the result and set `status: 'completed'`.
  - Write one log: `Finished experiment "No coffee after 14:00": sleep_quality 6.2 → 7.4 (+18%, clear) +experiment`.
  - Write the tracker's name as plain text in that note, not as a `#tag(value)`, so the summary doesn't count as a sleep reading.
  - Offer to archive the adherence tracker by removing it from the board. Keep the tracker itself, because its history is the record.
- **Reminder:** while an experiment runs, show a small card on the Goals page and the dashboard: "Today: did you stick to *No coffee after 14:00*?" with the two habit buttons.

### 3.7 Presets (`experiment-presets.ts`)
Each preset gives a title, the change, suggested outcome *tags or names*, directions, a duration and a lag. In the editor, match each suggested outcome to the user's own trackers. If one is missing, offer to create it from the tracker library (`src/domains/library/`).

Five to start:

| Preset | Suggested outcomes | Lag |
| --- | --- | --- |
| No caffeine after 14:00 | sleep quality ↑ | 1 day |
| 30-minute walk each day | mood ↑, energy ↑ | 0 |
| No screens in the last hour before bed | sleep quality ↑ | 1 day |
| No alcohol | sleep quality ↑, mood ↑ | 1 day |
| 10-minute meditation | stress ↓, mood ↑ | 0 |

### 3.8 Dashboard widget (phase 3)
Add `{ label: 'Experiment', id: 'experiment' }` to `widget-types.ts`. Render it in a new `types/widget-experiment.svelte`, branching in `widget-display-type.svelte` the way `habit` does. Let the widget editor choose which experiment to show.

### 3.9 AI explanation (phase 4, optional)
- Add an `experiment` profile to `src/domains/ai/profiles/`, extend `ProfileName`, and register it in `engine.svelte.ts`.
- Send **only** the frozen `ExperimentResultSnapshot` plus the change and tracker names, not raw logs.
- Ask for a short explanation in plain words and one idea for a follow-up experiment.
- Never let AI produce the numbers or the verdict. Those come from `experiment-stats.ts`.

### 3.10 Phases and done criteria
1. **Engine.**
   - Build `experiment-class.ts`, `ExperimentStore.ts`, `experiment-stats.ts`, `experiment-data.ts` and the `NPaths` entries.
   - Specs cover every reference value in 3.5, the series rules in 3.4 (missing day as zero or skipped, inactive days, lag, adherence filtering), and backup inclusion.
   - *Done when* all the new specs pass and nothing else changes.
2. **Create and track.** Route, navigation entries, editor, detail view, check-in card, adherence tracker creation.
   - *Done when* Ronald can create the "No caffeine" preset on the dev instance, check in, and see the live result update.
3. **Finish.** Finishing and stopping, the frozen result, the journal log, the finished list, the dashboard widget, presets matched to the tracker library, a `whatsNew.json` entry.
4. **AI.** The experiment profile and an "Explain this result" button, shown only when AI is enabled.

---

## 4. Feature 2: Starter mode

### 4.1 Goal
A new user should get value in their first minute without facing 48 feature areas. Starter mode shows the core and keeps everything else one switch away. **It never deletes or hides data.** It only hides navigation, options and entry points.

### 4.2 Preference and migration
Add to `PreferencesStateType` in `src/domains/preferences/Preferences.ts`:
```ts
experience?: 'starter' | 'full'
starterNudgeShown?: boolean
```

**How the mode is decided.** Saved preferences replace the defaults, so existing users won't have the field. Resolve it with a pure function:
```ts
export const resolveExperience = (p: PreferencesStateType): 'starter' | 'full' =>
  p.experience ?? (p.onboarded ? 'full' : 'starter')
```
- **Existing users** (`onboarded: true`) get **full** and notice no change.
- **New users** get **starter**. Write it explicitly when onboarding finishes: in `src/domains/setup/setup.svelte`, where `$Prefs.onboarded = true` is set.
- Optionally add a choice to the setup flow: "Keep it simple (recommended)" or "Show me everything".

### 4.3 One feature registry
Create `src/domains/preferences/features.ts`:

```ts
export type FeatureId =
  | 'analytics' | 'blockly' | 'afternomie' | 'plugins' | 'ai' | 'files'
  | 'uoms' | 'csv' | 'advanced-tracker-options' | 'advanced-widgets'
  | 'people-board' | 'context-board' | 'experiment-advanced'

export const STARTER_HIDDEN: ReadonlyArray<FeatureId> = [ /* all of the above */ ]

export const isFeatureVisible = (prefs: PreferencesStateType, id: FeatureId): boolean =>
  resolveExperience(prefs) === 'full' || !STARTER_HIDDEN.includes(id)

// Convenience store for components: $FeatureVisible('analytics')
export const FeatureVisible = derived(Prefs, ($p) => (id: FeatureId) => isFeatureVisible($p, id))
```

Every check goes through `isFeatureVisible` or `FeatureVisible`. Don't scatter `experience === 'starter'` checks around the code. That way, deciding what starters see means changing one list.

### 4.4 What starters see and where to gate

| Area | Starter | Full | Where to gate |
| --- | --- | --- | --- |
| Track, Timeline, On This Day, Dashboard, Goals, **Experiments** | shown | shown | nothing to change |
| Analytics (pivots) | hidden | shown | `navigation` array in `desktop-sidebar.svelte`; `/analytics` in `routes.svelte` |
| Blockly | hidden | shown | sidebar `blockly` item; `/nomie-blockly` route |
| AfterNomie, Files, Units of measure | hidden | shown | routes `/afternomie`, `/files`, `/uoms`; their entries on the settings and More page |
| Plugins | hidden | shown | `src/domains/plugins/plugins-more-menu.svelte` and the plugin entries on the settings page; plugin widget types in `widget-types.ts` |
| AI settings, AI chat, Insight widget | hidden | shown | `SettingsAIList` in `settings-page.svelte`; the `insight` widget type |
| CSV import and export | hidden (backup stays) | shown | the CSV items in `settings-data-list.svelte`; `/settings/export/csv` route |
| Advanced tracker options (math, scoring, combo, defaults) | hidden | shown | `trackable-editor-modal.svelte`. `$Prefs.betaFeatures` already gates a block there (around line 422); use the same pattern |
| Widget types | value, bar chart, line chart, habit, text, positivity, experiment | all | filter the list in `widget-types.ts` |
| Experiment options (baseline length, lag, missing-day rule) | collapsed or hidden | shown | the experiment editor |
| Search commands for hidden areas | hidden | shown | `src/domains/search/unisearch-commands.ts` |

**Hidden routes:** when a starter opens a hidden route directly, through a bookmark or a link, show a small page instead of a 404: *"This is part of the full Daily Nomie. Switch to full mode?"* with a button. Build it once, for example `src/domains/preferences/feature-gate.svelte`, and wrap each gated route in it.

### 4.5 Switching modes
- **Settings → Customize** (`settings-features-list.svelte`): an "Experience" item with the choices **Starter** and **Full**, and a one-line explanation. Switching is instant and safe both ways.
- **A gentle nudge, shown once:** after the user has logged on 14 different days, or when `LaunchCount` (`src/domains/preferences/LaunchCount.ts`) reaches 30, ask: *"You've been tracking for two weeks. Want to see everything Daily Nomie can do?"* Then set `starterNudgeShown: true`.
- **Restoring a backup:** `experience` travels with preferences in v6 backups. That's fine: restoring a full user's backup turns full mode on.

### 4.6 Tests and done criteria
- **Specs:**
  - `resolveExperience`: new users get starter, existing users get full, and an explicit value always wins.
  - `isFeatureVisible`: every `FeatureId` is visible in full mode, and exactly the `STARTER_HIDDEN` ones are hidden in starter mode.
  - The widget-type filter.
- **Done when:**
  - A fresh profile finishes setup in starter mode, and the sidebar, More page, widget picker and tracker editor show only starter items.
  - Switching to full mode shows everything without a reload.
  - An existing profile is unchanged after the upgrade.

---

## 5. Version bump to Daily Nomie 7
- Set `package.json` to `"version": "7.0.0"` (recommended) or keep the `dn` style (`dn7.0.0v2026…`). Both work: since the backup fix, restore detects the format by its contents, and the older importer treats any version from 4 up the same way.
- **Don't rename** the PouchDB database key `nomie6-pouch` (`src/domains/storage/engines/pouchdb/engine.pouchdb.ts`), the `data/` root, or any `localStorage` keys. Renaming any of them makes existing users' data unreachable.
- Update the "Nomie 6" text users see:
  - `src/domains/layout/layout.svelte`: the page `<title>`
  - `src/domains/whats-new/whats-new-modal.svelte`
  - the support email subject in `src/domains/settings/settings-page.svelte`
  - the manifest `name` in `manifest.js`
  - the `<title>` in `index.html`
- Add `whatsNew.json` entries for Experiments and Starter mode.

---

## 6. Decisions for Ronald (ask when you reach them)
1. Experiments on mobile: an entry on the Goals page, or a separate bottom tab that replaces one of the current five?
2. Should starters see Experiments presets only, or also "write your own"?
3. Is the starter widget list in 4.4 right? Should Pointers or To-dos be included?
4. Should the setup flow ask Starter or Full, or always start in Starter?
5. Version string: `7.0.0` or `dn7.0.0v<date>`?
6. Is the AI explanation (Experiments phase 4) part of 7.0, or a 7.1 item?
