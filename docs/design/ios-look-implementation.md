# Daily Nomie 7: iOS look, implementation guide

This guide is for Claude working in VS Code on the Daily Nomie 7 repository (`dailynomie/dailynomie7`, branch `dev`), with the maintainer, Ronald. It explains how to restyle the app to the approved iOS-style design, in light and dark mode, without changing what the app does.

It was written against the `dev` branch as of 19 October 2026, version `7.0.0`, which already includes Experiments, Starter mode, the central radial menu and the Experiments board. Every file path below was checked against that branch.

**Reference material**
- The approved mockups are on a private design canvas. Ronald can open it and share screenshots: https://claude.ai/artifact/2VFEw9hqkEuo8qhbCPZEyy
- The mockup source files come with this guide as `dn7-ios-mockups.zip`. Each `.dc.html` file is one screen written as HTML with inline styles. **Read them for exact sizes, colours and spacing.** They are a visual reference, not code to copy: they use a design-tool format (`<x-dc>`, `{{holes}}`, `<sc-for>`) that isn't Svelte.

---

## 0. How to work on this

1. **Read this whole guide first**, then the mockup file for the screen you're working on.
2. **This is a visual change only.** Don't change stores, data, routes, props, event handlers, Starter mode rules or experiment logic. If a visual change seems to need a logic change, stop and ask Ronald.
3. **Work in the phases in section 9**, on a branch such as `feat/ios-look`. Finish a phase, check it in light **and** dark mode at phone width (390 px) and desktop width (1280 px), then commit before starting the next.
4. **Tokens first, components second, screens last.** Most screens should improve automatically once the shared components use the tokens.
5. **Tailwind is version 2.2, without JIT** (`tailwind.config.js` has `purge` and no `mode: 'jit'`). Arbitrary values such as `bg-[#F2F2F7]` or `rounded-[18px]` **don't work**. Use the token classes added in section 2, or plain CSS in the component's `<style>` block.
6. **Dark mode is class-based.** `setDocumentTheme()` in `src/domains/preferences/Preferences.ts` puts `dark` or `light` (plus `mode-dark` / `mode-light`) on `<html>`. Tailwind's `dark:` variants follow the `dark` class. The new CSS variables switch on `html.dark`, so token classes need no `dark:` variant.
7. **Run the tests after each phase** with `npx vitest run`. Nothing here should change a test result.
8. Section 10 lists decisions that are Ronald's. Ask about them when you reach them.
9. **When this guide doesn't cover an item, don't skip it.** Look up the best iOS look and feel for that item (Apple's Human Interface Guidelines, or a current reference on iOS UI), then apply it in line with the rest of this guide: the same tokens (section 2), the same shapes and type sizes, and the same light and dark rules. Say in your reply which iOS pattern you chose, and add the decision to this guide under the matching section so the next change follows it too.
10. **Missing icons: add them, don't leave them out.** When a screen needs an icon that isn't in `src/n-icons/` or `src/components/icon/nicons.ts`, look first in the Ionicons package in `node_modules/ionicons/dist/svg/` (the outline version, for example `save-outline.svg`). If it isn't there, find the Ionicons outline glyph on the internet. Add it the same way as the others: a `src/n-icons/<Name>.svelte` file copied from an existing one (viewBox 512, `currentColor`, `size` prop, `<title>`), then an import and an `export const <Name> = <Name>Icon` line in `src/components/icon/nicons.ts`. Use the same stroke width as the set. Say in your reply which icon you added.

---

## 1. Design principles

- **Content on grouped cards.** A light grey page (dark: black) with white rounded cards (dark: `#1C1C1E`) holding lists, widgets and forms. No borders around cards. Depth comes from the contrast between background and card.
- **Large titles.** Each main screen starts with a 34 px bold title, with small actions (text buttons or 36 px round icon buttons) in a 44 px row above it.
- **One accent colour.** Nomie blue, `#0A6CC9` in light mode and `#4DB3FF` in dark, for anything you can tap: links, the selected tab, primary buttons, progress.
- **Colour means something.** Green means done or kept to it, amber means possible, blue means running, grey means neutral. Tracker colours appear only on icon squares and charts.
- **Translucent bars.** The tab bar and bottom action bars blur what's behind them.
- **Touch targets are at least 44 × 44 px.** Text contrast is at least 4.5:1. Every colour pair in this guide was checked (section 2.1).
- **Numbers use the rounded system font** (`ui-rounded`), so values read like the iOS Health app.
- **No gradients, no emoji as UI icons, no heavy shadows.** Tracker emoji are user content and stay as they are.

---

## 2. Design tokens

### 2.1 Colours

Add these as CSS variables (section 2.5). Contrast ratios are text on its usual background and were checked with the WCAG formula.

| Token | Light | Dark | Use | Contrast |
| --- | --- | --- | --- | --- |
| `--ios-bg` | `#F2F2F7` | `#000000` | Page (grouped background) | |
| `--ios-card` | `#FFFFFF` | `#1C1C1E` | Cards, list groups, tiles | |
| `--ios-card-2` | `#F2F2F7` | `#2C2C2E` | Boxes inside cards (stat boxes, check-in area) | |
| `--ios-label` | `#000000` | `#FFFFFF` | Main text | 21:1 / 17:1 |
| `--ios-label-2` | `#6C6C70` | `#AEAEB2` | Secondary text, inactive tabs, captions | 5.23 on card, 4.69 on bg / 7.69 on card, 9.50 on bg |
| `--ios-fill` | `#E5E5EA` | `#2C2C2E` | Chips, secondary buttons, segmented-control track, progress track | |
| `--ios-separator` | `#D8D8DC` | `#48484A` | 0.5 px row dividers; grid dividers | Dark value changed Oct 2026 from `#38383A` (decided by Ronald): the old value was too faint on the dark card |
| `--ios-tint` | `#0A6CC9` | `#4DB3FF` | Accent: links, selected tab, primary buttons, progress | 5.25 on white / 7.46 on `#1C1C1E` |
| `--ios-on-tint` | `#FFFFFF` | `#000000` | Text on tint buttons | 5.25 / 9.21 |
| `--ios-tint-soft` | `#E3EFFB` | `#0B2236` | Tinted backgrounds (experiment icon square, "During" box) | |
| `--ios-good` | `#1E7A34` | `#30D158` | Done, success text and badges | 5.40 / 8.42 |
| `--ios-good-soft` | `#DDF3E2` | `#123620` | Done backgrounds | |
| `--ios-save` | `#1E7A34` | `#30D158` | The green Save button in the capture area | white 5.40 / black 10.39 |
| `--ios-on-save` | `#FFFFFF` | `#000000` | Text on Save | |
| `--ios-danger` | `#D70015` | `#FF6961` | Delete, destructive actions | 5.38 / 6.03 |
| `--ios-switch-on` | `#34C759` | `#34C759` | Switch track when on (not text) | |
| `--ios-switch-off` | `#E3E3E8` | `#39393D` | Switch track when off | |

**Chips (status pills).** These are the four `ChipTone` values in `src/domains/experiments/experiment-chip.svelte`.

| Tone | Light background / text | Dark background / text | Contrast (light / dark) |
| --- | --- | --- | --- |
| `running` (blue) | `#E3EFFB` / `#0A5BA8` | `#0B2236` / `#7CC6FF` | 5.86 / 8.78 |
| `positive` (green) | `#DDF3E2` / `#1E6B30` | `#123620` / `#5BE07F` | 5.62 / 7.89 |
| `possible` (amber) | `#FDF0D5` / `#7A4D00` | `#3A2A06` / `#FFD60A` | 6.44 / 9.83 |
| `neutral` (grey) | `#EEEEF2` / `#55555A` | `#2C2C2E` / `#C7C7CC` | 6.41 / 8.28 |

**Icon squares** use white glyphs on these colours. They're for icons only: green and orange are under 4.5:1 with white, so never put text on them.

| Name | Hex | Used for in the mockups |
| --- | --- | --- |
| purple | `#8944AB` | Mood |
| indigo | `#3634A3` | Sleep, Theme |
| blue | `#0A6CC9` | Water, location, Experiments |
| orange | `#C25E00` | Coffee, Start page, Plugins |
| green | `#248A3D` | Walk, Back up now, CSV |
| pink | `#C2185B` | Meds, Analytics |
| red | `#D70015` | Headache |
| teal | `#0E7C86` | Meditate, Restore, Experiments board |
| grey | `#6C6C70` | PIN, Text size |

**Charts** (dashboard and experiment detail):

| Series | Light | Dark |
| --- | --- | --- |
| Mood line | `#8944AB`, area fill at 12% | `#DA8FFF`, area fill at 16% |
| Sleep bars | today `#3634A3`, others `#C9C8EE` | today `#A5A3FF`, others `#34335E` |
| Water ring | `#0A6CC9` on `#DCEAF8` | `#4DB3FF` on `#14324B` |
| Goal history (7 days) | hit `#34C759`, miss `#D1D1D6` | hit `#30D158`, miss `#48484A` |
| Experiment bars | before `#AEAEB2`, during = tint | before `#636366`, during = tint |

**Materials and shadows:**

| Token | Light | Dark |
| --- | --- | --- |
| `--ios-bar` (tab bar, bottom action bars) | `rgba(249,249,249,0.92)` + `backdrop-filter: blur(20px)` | `rgba(22,22,24,0.92)` + blur 20px |
| `--ios-bar-border` (top hairline, 0.5 px) | `rgba(0,0,0,0.2)` | `rgba(255,255,255,0.16)` |
| `--ios-scrim` (behind the radial menu) | `rgba(0,0,0,0.38)` + blur 3px | `rgba(0,0,0,0.55)` + blur 3px |
| `--ios-shadow-float` (floating cards) | `0 6px 24px rgba(0,0,0,0.12)` | `0 6px 24px rgba(0,0,0,0.6)` |
| `--ios-shadow-thumb` (segmented thumb) | `0 2px 6px rgba(0,0,0,0.12)` | `0 2px 6px rgba(0,0,0,0.5)` |
| `--ios-shadow-hub` (central button) | `0 6px 16px rgba(10,108,201,0.35)` | `0 6px 16px rgba(77,179,255,0.30)` |

**About the brand blue.** Tailwind's `primary` scale stays for the logo and brand moments. Interactive elements move to `--ios-tint`. White text on `#00A4E4` is 2.83:1 and on `primary-500` (`#00aaff`) 2.56:1, both under the 4.5:1 minimum. So `bg-primary-500 text-white` buttons become tint buttons (section 5.4).

### 2.2 Typography

Font stack for all UI text:
```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
-webkit-font-smoothing: antialiased;
```
For numbers and values (tile values, stats, ring centres):
```css
font-family: ui-rounded, -apple-system, system-ui, sans-serif;
```
On Android and Windows these fall back to the system font. That's intended.

| Style | Size / line height | Weight | Where |
| --- | --- | --- | --- |
| Large title | 34 / 41, letter-spacing 0.37px | 700 | Screen titles: Track, Timeline, Dashboard, My Goals, Experiments, More |
| Title 1 | 28 / 34 | 700 | Experiment detail title |
| Title 2 value | 22–30 rounded | 700 | Tile values, stat numbers, mood average |
| Title 3 | 20 / 25 | 700 | Timeline day headings ("Today") |
| Headline | 17 / 22 | 600 | Card titles, nav bar title, button labels |
| Body | 17 / 22 | 400 | List rows, notes, inputs |
| Subhead | 15 / 20 | 400–600 | Tile titles (600), timeline note text, check-in question |
| Footnote | 13 / 18 | 400–600 | Secondary lines, section headers (uppercase), segmented labels |
| Caption 1 | 12 / 16 | 400–600 | Chip text, tile subtitles, caveat |
| Caption 2 | 11 / 13 | 400 | Chart axis letters |
| Tab label | 10 / 12 | 500, 600 when selected | Tab bar |

**Section headers** above grouped lists are 13 px, uppercase, letter-spacing 0.3px, `--ios-label-2`, with padding 22px top, 7px bottom and 16px left.

### 2.3 Spacing and layout

- **Page side gutter:** 16 px. Floating cards near the bottom use 12 px.
- **Base unit:** 4 px. Most gaps are 8, 12 or 16.
- **Gap between cards:** 12 px. Between a section header and its card: 7 px.
- **Rows:** minimum 44 px high, or 52 px with a second line. Padding is 16 px left, and 16 px right on the inner content.
- **Row dividers:** 0.5 px `--ios-separator`, starting where the text starts, not at the card edge. With a 29 px icon square that's 16 + 29 + 12 = 57 px from the left.
- **Safe areas:** top content starts below `env(safe-area-inset-top)` (54 px in the mockups). The tab bar is 49 px plus `env(safe-area-inset-bottom)` (83 px total in the mockups).
- **Floating elements** (capture area, check-in card) sit 112 px above the bottom edge on phones, so they clear the raised central button.

### 2.4 Shape

| Element | Corner radius |
| --- | --- |
| Tracker tile | 18 px |
| Dashboard and experiment cards | 16 px |
| Grouped list card | 12 px |
| Capture area (floating) | 22 px |
| Check-in card (floating) | 18 px |
| Primary and secondary buttons (44 px high) | 12 px |
| Pill buttons, board tabs (34–36 px high) | half the height (17–18 px) |
| Chips | 10 px |
| Segmented control: track / thumb | 9 px / 7 px |
| Icon squares: 29 px / 34 px / 40 px | 7 / 9 / 11 px |
| Round icon buttons (36 px) | 18 px |
| Central button (58 px) | 29 px |
| Progress bar (6 px high) | 3 px |

### 2.5 Where to put the tokens

**1. `src/style/main.css`:** add at the top, after the existing `:root` block:
```css
:root {
  --ios-bg: #F2F2F7; --ios-card: #FFFFFF; --ios-card-2: #F2F2F7;
  --ios-label: #000000; --ios-label-2: #6C6C70;
  --ios-fill: #E5E5EA; --ios-separator: #D8D8DC;
  --ios-tint: #0A6CC9; --ios-on-tint: #FFFFFF; --ios-tint-soft: #E3EFFB;
  --ios-good: #1E7A34; --ios-good-soft: #DDF3E2;
  --ios-save: #1E7A34; --ios-on-save: #FFFFFF; --ios-danger: #D70015;
  --ios-switch-on: #34C759; --ios-switch-off: #E3E3E8;
  --ios-bar: rgba(249,249,249,0.92); --ios-bar-border: rgba(0,0,0,0.2);
  --ios-scrim: rgba(0,0,0,0.38);
  --ios-shadow-float: 0 6px 24px rgba(0,0,0,0.12);
  --ios-shadow-thumb: 0 2px 6px rgba(0,0,0,0.12);
  --ios-shadow-hub: 0 6px 16px rgba(10,108,201,0.35);
  --ios-font: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
  --ios-font-rounded: ui-rounded, -apple-system, system-ui, sans-serif;
}
html.dark {
  --ios-bg: #000000; --ios-card: #1C1C1E; --ios-card-2: #2C2C2E;
  --ios-label: #FFFFFF; --ios-label-2: #AEAEB2;
  --ios-fill: #2C2C2E; --ios-separator: #38383A;
  --ios-tint: #4DB3FF; --ios-on-tint: #000000; --ios-tint-soft: #0B2236;
  --ios-good: #30D158; --ios-good-soft: #123620;
  --ios-save: #30D158; --ios-on-save: #000000; --ios-danger: #FF6961;
  --ios-switch-off: #39393D;
  --ios-bar: rgba(22,22,24,0.92); --ios-bar-border: rgba(255,255,255,0.16);
  --ios-scrim: rgba(0,0,0,0.55);
  --ios-shadow-float: 0 6px 24px rgba(0,0,0,0.6);
  --ios-shadow-thumb: 0 2px 6px rgba(0,0,0,0.5);
  --ios-shadow-hub: 0 6px 16px rgba(77,179,255,0.30);
}
```
Also set the page background and font:
- `html` uses `background: var(--ios-bg)`. This replaces `@apply bg-gray-200 dark:bg-gray-800` and the `html.mode-dark` rule.
- Replace the v7 tint rule `html:not(.dark) .n-layout.bg-gray-100 { background-color: #f2f4f8 }` with `.n-layout { background: var(--ios-bg) }`.
- `body` uses `font-family: var(--ios-font); color: var(--ios-label); -webkit-font-smoothing: antialiased`.

**2. `tailwind.config.js`:** extend so templates can use token classes. Tailwind 2.2 accepts CSS variables as plain colour strings; opacity modifiers like `bg-ios-card/50` won't work, and aren't needed.
```js
extend: {
  colors: {
    // keep gray.950 and primary as they are
    ios: {
      bg: 'var(--ios-bg)', card: 'var(--ios-card)', card2: 'var(--ios-card-2)',
      label: 'var(--ios-label)', label2: 'var(--ios-label-2)',
      fill: 'var(--ios-fill)', separator: 'var(--ios-separator)',
      tint: 'var(--ios-tint)', ontint: 'var(--ios-on-tint)', tintsoft: 'var(--ios-tint-soft)',
      good: 'var(--ios-good)', goodsoft: 'var(--ios-good-soft)',
      save: 'var(--ios-save)', onsave: 'var(--ios-on-save)', danger: 'var(--ios-danger)',
    },
  },
  borderRadius: { tile: '18px', card: '16px', group: '12px', chip: '10px', float: '22px' },
  fontSize: {
    'ios-large': ['34px', { lineHeight: '41px', letterSpacing: '0.37px' }],
    'ios-title1': ['28px', { lineHeight: '34px' }],
    'ios-title3': ['20px', { lineHeight: '25px' }],
    'ios-body': ['17px', { lineHeight: '22px' }],
    'ios-subhead': ['15px', { lineHeight: '20px' }],
    'ios-footnote': ['13px', { lineHeight: '18px' }],
    'ios-caption': ['12px', { lineHeight: '16px' }],
    'ios-caption2': ['11px', { lineHeight: '13px' }],
  },
  minHeight: { tap: '44px' },
  minWidth: { tap: '44px' },
},
```
The new classes are `bg-ios-card`, `text-ios-label2`, `border-ios-separator`, `rounded-tile`, `text-ios-large` and so on. Check that `npm run vbuild` still succeeds after changing the config.

---

## 3. Navigation chrome

### 3.1 Screen header (large title)
**Where:** `src/domains/layout/layout.svelte` holds the sticky `<header class="... glass ...">` that wraps each page's `slot="header"`. Pages fill it using `ToolbarGrid` (`src/components/toolbar/toolbar-grid.svelte`) and an `h1.ntitle`.

**Target on phone width:**
- A 44 px **action row**: left action (a text button such as "Edit", or a 36 px round fill button with an icon), the right action likewise. No title text in this row.
- Below it, the **large title**: `h1`, `text-ios-large`, weight 700, colour `--ios-label`, 16 px side padding.
- An optional **subtitle** below that: 15 px, `--ios-label-2` (for example "Monday 19 October" or "3 of 4 reached today").
- The header background is `--ios-bg`, not glass, until the page scrolls. On scroll, the 17 px semibold title may appear in the action row with a `--ios-bar` blur background. That's optional and can come later.

**How:**
- Restyle `.ntitle` in `main.css`: `font-size: 34px; line-height: 41px; font-weight: 700; letter-spacing: 0.37px` on phones. Keep `.ntitle.sm` small for modal headers.
- `ToolbarGrid` stays as the action row. Move the title out of its centre slot into its own block under it, on the pages listed in section 6.
- `.glass` in `src/domains/layout/layout.css` becomes `background: var(--ios-bar); backdrop-filter: blur(20px)`.

**Modal headers** (experiment detail, editors): a 44 px row with a text button on the left ("Close" in tint), a centred 17 px semibold title, and an optional action on the right. A Title 1 heading may follow (experiment detail).

### 3.2 Tab bar and central button (phones only)
**Where:**
- `src/domains/layout/tabs.svelte` (shown when `$Device.width < 900`)
- `src/components/app-tab/app-tab.svelte`
- `src/domains/layout/radial-menu.svelte`

**Tab bar:**
- Height 49 px plus the safe area, with a 7 px top padding.
- Background `--ios-bar` with `backdrop-filter: blur(20px)` and a 0.5 px top border in `--ios-bar-border`.
- Five columns: Timeline · Dash · **central button (76 px)** · Track · More. The grid is `1fr 1fr 76px 1fr 1fr`, as `.radial-slot { flex: 0 0 76px }` already does.
- **Each tab:** a 26 px icon above a 10 px label, 3 px apart. Inactive tabs use `--ios-label-2` with label weight 500. The active tab uses `--ios-tint` with weight 600.
  - In `app-tab.svelte`, replace `text-gray-600 dark:text-gray-400` with `text-ios-label2` and the active colour with `text-ios-tint`.
  - Keep the existing `aria-current="page"` logic.
- **Goal score notification:** keep it as a small badge, using the radial badge style below.

**Central button (`.radial-hub`):**
- 58 px circle, raised by `margin-top: -20px`, with a 3 px ring in the bar colour (`#F9F9F9` light, `#161618` dark) and `--ios-shadow-hub`.
- Inside: the app icon image, as today. The mockups show a tint disc with a plus because the image isn't in them; see decision 1 in section 10.
- **Open state (`.radial-hub.is-open`):** replace `linear-gradient(145deg, #2cbdff, #0083d4)` with a flat `var(--ios-tint)`, icon colour `var(--ios-on-tint)`. The rotated plus (×) stays.
- **Scrim (`.radial-backdrop`):** `background: var(--ios-scrim); backdrop-filter: blur(3px)`.
- **Items (`.radial-item`):**
  - Icon circle: 54 px, `--ios-card` background (`#2C2C2E` in dark), icon in tint at 24 px, shadow `0 6px 18px rgba(0,0,0,0.3)`.
  - Label pill below, 6 px gap: `#1C1C1E` background, white 12 px weight 600, padding 3px 9px, radius 10px.
  - Replace `bg-white dark:bg-gray-800 text-primary-500` on `.radial-icon` with the token colours.
- **Badge (`.radial-notify`):** minimum 22 × 20 px, radius 10, 12 px bold. Light: `#48484A` background, white text. Dark: `#C7C7CC` background, black text.
- **Hint ("Tap for more"):** pill 62 px above the button centre, 12 px weight 600. Light: `#1C1C1E` background, white text. Dark: `#F2F2F7` background, black text.
- **Don't change** `RADIUS = 118`, `ARC_START = 150`, `ARC_END = 30`, the animation, the badge rules, or the Starter rule that hides Pointers.

### 3.3 Desktop
On desktop (≥ 900 px), `desktop-sidebar.svelte` stays a sidebar. Apply only the tokens:
- background `--ios-card`
- a right hairline in `--ios-separator`
- items as 44 px rows with tint for the current page
- the same icon set

The content area uses the same cards, centred with a `max-width` (the existing `max-w-screen-lg` is fine).

---

## 4. Shared controls

### 4.1 Grouped list (`List` + `ListItem`)
**Where:** `src/components/list/list.svelte` (120 lines) and `src/components/list-item/list-item.svelte` (168 lines). These are used on More, Goals and Experiments, and in many modals.

- **`List solo`:**
  - Card background `--ios-card`, radius 12 px (`rounded-group`), `overflow: hidden`, no border, no shadow, 16 px side margin on phones.
  - Today it uses `@apply bg-white dark:bg-gray-900` and `rounded-t-2xl`. Replace both with `bg-ios-card rounded-group`.
- **List title** (the outside title): the section header style in 2.2. Its current classes are `text-xs ... uppercase tracking-wider text-gray-500 dark:text-gray-400`.
- **`ListItem`:**
  - Minimum height 44 px; with a description, 52 px.
  - Title 17 px weight 400, colour `--ios-label`. Today it's `font-medium` or `font-semibold`, so lower it to normal for rows. Card and section titles stay semibold.
  - Right-side value: 17 px, `--ios-label-2`.
  - `detail` items show a chevron: 12 px, stroke 3, `--ios-label-2`, 8 px after the value.
  - Divider: a 0.5 px bottom border on the **content** part, not the whole row, so it starts at the text. `bottomLine={16}` and `bottomLine={52}` already pass the inset, so map them to 16 px and 57 px.
- **Icon in the left slot:** a 29 px square, radius 7, coloured from the icon palette, with a white 16–17 px glyph, 12 px before the text.

### 4.2 Segmented control (`ButtonGroup`)
**Where:** `src/components/button-group/button-group.svelte` (83 lines). Used for Running / Finished, Daily / Weekly / Monthly and Day / Week / Month.

- **Track:** background `--ios-fill`, radius 9, padding 2 px, 2 px gap, equal columns.
- **Segment:** 30–32 px high, 13 px weight 600, `--ios-label`.
- **Selected thumb:** `#FFFFFF` light / `#636366` dark, radius 7, shadow `--ios-shadow-thumb`.
- **Unselected:** transparent.
- Keep the existing badge feature, restyled as the radial badge.

### 4.3 Switch (`ToggleSwitch`)
**Where:** `src/components/toggle-switch/toggle-switch.svelte` (61 lines; today `w-11 h-6`).

- **Size:** 51 × 31 px track, radius 16. Knob 27 px white with `0 2px 4px rgba(0,0,0,0.2)`, 2 px inset.
- **Colour:** on uses `--ios-switch-on`, off uses `--ios-switch-off`.
- **Motion:** the knob slides 20 px in 0.2 s.
- **Accessibility:** keep or add `role="switch"` and `aria-checked`. The visible track is decoration; the real control must be focusable.

### 4.4 Buttons (`Button`)
**Where:** `src/components/button/button.svelte`.

| Variant | Style |
| --- | --- |
| Primary (block) | 44 px high, radius 12, `--ios-tint` background, `--ios-on-tint` text, 15–17 px weight 600 |
| Secondary | the same, with `--ios-fill` background and `--ios-label` text |
| Save (capture area only) | the same, with `--ios-save` / `--ios-on-save` |
| Plain text (`clear`) | no background, `--ios-tint` text, 17 px, at least 44 px high (Edit, New, Close, Stop early) |
| Destructive text | `--ios-danger`, 17 px (Delete experiment) |
| Round icon | 36 px circle, `--ios-fill` background, `--ios-label` icon at 18 px, with an `aria-label` |
| Pill (in lists) | 36 px high, radius 18, 14 px side padding (Kept to it / Didn't in the experiment detail) |

**Sheet close and header icon buttons (Oct 2026).** A close icon on a sheet is a round icon button in the fill token with a label glyph: `Button icon clear primary` (36 px, grey circle). Do not use a solid primary icon: it renders as a black or blue pill. A header icon button is a 36 px circle; the header radius rule applies to text buttons only (`header[slot="header"] .nbtn.clear:not(.nbtn-icon)`).

### 4.5 Chips
**Where:** `src/domains/experiments/experiment-chip.svelte`.
- Keep its four tones. Swap the Tailwind colour classes for the exact values in 2.1. Add four small classes in the component's `<style>`, using `:global(html.dark)` for dark mode.
- Style: 12 px weight 600, padding 3px 9px, radius 10. `truncate` stays.
- **Timeline chips** (tracker, person and context on a log): 24 px high, radius 12, `--ios-fill` background, 13 px text. Inside: an 8 px colour dot, the label, then the value in bold.

### 4.6 Progress bar
**Where:** `src/components/progress-bar/progress-bar.svelte` (29 lines; default `h-6`). It's used by goals and `experiment-progress.svelte`.
- For experiments, pass a class for a **6 px** track: `--ios-fill` track, `--ios-tint` fill, radius 3.
- Leave the goal usage as it is unless it's on a screen in section 6.

### 4.7 Cards
- **Card:** `--ios-card` background, radius 16, padding 14–16 px, no border, no shadow.
- **Floating card** (capture area, check-in card): adds `--ios-shadow-float`.
- **Inner box** (stat boxes, "Before"): `--ios-card-2`, radius 12, padding 8–12.
- **Tinted inner box:** `--ios-tint-soft` ("During") or `--ios-good-soft` ("Kept to it").

---

## 5. Feature components

### 5.1 Board tabs on Track
**Where:** `src/components/board-tabs/board-tabs.svelte` and `board-tabs.css`.

- A horizontal row of **capsules** with an 8 px gap and 16 px side padding. They scroll sideways and must not wrap: give each `flex-shrink: 0`.
- **Capsule:** 34 px high, radius 17, 16 px side padding, 15 px text.
  - Selected: `--ios-tint` background, `--ios-on-tint` text, weight 600.
  - Others: `--ios-fill` background, `--ios-label` text, weight 500.
- The **Experiments board** (`$Prefs.experimentBoard`, id `_experiments`) shows its `ExperimentBoardIcon` (15 px) before the label.

### 5.2 Tracker tiles
**Where:**
- `src/components/shortcut-button/shortcut-button.svelte`: the tile. Today it uses `rounded-2xl shadow-md`, and `.has-value` turns it white-on-colour.
- `src/domains/board/UniboardTrackableGrid.svelte`: the grid.
- The `.item-grid` class in `main.css`: today it's 2 columns on phones.

**Target:**
- **Grid:** 3 columns, 10 px gap, 16 px side padding on phones (decision 2 in section 10). Keep `.item-grid-compact` for `compactTrackers`.
- **Tile:** 112 px high, `--ios-card` background, radius 18, padding 12, no shadow, laid out as a column with space between.
  - **Top row:** icon square on the left, value on the right.
  - **Icon square:** 34 px, radius 9, the tracker's emoji at 20 px on the tracker colour at 16% (light) or 28% (dark). Decision 3 covers emoji versus glyphs.
  - **Value:** rounded font, 22 px weight 700, or 18 px if longer than 4 characters ("7h 40", "5.2 km"). Habit "done" shows a 26 px `--ios-good-soft` circle with a `--ios-good` check.
  - **Bottom:** title at 15 px weight 600, line-clamped to 2 lines (14/17 px when long). Subtitle 12 px `--ios-label-2`, such as "08:12 today" or "Last night".
- **Don't** fill the whole tile with the tracker colour when it has a value; that's the old `.has-value` look. The value on the right shows the state.
- **Experiment check-in tracker** (`#exp_…`, emoji 🧪):
  - The tile gets `--ios-tint-soft` with a 1.5 px dashed `--ios-tint` border.
  - Top right: "Day 9" in tint, 12 px weight 600.
  - Subtitle: "Check in" in tint, weight 600.
  - Find these tiles by their tag prefix or by matching `ExperimentStore` adherence tags. Don't add data to the tracker.
- **Running timer:** keep the existing indicator, restyled as a small red dot.

### 5.3 Capture area
**Where:**
- `src/domains/capture-log/capture-log.svelte`
- `src/domains/capture-log/capture-log.css`
- `CaptureTextarea`, `TimeSelect`, `CaptureDatePicker`

**Empty state** (`!isPopulated`): a floating card 12 px from the sides and 112 px from the bottom, radius 22, `--ios-card` with `--ios-shadow-float`, padding 6px 6px 6px 16px.
- **Field:** "What's up?" placeholder in `--ios-label-2`, 17 px.
- **Lightbulb** (`#prompt-button`, the writing-prompts menu): a 40 px round button, transparent, with the bulb in tint at 22 px. Keep the existing `MenuInline` and `promptMenu`.
- **AI Insights** (`NomieAiButton`, only when `$Prefs.ai?.enabled` and `$FeatureVisible('ai')`): a 40 px round button on `--ios-tint-soft` with a tint sparkle icon. Keep its label as the `aria-label`.

**Typing state** (`isFocused || isPopulated`): the same card grows.
- **Text area:** 17/22 `--ios-label`, about 2 lines.
- **Tool row** (the `bottom-section`), 6 px gaps:
  - Mood score (positivity selector): a 34 px pill on `--ios-good-soft` (or neutral, or red for negative) with the emoji and a word such as "Positive".
  - Location (the 🗺 button): a 34 px round `--ios-fill` button. Keep the existing dot for a saved location.
  - Expand note: a 34 px round `--ios-fill` button.
  - A spacer, then the **time and date**: a 34 px `--ios-fill` pill, 15 px, tabular numbers ("Today 08:12").
- **Cancel / Save bar** (the existing glass `div` under the card):
  - Full-width, `--ios-bar` with blur and a top hairline. Two equal 44 px buttons.
  - Cancel is secondary. Save uses `--ios-save` (green, as the app has now).
  - Bottom padding is 28 px, so the raised central button doesn't overlap.
  - Replace `bg-green-500 text-white` (white on Tailwind 2's `#10B981` is only 2.54:1) and `bg-gray-200 text-gray-700`.
- The date picker opens in the same card, as it does now.

### 5.4 Today's check-in card
**Where:**
- `src/domains/experiments/ExperimentCheckInCard.svelte`. It's mounted in `layout.svelte` and moved to `<body>`, so it floats over every page and hides while a modal is open.

**Style:**
- **Card:** radius 18, padding 16, `--ios-card` with `--ios-shadow-float`, 12 px from the sides.
- **Position:** today it's `bottom-52` on phones, which is fine. On the Track screen it may sit above the capture card. Keep at least 12 px between them.
- **Content:**
  - Eyebrow: "Today's check-in", 12 px uppercase, letter-spacing 0.4px, `--ios-label-2`.
  - Question: "Did you stick to **[title]**?" at 15 px.
  - Two equal 44 px buttons, radius 12: "Kept to it" is primary (tint), "Didn't" is secondary.
- Replace `bg-primary-500 text-white`, which has contrast problems (2.1).

### 5.5 Experiments list
**Where:** `src/domains/experiments/ExperimentsPage.svelte`.

- **Header (revised Oct 2026, decided by Ronald):** the same header as My Goals (3.1 and 5.8). A 36 px round "+" button (`--ios-fill`, label icon 18 px, with an `aria-label`) on the right of the action row, then the large title "Experiments", then the subtitle "Test one change. See what it does." in `--ios-label-2` (15 px). Under it, a count line in 13 px `--ios-label-2`: "2 running · 1 finished", shown only when there are experiments. "New" is not a text button here any more.
- **Running / Finished:** the segmented control (4.2), 10 px under the subtitle.
- **Running rows**, inside one grouped card:
  - Title 17 px weight 600, truncated, with the `running` chip on the right ("Day 9 of 14").
  - The 6 px progress bar 10 px below.
  - A chevron on the right of the row.
- **Finished rows:** title plus a `neutral` chip ("Finished" / "Stopped early"). On the next line, one chip per outcome in its tone, with the text from `experimentWidgetView`.
- **Empty state:** keep `Empty` with `PulseOutline`, using the text colours in 2.1.

### 5.6 Experiment detail
**Where:** `src/domains/experiments/experiment-detail-modal.svelte`.

From top to bottom:
1. **Modal header** (3.1): "Close", centred "Experiment", then the Title 1 experiment title.
2. **Status card:**
   - Chip (running or neutral) on the left, with "14 days · ends Saturday 24 October" on the right in 13 px secondary.
   - The 6 px progress bar.
   - Three stat boxes in a 3-column grid with 8 px gaps:
     - **Kept to it:** `--ios-good-soft`, rounded number 20 px weight 700 in `--ios-good`.
     - **Didn't**, **Not checked:** `--ios-card-2`.
   - If the change text differs from the title, it goes above the boxes.
3. **Check-in card:**
   - Eyebrow "Check in", then "Did you stick to it?" at 15 px weight 600.
   - One row per unchecked day: the day label, then the pill buttons "Kept to it" (tint) and "Didn't" (fill). Rows are divided by 0.5 px lines.
4. **One card per outcome:**
   - The name (17 px weight 600, capitalised) with the verdict chip below, in its tone, showing `verdictText(outcome)`.
   - The before-and-during chart (`experiment-chart.ts`): 64 px high bars, 3 px gaps, radius 3. Before bars in grey, during bars in tint, with "Before" and "During" captions.
   - Two boxes:
     - **Before:** `--ios-card-2`. "Before" caption, 22 px rounded value, then "14 days".
     - **During:** `--ios-tint-soft`. The value plus the percentage in 13 px bold, `--ios-good` when positive or `--ios-danger` when negative, then "8 days".
5. **Explain this result** (`NomieAiButton`, AI on only): a full-width 48 px card button with a tint sparkle icon and tint 17 px text.
6. **Caveat** (`CAVEAT`): 12/16, `--ios-label-2`, 4 px side inset.
7. **Actions:** a grouped card with 48 px rows of centred 17 px text.
   - "Finish experiment" in tint, weight 600, only when finishable.
   - "Stop early" in tint.
   - "Delete experiment" in `--ios-danger`.

### 5.7 Experiment dashboard widget
**Where:** `src/domains/dashboard2/widget/types/widget-experiment.svelte`.

- **Header row:** a 34 px `--ios-tint-soft` square with the 🧪 emoji (or a flask glyph), then the title (15 px weight 600) and status ("Day 9 of 14", 13 px secondary).
- The 6 px progress bar.
- **Bottom row** (wraps): "Kept to it **8** of 9 days" in 13 px secondary with the number in `--ios-label`, then the outcome chips.
- Tapping the widget opens the detail screen, as now.

### 5.8 Goals list
**Where:** `src/domains/goals/GoalsPage.svelte`.

- **Header (revised Oct 2026, decided by Ronald):** Edit (or Done) text on the left, a round "+" button (new goal) on the right, then the large title "My Goals" and the subtitle "3 of 4 reached today" (from `GoalScoreStore`).
- Daily / Weekly / Monthly segmented control.
- **Goal rows**, in one grouped card:
  - A 29 px tracker icon square, then the label (17 px) and the target in 13 px secondary ("At least 5 km a day").
  - On the right: a done check (26 px `--ios-good` circle with a white check) or progress text ("0 of 10 min", 13 px weight 600 secondary).
  - Below, a 7-day history: seven 18 × 6 px bars with 5 px gaps, radius 3, in hit or miss colours (2.1). Give it `role="img"` and an `aria-label` such as "Reached on 6 of the last 7 days".
- Keep the existing edit, delete and score behaviour.

### 5.9 Timeline entries
**Where:**
- `src/domains/timeline/timeline-view.svelte`
- `src/domains/timeline/timeline-item.svelte`
- `src/components/list-item-log/list-item-log.svelte`: today a `note-bubble`

**Target:**
- **Day sections:** a header row with the day title (20 px weight 700, such as "Today") and the date on the right (13 px secondary), with padding 22px 16px 7px. Then one grouped card per day.
- **Entry rows:**
  - A 40 px time column (13 px weight 600 secondary, tabular numbers).
  - The note text at 15/20 px.
  - The chips row (4.5).
  - An optional location line: 13 px pin icon and place name, secondary.
  - Rows are divided by 0.5 px lines.
- **Search bar** (if shown): 36 px high, radius 10, `--ios-fill`, a magnifier icon, and the placeholder "Search notes, #trackers, @people".
- Keep every existing action on an entry (positivity, edit, pin, share). Long press and the menu stay as they are.

### 5.10 Dashboard cards
**Where:** `src/domains/dashboard2/dashboard-view.svelte` and the widget types in `src/domains/dashboard2/widget/types/`.

- **Each widget:** a card (4.7) with a header of a 16–18 px icon plus the name in the series colour (15 px weight 600), and an optional right caption (13 px secondary).
- **Values:** in the rounded font.
- **Layout on phones:** full-width cards, or two half-width cards in a 2-column grid with 12 px gaps.
- **Period:** there is no Day / Week / Month switch on cards. The period is the Time Frame pill in each card's footer ("Last 90"), which opens an action sheet with the current period checked (Ronald, Oct 2026).
- **Line chart:** 2.5 px line, area fill at 12–16%, 3.5 px dots with a card-coloured centre. Day letters (M T W T F S S) at 11 px secondary.
- **Bar chart:** bars radius 4, 5 px gaps. Today's bar in the strong colour, the others soft.
- **Ring:** 10 px stroke, round caps, starting at the top.

### 5.11 More (settings)
**Where:**
- `src/domains/settings/settings-page.svelte`
- `settings-features-list.svelte`
- `settings-data-list.svelte`
- `settings-ai-list.svelte`
- `settings-about-list.svelte`

**Target:**
- Large title "More".
- **Experience card first:** "How much do you want to see?" (15 px weight 600), a Starter / Full segmented control instead of the `SelectPop`, then the explanation in 13 px secondary. The wording depends on the mode: Starter "shows the essentials... nothing is deleted", Full "shows everything...". Keep `resolveExperience` and `$Prefs.experience` exactly as they are.
- **Experiments group:** an "Experiments" row (blue pulse icon square, "1 running", chevron) and a "Show Experiments board" switch (teal flask icon square).
- **Groups:** Appearance, Your data, Privacy, and in Full mode Advanced (Analytics, Plugins, AI insights, CSV). Each row has a 29 px icon square in the palette.
  - "Back up now" is a two-line row: tint title, plus "Last backup 2 days ago · everything included" in 13 px secondary.
- **Footer:** "Daily Nomie 7.0.0", centred, 13 px secondary, 24 px above. The existing "v7" badge may stay in the about list.
- All `$FeatureVisible(...)` checks stay. Starter mode must still hide the same entries.

---

## 6. Screen checklist

The light-mode mockup for each screen is the named file in `dn7-ios-mockups.zip`. Each `*Dark.dc.html` shows the same screen in dark mode.

| Screen | Mockup file | Main files to change |
| --- | --- | --- |
| Track | `Main.dc.html` (settings: capture empty or typing, AI on or off, hint, Experiments board) | `routes/track.svelte`, `domains/board/Uniboard.svelte`, board tabs, shortcut button, capture log |
| Central menu open | `RadialOpen.dc.html` (setting: full or starter mode) | `domains/layout/radial-menu.svelte`, `domains/layout/tabs.svelte` |
| Timeline | `Timeline.dc.html` | `routes/Timeline.svelte`, `domains/timeline/*`, `components/list-item-log/*` |
| Dashboard | `Dashboard.dc.html` | `routes/dashboard.svelte`, `domains/dashboard2/*` |
| My Goals | `Goals.dc.html` | `domains/goals/GoalsPage.svelte` |
| Experiments | `Experiments.dc.html` (setting: Running or Finished view) | `domains/experiments/ExperimentsPage.svelte` |
| Experiment detail | `ExperimentDetail.dc.html` | `domains/experiments/experiment-detail-modal.svelte` |
| More | `Settings.dc.html` (setting: Starter or Full) | `domains/settings/*` |
| Tab bar (shared) | `TabBar.dc.html` | `domains/layout/tabs.svelte`, `components/app-tab/app-tab.svelte` |

**Content in the mockups is example data** (Mood 7, Sleep 7h 40, and so on). The real screens show the user's data. Match the layout, sizes and colours, not the numbers.

---

## 7. Dark mode rules
- Every colour comes from a token, so nothing needs a `dark:` variant once it uses token classes or variables.
- Code you touch that still has `bg-white dark:bg-gray-900`, `text-gray-500 dark:text-gray-400` and similar: replace the pair with one token class.
- Dark mode uses **true black** for the page and `#1C1C1E` / `#2C2C2E` for cards. Never use pure grey `#808080` for text; use `--ios-label-2`.
- In dark mode, accents get **lighter** (tint `#4DB3FF`, green `#30D158`). Text on them turns **black** (`--ios-on-tint`, `--ios-on-save`).
- Shadows get stronger (0.5–0.6 alpha) because they barely show on black.
- Test with the theme set to Dark, Light and Automatic (`$Prefs.theme`). `setDocumentTheme()` already updates when the system changes in Automatic.

---

## 8. Accessibility rules
1. **Text contrast:** at least 4.5:1, including 11–12 px captions and chips. Use only the colour pairs in 2.1. If you need a new pair, check its contrast before using it.
2. **Touch targets:** at least 44 × 44 px. A 34–36 px visual button needs padding or a larger hit area.
3. **Real elements:** use `<button>` for actions and `<a href>` for navigation. Never put a click handler on a `div` or `span`.
4. **Icon-only buttons** need an `aria-label`: search, add, location, expand, lightbulb ("Writing prompts"), AI ("AI Insights"), the central button ("Actions").
5. **Decorative SVGs** get `aria-hidden="true"`. Charts and history bars get `role="img"` with an `aria-label` that states the numbers.
6. **Switches:** `role="switch"` and `aria-checked`. Segmented controls: `aria-pressed` on each segment, or a `radiogroup`.
7. **The current tab** keeps `aria-current="page"`.
8. **Don't use colour alone:** green and red states also have a check or a word ("Kept to it", "+19%").
9. **Reduced motion:** wrap the radial animation and switch transitions in `@media (prefers-reduced-motion: no-preference)`.
10. **No pinch zoom (rule, Ronald):** the page stays at `maximum-scale=1`. Do not allow pinch zoom. The font size setting covers the need.

---

## 9. Phased plan

Each phase ends with these checks:
- `npx vitest run` gives the same result as before the phase.
- `npm run vbuild` succeeds.
- A visual check of the affected screens at 390 px and 1280 px, in light and dark mode.
- A commit.

**Phase 0: baseline**
- Create the branch `feat/ios-look`.
- Note the current test result.
- Take screenshots of the 8 screens in light and dark mode for comparison.

**Phase 1: tokens (section 2)**
- Add the CSS variables, the Tailwind extensions, and the page background and font.
- *Done when:* the app looks almost the same, with the iOS font, page background and black dark mode, and no layout changes.

**Phase 2: navigation chrome (section 3)**
- Large titles, the action row, the `.glass` material, the tab bar, the central button and its open state, desktop sidebar colours.
- *Done when:* tabs, the central menu (full and starter) and page headers match `TabBar.dc.html`, `RadialOpen.dc.html` and the tops of the screens.
- *Status (Oct 2026):* measured in the browser at 390 px. The tab bar (56 px with the top padding, 26 px icons, 10 px labels, secondary and tint colours, blur 20px), the 58 px central button with its -20 px lift, the open menu (scrim 0.38, 54 px items, label pills, badge colours in both themes), the 34 px title and the 76 px centre column match the spec. The running-timer dot now uses the danger token. Still open: the Track header differs from `Main.dc.html` (no Edit, search or plus in the action row, no subtitle, and the app logo under the title). That belongs to Phase 4. The AfterNomie and Analytics back-control question is still open.
- *Not yet compared:* the `--color-red` variable is still used by `points.svelte`, `pop-menu.css`, `widget-display.svelte` and `search-recent.svelte`. These belong to the later phases.

**Phase 3: shared controls (section 4)**
- Grouped list, segmented control, switch, buttons, chips, progress bar, cards.
- *Done when:* the More page and the modals already look right with no page-specific changes.

**Phase 4: Track (5.1–5.4)**
- Board tabs, tracker tiles including the experiment check-in tile, the capture area (empty and typing), the Cancel / Save bar, the check-in card.
- *Done when:* `Main.dc.html` matches in all its setting combinations.

**Phase 5: other screens (5.5–5.11)**
- Experiments list and detail, the experiment widget, Goals, Timeline, Dashboard, More.
- *Done when:* each screen matches its mockup in light and dark mode.

**Phase 6: finish**
- Accessibility (section 8) and the Starter mode check:
  - Starter hides Analytics, Blockly, plugins, AI, Pointers and the advanced widgets.
  - Full shows them again.
- Desktop check, reduced motion, and a `whatsNew.json` entry such as "A fresh iOS-style look with full dark mode".

---

## 10. Decisions for Ronald (ask when you reach them)
1. **Central button:** keep the app icon image, which uses the Nomie elephant mark, or use a plain tint disc with a plus as in the mockups?
2. **Tracker grid:** 3 columns on phones as in the mockups, or keep 2 (today's `.item-grid`)?
3. **Tracker icons:** emoji on a tinted square (recommended, keeps users' emoji), or solid colour squares with white glyphs as drawn in the mockups?
4. **Page background:** iOS grey `#F2F2F7` (mockups) or the v7 tint `#F2F4F8`?
5. **Save button:** keep it green (`--ios-save`), as now and in the mockups, or make it tint blue like other primary buttons?
6. **Pinch-zoom:** remove `maximum-scale=1` from the viewport in `index.html`? It's recommended for accessibility.
7. **Collapsing large title on scroll** (3.1): include it now or later?

Decided so far (from the review rounds, Oct 2026):
- 1 Central button: keep the Nomie elephant (the app icon).
- 2 Tracker grid: 3 columns on phones.
- 3 Tracker icons: emoji on a tinted square.
- 4 Page background: iOS grey `#F2F2F7` (light) and black (dark).
- 5 Save button: keep the green `--ios-save`.
- 6 Pinch-zoom: keep `maximum-scale=1`; the font size setting covers it.
- 7 Collapsing title: included. The row under the title collapses on scroll.

---

## 11. Decisions from the audit (round 1)

Patterns chosen while going through the whole app with sample data. Reuse these for similar items.

1. **Never truncate key status text.** Status chips never shrink (`shrink-0`). Long info wraps onto the next line. An item name sits above its verdict or status chip, not beside it (experiment detail, 5.6).
2. **Edit mode on lists (goals, and any list with delete):** a red minus circle (`--ios-danger`, 24 px) on the leading edge deletes the row. A chevron sits on the trailing edge. Tapping the row opens its editor. No pencil squares or red buttons on the right.
3. **Action row:** round 36 px buttons (`.ios-round`) on both sides, then the large title below. Use the same pattern on every top-level screen (Timeline, On This Day, Track, Dashboard, Goals, Experiments).
4. **Empty states:** an outline icon (from `n-icons`) in `--ios-tint`. Never an emoji as the hero icon.
5. **Emoji are only user content** (tracker emoji, log mood). Any UI icon, folder or file row included, is an outline icon.
6. **Time columns are fixed width and never wrap** (`white-space: nowrap`). The Timeline time column is 56 px so "8:00 AM" fits on one line.
7. **Files and folders:** folder in tint, document in secondary label colour, both outline, 22 px.

Decided by Ronald:
- Today's check-in card is hidden on pushed screens (Awards, Uoms, AfterNomie, the file list) and while the radial menu is open. It stays on the main screens (guide 5.4).
- Capture menu Blockly item uses an outline icon. Plugin emoji stay (plugin content).

Open:
- Analytics (pivot builder) keeps its old toolbar and needs its own pass.
- AfterNomie and Analytics have no back control in their header; confirm whether they are top-level.

Decisions taken later:
- Viewport: keep `maximum-scale=1` in `index.html`. The font size setting in Settings covers the need (Ronald, Oct 2026).

Component decisions (overnight audit, Oct 2026; full log in `planning/components-ios-audit.md`):
- **D-focus:** no coloured focus box on touch or mouse focus. Text fields show focus with the caret. Keyboard focus (`:focus-visible`) gets a 2 px tint outline. One global rule in `main.css`.
- **D-select:** selection circles are 22 px. Unselected: a clear 2 px outline. Selected: tint fill with a white tick (iOS multi-select).
- **D-alert:** in an alert, Cancel is the bold tint. Red is for destructive actions only (none of the current callers use a destructive style yet; to add when a caller needs it).
- **D-press:** a pressed list row shows the fill token (no ring). Section headers sit on the grouped background, without a grey band.
- **D-badge (revised Oct 2026, decision 1):** a count badge (tab, button group, unread) is the tint fill with on-tint text (`--ios-on-tint`). Red is not used for counts. A remove badge (the red circle on an editable item) is the danger fill with on-danger text, because it removes.
- **D-chip:** text on a fill (tracker chip value, dashboard footer pill) is the label or label2 token, so it reaches 4.5:1 in both modes. The footer pill uses the card-2 token in light mode.
- **D-native:** browser-native controls (select, date, time, datetime-local, range, color) are replaced by app-native iOS-look components so the app looks the same in every browser. Native file dialogs are the only exception (the trigger is an app button).
- **D-danger:** a destructive action in a menu or action sheet is the danger colour (pop menu buttons take danger: true). Applies to delete and remove actions only.
- **D-field:** standalone text fields are filled rounded boxes (fill token, 10 px radius), not outlined boxes. The placeholder keeps 4.5:1 on the fill.

## 12. Working rules and research notes (added in pass 6)

### 12.1 Rules for every decision
- **Common practice first.** When in doubt about a look, colour, control or pattern, investigate what Apple and widely used iOS apps do before deciding (web search, Apple HIG pages, archived Apple docs). Record the finding and the decision in section 11.
- **Enhance this guide from the research.** When research gives a clear iOS practice that this guide lacks, add it here with the source link.
- **Red is only for destructive actions** (delete, remove, reset, destroy). Errors and cautions use neutral text with a glyph, and warnings use the label colours. (D-alert, D-caution.)
- **User-chosen colours** (tracker, person and pointer colours) are fills or glyphs. Any text in such a colour is shifted toward black or white only as far as needed to reach 4.5:1 on the surface (`accessibleTint`). The colour itself is kept where it already passes. (D-user-text.)
- **Surfaces** use the tokens: card (`ios-card`) inside pages, grouped background (`ios-bg`) for page-level containers. The Tailwind gray 800 is not a surface; in dark mode it reads blue-grey.
- **Verify before reporting.** An item that cannot be verified gets at least three different attempts (coordinate click, element dispatch, direct route, fresh profile, computed-style probe) and the attempts are reported.

### 12.2 Research notes (sources)
- **Destructive red.** Red text is used for destructive actions, with a filled red style for the final confirm step in dialogs ([uxcel, Apple HIG destructive buttons](https://app.uxcel.com/courses/apple-hig/system-buttons-actions-400/destructive-buttons-0432)). System red is listed for destructive actions and errors, not for ordinary primary actions ([iOS platform data, glama](https://glama.ai/mcp/servers/@redf0x1/ui-ux-pro-mcp/blob/943385ee3e2320f493dedd86f0869260d3f8324e/data/platforms/ios.csv)).
- **Contrast of system colours.** System red, blue and green fall short of WCAG AA 4.5:1 for normal text, and about half of Apple's default system colours fail it ([Design Systems Collective](https://www.designsystemscollective.com/a-study-in-red-clashing-colors-in-app-design-603b1a663f30)). So red text must always be checked, and the 4.5:1 rule decides the shade.
- **Caution.** The legacy caution alert is for warning that a task could inadvertently destroy data, and it uses a triangle with an exclamation mark ([Apple archive, Types of Alerts](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/Dialog/AlertBadging.html)). Non-destructive cautions are therefore neutral text with a glyph (D-caution).
- **Bars and materials.** iOS bars are translucent by default, with a blur behind them ([Apple archive, Bars](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/TransitionGuide/Bars.html)). Use semantic system background colours rather than hard-coded values, and an explicit opaque background when a solid bar is needed ([UIKit summary](https://medium.com/@ios-interview/liquid-glass-in-ios-26-a-uikit-developers-guide-9aa1c91bf139); [UINavigationBar changes in iOS 13](https://sarunw.com/posts/uinavigationbar-changes-in-ios13/)). Apple's sheet-bar rule was not retrievable; the decision here is in D-surface.
- **Dark mode.** Use system semantic colours, avoid pure black for surfaces where a card colour exists, and elevate surfaces with small colour steps ([uxcel, Dark mode principles](https://app.uxcel.com/courses/apple-hig/color-systems-dark-mode-518/dark-mode-principles-9720)).
- **Custom colours and contrast.** Check a custom colour against both light and dark surfaces; choose black or white text, or shift the lightness, to reach 4.5:1; Increase Contrast is separate and not a WCAG guarantee ([Deque, iOS Increase Contrast](https://www.deque.com/fr/blog/ios-color-contrast-best-practice-increase-contrast/); [BOIA](https://www.boia.org/blog/the-ios-increase-contrast-feature-and-accessibility-what-to-know)).

### 12.3 Decisions from pass 6
- **D-caution:** a caution is neutral secondary text (semibold) with a warning glyph. Red is not used for cautions.
- **D-surface:** modal and sheet surfaces are the card or grouped-background tokens in both modes. The translucent glass bar is only used where the content behind it is meant to show through (the Timeline and Track bars).
- **D-user-text:** coloured text uses `accessibleTint` (or `readableTextOn` for text on a fill). The fill keeps the exact colour.
- **Segmented controls.** The selected segment must be clearly different from the others, so it is the thumb (white in light mode, grey in dark) on a grey track; unselected segments sit on the track. Segments are equal width, at most about five on a phone, with text only (not a mix of text and icons). A segmented control chooses; it does not start actions ([Apple HIG, segmented controls, mirror](https://developer-mdn.apple.com/design/human-interface-guidelines/components/selection-and-input/segmented-controls); [uxcel, segmented controls](https://app.uxcel.com/courses/apple-hig/system-buttons-actions-400/segmented-controls-2741)). Applied in the experiment step 3 choices (D-segment).
- **D-segment:** a choice among a few options is a segmented control (grey track, thumb for the selected option). Unselected options never look like the selected one. Two-way choices that are not segments (setup) use the tint for the chosen option.

### 12.4 Decisions from the red, status and token round (Oct 2026)

This round walked the whole codebase, not only the screens. Each decision below was agreed with Ronald (decisions 1 to 4) or follows from the rules in 12.1.

- **Decision 1, count badges:** tint, not red (see D-badge above). Red is only for destructive actions.
- **Decision 2, errors and validation:** neutral text with a warning glyph (`⚠︎`), never red. An invalid form field has no tint; its hint text says what is wrong. A valid field uses the good-soft token. (D-alert.)
- **Decision 3, statuses:** a status is neutral, with a glyph or a sign. Missed goals are an outlined neutral ball (the fill token still means "no data"). Negative outcomes, totals, positivity segments and negative calendar days use the label colour; the minus sign carries the meaning. Met goals and positive values stay green.
- **Decision 4, dead files:** files that nothing imports are left in place and listed in the audit report under "Open for Ronald". Delete them only when Ronald says so.
- **D-icons (decision 5, extended):** a UI icon is an outline icon from `components/icon/nicons`, in the tint or the label2 token, 14 to 22 px. An emoji is only user content (tracker emoji, mood, positivity score, plugin icons). Arrows in text (`→`) are not icons; a row that leads somewhere uses a chevron.
- **D-dialog:** user-facing messages use the app dialogs (`Interact.alert`, `Interact.confirm`, `Interact.prompt`), never the browser's `alert`, `confirm` or `prompt`. Development stubs that alert are removed, not kept.
- **D-destructive-row:** a destructive control is red only when it deletes, destroys or removes (Delete Tracker, Destroy all Data, the remove minus, the remove badge). Cancel, Done, Edit/Done, back and Clear are tint.
- **D-token-sweep:** live components use iOS tokens, not Tailwind palette classes. Mapping used: `dark:text-white` and dark grey text → label; grey text pairs and placeholders → label2; grey overlays and panels → fill; `bg-white` and dark black surfaces → card (or grouped background for a page); Tailwind green → good; Tailwind blue → tint (tint-soft for pastel chips); primary and white-on-fill → tint with on-tint text; focus rings → tint. Scrims (black alpha over content), the HUD toasts, positivity data gradients, the favourite star, and the AI brand gradient are deliberate exceptions and stay as they are.
- **D-scrim:** a modal or lock scrim is black alpha over the content, in both modes. It is not a surface.
- **D-native rows (retrospective, Oct 2026):** a location or any editable list row uses the list pattern from 11.2: red minus on the leading edge, tap opens the editor, reorder grip on the trailing edge.
- **D-caution (retrospective):** the backup reminder is a neutral card with a glyph, not a red banner (it does not destroy anything).
- **D-streak (retrospective):** a tracker's 30-day strip uses label text on a card pill for values, and the fill token for day tiles and "+" buttons (not pure black in dark mode).
- **D-map (retrospective):** map controls (zoom, attribution, search) are cards with label text in both modes. The search glyph is an outline magnifier.
- **D-resize (retrospective):** the widget size control is the outline resize icon in the label2 token.
- **D-verify-compile (method):** a Svelte file can fail to compile while the app still runs, if nothing imports it. Check every live module by requesting it from the dev server (a 500 means a compile error). `svelte-check` is not installed in this workspace.
- **D-import-cycle (method):** a static import of the store (`store/interact`) from a low-level utility can close a cycle with `Preferences` and break boot. Load the store on demand (`import('../../store/interact')`) in those utilities.
- **D-set-state (method):** a prop cannot be assigned in Svelte 5. Seed a local `$state` from the prop, or dispatch the value instead of reassigning it (scorebar, day stepper).
- **D-layer (Oct 2026):** the check-in card (z-index 9999) is hidden on pushed screens and while the radial menu is open. An open drop menu or action sheet is above it, so its options stay tappable (drop menu backdrop z-index 10000).
- **D-select-tile (Oct 2026):** a selected option in a tile row (the widget type picker) is the tint fill with on-tint text, with no extra ring. A ring is reserved for keyboard focus (D-focus).
- **D-desktop-only (Oct 2026):** a phone does not offer some editors (pivot list and editor: "Edit pivots on a larger screen"). Those are checked on a desktop-width walk, not on the phone walk.
- **D-desktop-walk (Oct 2026):** at 1280 px the sidebar layout was checked on the six main tabs (Timeline, Track, Dashboard, Goals, Experiments, More) in light and dark. The centred content column, the sidebar's tint-soft selected item and the check-in card all follow the tokens; no change was needed. The pivot builder (Analytics) was restyled to the tokens (see the report).
- **D-slot (Oct 2026, layout):** a control placed in a list row's right slot must have a definite width, and a control that fills its container sets `width: 100%`. A flex item sized to its content collapses (the app-native range showed only its knob). A value that is undefined must fall back to the same default the label shows (the pointer Samples control).
- **D-tile (Oct 2026):** a tile in a horizontal type row has a fixed width, and its label wraps inside the tile. Labels are never allowed to run into the next tile.
- **D-widget-data (Oct 2026):** every dashboard widget has an empty state ("Not enough data") and never fails on a log it cannot draw (a pointer note without its tracker value is skipped). Widgets are checked rendered, in light and dark, with sample data: a habit with a day logged, a pointer with a tagged note, and a positivity chart.
- **D-sample (method):** a widget check needs data. Create it through the app (a habit tracker logged from its tile; a note typed in the capture bar with `#tracker value ^pointer`), not by editing the store.
- **D-ai-state (Oct 2026):** an AI reply that streams no content ends with an error message (neutral text with a glyph), never a spinner that waits forever. A key is cleared with the danger text control (it removes data).
- **D-class-state (method, Oct 2026):** the widget editor holds a class instance, which Svelte 5 does not make reactive. A control that writes into it must also bump the editor's update counter, and the template must read that counter (the Size and Prompt Type groups both do this now).
- **D-key-handling (method):** an API key is entered only in the app's own AI settings. It is never written into the repo, a commit, the report or the guide.
- **Decided (Oct 2026, Ronald):** an AI chat error shows in the reply bubble and in the box above the input (both kept). The default insight model is the free route (openrouter/free); a model picker is not added. Starter template emoji are template content, not UI icons (decision 5 does not apply to them).
- **D-prompt-default (Oct 2026):** an insight widget with no prompt type shows Predefined selected.
- **Decided (Oct 2026, Ronald):** the Insight card border is the neutral separator, not the tint.
- **D-disclosure (Oct 2026):** a disclosure control ("More Options", "Less Options") is a tint text link, not a grey block.
- **D-condition-remove (Oct 2026):** removing a condition row is the red minus on the leading edge (the list edit pattern, 11.2).
- **Decided (Oct 2026, Ronald):** the add action is on the trailing side of the header action row (iOS convention); on My Goals Edit is on the leading side.
- **D-status-bar (Oct 2026):** a failed goal's progress bar is the label2 token (decision 3).
- **D-tile-tint (Oct 2026, decided by Ronald):** a large tracker tile with a value keeps the tracker-colour tint and the glow, as the small tiles do. This overrides the "no fill, no shadow" line in 5.2 and reverses the card-only change for normal tiles.
- **D-goal-icon (Oct 2026, decided by Ronald, exception):** the tracker icon in a goal row is a 21 px glyph inside the 29 px square (section 4.6 says 16 to 17 px). The square and the row layout stay as they are.\n- **D-board-off (Oct 2026, decided by Ronald):** Main has no delete badge. The badge on All, People, Context and Experiments turns that board off, as its Settings toggle does (no confirmation). It is not a delete.
- **D-board-fixed (Oct 2026, decided by Ronald):** Main, All, People, Context and Experiments are not movable in the board editor. Only the user's own boards can be reordered, and they stay after the fixed tabs.
- **D-track-header (Oct 2026, decided by Ronald):** the logo stays. The Track header has search beside the board menu (trailing) and the day under the title. Edit mode is in the board menu. The dashboard header has search beside its menu too (Ronald request). Only actions the app already supports are shown.
- **D-tile-truncation (Oct 2026, decided by Ronald, option A):** long tile values are truncated, not reflowed. The emoji square stays top left.
- **D-capture-time (Oct 2026, decided by Ronald):** the capture card shows one date and time pill ("Today 08:12"). It opens the day picker, and the date and time there use the iOS date field and selects. The three select boxes are gone from the tool row.
- **D-checkin-typing (Oct 2026, decided by Ronald):** the check-in card is hidden while the capture card is being typed in, so it never covers the text.
- **D-tile-value (Oct 2026, decided by Ronald, option B):** on a normal tracker tile the value is top right at 22 px (18 px when longer than four characters), and the ⋮ menu button is bottom right, so they don't collide. Known limit: on a 112 px tile, a value wider than the space beside the emoji square (about 7 characters at 18 px) is truncated. Compact tiles are unchanged.
- **D-residual (Oct 2026):** the last palette classes in live code are kept on purpose. Scrims and the modal dimmer stay grey (they are overlays, not chrome). The toast HUD stays dark. Positivity and status gradients stay (they encode data). User colours (tracker colour swatches, the colour picker) stay, because the user chose them. Favourite stars stay yellow. Everything else in live code uses an iOS token; focus and selection rings use the tint (D-focus). Dead files are not edited.
- **D-dead (Oct 2026):** `calendar4` is used only by the dev-only `/test` route and its import is commented out. `timeline-view-og` has no importers. Both stay in place (decision 4), and their palette classes are not edited.
- **D-stop (Oct 2026, decided by Ronald):** the stop button in the tracker input footer keeps the danger red fill with white text. It is not made neutral. Its hard-coded white label is left as it is, since the on-danger token turns black in dark mode.
- **D-divider (Oct 2026):** a grid of action cells (the tracker menu) draws its dividers as the 1 px gap, on a background that is the separator token. The gap must not show the card colour.
- **Decided (Oct 2026, Ronald):** the dark separator is `#48484A`.
- **D-strip (Oct 2026):** a value is never drawn over the data it describes. In the 30-day strip the value is in its own band above the bar.
- **D-strip (refined Oct 2026):** the value has no background pill and stays on one line in its band above the bar.
- **D-strip (corrected Oct 2026):** bars are never clipped; the value sits on the card in a 20 px band above the track, with no pill; the track is the fill token below the band.
- **D-menu (Oct 2026):** a drop menu (size, chart settings) sits over a translucent, blurred backdrop, not a grey sheet. The current choice carries the blue checkmark, and unchecked rows reserve its width so the labels align.
- **D-menu (refined Oct 2026, decided by Ronald):** the drop menu backdrop is the widget options sheet backdrop (translucent grey, blur 4 px, saturate 1.5).
- **D-list-align (Oct 2026):** list rows are leading-aligned, including the name and description in the custom template rows.
- **D-icon-circle (Oct 2026):** a clear icon button is 36 by 36 px (the 44 px text-button height does not apply), so it is a circle.

**Phase 5 status (Oct 2026):**
- Done: the Experiments list (5.5), the experiment detail status row, colours and bar chart (5.6), the experiment detail chart now one bar per day with captions (5.6, Ronald decision), the Goals history strips (5.8: 7 days daily, 4 weeks weekly, 12 months monthly), the goal target lines (5.8), the Timeline (5.9), the dashboard card footers, charts and series-colour names (5.10), the More experience control, footer, Experiments row and flask toggle (5.11).
- Checked: the experiment widget on the dashboard (5.7). The test dashboard now has one. Its header square, title, status, progress bar, kept-to-it line and outcome chip match the guide. No change was needed.
- Phase 5 is complete, apart from the decisions recorded above.

**Phase 6 status (Oct 2026):**
- Done: reduced motion (a global rule in main.css, rule 9); the What's New entry (already in whatsNew.json); the Starter check (Pointers, Analytics, plugins, AI and the people and context boards hidden in Starter, shown in Full; the central menu lists Analytics and Pointers only in Full); the desktop check at 1280 px (no horizontal overflow); icons are aria-hidden (rule 5); named controls and the current tab mark (rules 4 and 7) pass on the main screens; no pinch zoom (rule 10, Ronald).
- Touch targets (rule 2): a transparent 44 px area is added to the shared small controls (main.css), so the layout does not change. Measured: 78% of sampled touch points reach their control, up from 30%.
- **D-touch (Oct 2026, decided by Ronald):** the list-row chips that a neighbour covers stay as they are. No extra spacing is added to those rows.
- Not checked: Blockly's entry in More (it was not listed in Starter or Full on the settings page).

**Open items 1 to 3 (Oct 2026):**
- Analytics (pivot builder): the option checkboxes are already the iOS circle with a tick, and the toolbar icons and pivot chips use the tokens. The Plotly chart keeps its own default colours and fonts. Restyling the chart is a question for Ronald.
- Back controls: Analytics is a top-level screen (opened from the central menu, like Goals and Experiments), so it has no back control. AfterNomie is a pushed screen with a back arrow. Nothing in the app links to AfterNomie, only its URL.
- Blockly: the plugin page loads an external plugin in an iframe, so its header and colours belong to the plugin. The setup prompt is ours: the check-in card now steps aside while it is shown.
- Decided (Ronald): the pivot chart is restyled to the app font and theme tokens (8ba5c2c7). The Blockly page has the standard header with the plugin frame below it. The dark bar inside the frame belongs to the external plugin.
- **Dark-mode walk (Oct 2026):** Track, Timeline, Dashboard, My Goals, Experiments, More, Analytics, Nomie Blockly and the experiment detail were checked in dark mode at 390 px. No regressions found. The Blockly header and frame were checked after the page had loaded. The plugin's own dark bar inside the frame belongs to the external plugin.
- **Board reordering (confirmed by Ronald, Oct 2026):** reordering two of the user's own boards works in the board editor. Main and the dynamic tabs stay fixed.
