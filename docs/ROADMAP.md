# Daily Nomie 7: roadmap

Written 22 October 2026, on the `v7-dev` branch (`dev` on the `v7` remote), version `7.0.0`.

This roadmap replaces the 19 October roadmap (now removed) (19 October 2026). Section 1 checks every item of that roadmap against the code, so the open points are clear. Section 2 lists the work done since then, which was not in the old roadmap. Sections 4 to 6 are the plan for the 7.0 release, the performance work, and the innovation for 7.0. The rules in section 3 apply to every task.

The rules for working on a task, and the rules for backups, Starter mode and AI, are unchanged from the old roadmap. The old section 2 rules are repeated in section 3 with the new guardrails added.

---

## 1. Status of the 19 October roadmap

| Item | Status | Evidence | What is left |
| --- | --- | --- | --- |
| S1 Tests in CI | **Done** | `.github/workflows/test.yml` runs `npm ci`, `vitest run` and `vbuild`. `publish.yaml` is gone. | Branch protection so that "test" must pass before merging. This is a GitHub setting. |
| S2 "Don't do it" goals | **Done** | `goals.spec.ts` checks that a day with no log counts as a success. `toBeGreaterThan(11)` is gone. | Nothing. Decision D8 is answered by the test. |
| S3 AI proxy leaks secrets | **Superseded, with a new issue** | There is no `api-server.js` and no port 5002 in `dev`. The `fix/api-server-logging` branch exists only as a branch. | The AI calls go **straight from the browser** to Anthropic (`src/domains/ai/engine.svelte.ts`, `dangerouslyAllowBrowser: true`) and to OpenRouter (`services/openrouter.ts`). The API key is in the browser. The unused route `src/routes/api/ai/+server.ts` is a leftover. See N1 below. |
| S4 Debug routes | **Done** | `routes.svelte` wraps `/test` and `/test-ai` in `{#if import.meta.env.DEV}`. | Lazy imports, which belong to M4. |
| S5 Privacy policy | **Mostly done** | `public/content/privacy.md` has text (1,183 bytes), and the app opens it from `MarkdownModalStore.ts`. | Ronald's approval of the text (D10). Check that the text matches the AI behaviour in N1. |
| S6 Repository hygiene | **Mostly done** | The Finder duplicates are gone. `.claude/` is ignored. The root notes are in `docs/notes/`. `homepage` points to `dailynomie/dailynomie7`. `version.json` is gone. `README.md` is rewritten for Daily Nomie 7. | `netlify.toml` still names a `functions/` directory that does not exist. Remove it with S7. |
| S7 Deployment | **Partly done** | `public/_headers` has the security headers and a report-only CSP, and the blockstack origin is gone. `Dockerfile` uses `npm ci --legacy-peer-deps`. `nginx.conf` exists. | `netlify.toml` still has the `functions/` setting (D11 for the CSP). Check that the Docker image serves deep links and gzip. |
| S8 Service worker cache | **Done** | `vite.config.mjs`: `/assets/*.js|css` is CacheFirst, and other `.js|css` is StaleWhileRevalidate (line 113). | Nothing. |
| S9 Dependency health | **Partly done** | `.github/dependabot.yml` is set up, weekly and grouped. | `npm audit` has not been run again. The critical findings through Plotly remain (D12). |
| S10 Pinch zoom | **Open** | `index.html` still has `maximum-scale=1` (line 16). | Decision D6. |
| M2 iOS look and feel | **Partly done** | Many screens are done on this branch: tokens, the tab bar and central button, the More page, Experiments, the dashboard, the tile menu, the grouped lists (see section 2). | The design guide phases 0 to 6 are not signed off screen by screen. Ronald's approval is open. |
| M3 Release 7.0 | **Open** | `package.json` is at 7.0.0 and `whatsNew.json` exists. | The test matrix, the one-time "make a fresh backup" prompt, the whatsNew check, the tag and the deploy. |
| M4 Speed | **Open** | The `vbuild` output (22 October) shows `index-*.js` at **7,682 kB, 2,371 kB gzipped**. Target: under 600 kB gzipped. | Everything in section 5. |
| M5 Trust and capture | **Mostly open** | Experiments are complete. The Dutch translation is complete (part of T8). | T1 automatic backups, T2 AI data controls, T3 local AI, T4 capture, T5 share target (not in `manifest.js`), T6 starter setups, T7 correlation view (no file yet), T8 accessibility, T9 Playwright. |
| M6 Platform | **Open** | Not started. | N1 to N7, as before, plus the new items in section 6. |

