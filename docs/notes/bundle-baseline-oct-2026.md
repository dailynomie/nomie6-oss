# Bundle baseline, 22 October 2026

Measured with `ANALYZE=<file> npm run vbuild` (the report is written by `rollup-plugin-visualizer`, raw data). Branch `v7-dev`, commit with the visualizer switch.

## Totals

| | Size |
| --- | --- |
| All modules, minified | 11,595 kB |
| All modules, gzipped | 3,248 kB |
| `index-*.js` first load (from the build output) | 7,682 kB, 2,371 kB gzipped |

Target for M1 (docs/ROADMAP.md): first load under 600 kB gzipped.

## Largest packages (gzipped, all chunks)

| Package | Gzipped | Raw | Note |
| --- | --- | --- | --- |
| plotly.js-dist-min | 1,307 kB | 4,467 kB | Only the analytics pivot uses it (P3, decision D12). The biggest single item. |
| lodash | 159 kB | 675 kB | Imported per function in 2 files (`lodash/throttle`, `lodash/escapeRegExp`, `lodash/dropRight`). Likely pulled in whole by another dependency; check. |
| leaflet | 114 kB | 457 kB | Map screens only (P3). |
| @anthropic-ai/sdk | 112 kB | 412 kB | Only `src/domains/ai/engine.svelte.ts`, imported at the top (P3). |
| chart.js | 77 kB | 360 kB | Used by the app; the other chart library is Plotly (N6: one chart library). |
| pouchdb | 75 kB | 298 kB | The sync engine. Needed on start for the storage layer. |
| src/n-icons | 69 kB | 130 kB | Icons, all bundled. Could be loaded per use. |
| svelte | 69 kB | 192 kB | Runtime. |
| crypto-js | 61 kB | 241 kB | Used by the PIN and API-key encryption. |
| src/lang | 57 kB | 187 kB | All languages are in the bundle (en, de, it, zh-cn, test, nl). Load only the active language (P3 extension). |
| muuri | 55 kB | 243 kB | Grid layout. |
| esri-leaflet | 34 kB | 124 kB | Map. |
| widget/types | 31 kB | 86 kB | Dashboard widget components (lazy per widget type is possible). |
| experiments | 27 kB | 93 kB | Experiments screens (lazy route, P2). |
| qrcode | 25 kB | 73 kB | Used by the AfterNomie and backup QR codes. |

## What this means for the plan

- Plotly is roughly half of the gzipped total. Lazy-loading it (P3) moves it out of the first load. That is the biggest single win, and it does not need the decision on replacing it.
- Leaflet, the Anthropic SDK, the language files, the icons and the dashboard widgets can all move out of the first load with lazy imports (P2 and P3).
- The first load also includes everything for every route. P2 (lazy routes) is needed for the 600 kB target.

## After P2 and part of P3 (branch perf/lazy-routes)

| | Before | After |
| --- | --- | --- |
| First load `index-*.js` | 7,682 kB, 2,371 kB gzipped | 2,339 kB, **750 kB gzipped** |

What moved out of the first load: 18 pages (each its own chunk), Plotly (1.3 MB gzipped, now loaded when the analytics page opens), and the Anthropic SDK (loaded for a Claude request).

Still in the first load, in order of size: the map (Leaflet and esri-leaflet, about 150 kB gzipped; the map is used by Timeline, which is a start page), the language files (all six are bundled), lodash (imported in several places), and the icons. The target of 600 kB gzipped needs the map and the languages to move as well.

## Languages on demand: tried, not kept (22 October)

The other languages were moved out of the first load: the language registry loads the chosen language before the app starts (`main.ts` awaits it, then imports the app), and workers are built as ES modules, since the CSV worker imports the domain code.

The result: the languages save about 34 kB gzipped, but the start chunks grew from 675 kB to 690 kB (the app chunk, the shared chunk and the main chunk together). The change was reverted; it does not reduce the first load. The next step is to find out what the 593 kB app chunk holds (see the roadmap, P3 and P7).

## After the app chunk analysis (22 October, branch perf/lazy-routes)

The static import graph from the app was analysed. The largest items that were in the first load, and are now lazy or removed:

