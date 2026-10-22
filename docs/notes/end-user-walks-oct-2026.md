# End-user observations (Oct 2026)

Written by the agent while acting as a new end user, at Ronald's request. Nothing here is fixed unless it says so.
Each entry: where, what was seen, why it matters, and a suggested next step. "Not understood" means I could not tell what the screen intended.

## Overnight tasks (done before the walk)

| Task | Outcome | Commit |
| --- | --- | --- |
| CSV importer: Delete removes the template | Fixed in code. Browser check not run (no template could be seeded). | 1278f37b |
| Map marker is a broken image | Fixed: the marker is served as an image, in development and in the build. | d527e5da |
| Log editor opens an older entry with today's date | Fixed in code: the picker starts from the entry's own time. Browser check not run. | 9a77b5bd |
| Units of Measure stub | Route removed (nothing in the app linked to it). `Uoms.svelte` stays and is unused. | d303f39a |
| Plugin-rendered widgets (Nomie Quotes, My Balance) take their colours from the plugin | Not changed. The plugin owns these colours; the app cannot restyle them. | - |

## Bug fix status (after the walk)

| # | Bug | Status | Commit |
| --- | --- | --- | --- |
| 1 | Wizard pre-fills a tracker the user does not have | Fixed: shown as "Tracker not added yet" | 4053df1e |
| 2 | Tracker save looks stuck | Not a save failure: the save waits for the board question, and the tracker is saved first. The question now reads "Show Water on your Track screen?" | 0574b9ce |
| 3 | Timeline says "between now and Jul 2025" | Fixed: the message no longer shows the date the search stopped at. Browser check not run (the profile has data now) | 525eca9c |
| 4 | Hashtag shows a "Walk 1 +" chip with no tracker | Fixed (Ronald decision): a note with a new #tag offers to create a tracker before saving. Cancel keeps the tag unknown | (see git log: capture offer) |
| 5 | Delete on unsaved items | Fixed: tracker actions and goal delete show only once saved. New items checked in the browser; saved tracker checked from code only | 687083d9 |
| 6 | "Delete Dashboard" beside Add Widget on an empty dashboard | Fixed: moved into the dashboard menu | 5885b8df |
| 7 | Splash logo and title overlap | **Parked for now (Ronald).** The overlap is inside the splash illustration (public/images/nomie-splash-on-blue-ai.svg). Needs the designer | - |
| 8 | "Toggle People Board" on the All board toggle | Fixed: the All toggle is labelled "Toggle All Board". The text is screen-reader only, so it was not visible | c2a4bd77 |

Wording fixes from the list (not done yet): typo "how long much data", jargon ("trackable", "Main"), the date formats, the setup wording, and the widget picker.

## Step 2 checks (after the fixes)

- **Timeline day headings for older days.** The rule (Today, Yesterday, a weekday within the last six days, then the medium date) moved into `src/domains/timeline/day-title.ts`, with unit tests (343 pass). Not seen in the browser: the test profile has no note older than a week that the Timeline loads.
- **Unknown trackables: person, context and pointer.** A note with @sam, +work and ^healthy lists them under People, Contexts and Pointers. Create worked for @sam and +work (both are tiles on Track). ^healthy left the list after Create, so it is now known; a pointer does not appear as a tile.

## Step 3: second walk with history (profile with notes on 7 days)

Notes were saved on the last 12 days (using the capture date chips); new tags were created with the offer. Screens reviewed together.

- **Track tiles: text is clipped at the bottom right.** "Sleepgood" shows as "Sleepgo", and "12 days ago" is cut off, because the menu button (moved to the bottom right for normal tiles) covers it. Suggestion: reserve room for the menu button in the title and subtitle lines, or shorten long names.
- **Track tile subtitles are good:** "now", "a day ago", "12 days ago" read naturally. The value "1" shows on tiles logged today.
- **Timeline reads well:** "Today", "Yesterday", "Tuesday", each with the medium date on the right; tags show as chips with their count.
- **All entries show the same time (9:06 AM)** because the test notes were all saved at the same moment. Not a user issue, but it means the test history cannot show time of day.
- **Dashboard empty state shows "Add a Widget…" twice:** as a link in the message and as a row below. Suggestion: keep one.
- **Goal editor: Save does nothing until the goal is complete** ("Should be…" and "Target" are empty), and nothing says which fields are missing. Suggestion: name the missing fields, or enable Save only when complete with a hint.
- **Goal editor tracker picker works:** it lists all trackers with their tag and lets the user search by name.
- **"No recent backups" appears again** once trackers exist, on every tab. Expected by design, but it is still a constant banner for a user who has never been asked to back up.