**Decisions (section 9 of the old roadmap):**

| # | Decision | Status |
| --- | --- | --- |
| D1 to D5 | Central button, tracker grid columns, tracker icons, page background, capture Save colour | Not recorded as answered. Ronald to confirm against the approved mockups. |
| D6 | Pinch zoom | **Answered: no pinch zoom.** `maximum-scale=1` stays; this is a design rule (UI-09). |
| D7 | Collapsing large title | Open |
| D8 | "Don't do it" goals count days without logs as successes | **Answered: yes**, by the test and the code. |
| D9 | Naming and the Nomie trademark | Open. Needed before the announcement. |
| D10 | Privacy policy text | **Approved 22 October.** The text is in `public/content/privacy.md`. |
| D11 | CSP strictness and allowed origins | Report-only is in place. Enforcing needs the reports. |
| D12 | Plotly: lazy-load or replace | Open |
| D13 | Hosted sync | **Answered 22 October: Ronald offers a hosted CouchDB service next to self-hosting; users choose.** The privacy text must reflect this (W18). |
| D14 | `version.json` | **Answered: removed.** |
| D15 | `publish.yaml` | **Answered: deleted.** |

---

## 2. Done since 19 October (not in the old roadmap)

This is work that was done in the branch and never tracked. It is listed here so that the roadmap matches the code.

**Language (i18n)**
- Every visible string goes through `Lang.t` in templates and in script code. The check `docs/guardrails/checks/lang-checks.sh --all` passes with zero violations.
- Dutch (`src/lang/nl.ts`) covers all 1,579 base keys. The LANG-07 check enforces it. Nomie slang (track, tracker, habit, pointer, people, board, tab, pivot, streak, goal, log, note, template) stays in English in every language, and so do the page headers (LANG-10).
- The dates follow the language (dayjs locale, `src/store/lang.ts`).
- The other languages (German, Italian, Simplified Chinese, tester) are reported but not enforced, because they are missing 1,450 to 1,550 keys and fall back to English.

**Guardrails**
- `docs/guardrails/` now has the UI rules (`ui-design.md`), the language rules (`language.md`) and the checks in `checks/`.
- New rules: UI-12 (one colour base per grouped list; check `ui-checks.sh`), LANG-10 (Nomie slang), LANG-11 (text in script code, check `lang-script-scan.py`).
- The UI check still fails on older violations in files this branch touches: palette classes (UI-04), native controls (UI-02), click handlers on div (UI-05) and a few others. These are the largest open quality item (section 5, Q1).

**Screens and components**
- Settings: the More page sections each have a colour base (teal for data, purple for features, blue for about, orange for tweaks, green for Views), one titled list per section, and the Experiments flask.
- Experiments: the flask is the one icon, in the tab bar, the radial menu, the sidebar, the board tab, the empty states and the widget.
- Dashboard: a text widget always spans the full width, and has no size.
- Tracker tile menu: the outline shows on all four sides.
- Spinner: the blank spacer entity no longer shows as text.

**Fixes**
- `title="${plugin.name} status"` showed the raw template text. Fixed.
- Placeholder values were HTML-escaped by i18next. Fixed.

---

## 3. Rules for every task

