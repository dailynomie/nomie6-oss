# Components iOS audit (overnight, Oct 2026)

Scope: every component folder in `src/components/` and the modals that use them. Each row: what was checked, the decision, the commit. Before and after screenshots are in the scratchpad `components-audit/` folder and in the report (`ios-audit/report.html`).

## Decisions made in this audit (also in the design guide, section 11)

- **D-focus:** text fields show focus with the caret. No coloured box on touch or mouse focus (a global rule: outline only for `:focus-visible`). Keyboard focus gets a 2 px tint outline. Basis: Apple HIG (text fields), WCAG 2.4.7 (focus must stay visible for keyboard users).
- **D-alert:** in an alert dialog, Cancel is the bold tint; red only for destructive actions (none yet).
- **D-select:** selection circles are 22 px. Unselected: a clear 2 px outline (3:1 contrast). Selected: tint fill with a white tick (the iOS multi-select mark, as in Photos and Reminders).

## Status

| Component | Status | Commit | Notes |
| --- | --- | --- | --- |
| input | done (focus) | f356a366 | D-focus; helper text uses the label token |
| radio-button | done | 0ba77abe | D-select |
| toggle-switch | done (focus) | 0ba77abe | already iOS sized (51x31); focus keyboard-only |
| textarea | todo | | |
| input-slider | todo | | |
| picker-list | todo | | |
| date-picker, date-range-controller, date-time-bar | todo | | |
| time-select, time-range, time-gap, time-balls, time-progressbar, day-time-grid | todo | | |
| color-picker | todo | | |
| emoji-selector | todo | | |
| positivity-selector, positivity-bar | todo | | |
| tracker input footer (input-modal-footer, input-modal) | done | (see git log) | Save/Start tint pill (contrast fix), Stop danger, no ring |
| tracker input vertical range (tracker/input/slider.svelte) | done | (see git log) | card track, fill value box, sentence-case labels |
| components sweep (text colours, 35 files) | done | 86f8d351 | secondary grey to label2, primary text to tint, red text to danger |
| components sweep (primary backgrounds, 11 files) | done | 516b25f9 | bg-primary-500 to tint with on-tint text; soft highlights to tintsoft |
| button | done (accent and danger text) | 6333a9d9 | text-primary = tint, text-danger = danger (103 uses) |
| classic-button, value-button, counter | todo | | |
| backdrop, modal | todo | | 49 screens use the backdrop modal |
| alertbox | done | (see git log) | D-alert; card and label tokens |
| toast, tip | toast dark by design (kept); tip checked by grep only | | |
| card, form-group, label-meta, title, panel, badge | todo | | |
| search-bar, calculator, markdown-modal | todo | | |
| shortcut-button, tiny-trackable, avatar, emoji-editor | todo | | |
| menu, pop-menu | pop-menu done earlier (Close, checkmark) | | menu-inline: badges, blocker |
| components grey surfaces (20 files) | done | 86b8c0e3 | card in pages, grouped background for page-level |
| dashboard2 legacy colours (13 files, 49 classes) | done | ef7f7267, 6c2fffae | primary buttons to tint, page surfaces to tokens; secondary text to label2, grey 800/900 and white pairs to label and card, primary to tint, red to danger; footer pill on card-2 for 4.5:1 |
| list rows: tap highlight and focus ring | done | 5ec698aa | press is the fill token, focus ring is keyboard-only; surfaces and text to tokens; section headers on the grouped background |
| tracker chip value contrast | done | ba660b44 | value is label colour on the fill |
| buttons: focus ring for keyboard only | done | 2a696197 | a tap leaves no blue box (D-focus) |
| widget editor: Trackable row shows Select | done | ee5d99a7 | no empty row |
| template modals: iOS tokens, black dark page | done | 80435f81 | grouped background, card rows |
| input sheet: Close is the tint | done | c9e69907 | like the other sheets |
| components: remaining black, white and grey pairs (28 files) | done | f6d1540f | label, label2 and card tokens; overlays, toast, user colours kept |
| emoji picker | done | e5e63171 | card and label tokens |
| (others with no legacy classes) | checked by grep: nothing legacy | | |

## Still to check (overnight)

- Tracker input: note-combo, input-slider2 and the habit input (not yet checked on screen).
- Date and time pickers: colours swept (card and label); not yet checked on screen.
- Colour and emoji pickers: emoji picker swept (e5e63171). Colour picker swatches are user colours and stay.
- Alert, toast and tip components: not yet checked.
- Grey background sweep: done for surfaces (25 replacements). Left on purpose: overlays and backdrops (bg-gray-500 with opacity), the toast (dark by design), and the progress bar tracks (to check on screen).