## Walk log

Profile used: a fresh profile (no data, no backup), full setup walked from the first slide. Screenshots are in the agent's scratchpad (`user/`).

### 1. First-run setup
- **Slide "Which looks right?" (time, units, week start, location).** Not understood: the heading does not say what the group controls. The units choice ("10 lbs / 4.5 kg") and "Location Tracking ?" need plain labels such as "Units", "Week starts on", and a short help text.
- **Slide "Data Storage": Next is disabled until an option is chosen, with no hint.** Suggestion: say "Choose where to keep your data" or select "Local Only" by default.
- **"Nomie Server" is greyed out with no reason.** Not understood: is it unavailable, or is it just not chosen? Suggestion: an explicit label such as "Requires a Nomie Server address (Show Advanced)".
- **"Local Only ... FREE" and "Nomie Server ... FREE".** The word FREE appears after a description, which reads as a stray label. Suggestion: move the price into a small tag or remove it.
- **Splash after setup.** The app finishes loading in a few seconds, but during that time the logo and the "Daily Nomie 7" title overlap, and an empty outlined box sits at the bottom of the screen. Suggestion: check the splash layout.

### 2. Track (empty board)
- **Heading "Empty."** Poor copy for a new user. Suggestion: "No trackers yet".
- **"Get started by adding a trackable below."** Jargon: "trackable" and "Main board" are internal words. Suggestion: "Add something you want to track".
- **Persistent "Tap for more" tooltip** over the central button on every visit. Not understood whether it is meant to be permanent. Suggestion: show it once.

### 3. Create Custom Tracker
- **The editor shows "Share Tracker" and "Delete Trackable" for a tracker that has not been saved yet.** These actions do not make sense before the first save. Suggestion: hide them until the tracker exists.
- **"Measure By: Count" sits cramped:** the small label overlaps the top of the select box.
- **"Tag: #water" preview is cramped** and the tag text runs into the input's right edge. Hashtags and "Tag" are jargon for a new user; suggestion: "Short name used in notes: #water".
- **Save shows a dialog "Add #water to Main?"** with Ok and Cancel. Not understood: "Main" and "add ... to Main" are internal words. Suggestion: "Add Water to your Track screen?".
- **Save is intermittent in the automated run.** In one run the dialog appeared; in a second run the editor stayed open with no dialog. Not understood whether the save failed or only took longer. To check manually before deciding.

### 4. Other tabs (empty states, new user)
- **Timeline:** "No entries found between now and Jul 29th 2025". The date is wrong for today (Oct 2026), and the range start is not explained. Probably a bug in the default range; to check in the code.
- **Dashboard:** the empty state shows "Delete Dashboard" next to "Add Widget". Deleting the only dashboard from its empty state is a risky spot. Suggestion: move Delete into the dashboard menu.
- **"No recent backups" banner on every tab**, even for a brand-new user who has not logged anything yet. Suggestion: show it after the first log.
- **Goals:** "No goals found" with "Create a Daily Goal →". Clear. The Daily / Weekly / Monthly switch is shown although nothing exists yet; acceptable.
- **Experiments:** the empty state explains the feature well ("Test whether one change, such as no coffee after 14:00, affects something you track"). Good.
- **Settings:** the labels are clear. "v7 Feedback" on the top row is unexplained; the "v7" badge is not understood.

### 5. Capture a note
- **Typing "#walk" with no matching tracker shows "No Match Found!"** in a bubble over the tool row, which covers the location and expand icons. Suggestion: show the hint below the field, or only once.
- **Saving works and the note appears on the Timeline.** Good.
- **Inconsistent result for the hashtag.** On the Timeline the entry shows a chip "Walk 1 +", although the capture bar said "No Match Found!" and the Track screen still has no trackers. Not understood what the chip represents or whether a tracker was created. To check in the code.

### 6. Date formats
- Timeline day heading: "Today Oct 22, 2026 12:59 AM" (US order).
- Search results: "Oct 22nd 2026 12:59 AM" (ordinal, US order).
- Track and Dashboard: "Thursday 22 October" (day first).
- Capture pill: "Today 12:59 AM".
Three styles for the same date. Suggestion: one format, from the user's locale setting.