**Checks before every commit:**
- `npx vitest run` passes (367 tests on 22 October).
- `npm run vbuild` succeeds.
- `bash docs/guardrails/checks/lang-checks.sh --all` reports zero violations.
- `bash docs/guardrails/checks/ui-checks.sh` reports no new MUST violations in the files you changed.
- Anything visible is checked at 390 px and 1280 px, in light and dark mode, in Starter and Full mode, and in English and Dutch.
- Prettier passes on the changed files.

**Data must never be lost:**
- Never rename storage keys or databases: the PouchDB name `nomie6-pouch`, the `data/` root, file names such as `trackers.json` and `experiments.json`, or `localStorage` keys.
- Backups are detected by their **shape**, never by the version string. Backups never contain the PIN, the storage type, AI keys or server tokens. Restoring twice changes nothing. See `docs/guardrails/storage.md (section 6)` section 5.
- New persistent data goes through `createArrayStore` or `createKVStore`, so backups include it. Add a round-trip test in `src/domains/storage/backup-roundtrip.spec.ts`.

**Product rules:**
- What Starter mode hides is decided only in `STARTER_HIDDEN` and `STARTER_WIDGET_TYPES` (`src/domains/preferences/experience.ts`). Use `$FeatureVisible(id)` in components.
- AI never sends data unless the user has enabled it. Numbers come from code. AI explains them (the experiment verdicts come from `experiment-stats.ts`).
- Colours come from the tokens (UI-04, UI-07). A grouped list has one colour base (UI-12).
- Every visible string is translatable (LANG-01, LANG-11), and Nomie slang stays English (LANG-10).
- Add a `src/config/whatsNew.json` entry for anything a user will notice.

**Git:**
- One logical change per commit, with a conventional commit message. The commits in this branch end with the `Co-Authored-By` trailer the session asks for.
- Do not push, merge or open a pull request without an explicit go-ahead from Ronald.

**Sizes:** S is half a day or less, M is 1 to 3 days, L is 1 to 2 weeks, XL is more than 2 weeks.

---

## 4. Plan for Daily Nomie 7.0

The 7.0 release has four parts, in this order: close the open stabilisation items (M0), make it fast (M1), close the functional gaps (M2), and add three small innovations (M4). Then release (M3).

### M0. Close the open items · S–M

| # | Task | Size | Done when |
| --- | --- | --- | --- |
| C1 | **AI key in the browser: decided, keep the browser calls (D16).** Remove the unused `src/routes/api/ai/+server.ts`. Add a short notice where the key is entered: the key is used from the browser, and the request goes straight to the provider. | S | **Decided 22 October.** The file is removed and the notice is in the AI settings. |
| C2 | Remove the Netlify configuration. **Done:** Netlify is not used, `netlify.toml` is removed. `nginx.conf` already has `try_files` for deep links and gzip. | S | **Done for the code.** The Docker check (build, a refresh on `/goals`, gzip in the response) is done by Ronald. |
| C3 | Ronald approves the privacy text (D10). | S | **Done 22 October.** The approved text is in `public/content/privacy.md`. |
| C4 | **Decided: no pinch zoom (D6).** `maximum-scale=1` stays; the rule is UI-09 and the check enforces it. | S | **Done.** Close. |
| C5 | `npm audit`: the non-breaking fixes are applied (`fc4f99a7`). 73 findings remain. Shipped: `plotly.js` and `maplibre-gl` (critical), and the `uuid` chain under PouchDB 6. The rest are development tools. | S–M | **Partly done.** Plotly is tied to P4; PouchDB to the sync work (see W16). Development tools: upgrade in a separate pass. |
| C6 | Branch protection on `dev` and `master`: the "test" check must pass. | S | Set on GitHub, and tested with a failing branch. |
| C7 | Remove the blockstack origin from `public/_headers` if it is still in use anywhere. | S | **Done.** No blockstack reference is left in the code. |

### M1. Performance · M–L