- FIXED: `--ios-label2` was used in 30 places but never defined (the token is `--ios-label-2`). Added an alias in both token blocks. Secondary text across the app now shows the intended grey, not inherited black or white.
- input-slider2 (log note combo) and the other tracker input types (timer, text, habit, tally).

## Modals checked on screen (overnight)

| Modal | Opened from | Result | Commit |
| --- | --- | --- | --- |
| Tracker editor (new) | Track, Add New #Tracker | iOS already (Cancel tint, grouped rows) | 6333a9d9 (text tint) |
| Tracker input (Mood range) | Track, tap tile | footer Save fixed (contrast), range restyled | 4a74e54c |
| Pick From Existing (selector) | Track, board menu | tick mark, focus box removed | 0ba77abe |
| Confirm alert | Language, Reset | Cancel tint (D-alert) | 1e7127e8 |
| Pointers | More | legend readable | 0ecc7175 |
| Tracker Library | Track, Browse Library | iOS already (grouped sections, chevrons) | none |
| Timeline jump sheet | Timeline, calendar button | iOS action sheet already | none |
| Tracker quick sheet (chip tap) | Timeline, tracker chip | action sheet with grid, tint Close. Open: the first day column is cut at the left edge on the sample data (to check: horizontal scroll of the day row) | none |

| Plugins | More, Manage Plugins | iOS already (grouped rows, switches, tint Edit) | none |
| Locations | More | names left-aligned, round edit and delete, empty header dot removed | 306c808d |
| Colour picker (Color tab) | tracker editor, icon square | swatches are user colours; selected ring kept | none |
| Emoji picker (Emoji tab) | tracker editor, icon square | swept (card and label) | e5e63171 |
| Capture date and time | Track, What's up? | compact pill in the tint/label colours | none |
| Save in the capture bar | Track, typing | kept green (decision 5) | none |

Checked on screen in this pass: the template editor (manager, Build, editor; light and dark), the widget editor (type tiles, Trackable row) and the habit input sheet (light and dark).

Still to check: the note combo (a note tracker input) on screen.

Left as they are, on purpose (for the record):
- Overlays (backdrops, the pop-menu and modal scrims), the toast (dark by design), user colours (tracker colours, positivity colours, emoji).
- Calendar 4 day bars (green and red progress on day cells): graphics, not text. WCAG asks for 3:1 for graphics; the bars are not checked yet.
- The calendar day-name text (`text-gray-200` in light mode) inside the calendar component: needs a screen check on where the calendar sits before changing.
- `button.css` variant classes: these are live. `Button` builds `nbtn-${color}` from its color prop (primary, light, danger, success), so they were fixed to the tokens in commit (see the report), not left as dead code.


## Pass 1 summary (done)

Pass 1 covered the input and selection controls, the modals and the screens: native selects, date, time and range inputs replaced (D-native); legacy colour classes swept in components, domains and dashboard; focus rings only for keyboard focus (D-focus, main.css and button.css); destructive actions red (D-danger); separators on the token; menus with a tint tick (D-select); inset grouped lists for the editor actions; calendar day states; chart colourway; avatar initials readable. Checked on screen in light and dark: goal editor, tracker, person and context editors, template manager and preview, plugins, Locations, Pointers, Awards, Experiments, Track People, Track gear menu, calculator, note combo, habit input, log editor and its date sheet, Timeline search, jump sheet and date-time dialog, setup slides, dashboard edit mode, Danger Zone, analytics chart selector.

## Pass 2 checklist (start over, every component folder)

Each folder: native controls, legacy colours, focus, press states, title alignment, separators, destructive colour, grouped lists, contrast on fills. Mark done with the commit.