- **lodash** (about 144 kB gzipped): the usage files imported all of it, for three functions. Replaced by plain JavaScript.
- **Chart.js and its annotation plugin** (about 96 kB gzipped): only the stats screen uses them. The stats modal now loads when it opens.
- **The markdown viewer** (about 30 kB gzipped): the privacy policy and the terms. Loads when opened.
- **The template editor** (about 13 kB gzipped): loads when opened.

First load now: `index-*.js` 561 kB gzipped, plus a shared chunk of 44 kB, so about **605 kB gzipped**. Target: 600 kB.

Still in the first load (candidates for the next step): PouchDB (about 75 kB, needed for the CouchDB sync only, but the storage layer picks the engine at start), the emoji data (18 kB, opens with the emoji picker), canvas-confetti (7 kB), tributejs (12 kB, the textarea mentions), papaparse (7 kB, the CSV import).

## Result of the first-load work (22 October, branch perf/lazy-routes)

First load: `index-*.js` 537 kB gzipped, plus a shared chunk of 44 kB, **about 581 kB gzipped**. Target 600 kB, reached. From 2,371 kB at the start of the work.

The last two items: the emoji list (about 18 kB) and the confetti library (about 7 kB) now load when they are used.

Not in the first load any more: the routes (except Track and Timeline), Plotly, the map, the Anthropic SDK, the stats modal with Chart.js, the markdown viewer, the template editor, lodash (for the usage files), the emoji list and the confetti.

## Vendor chunks, precache, offline, Lighthouse (22 October)

- **P5, vendor chunks:** Svelte, dayjs and PouchDB are in their own files. They change less often than the app, so they stay cached after an update.
- **P6, precache:** the service worker precaches the shell (`index.html`, the manifest, the app icons, the top-level images, the CSS and the main JS). The award pictures and the widget icons are not precached; they and every page are cached the first time they are used. The precache is 67 files, about 3.0 MB, most of it the app code.
- **Offline:** checked on the production build (`vite preview`): after visiting Track, Goals, Analytics and Settings online, all four open offline with no errors.
- **Lighthouse (mobile, performance):** score **67**, target 80. First contentful paint 4.2 s, largest contentful paint 5.4 s, total transfer 715 kB.

What Lighthouse reports for the first screen:
- **Unused JavaScript:** about 307 kB in the main chunk. Code that the Track screen does not use is still loaded at start: modal components that are imported by the stores. This is the largest item.
- **Render-blocking CSS:** the main stylesheet (35 kB gzipped) delays the first paint by about 150 ms, and about 32 kB of its rules are unused.
- **Fonts:** the Nunito font is named in the splash SVG files, and Lighthouse counts it as a request on the start page. It is not loaded by the app's code.

## Modals on demand, and the Lighthouse score after it (22 October)

- Twelve modals (the tracker editor and selector, the importer and CSV import, unisearch, the location manager, the plugin screens, the streak, goal and pivot editors, the writing prompts, the widget editor and the tracker library) now load when they open. Their stores no longer import them at the top.
- Start chunks: the main file 392 kB gzipped, the Svelte, dayjs and PouchDB files 69 kB. Total about **461 kB gzipped** (from about 582).
- **Lighthouse, mobile performance: 71** (target 80). First contentful paint 3.8 s, largest contentful paint 4.9 s, total blocking time 150 ms, total transfer 638 kB.
- What is still unused on the Track screen: 244 kB of the main file (transferred) and 36 kB of PouchDB. Next step: split the components the Track screen does not show first (the log editor, the tile editor and similar), and check what the render-blocking CSS (35 kB) holds that the first screen does not use.

## The Timeline on demand: Lighthouse 80 and up (22 October)

The Timeline screen was in the first load, although Track is the start page. It is now a lazy page. Lighthouse mobile performance on the Track start page, three runs: **98, 87 and 97** (target 80). The first contentful paint is 1.6 s in each run. The variation between runs is in the largest contentful paint (2.0 s to 4.0 s).

Still in the first load: about 240 kB of unused JavaScript in the main file, and 36 kB of PouchDB. These are not needed for the score target now, but they remain the next step for the first load.