**Goal:** first load under 600 kB gzipped JS. Today: 2,371 kB gzipped, from one `index-*.js` of 7,682 kB.

| # | Task | Size | Done when |
| --- | --- | --- | --- |
| P1 | **Measure.** The bundle report is switched on with `ANALYZE=<file>`, and the baseline is in `docs/notes/bundle-baseline-oct-2026.md`. Plotly is the largest item (about 1.3 MB gzipped). | S | **Done 22 October.** |
| P2 | **Lazy routes.** 18 pages load on first use (`src/routes/lazy-page.svelte`). Track and Timeline stay eager. | M | **Done 22 October** (branch `perf/lazy-routes`). Every route was checked in the browser with no page errors. |
| P3 | **Lazy heavy libraries.** Done: Plotly, the Anthropic SDK, the map, lodash in the usage files, the stats modal and Chart.js, the markdown viewer, the template editor, the emoji list, the confetti. Tried and not kept: the languages on demand (see the bundle note). | M | **Done 22 October.** First load about 581 kB gzipped (from 2,371). Target 600 kB, reached. |
| P4 | **Plotly decision (D12).** Lazy loading is in place (P3). Replacing Plotly with Chart.js is still open. | M | **Partly done.** The status "decided" was wrong; D12 is still open. |
| P5 | **Vendor chunks** with `manualChunks` for Svelte, dayjs and PouchDB. | S | **Done 22 October.** See `docs/notes/bundle-baseline-oct-2026.md`. |
| P6 | **Service worker precache.** Only the shell and the start files are precached; the rest is cached on first use. | S | **Done 22 October.** Offline checked after visiting Track, Goals, Analytics and Settings. |
| P8 | **Unused code in the first load.** Done so far: twelve modals, the Timeline, the AI chat and the markdown renderer, the languages (chosen one only). Start is about 393 kB gzipped. Lighthouse mobile on Track: median 83 over six runs, with runs between 79 and 99 on a busy machine. The target of 80 is not yet reliable. Open: PouchDB (about 44 kB; needs a decision, it opens the database when the module loads) and lodash (about 60 kB across the start path). | M | **Open.** The earlier note "97 or higher" was from a single quiet run and is not a reliable result. |
| P7 | **Pivot and widget cost.** Check the analytics and dashboard render times on a phone with 5 years of logs. | M | Recorded, with the slow parts fixed. |

**Done when:** first-load gzipped JS is under 600 kB, Lighthouse mobile performance is at least 80, and offline works after the first visit.

### M2. Functional gaps · M–L

| # | Task | Size | Done when |
| --- | --- | --- | --- |
| F1 | **Automatic backups** (old T1): a schedule, a folder via the File System Access API where supported, reminders elsewhere, the last backup's age on the dashboard. | M | A backup is made on the schedule and restores. |
| F2 | **Restore preview and replace mode** (old T1, `BACKUP_PATCH_BRIEFING.md` section 7): counts and conflicts before anything is written, and a snapshot before a replace. | M | A preview shows the counts before the restore. |
| F3 | One-time "make a fresh backup" prompt. **Done 22 October:** shown once to users with trackers, English and Dutch. | backup | S |
| F4 | **Accessibility pass** (old T8): capture, Track and Experiments with a screen reader. Check tap targets and contrast on the iOS tokens. | M | The checks pass and the issues found are fixed. |
| F5 | **Dutch review:** Ronald reviews `nl.ts`, the slang rule (LANG-10) and the page headers. | S | Approved. |
| F6 | **Other languages:** decide whether German, Italian and Simplified Chinese are kept for 7.0, and if so complete them (1,450 to 1,550 keys each) or hide them. | M–L | Decided. If kept, LANG-07 passes for them. |
| F7 | **Date and number formats** on pivot tables and charts follow the language (the pivot library shows English weekday names). | S | Dutch shows Dutch weekdays in the pivot. |
| F8 | **Bugs found on the way:** the related-view count (`Math.abs(results?.length || 0 - …)`, see N2) and the three old UI violations that are on screens we touched. | S | Fixed or recorded. |
| F9 | **Playwright smoke tests** (old T9): log a note, see it on the timeline, backup and restore round trip. In CI. | M | Green in CI. |
| F10 | **Encrypted sync, opt-in (N4): moved to 7.1** (decision 22 October). Depends on C5 (the PouchDB upgrade). The 7.0 privacy text says sync is not encrypted, which stays true for 7.0. | 7.1 | XL |
| F11 | **Privacy text for the hosted service.** **Done 22 October:** the sync section names the hosted service and says the sync data is not encrypted. Approved by the maintainer. | M2 | S |

