# Daily Nomie — Analysis & Improvement Plan

16 October 2026 · Ronald de Lange

> **Snapshot from 16 October 2026**, analysing `dailynomie/nomie6-oss` at version `dn6.8.0v20260928`. Some findings have been fixed since: backup and restore, Experiments, Starter mode, and the "Daily Nomie" name in the page title and manifest. `ROADMAP.md` gives the current status of each item.

## Executive summary

Daily Nomie is the most actively developed descendant of Nomie, and 2026 turned it from a maintenance fork into a real product: a full Svelte 5 migration, an AI layer, analytics, habits, goals, pointers and a template builder. The feature set now outruns the foundations. The app ships as one 7.4 MB JavaScript file, CI never runs the tests, and the new AI features send private journal data through paths that need hardening. The live app still calls itself Nomie 6 and has an empty privacy policy.

The five moves with the most leverage, in order:

1. **Make it fast again.** Split the 7.4 MB bundle (2.2 MB gzipped) by route; Plotly, Blockly, Leaflet and the AI SDK should load only when used. Target under 600 kB gzipped for first load.
2. **Put a safety net under the velocity.** 579 commits landed in June 2026 alone. Run the 244 existing tests plus a build on every pull request, and fix the one test that fails today.
3. **Treat AI as a privacy feature, not just a smart one.** Publish a real privacy policy, stop logging keys and payloads in `api-server.js`, show users exactly what context is sent, and add any OpenAI-compatible endpoint so Ollama or LM Studio can keep everything local.
4. **Lean into the note-as-data idea.** Nomie's `#tracker(value) @person +context` notation is its real moat. AI that turns plain speech into that notation, and an MCP server that lets assistants read and log, extend it without abandoning it.
5. **Lower the sync barrier.** Self-hosting CouchDB is the main wall between Daily Nomie and non-technical users. An end-to-end encrypted, turnkey sync option would widen the audience more than any single feature.

## What Daily Nomie is today

Daily Nomie (version `dn6.8.0v20260928`) is a local-first PWA life tracker forked from Nomie 6 after Happy Data closed nomie.app and open-sourced it. The original project now points to your fork as the maintained version.

| Area | Current state |
| --- | --- |
| Stack | Svelte 5.22 (all 509 components opted into runes), Vite 5, TypeScript, Tailwind |
| Storage | Local (LocalForage) by default; PouchDB with self-hosted CouchDB for sync |
| Data model | Every log is a text note; `#tracker(value)`, `@person` and `+context` are parsed at read time |
| Distribution | Static build, GitHub Pages, Docker image on GHCR |
| AI | Claude via browser SDK or local proxy, OpenRouter (default free tier); 7 profiles: advice, alert, chat, data, insight, journal, narrative |
| Extensibility | iframe plugins, Blockly as built-in automation, tracker library, templates |
| Languages | English, German, Italian, Simplified Chinese |
| Codebase | \~87k lines across 509 Svelte and 354 TS/JS files, 48 feature domains |
| Tests | 55 spec files, 244 tests (Vitest): 243 pass, 1 fails |
| Community | r/nomie, GitHub; 0 open issues at time of review |

Recent releases added the AI chat and Insight widget, dual-axis charts, PIN-encrypted API keys, the finished template builder, habits, weekly and monthly goals, pointers and reminders, AfterNomie, a Location Manager and a pivot-style Analytics platform.

Commit activity shows two phases: steady maintenance from 2023 to 2025 (typically 5 to 45 commits a month), then a step change from April 2026, peaking at 579 commits in June during the Svelte 5 migration and AI work.

## Strengths to build on

Daily Nomie's advantages are structural, and most competitors cannot copy them quickly.

- **Notation as data.** A log is a readable sentence that is also structured data. It survives export, is greppable, and is ideal input and output for language models.
- **Local-first and private by default.** No account, no server needed. In a market where mood and health apps monetise data, this is a selling point worth stating loudly.
- **Extremely flexible tracking.** Trackers, people, context, locations, pointers, goals, habits and templates cover more ground than Daylio, Bearable or Exist individually.
- **A modern foundation.** The Svelte 5 migration is complete: every component now opts into runes, ahead of what `CLAUDEDOCUMENTATION/MIGRATION_PROGRESS.md` still says (38.9%).
- **Real extensibility.** iframe plugins plus Blockly give power users automation without forking.
- **Good test seeds in the core.** The tokenizer, ledger, stats, goals and storage merge logic all have specs, which is exactly where regressions would hurt most.
- **An inheritance of goodwill.** The upstream repo directs users to you, and the r/nomie community already treats Daily Nomie as Nomie's continuation.

