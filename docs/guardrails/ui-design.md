# UI design guardrails: iOS look and feel

These rules keep Daily Nomie 7 looking and behaving like an iOS app, in light and dark mode. Use them for every new page, component and change to an existing one.

Levels: **MUST** and **SHOULD**, as explained in the [README](README.md). Check IDs refer to [checks/ui-checks.sh](checks/ui-checks.sh).

---

## 0. Working rules

- **MUST** A visual change does not change stores, data, routes, props, event handlers or experiment logic. If it seems to need one, stop and ask.
- **MUST** Use the tokens in section 2 for every colour, surface and text colour. Use the type styles in section 3 for text sizes.
- **MUST** When this document does not cover an item, look up the iOS pattern (Apple's Human Interface Guidelines, or a current iOS reference), apply it with the same tokens and shapes, and add the decision to section 11. Say which pattern you chose in your report.
- **MUST** Icons are outline icons from `src/components/icon/nicons.ts`. If the icon you need is missing, add it: look in `node_modules/ionicons/dist/svg/` for the outline glyph (for example `save-outline.svg`), otherwise find the Ionicons outline glyph online. Add it as `src/n-icons/<Name>.svelte` (viewBox 512, `currentColor`, a `size` prop, a `<title>`), then export it from `nicons.ts`. Use the same stroke width as the set.
- **MUST** Verify in light and dark mode at phone width (390 px) and desktop width (1280 px). Run `npx vitest run` (it must exit 0) and `npm run vbuild`.
- **MUST** Run `bash docs/guardrails/checks/ui-checks.sh` before a commit. Fix the MUST items in the files you changed.
- **SHOULD** Report what you verified, and what you could not verify, in plain words.

---

## 1. Principles

- **Content on grouped cards.** The page is a light grey background (dark mode: black). Lists, widgets and forms sit on white cards (dark mode: `#1C1C1E`). No borders around cards. Depth comes from the contrast between background and card, not from shadows.
- **Large titles.** Each main screen starts with a 34 px bold title. Small actions (text buttons, or 36 px round icon buttons) sit in a 44 px row above it.
- **One accent colour.** The tint (`--ios-tint`) is used for anything you can tap: links, the selected tab, primary buttons and progress.
- **Colour means something.** Green means done or kept to it. Amber means possible. Blue means running. Grey is neutral. Red is only for destructive actions (section 10). Tracker colours appear only on icon squares and charts.
- **Translucent bars.** The tab bar and the bottom action bars blur what is behind them.
- **Touch targets** are at least 44 × 44 px. **Text contrast** is at least 4.5:1 (section 9).
- **Numbers** use the rounded system font (`--ios-font-rounded`), so values read like iOS Health.
- **No gradients, no emoji as UI icons, no heavy shadows.** Tracker emoji are user content and stay as they are.

---

## 2. Tokens

Colours are CSS variables in `src/style/main.css`, on `:root` for light mode and on `html.dark` for dark mode. Tailwind classes map to them in `tailwind.config.js` (section 2.3).

### 2.1 Colour tokens

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--ios-bg` | `#F2F2F7` | `#000000` | Page background (grouped background) |
| `--ios-card` | `#FFFFFF` | `#1C1C1E` | Cards, list groups, tiles, modal surfaces |
| `--ios-card-2` | `#F2F2F7` | `#2C2C2E` | Boxes inside cards |
| `--ios-label` | `#000000` | `#FFFFFF` | Main text |
| `--ios-label-2` | `#6C6C70` | `#AEAEB2` | Secondary text, inactive tabs, captions |
| `--ios-fill` | `#E5E5EA` | `#2C2C2E` | Chips, secondary buttons, segmented track, progress track, text fields |
| `--ios-separator` | `#D8D8DC` | `#48484A` | 0.5 px row dividers |
| `--ios-tint` | `#0A6CC9` | `#4DB3FF` | Accent: links, selected tab, primary buttons, progress |
| `--ios-on-tint` | `#FFFFFF` | `#000000` | Text on a tint fill |
| `--ios-tint-soft` | `#E3EFFB` | `#0B2236` | Tinted backgrounds, pastel chips |
| `--ios-good` | `#1E7A34` | `#30D158` | Done and success text |
| `--ios-good-soft` | `#DDF3E2` | `#123620` | Done backgrounds |
| `--ios-save` | `#1E7A34` | `#30D158` | The Save button in the capture area |
| `--ios-on-save` | `#FFFFFF` | `#000000` | Text on Save |
| `--ios-danger` | `#D70015` | `#FF6961` | Destructive actions only |
| `--ios-on-danger` | `#FFFFFF` | `#000000` | Text on a danger fill |
| `--ios-switch-on` | `#34C759` | `#34C759` | Switch track when on (not text) |
| `--ios-switch-off` | `#E3E3E8` | `#39393D` | Switch track when off |
| `--ios-bar` | `rgba(249,249,249,0.92)` | `rgba(22,22,24,0.92)` | Tab bar and bottom bars, with `backdrop-filter: blur(20px)` |
| `--ios-bar-border` | `rgba(0,0,0,0.2)` | `rgba(255,255,255,0.16)` | Hairline at the top of a bar |
| `--ios-scrim` | `rgba(0,0,0,0.38)` | `rgba(0,0,0,0.55)` | Behind a menu or modal |
| `--ios-shadow-float` | `0 6px 24px rgba(0,0,0,0.12)` | `0 6px 24px rgba(0,0,0,0.6)` | Floating cards |
| `--ios-shadow-thumb` | `0 2px 6px rgba(0,0,0,0.12)` | `0 2px 6px rgba(0,0,0,0.5)` | Segmented thumb |
| `--ios-shadow-hub` | `0 6px 16px rgba(10,108,201,0.35)` | `0 6px 16px rgba(77,179,255,0.30)` | Central button |

Contrast on the usual surfaces was checked: label 21:1 on white; label-2 5.23:1 on card (4.69:1 on the grouped background); tint 5.25:1 on white and 7.46:1 on the dark card; on-tint 5.25:1 and 9.21:1; good 5.40:1 and 8.42:1; danger 5.38:1 and 6.03:1.

### 2.2 Chips and icon squares

Chip tones (status pills) use these pairs. Light background / text, then dark background / text.

| Tone | Light | Dark |
| --- | --- | --- |
| running (blue) | `#E3EFFB` / `#0A5BA8` | `#0B2236` / `#7CC6FF` |
| positive (green) | `#DDF3E2` / `#1E6B30` | `#123620` / `#5BE07F` |
| possible (amber) | `#FDF0D5` / `#7A4D00` | `#3A2A06` / `#FFD60A` |
| neutral (grey) | `#EEEEF2` / `#55555A` | `#2C2C2E` / `#C7C7CC` |

Icon squares use a white glyph on a solid colour. They are for icons only: never put text on them, because green and amber are under 4.5:1 with white.

### 2.3 Tailwind classes

`tailwind.config.js` maps the tokens to classes: `bg-ios-bg`, `bg-ios-card`, `bg-ios-card2`, `text-ios-label`, `text-ios-label2`, `bg-ios-fill`, `border-ios-separator`, `bg-ios-tint`, `text-ios-ontint`, `bg-ios-tintsoft`, `text-ios-tint`, `bg-ios-good`, `bg-ios-goodsoft`, `bg-ios-save`, `text-ios-onsave`, `bg-ios-danger`, `text-ios-danger`, `text-ios-ondanger`. Opacity modifiers such as `bg-ios-card/50` do not work with these, so do not use them.

Font size classes: `text-ios-large`, `text-ios-title1`, `text-ios-title3`, `text-ios-body`, `text-ios-subhead`, `text-ios-footnote`, `text-ios-caption`, `text-ios-caption2`. Tap sizes: `min-h-tap` and `min-w-tap` (44 px).

**Not yet in the config:** the radius names from the design guide (`rounded-tile`, `rounded-card`, `rounded-group` and the rest). Until they are added, use `rounded-xl` (12 px), `rounded-2xl` (16 px) or a radius in the component's own `<style>` block.

### 2.4 Rules for tokens

- **MUST (UI-04)** Use token classes. No Tailwind palette classes (`bg-gray-100`, `text-red-500`, `bg-white`, `text-white`, `bg-black`, `bg-primary-500`) in new or changed code. A white or black surface is a card or the page background.
- **MUST (UI-03 and UI-04)** Text on a tint fill is `text-ios-ontint`. Text on a danger fill is `text-ios-ondanger`.
- **SHOULD (UI-07)** Component styles use `var(--ios-*)`, not hex values. Chart series colours are the exception; they live in the chart code.
- **SHOULD (UI-08)** Do not add `dark:` variants. The tokens switch on `html.dark`, so the same class works in both modes. Dark mode is class-based: `setDocumentTheme()` in `src/domains/preferences/Preferences.ts` sets `dark` or `light` on `<html>`.
- **MUST** Use `--ios-bar` with blur only for the tab bar and bottom action bars (and the Track and Timeline bars where the content behind is meant to show through).
- **MUST** Modal and sheet surfaces use `--ios-card` or `--ios-bg` in both modes. A modal scrim is black with alpha over the content; it is not a surface.

---

## 3. Typography

Font stacks:

```css
font-family: var(--ios-font);          /* -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif */
font-family: var(--ios-font-rounded);  /* numbers and values: ui-rounded, then the system font */
```

On Android and Windows these fall back to the system font. That is intended. Body text has `-webkit-font-smoothing: antialiased`.

| Style | Size / line height | Weight | Used for |
| --- | --- | --- | --- |
| Large title | 34 / 41, letter-spacing 0.37 px | 700 | Screen titles |
| Title 1 | 28 / 34 | 700 | Experiment detail title |
| Title 2 value | 22–30, rounded | 700 | Tile values, stat numbers |
| Title 3 | 20 / 25 | 700 | Timeline day headings |
| Headline | 17 / 22 | 600 | Card titles, navigation titles, button labels |
| Body | 17 / 22 | 400 | List rows, notes, inputs |
| Subhead | 15 / 20 | 400–600 | Tile titles (600), secondary note text |
| Footnote | 13 / 18 | 400–600 | Secondary lines, section headers (uppercase) |
| Caption 1 | 12 / 16 | 400–600 | Chip text, tile subtitles |
| Caption 2 | 11 / 13 | 400 | Chart axis labels |
| Tab label | 10 / 12 | 500, 600 when selected | Tab bar |

Section headers above grouped lists: 13 px, uppercase, letter-spacing 0.3 px, `--ios-label-2`, 16 px from the left edge.

- **MUST (UI-01)** No arbitrary Tailwind values such as `text-[11px]` or `min-h-[60vh]`. Use the type classes in section 2.3, or a value in the component's `<style>` block.

---

## 4. Spacing and shape

- **Page side gutter:** 16 px. Floating cards near the bottom use 12 px.
- **Base unit:** 4 px. Most gaps are 8, 12 or 16 px.
- **Gap between cards:** 12 px. Between a section header and its card: 7 px.
- **Rows:** at least 44 px high, or 52 px with a second line. Padding 16 px left and right.
- **Row dividers:** 0.5 px `--ios-separator`, starting where the text starts, not at the card edge. With a 29 px icon square the divider starts at 57 px from the left.
- **Safe areas:** content starts below `env(safe-area-inset-top)`. The tab bar is 49 px plus `env(safe-area-inset-bottom)`.
- **Floating elements** (capture area, check-in card) sit above the tab bar so they clear the central button.

Corner radii:

| Element | Radius |
| --- | --- |
| Tracker tile | 18 px |
| Dashboard and experiment cards | 16 px |
| Grouped list card | 12 px |
| Primary and secondary buttons (44 px high) | 12 px |
| Pill buttons and board tabs | half the height |
| Chips | 10 px |
| Text field | 10 px |
| Segmented track / thumb | 9 px / 7 px |
| Icon squares (29, 34, 40 px) | 7, 9, 11 px |
| Round icon buttons (36 px) | 18 px |
| Progress bar (6 px high) | 3 px |

---

## 5. Navigation

### 5.1 Screen header

- A 44 px **action row**: a text button or 36 px round icon button on the left and the right. No title text in this row.
- The **large title** below it, 34 px bold, `--ios-label`, 16 px side padding.
- An optional **subtitle** below that: 15 px, `--ios-label-2`.
- The header background is `--ios-bg`. A large title can collapse on scroll (decision 7 in section 11).
- Settings sub-pages and other pushed pages start their action row with the shared back button (`src/components/back-button/back-button.svelte`), at the left. Its fallback route is the parent page.
- **MUST (D-sheet-dismiss)** Sheets dismiss with text in tint, never a round icon:
  - An information sheet (nothing is changed): **Done** on the right.
  - An editor (the data can change): **Cancel** on the left, and the save action (Save, Done, Select) on the right.
  - Close on the left is allowed only where the right side holds a real action that has to stay, such as an add button or a bulk action. Those sheets are listed in section 11 as exceptions.
  - Search overlays use Cancel.
- A centred 17 px semibold title sits between the two buttons, in a 44 px row.

### 5.2 Tab bar and central button (phones)

- **Bar:** 7 px of top padding, then a 49 pt row of tabs, then the bottom inset. A 0.5 px top border in `--ios-bar-border`, background `--ios-bar` with blur.
- **Bottom clearance (MUST):** the bottom inset is `max(env(safe-area-inset-bottom), 8px)`. The labels keep at least 8 px from the bottom of the screen even with no inset (desktop, Android). Labels must never sit on the screen edge.
- Five columns: Timeline, Dash, central button, Track, More. The central slot is 76 px.
- **Tab item (MUST):** a 25 pt icon (Apple's size for regular tab bars), 2 px gap, a 10 px label. The icon starts 6 px from the top of the 49 pt row and the label keeps 4 px above its bottom. A tab has no button shape, border or shadow: it is an icon and a label on the bar.
- Inactive tabs use `--ios-label-2` at weight 500. The active tab uses `--ios-tint` at weight 600. The current tab keeps `aria-current="page"`.
- **Sources:** Apple, [Tab bars](https://developer-rno.apple.com/design/human-interface-guidelines/components/navigation-and-search/tab-bars) (25 pt regular icons, 18 pt compact); a 49 pt bar with the home-indicator inset below it, from [Calculating height of UITabBar](https://svasilevkin.wordpress.com/2018/12/06/calculating-height-of-uitabbar/). The label spacing and the bottom clearance are not in Apple's text; they were measured in the app and set to keep the labels clear of the screen edge.
- **Unread count on a tab** is the danger fill with `--ios-on-danger` text, as UIKit's default tab badge is red (D-tab-badge in section 11).
- The central button is 58 px, raised 20 px into the bar, with a 3 px ring in the bar colour and `--ios-shadow-hub`. Its open state is a flat tint with `--ios-on-tint` icon. Its scrim is `--ios-scrim` with blur 3 px.
- Badges on the tab bar follow D-tab-badge (section 11).

### 5.3 Desktop (1280 px and wider)

The sidebar stays. It uses the card token, a right hairline in `--ios-separator`, 44 px rows, and tint for the current page. The content is centred with a `max-width`.

---

## 6. Shared controls

Use these components. Do not make a new control when one exists.

### 6.1 Grouped list (`List` and `ListItem`)

- `List solo` is a card (`--ios-card`), 12 px radius, `overflow: hidden`, no border, no shadow, 16 px side margin on phones.
- Row title: 17 px, weight 400, `--ios-label`. Section and card titles stay semibold.
- Right-hand value: 17 px, `--ios-label-2`. A row that leads somewhere shows a chevron (12 px, `--ios-label-2`), not an arrow in the text.
- Dividers: 0.5 px, on the content part only (section 4).
- A row that is editable uses the list pattern in section 6.6 (red minus on the leading edge only when it deletes, tap opens the editor, reorder grip on the trailing edge).
- Left icon: a 29 px square, 7 px radius, a palette colour, a white 16–17 px glyph, 12 px before the text.

### 6.2 Segmented control (`ButtonGroup`)

Use for a choice among a few options (Running and Finished, Daily, Weekly and Monthly).
- Track: `--ios-fill`, 9 px radius, 2 px padding.
- Selected thumb: `#FFFFFF` in light mode, `#636366` in dark mode, 7 px radius, `--ios-shadow-thumb`.
- Unselected options are transparent. An unselected option never looks like the selected one (D-segment).
- A count badge on a segment is the tint fill with `--ios-on-tint` text (D-badge).

### 6.3 Switch (`ToggleSwitch`)

- Track 51 × 31 px, 16 px radius; knob 27 px white with a small shadow, 2 px inset; the knob slides 20 px in 0.2 s.
- Colour: `--ios-switch-on` when on, `--ios-switch-off` when off.
- The real control is focusable with `role="switch"` and `aria-checked`. The visible track is decoration.

### 6.4 Buttons (`Button`)

| Variant | Style |
| --- | --- |
| Primary (block) | 44 px high, 12 px radius, tint fill, `--ios-on-tint` text, weight 600 |
| Secondary | as primary, with the fill token and label text |
| Save (capture area) | as primary, with the save token |
| Plain text (`clear`) | no fill, tint text, 17 px, at least 44 px high (Edit, New, Close, Cancel, Done, Back) |
| Destructive text | danger colour, 17 px (only for delete, remove, reset, destroy) |
| Round icon | 36 px circle, fill background, label-coloured glyph at 18 px, with `aria-label` |
| Pill | 36 px high, 18 px radius, 14 px side padding |

- **MUST (D-sheet-dismiss)** A sheet's dismiss is text, not an icon (section 5.1). A round icon button is for toolbar actions only (search, add, settings), in the fill token (`Button icon clear primary`). Do not use a solid primary icon: it renders as a pill.
- **MUST (D-destructive-row)** Red is used only when the control deletes, destroys or removes. Cancel, Done, Edit, back and Clear are tint.
- **MUST (D-danger)** A destructive item in a menu or action sheet uses the danger colour.

### 6.5 Chips, progress and cards

- **Chips** (`experiment-chip.svelte` and the timeline chips): 12 px weight 600, 3 × 9 px padding, 10 px radius. Timeline chips are 24 px high with a 8 px colour dot, a label, and a bold value. Text on a chip is the label token (D-chip).
- **Progress bar**: 6 px high, fill track, tint fill, 3 px radius.
- **Card**: card token, 16 px radius, 14–16 px padding, no border, no shadow. A floating card adds `--ios-shadow-float`. An inner box uses the card-2 token with a 12 px radius. A tinted inner box uses `--ios-tint-soft` or `--ios-good-soft`.

### 6.6 Editable list rows (the remove pattern)

- Red minus on the leading edge removes the item. Tapping the row opens its editor. The reorder grip is on the trailing edge.
- Removing asks for confirmation with `Interact.confirm`.
- The minus is red only because it removes (D-destructive-row).

---

## 7. Feature components

These are the components with a specific look. Keep to the tokens and shapes in sections 2 to 6 when you change them.

- **Board tabs** (Track): pills under the title. Main is always first and cannot be moved. The Main, People, Context and Experiments boards cannot be deleted; a board can be turned off instead. The delete badge on a user board is the danger fill with `--ios-on-danger` text (D-badge: a remove badge is danger).
- **Tracker tiles**: 18 px radius, icon square top left, title and last-used time at the bottom left, the menu button at the bottom right. A tile with a value today is tinted with its tracker colour (a light mix over the card) and has a soft glow, as in `shortcut-button.svelte`.
- **Capture area** ("What's up?"): a floating card 22 px radius, 112 px above the bottom edge on phones. The Save button is the save token.
- **Check-in card**: a floating card, 18 px radius. It is hidden on pushed screens and while the central menu is open (D-layer).
- **Experiments**: a list of running and finished experiments. Detail: Title 1 heading; before and during captions above the bar chart; during is the tint.
- **Goals**: each goal has a target line in plain words and a progress bar. The history strip is a row of small boxes: a filled box is a day, week or month that reached the goal. Daily shows 7, weekly 4, monthly 12.
- **Timeline**: day headings are Title 3. Today, Yesterday, a weekday within the last six days, then the medium date. The date on the right appears only on headings that have a name. Entries show the time first, then the tracker and value.
- **Dashboard cards**: 16 px radius, with the widget header in the tracker colour (D-user-text applies to any text in that colour).
- **More** (settings): grouped lists with icon squares. Edit lists in place; do not add a second settings style.

---

## 8. Dark mode

- Every colour comes from a token, so no `dark:` variant is needed (UI-08).
- True black for the page; `#1C1C1E` and `#2C2C2E` for cards.
- Never use a pure grey such as `#808080` for text. Use `--ios-label-2`.
- In dark mode the accents get lighter (tint `#4DB3FF`, good `#30D158`), and text on them is black (`--ios-on-tint`, `--ios-on-save`).
- Shadows are stronger in dark mode (0.5–0.6 alpha) because they barely show on black.
- Check the screen in the Dark, Light and Automatic themes (`$Prefs.theme`).

---

## 9. Accessibility

1. **Text contrast** is at least 4.5:1, including 11–12 px captions and chips. Use only the colour pairs in section 2. A new pair needs its contrast checked first.
2. **Touch targets** are at least 44 × 44 px. A 34–36 px visual button needs padding or a larger hit area (`.touch-44` in `main.css`).
3. **Real elements.** Use `<button>` for actions and `<a href>` for navigation. **MUST (UI-05)** Never put a click handler on a `div` or `span`.
4. **Icon-only buttons need an `aria-label`** (search, add, expand, the central button, and similar). **SHOULD (UI-06)**
5. Decorative SVGs get `aria-hidden="true"`. Charts and history strips get `role="img"` and an `aria-label` that states the numbers.
6. Switches use `role="switch"` and `aria-checked`. Segmented controls use `aria-pressed` on each segment or a `radiogroup`.
7. The current tab keeps `aria-current="page"`.
8. **Do not use colour alone.** Green and red states also carry a check, a word, or a glyph.
9. **Reduced motion.** Wrap animations (the central button, switch transitions) in `@media (prefers-reduced-motion: no-preference)`.
10. **No pinch zoom (rule).** The viewport keeps `maximum-scale=1` (UI-09). The font size setting covers the need.
11. **Focus.** A tap shows no focus ring. Keyboard focus shows a 2 px tint outline. One global rule in `main.css` (D-focus). Do not add a focus ring to a single control.

---

## 10. Meaning of colour and copy

- **Red is only for destructive actions:** delete, remove, reset, destroy. Errors and cautions use neutral text with a glyph (D-alert, D-caution). The backup reminder is a neutral card, not a red banner.
- **Badges that count** use the tint fill (D-badge), except the unread count on a tab bar item, which is red (D-tab-badge). A remove badge uses the danger fill because it removes.
- **Dialogs.** User-facing messages use `Interact.alert`, `Interact.confirm` and `Interact.prompt`. Never the browser's `alert`, `confirm` or `prompt` (UI-03, D-dialog). Remove development stubs rather than keeping them.
- **Native controls** are replaced by app components so the app looks the same in every browser: select, date, time, datetime-local, range and colour (UI-02, D-native). The only exception is a native file dialog, opened from an app button.
- **Icons.** A UI icon is an outline icon from `nicons` in the tint or label-2 token, 14 to 22 px. An emoji is only user content (tracker emoji, mood, plugin icons). An arrow in text (`→`) is not an icon; a row that leads somewhere uses a chevron (D-icons).
- **Pressed rows** show the fill token with no ring (D-press).
- **Selection.** A selected option in a tile row is the tint fill with `--ios-on-tint` text, with no ring. A ring is reserved for keyboard focus (D-select-tile). Selection circles are 22 px: unselected has a clear 2 px outline; selected has a tint fill with a white tick (D-select).

---

## 11. Decisions

Decisions change a rule. Add one here with a short reason, and change the rule in the same commit.

| ID | Decision |
| --- | --- |
| D-focus | No coloured focus box on touch or mouse focus. Keyboard focus gets a 2 px tint outline. |
| D-select | Selection circles are 22 px (see section 10). |
| D-alert | In an alert, Cancel is the bold tint. Red is for destructive actions only. |
| D-sheet-dismiss | Sheets dismiss with tint text (Apple's sheets guidance, not an icon). Information sheets: Done on the right. Editors: Cancel on the left. Round icons are for toolbar actions only. Decided by Ronald, Oct 2026. Exceptions: sheets whose right side holds an action that must stay (the Pointers, Plugins, Trending, On This Day, Log Cache, Writing Prompts, Location manager and Calendar sheets, and the Goal details sheet, which has Edit on the right). These keep Close on the left until a decision moves their action. Still to convert from a round icon to text: the AI chat, Stats, Unisearch (Cancel) and plugin installer sheets. |
| D-press | A pressed list row shows the fill token, with no ring. |
| D-badge | Count badges use the tint fill and on-tint text. A remove badge uses the danger fill. |
| D-tab-badge | The unread count on a tab bar item is the danger fill with on-danger text, as UIKit's default tab badge is red (decided by Ronald, Oct 2026). |
| D-chip | Text on a fill is the label or label-2 token. |
| D-native | Browser-native controls are replaced by app components. |
| D-danger | A destructive action in a menu uses the danger colour. |
| D-field | Standalone text fields are filled rounded boxes (fill token, 10 px radius), not outlined boxes. |
| D-icons | UI icons are outline icons; emoji are user content only. |
| D-dialog | Use the app dialogs, never the browser's. |
| D-destructive-row | Red only when the control deletes, destroys or removes. |
| D-token-sweep | Live components use iOS tokens, not Tailwind palette classes. Scrims, the toast, positivity gradients, the favourite star and the AI brand gradient are exceptions. |
| D-scrim | A scrim is black with alpha over the content, in both modes. It is not a surface. |
| D-surface | Modal and sheet surfaces are card or grouped-background tokens in both modes. The translucent bar is only used where the content behind should show through. |
| D-user-text | Coloured text uses an accessible tint for the surface. The fill keeps the exact colour. |
| D-segment | A choice among a few options is a segmented control. |
| D-caution | A caution is neutral secondary text with a warning glyph. Red is not used for cautions. |
| D-streak | A tracker's history strip uses label text on a card pill for values, and the fill token for day tiles. |
| D-layer | The check-in card is hidden on pushed screens and while the central menu is open. Drop menus and action sheets sit above it. |
| D-select-tile | A selected option in a tile row is the tint fill with on-tint text. |
| D-desktop-only | Some editors are not offered on a phone (for example the pivot editor). Check them on a desktop-width walk. |
| D-verify-compile | A Svelte file can fail to compile while the app still runs if nothing imports it. Request each changed module from the dev server and check for 500. |
| D-import-cycle | A static import of the store from a low-level utility can close a cycle and break boot. Load the store on demand in those utilities. |
| D-set-state | A prop cannot be assigned in Svelte 5. Seed a local `$state` from the prop, or dispatch the value. |
| D-goal-icon | The goal icon glyph is 21 px (the only exception to the icon size range). |
| D-touch | Tap targets are at least 44 px; visual buttons get a transparent 44 px hit area. |

Decisions 1 to 7 from the design review (Oct 2026):
1. The central button shows the Nomie elephant (the app icon), not a plain plus disc.
2. Tracker tiles: three columns on phones.
3. Tracker icons: the user's emoji on a tinted square.
4. Page background: the iOS grey (`#F2F2F7`) in light mode, black in dark mode.
5. Save stays green (`--ios-save`).
6. Pinch zoom stays off (`maximum-scale=1`).
7. The large title collapses on scroll (the action row stays).

---

## 12. Checklist for a new page or component

1. Read sections 0, 2 and 6 of this document, and the existing component you are changing.
2. Use the page and header pattern (section 5.1) and the list and button components (section 6). Do not make new versions of them.
3. Colours and surfaces are tokens. Text sizes are type classes. Shapes follow section 4.
4. Icons come from `nicons`. Missing icons are added as described in section 0.
5. Check light and dark mode at 390 px and 1280 px, with the tab bar and any floating card visible.
6. Check the touch targets (44 px) and the labels on icon-only buttons.
7. Run `bash docs/guardrails/checks/ui-checks.sh`, then `npx vitest run`. Fix the MUST items in your files.
8. Record any new decision in section 11, with its ID, and report what you verified.