### M3. Release 7.0 · S

Follows the old milestone 3, with these changes:
1. Merge into `dev`, deploy to the dev instance, and Ronald tests for a few days.
2. The test matrix from the old roadmap (phone and desktop, themes, Starter and Full, new and existing users, backup and restore, CouchDB sync, Experiments, radial menu).
3. `whatsNew.json`: Experiments, Starter mode, the new look, the central menu, backups that include everything, Dutch, the text widget.
4. Naming (D9) confirmed before the announcement.
5. Merge into `master`, tag `v7.0.0`, check the Docker image and production, and announce on r/nomie and the website.

### M4. Innovation for 7.0 · M each

These three build on things that already exist, so they are small enough for 7.0. Each one keeps the rule that AI explains and code calculates.

| # | Innovation | What the user gets | Built from | Size |
| --- | --- | --- | --- | --- |
| I1 | **Correlations** (old T7): pick two trackers and see same-day and next-day links, with the number of days behind each. | "Your coffee days are followed by lower mood days, 9 of 14 times." An experiment can be started from the result. | `experiment-stats.ts`, the experiment presets, the Experiments check-in flow. | M |
| I2 | **Capture with confirmation** (old T4), first as a plain text box on Track: "slept badly, two coffees, walked with Em", then the app proposes `#sleep …  #coffee(2)  #walk @em`, and the user confirms before anything is saved. | Fast logging in one line. Nothing saved without confirmation. | The existing tokenizer (`src/modules/tokenizer/`), the `journal` AI profile. | M |
| I3 | **Weekly review** (old N7): on Sunday, a short summary of the week, saved as a log only if the user keeps it. | A reflection without extra effort. | The `narrative` and `journal` AI profiles, the stats in `src/domains/stats2`. | S–M |

I1 and I3 need no new AI provider. I2 works without AI, because the tokenizer does the proposal; AI is only an optional better parser.

---

## 4a. Open from the end-user walks (October 2026)

The end-user walks are in `docs/notes/end-user-walks-oct-2026.md`. Most of the bugs found there are fixed. These are the items still open. The walk was done with a new user, so most are about wording and first-run clarity.