## Engineering findings

I cloned `dailynomie/nomie6-oss` at the 28 September 2026 release, installed it, ran the tests, audited dependencies and built it. Findings are ordered by impact; severity is my judgement.

### Performance

| Finding | Evidence | Fix |
| --- | --- | --- |
| One 7.4 MB JS bundle | `vite build` emits `index-*.js` at 7,401 kB (2,263 kB gzipped); CSS 303 kB; only 5 dynamic imports in the codebase | Lazy-load every route in `routes.svelte`; use `manualChunks` for vendors |
| Full Plotly shipped to everyone | `plotly.js` 2.35 is used only by the Analytics pivot table (`domains/analytics/Pivot-table`) | Dynamic import, or switch to `plotly.js-basic-dist-min`, or reuse Chart.js |
| Two chart libraries | Chart.js in 4 files, Plotly in 6 | Standardise on one long term |
| Heavy optional features eager | Blockly, Leaflet, emoji data (1,570-line file), Anthropic SDK in main chunk | Load on first open of each feature |

On a mid-range phone, 2.2 MB of gzipped JS means several seconds of parse time on every cold start, which matters most for a tap-and-log app.

### Security and privacy

| Finding | Evidence | Fix |
| --- | --- | --- |
| Proxy logs secrets and personal data | `api-server.js` logs the first 10 characters of the API key and up to 500 characters of the request payload (journal context) | Remove both logs; never log bodies |
| Proxy open to any origin | `app.use(cors())` with no allow-list; anyone who can reach port 5002 can relay through it | Restrict origin, bind to localhost by default |
| PIN-derived key encryption is weak | `crypto-storage.ts` uses PBKDF2 with 100,000 iterations and AES-GCM, but a 4-digit PIN has only 10,000 possibilities, so the stored key can be brute-forced in seconds | Label it as obfuscation, or require a passphrase; consider WebAuthn PRF where available |
| Free-tier AI by default | OpenRouter `openrouter/free` routes data to unspecified free models, whose providers may log prompts | Make the default explicit opt-in with a clear data notice |
| Debug routes in production | `/test`, `/test-ai` and `ArrayStoreTest` are routable | Gate behind a dev flag |
| Dependency vulnerabilities | `npm audit`: 12 in production deps (2 critical, 8 high), 83 total; critical `maplibre-gl` arrives via Plotly | Fixing Plotly removes several; run `npm audit fix`, add Dependabot or Renovate |

### Quality and delivery

- **CI never runs tests.** Both workflows only build and publish Docker images. The older one triggers on branches `maix` and `dex`, which look like typos, so it never runs.
- **One test is failing.** `goals.spec.ts` "DONTDOIT goal" expects more than 11 day scores and gets exactly 11. It fails in UTC and in Europe/Amsterdam, so it is a real regression or an outdated expectation, not a timezone flake.
- **No end-to-end tests.** The README still credits Cypress, but none exists. A few Playwright smoke tests (capture a log, see it on the timeline, export and re-import) would guard the paths users care about.
- **The 300-line rule is drifting.** `template-editor.svelte` is 1,207 lines, `context-builder.ts` 952, `usage-chart.svelte` 814, `LedgerStore.ts` 744.
- **Pinned Svelte.** `svelte` is locked to 5.22.0 while the ecosystem has moved on; plan a deliberate bump.
- **Backup format churn.** September's commits show several reverts and fixes in backup import and export. Backups are the one thing that must never break: add round-trip tests with fixture files from each historical version.

### Repository hygiene

- Finder duplicates are committed: `TrackableStore 2.ts`, `trackable-editor-modal 2.svelte`, two logo SVGs, and `.claude/settings 2.json`.
- The `.claude/` folder, including a scheduled-tasks lock file, is committed; add it to `.gitignore`.
- The root holds nine working notes (`PHASE1_TEST_REPORT.md`, `NPM_AUDIT_*`, `CONTEXT_TRACKER_BUG_FIX.md` and more); move them to `docs/`.
- `package.json` `homepage` and `repository` point to `dailynomie/nomie-oss`, not `nomie6-oss`.
- The README is still upstream's text: first-person "I" is Brandon's voice, it asks for Node 16, and it says nothing about what Daily Nomie adds.
- **Brand risk.** The README states Nomie and the elephant are registered trademarks of Happy Data. Get written permission for "Daily Nomie", or plan a distinct name and mark before the audience grows.