- [ ] advanced-badge
- [ ] aibutton
- [ ] aibutton2
- [x] alertbox (grep scan, pass 2; manual review still open)
- [x] app-tab (grep scan, pass 2; manual review still open)
- [x] auto-complete (grep scan, pass 2; manual review still open)
- [ ] avatar
- [ ] back-button
- [x] backdrop (grep scan and on-screen check, pass 2)
- [x] backup-message (grep scan, pass 2; manual review still open)
- [x] badge (grep scan and on-screen check, pass 2)
- [x] board-tabs (grep scan, pass 2; manual review still open)
- [x] button (grep scan and on-screen check, pass 2)
- [x] button-group (grep scan and on-screen check, pass 2)
- [x] calculator (grep scan, pass 2; manual review still open)
- [x] calendar (grep scan and on-screen check, pass 2)
- [x] calendar4 (grep scan, pass 2; manual review still open)
- [x] card (grep scan and on-screen check, pass 2)
- [ ] charts
- [ ] classic-button
- [x] color-picker (grep scan, pass 2; manual review still open)
- [ ] confetti
- [ ] container
- [x] counter (grep scan, pass 2; manual review still open)
- [x] date-picker (grep scan and on-screen check, pass 2)
- [x] date-range-controller (grep scan, pass 2; manual review still open)
- [ ] date-time-bar
- [x] day-time-grid (grep scan, pass 2; manual review still open)
- [ ] divider
- [ ] dot
- [ ] dymoji
- [ ] emoji-editor
- [x] emoji-selector (grep scan, pass 2; manual review still open)
- [ ] empty
- [ ] file-browser
- [ ] file-uploader
- [x] form-group (grep scan and on-screen check, pass 2)
- [ ] grid
- [ ] h-scroller
- [ ] icon
- [ ] icon-square
- [x] input (grep scan and on-screen check, pass 2)
- [x] input-slider (grep scan and on-screen check, pass 2)
- [ ] ios-date
- [ ] ios-range
- [ ] ios-select
- [x] label-meta (grep scan and on-screen check, pass 2)
- [ ] letter-ticker
- [ ] list
- [x] list-item (grep scan, pass 2; manual review still open)
- [x] list-item-log (grep scan and on-screen check, pass 2)
- [ ] location-badge
- [x] log-list (grep scan, pass 2; manual review still open)
- [ ] logo
- [ ] markdown
- [x] markdown-modal (grep scan, pass 2; manual review still open)
- [x] menu (grep scan and on-screen check, pass 2)
- [x] modal (grep scan and on-screen check, pass 2)
- [x] ndump (grep scan, pass 2; manual review still open)
- [ ] next-prev-cal
- [x] note-textualizer (grep scan, pass 2; manual review still open)
- [ ] nvirtual-list
- [ ] offline-queue
- [x] panel (grep scan and on-screen check, pass 2)
- [x] picker-list (grep scan, pass 2; manual review still open)
- [ ] points
- [x] pop-menu (grep scan and on-screen check, pass 2)
- [x] positivity-bar (grep scan, pass 2; manual review still open)
- [x] positivity-selector (grep scan and on-screen check, pass 2)
- [x] progress-bar (grep scan and on-screen check, pass 2)
- [ ] progress-circle
- [x] radio-button (grep scan, pass 2; manual review still open)
- [ ] row
- [x] scorebar (grep scan and on-screen check, pass 2)
- [ ] scroller
- [x] search-bar (grep scan and on-screen check, pass 2)
- [ ] share-image
- [x] shortcut-button (grep scan, pass 2; manual review still open)
- [ ] sortable-list
- [ ] spacer
- [ ] spinner
- [x] stepper (grep scan, pass 2; manual review still open)
- [ ] swiper
- [ ] tab-panel-swiper
- [ ] text
- [ ] textarea
- [x] time-balls (grep scan, pass 2; manual review still open)
- [ ] time-gap
- [x] time-progressbar (grep scan, pass 2; manual review still open)
- [ ] time-range
- [x] time-select (grep scan and on-screen check, pass 2)
- [ ] tiny-trackable
- [x] tip (grep scan and on-screen check, pass 2)
- [ ] title
- [x] toast (grep scan and on-screen check, pass 2)
- [x] toggle-switch (grep scan, pass 2; manual review still open)
- [ ] toolbar
- [x] update-available (grep scan and on-screen check, pass 2)
- [ ] upgrade-message
- [ ] uploader
- [x] value-button (grep scan and on-screen check, pass 2)
- [x] width-box (grep scan, pass 2; manual review still open)


## Pass 2 status

Done: grep scan of all 102 folders; on-screen checks in light and dark for the folders above that appear in the main flows; value-button and avatar labels use the shared readable-text rule; standalone fields are filled (D-field).

Checked on screen in this round: timer input (counter tiles fixed), Stats modal with day-time heatmap (dark tiles fixed), board edit bar (red Close fixed, shortcut tabs, swiper and sortable on screen). Not in the sample data and so not seen: the picker tracker type and dashboard habit widgets. time-balls, time-progressbar and ndump have no callers (dead code, left alone).

## Pass 3 (second overall iteration) status

Checked on screen: Goals weekly and monthly, dashboard widget menu, Settings scrolled top to bottom (selects now one control), capture bar focused, desktop width (Timeline, Track, Dashboard, Goals, Analytics, pivot editor, Mood input sheet) in light and dark. Fixed: Settings selects (SelectPop now delegates to IosSelect), desktop sidebar goal badge (soft tokens), pivot editor separator inset.

Not reachable in the sample profile: AI integration section (feature-gated), picker tracker type, dashboard habit widgets. Pivot chips already use the analytics iOS tokens.

Known and left: the red backup banner (section 8 decision), analytics pivot caret glyphs (pivot library).