| # | Item | Where | Size |
| --- | --- | --- | --- |
| W1 | Jargon in the UI. **Partly done 22 October:** the widget editor says "Tracker" instead of "Trackable". The board name "Main" and "Share Tracker" are kept for now. | tracker and board screens | S |
| W2 | One date format from the locale. **Done 22 October:** every full date uses the language's short date (10/22/2026 in English, 22-10-2026 in Dutch). Compact labels use the same date without the year. Checked in the browser on Track, dashboard and history; Timeline and search were not checked because the test profile has no logs. | Timeline, search, capture, Track | M |
| W3 | Timeline range message. **Checked 22 October:** the old message is gone from the code; the empty state now says "No entries yet". | timeline | S |
| W4 | Goal editor: the missing fields are named ("Still needed: …"). **Checked 22 October: done.** | goal editor | S |
| W5 | "No recent backups" banner. **Checked 22 October: done.** It shows only after launch 5, and once a tracker exists. | layout | S |
| W6 | Setup wording. **Done 22 October:** the preferences groups have labels, the storage slide says "Choose one to continue.", the disabled Nomie Server option gives its reason, and the FREE label is gone. | setup | S |
| W7 | The "Tap for more" hint on the central button. **Checked 22 October: done.** It is shown once and remembered (`menuHintSeen`). | layout | S |
| W8 | Track tiles: the subtitle is no longer clipped by the menu button. **Checked 22 October: done** (28 px of padding on the text). | Track tiles | S |
| W9 | Dashboard empty state: "Add a Widget" appears once. **Checked 22 October: done.** | dashboard | S |
| W10 | Widget picker: a fade at the right edge shows that the row of types scrolls, and the no-tracker line is shown when there are no trackers. **Done 22 October.** | widget editor | S |
| W11 | Settings for a new user. **Done 22 October:** the maintenance rows sit under an Advanced heading, and starters do not see that group (the Starter list hides it; Full mode shows it). The People board toggle is already hidden for starters. | settings | M |
| W12 | Typo in the backup dialog. **Checked 22 October: done.** The text reads "how much data". | backup | S |
| W13 | Experiment wizard, step 2: a suggested tracker the user does not have shows "Tracker not added yet", and one clear action replaces the two overlapping ones. **Done 22 October.** | experiments | S |
| W14 | Capture: the "No Match Found!" bubble is gone; a new tag is offered when the note is saved. **Done 22 October.** | capture | S |
| W15 | Splash: the logo and the "Daily Nomie 7" title overlap while the app loads. **Parked by Ronald**; the overlap is in `public/images/nomie-splash-on-blue-ai.svg` and needs the designer. | splash | parked |
| W16 | **CouchDB sync is not encrypted:** the notice is on the sync form (not encrypted, the operator can read it, use https, protect the server), and an http:// address shows a warning. Still open: whether the encrypted sync (N4) moves up into 7.0 (D13). | sync setup | **Notice done 22 October** (checked for compile and text, not yet in the browser). D13 open. |
| W17 | **AI key notice:** under the key field: the requests go straight from this browser to the provider, the key stays on this device, and a short PIN gives little protection. | AI settings | **Done 22 October** (English and Dutch; checked in the browser). |
| W18 | **Privacy text for the hosted sync service (F11).** **Done 22 October**, approved. | privacy text | S |

---

## 5. Quality items to run alongside

| # | Item | Why | Size |
| --- | --- | --- | --- |
| Q1 | **Legacy UI violations.** `ui-checks.sh --all` reports 93 MUST violations: palette classes (UI-04, 81 hits in the files on this branch), native controls (UI-02), click handlers on divs (UI-05), and arbitrary Tailwind values (UI-01). Fix them in the files we touch, and then by area. | The guardrail should pass on the whole source. | M (ongoing) |
| Q2 | **TypeScript.** Run `npx tsc --noEmit`, record the error count (about 1,550 in the old roadmap, not re-measured), and stop it growing. | Type errors hide bugs. | M (ongoing) |
| Q3 | **Large files:** `template-editor.svelte` (about 1,200 lines), `ai/context-builder.ts` (about 950), `usage-chart.svelte` (about 810), `LedgerStore.ts` (about 740). Split when touched. | Easier review and faster builds. | M (when touched) |
| Q4 | **Script-side text gap.** LANG-11 does not scan template literals with `${…}` (for example `` `${label} updated` ``). | Those strings stay English in Dutch. | S |
| Q5 | **Svelte upgrade.** Svelte is pinned at 5.22.0; later versions hang the boot (memory note). Check the upstream fix before the upgrade. | Current Svelte version and fixes. | M |

---

## 6. Later (7.1 and 7.2+)

These are carried over from the old roadmap, with the new items marked.

