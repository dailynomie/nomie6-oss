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