## The live app at app.dailynomie.com

The hosted app still presents itself as upstream Nomie and has gaps in privacy disclosure that matter more now that it ships AI and analytics. I fetched the live front page, service worker and version file on 16 October 2026. The manifest and privacy page came back as unreadable or empty, and response headers were not visible, so those rows come from the repo's deploy config.

| Finding | Evidence | Fix |
| --- | --- | --- |
| Empty privacy policy | `public/privacy.md` is 0 bytes and has been since the first commit in 2022, yet the app loads Plausible analytics and offers Anthropic and OpenRouter | Write a short policy: what stays local, what Plausible collects, what each AI provider receives |
| Analytics tagged as the dev site | `index.html` loads self-hosted Plausible with `data-domain="dev.dailynomie.com"` | Set the production domain at build time, so production and dev stats separate |
| Branding says Nomie 6 | Live page title is "Nomie 6 OSS", the iOS home-screen title is "Nomie 6", the manifest name is "Nomie 6 dev" | Rename to Daily Nomie everywhere a user sees it |
| Pinch-zoom disabled | Live viewport sets `maximum-scale=1` and `minimum-scale=1` | Remove both; blocking zoom fails WCAG 1.4.4 for low-vision users |
| No security headers | `public/_headers` sets only asset caching and a CORS allowance for `browser.blockstack.org`, a service that no longer exists; no Content-Security-Policy, Referrer-Policy or frame protection | Add a CSP that allow-lists the AI and plugin origins; drop the Blockstack line |
| Dead API redirect | `netlify.toml` routes `/api/*` to Netlify functions, but the `functions/` folder does not exist | Remove it, or deploy the proxy there deliberately |
| No install shortcuts | The manifest has screenshots and maskable icons but no `shortcuts` or `share_target` | Add both (see Capture speed below) |
| Stale version file | Live `/version.json` returns `"6"` while the app is `dn6.8.0v20260928` | Generate it at build time and use it for the update prompt |

The live service worker is a Workbox build with 22 precached files, including the whole main bundle, plus four runtime caches. One rule deserves a change: every `.js` and `.css` URL is served **cache-first for 30 days**. That is safe for hashed files in `assets/`, but it also catches unhashed ones such as `js/vendors.js`, `plugins/1.0/connect.js`, plugin scripts and the Plausible script. A fix to any of those can take up to a month to reach installed users. Limit cache-first to `/assets/` and use stale-while-revalidate for everything else.

The Docker image, which self-hosters use, needs the same care. It serves `dist/` from stock nginx with no config, so there is no gzip (the 7.4 MB bundle goes over the wire uncompressed), no SPA fallback (refreshing a deep link returns 404), and no headers. It also copies only `package.json` and runs `npm install --force`, ignoring the lockfile, so two builds of the same commit can differ. Ship an `nginx.conf` with gzip, `try_files $uri /index.html` and the headers above, and build with `npm ci`.

## Product and UX improvements

The biggest product gap is not features but how quickly a new user gets value, and how safely they keep their data.

**Onboarding and focus**

- Offer three starter setups on first run (mood and sleep, habits, health symptoms) built from the tracker library and templates, so the first board is useful in under a minute.
- Hide advanced areas (Blockly, Analytics pivots, AfterNomie, plugins) behind a "Power features" toggle until the user has logged for a week. Today 48 domains compete for attention.
- Write a Daily Nomie README and a short docs site: what's new versus Nomie, how to host, how to sync, how AI works.

**Capture speed**

- Add a PWA `share_target` and URL shortcut (for example `/capture?note=#water(1)`) so iOS Shortcuts, Android Tasker and widgets can log without opening the app.
- Add PWA `shortcuts` in the manifest for the top three trackers.
- Make AI capture the default text box behaviour when a provider is set: type "slept badly, two coffees, walked with Em" and get a previewed `#sleep #coffee(2) #walk @em` note to confirm.

**Trust in data**

- Scheduled automatic backups to a user-chosen folder via the File System Access API, plus a visible "last backup" age on the dashboard.
- A backup verifier that re-imports into a scratch database and reports counts before the user relies on it.
- An "AI data preview" drawer showing the exact context each profile will send, with per-tracker opt-outs (for example exclude `#medication`).

**Insight**