**7.1 Trust and capture**
- **T2 AI data controls:** an "AI data preview" showing exactly what each request sends, per-tracker opt-out (for example `#medication`), an explicit OpenRouter default with a data notice, and an honest description of the PIN-based key encryption (`crypto-storage.ts`): a 4-digit PIN can be brute-forced.
- **T3 Local AI:** an OpenAI-compatible provider with a base URL, so Ollama or LM Studio keep data on the device.
- **T5 Share target and shortcuts:** `share_target` and `/capture?note=…` in `manifest.js`. The manifest has no `share_target` yet.
- **T6 Starter setups:** three onboarding starts (mood and sleep, habits, health).
- **N1 (new) Move AI calls behind a key the user controls.** See the note below.

**7.2+ Platform**
- **N2 Notation package:** extract `src/modules/tokenizer/` with its spec into an npm package.
- **N3 MCP server:** read-only over a backup file first, then over CouchDB, then "add log".
- **N4 Encrypted sync:** in 7.1 as opt-in (F10), and then the whole chain (transport and server side).
- **N5 Native shell:** Capacitor for home-screen widgets, notifications and Apple Health or Health Connect.
- **N6 Plugin directory:** a curated JSON index, shown in the plugins modal.
- **N7 Upgrade Svelte** deliberately (Q5).

**Notes on the new items**

- **N1, AI and the key in the browser.** The app calls Anthropic from the browser with `dangerouslyAllowBrowser: true`, so the key is in the browser, and any script on the page can read it. Options: a small server that holds the key (the old proxy idea, with no logging of bodies or keys, CORS to the app's origin, and the local bind from the old S3), or keep the browser calls and say so plainly in the privacy policy and the AI settings. This is decision D16 and it comes before the 7.0 release.
- **N2 (related-view count).** `src/domains/related/related-view.svelte` computes `Math.abs(results?.length || 0 - Object.keys(usages).length)`. The `||` binds looser than `-`, so the count is `results.length` when there are results, and the number of usages otherwise. The intent is probably `Math.abs((results?.length || 0) - usages)`. Decision D17, because it changes what the screen shows.

---

## 7. Decisions for Ronald

Ask when a task reaches the decision. Record the answer in the commit message or the pull request.

| # | Decision | Needed for |
| --- | --- | --- |
| D1 to D5 | Central button, tracker grid columns, tracker icons, page background, capture Save colour (check against the approved mockups) | M2 |
| D6 | Pinch zoom | **Answered: no pinch zoom** (UI-09). |
| D7 | Collapsing large title | M2 |
| D9 | Naming and the Nomie trademark | M3 |
| D10 | Privacy policy text | **Approved 22 October** (C3). |
| D11 | CSP strictness and allowed origins | C2 and the enforcing CSP |
| D12 | Plotly: lazy or Chart.js | P4, and C5 (critical findings in plotly.js) |
| D13 | Hosted sync or self-hosted only | **Answered: both.** Encrypted sync (N4) is in 7.1 as opt-in (F10). |
| D16 | AI key in the browser | **Answered: keep the browser calls.** The privacy text says so, and a notice is shown where the key is entered (C1). |
| D17 | The related-view count: which intended formula | F8 |
| D18 | Other languages for 7.0: keep German, Italian and Simplified Chinese (complete them) or hide them | F6 |

---

## 8. Quick start prompts

- **Start M0:**
  > Read @docs/ROADMAP.md sections 0 to 4 and section 3. Start C1 on a branch `fix/ai-key-browser`. Ask me decision D16 first, and do not change the AI code before I answer.
- **Start M1:**
  > Read @docs/ROADMAP.md section 4 M1. Do P1 first, save the baseline report in `docs/notes/`, and show me the five largest modules before changing anything.
- **Start an innovation:**
  > Read @docs/ROADMAP.md section 4 M4 and the rules in section 3. Start I1 (correlations) on a branch `feat/correlations`, reusing `experiment-stats.ts`. AI may explain the result, never compute it.