### 7. Goal editor (new goal)
- **"Delete Daily Goal" appears on a goal that is not saved yet.** Same problem as the tracker editor. Suggestion: hide it until the goal exists.
- **"Which Trackable? Select"**: "Trackable" is jargon. Suggestion: "Which tracker?".
- **"Should be..."** (a dropdown with no visible options until opened): not understood what it chooses. Suggestion: "Goal type" with clear options such as "At least", "At most".
- **"Target / Goal Target"**: the placeholder repeats the label. Suggestion: "e.g. 5".

### 8. Search
- **Search from Track works:** it finds the note, and "Search all notes for: walk" is offered.
- The result row and the "Search..." button both show the same action. Minor: the button could read "Show all".

### 9. Experiment wizard (new user)
- **Step 1 "Choose a change" is clear.** Five suggested changes, each with its length and tracker count. Good.
- **Step 2 pre-fills "Sleep Qual" as the tracker to watch, but this new user has no such tracker.** Bug: the suggestion is shown as if chosen. Next is then blocked with "Choose a tracker: Each outcome needs one of your trackers". Suggestion: only pre-fill trackers the user has, or leave the field empty with a prompt.
- **Two overlapping actions on step 2:** "Add Sleep Qual from library" and "Choose a tracker". Not clear what the difference is for a new user.
- **"I hope it goes up" looks like a link but is a dropdown** (the expected direction). Suggestion: style it as a select, or show "Expect: up / down / no change" as labelled buttons.
- The wizard shows "STEP 2 OF 3" and a progress bar. Good.

### 10. Add widget (new user, empty dashboard)
- **The widget picker is a horizontal row of icon tiles** (Display Value, Bar Chart, Line Chart, Habits, Positivity Chart, Just Text, Experiment) and the row is cut off at the right edge. Nothing says it scrolls. Suggestion: a second row, or a short hint.
- **The picker gives no hint that widgets need trackers.** A new user without trackers will see empty options. Suggestion: say "Widgets show your trackers. Add a tracker first" when none exist.
- Save stays disabled until a type is chosen. Good.

### 11. Settings (new user, Starter)
- **"How much do you want to see? Starter / Full"** is a clear, friendly choice. Good.
- **Technical labels for ordinary users:** "Update Usage and Streak Data", "Clean Plugin Database" with the description "Find and remove duplicate plugin settings", and "Auto Cleanup". Suggestion: move them under an "Advanced" heading.
- **"Toggle People Board" is in the page text** even though the People board is hidden in Starter mode. Not understood whether this text is visible or only for screen readers. To check with the layout.
- The Settings list is long for a new user (about 25 rows before the About section). Suggestion: fewer rows in Starter.

### 12. Backup, import, font size (new user)
- **"Generate a Backup" dialog has a typo:** "Depending on how long much data you have, this might take a while." Suggestion: "how much data".
- **"Download Backup" banner and "Back up now" both open the same "Generate a Backup" dialog.** Clear enough; the banner could say "Back up now" to match the Settings row.
- **Import sheet is clear:** "Import a file. Supports CSV files, Nomie backup files (all versions), and tracker packs." Good. "Tracker packs" is not explained.
- **Largest font size:** the Track screen scales without horizontal overflow. The "No recent backups" banner wraps onto three lines and takes a lot of room. Suggestion: shorter banner text at large sizes.

### Walk limits (honest notes)
- The walk with **data** (Track tiles with values, Timeline with several days, Goals with history, Analytics) was done earlier on a restored backup profile, not as a brand-new user. A new user's first week was not walked over time; this needs a real device check.
- Theme (Light, Dark, Auto) was checked in the earlier dark-mode walk, not again here.
- Interactive editors were only opened and read, not used to the end (for example, a tracker with a full input sheet).

### Summary so far (walk finished)
- The app works end to end for a new user: setup, a tracker, a note, search, goals and experiments open and explain themselves.
- The most frequent problems are jargon ("trackable", "Main", "tag"), a Delete action shown on unsaved items (tracker and goal editors), and three date formats.
- Several questions are parked above for Ronald: whether the splash overlap is a bug or intended, the Timeline's start date, and the hashtag chip.