- Built-in correlation view without AI: pick two trackers, see same-day and next-day correlation with sample size. AI can explain it, but the maths should stand on its own.
- A weekly review screen generated from the existing `narrative` and `journal` profiles, saved as a log so it becomes part of the record.

**Accessibility and reach**

- Only 55 files use `aria-` attributes across 509 components; audit the capture flow and track board with a screen reader first.
- Dutch is a natural next language given your base, and Spanish or French would reach the largest new groups.

## Innovation bets

The strongest bets build on what only Daily Nomie has: a human-readable data notation and a private, local-first store.

| Bet | What it is | Why it fits Daily Nomie | Smallest first step |
| --- | --- | --- | --- |
| Nomie notation spec | Publish `#tracker(value) @person +context` as an open, versioned format with a tiny parser library | Makes the format the product; others can write to it (scripts, other apps, AI) | Extract `modules/tokenizer` into an npm package with its existing specs |
| MCP server | A local Model Context Protocol server exposing "query logs", "summarise period" and "add log" | Lets Claude Desktop and other assistants use your data without sending a whole history; natural follow-on to the AI engine | Read-only server over a backup file, then live over CouchDB |
| Natural-language and voice capture | Speak or type freely; a model converts it to notation and the user confirms | The note format is literally what an LLM produces well; capture friction is the main reason trackers are abandoned | Add a "capture" profile alongside the existing seven |
| Fully local AI | Any OpenAI-compatible base URL (Ollama, LM Studio) plus optional in-browser WebLLM | Keeps the privacy promise intact while offering AI; `LOCAL_LLM_EXAMPLE.md` shows the demand already exists | One generic provider next to Anthropic and OpenRouter |
| Personal experiments | Define an n-of-1 experiment ("no coffee after 14:00 for 3 weeks"), with baseline, intervention and a significance readout | Turns tracking into answers, which is what Bearable and Exist users pay for | A goal type with start and end dates plus a before/after comparison |
| Turnkey encrypted sync | Client-side encrypted replication to a hosted CouchDB, or to WebDAV/Nextcloud | Removes the biggest adoption wall without breaking local-first; could fund the project | Encrypt documents before PouchDB replication; trial with existing CouchDB users |
| Native shell | Capacitor wrapper for home-screen widgets, reliable notifications and Apple Health / Health Connect import | PWAs cannot read health data or show real widgets | Import steps, sleep and heart rate into trackers on a daily schedule |
| Plugin directory | A curated, signed index of community plugins and Blockly recipes inside the app | Plugins exist but discovery does not; a directory turns users into contributors | A JSON index in a GitHub repo, rendered in the plugins modal |

If you pick only two, choose **natural-language capture** (it improves every session) and **fully local AI** (it protects the brand promise while AI features grow).

## Suggested roadmap

Spend the next month on stability before adding features: every later phase depends on CI catching regressions.

The original roadmap had four phases: (1) Stabilise: CI, the failing test, proxy logging, debug routes, dependencies, repository cleanup. (2) Speed and trust: route code-splitting, lazy Plotly and Blockly, backup fixture tests, automatic backups, AI data preview. (3) Faster capture: local AI providers, natural-language logging, PWA share target and shortcuts, starter setups, correlation view. (4) Platform: notation package, MCP server, encrypted sync, native shell with Health import, plugin directory.

> **Superseded:** `ROADMAP.md`, written on 19 October 2026, replaces this section. It reflects what has been built since and puts the iOS redesign before the 7.0 release.

Phases 1 and 2 are mostly invisible to users but make every later feature cheaper and safer. Phase 3 is where users feel the difference; phase 4 is where Daily Nomie becomes a platform rather than an app.

## Sources

- [dailynomie/nomie6-oss](https://github.com/dailynomie/nomie6-oss): cloned at commit of 28 September 2026; `npm install`, `vitest run`, `npm audit` and `vite build` run on 16 October 2026
- [dailynomie/nomie6-oss issues](https://github.com/dailynomie/nomie6-oss/issues): 0 open
- [open-nomie/nomie6-oss](https://github.com/open-nomie/nomie6-oss): upstream README pointing to Daily Nomie
- [r/nomie](https://nyc1.lr.ggtyler.dev/r/nomie/controversial): Daily Nomie habit and goals announcement
- [app.dailynomie.com](https://app.dailynomie.com/): front page fetched on 16 October 2026; manifest, service worker and headers were not reachable, and www.dailynomie.com could not be fetched
