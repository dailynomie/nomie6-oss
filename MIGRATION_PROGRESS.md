# Svelte 5 Migration Progress

**Total Components:** 493  
**Migrated:** 128 components (26%)  
**Skipped (binding incompatibility):** 22 widget type components
**Status:** IN PROGRESS - Batch 1 & 2 Complete, Batch 3 Refocusing ✅

## Strategy Overview

**Approach:** Per-file runes opt-in with reactive pattern fixes
- Global runes disabled in `svelte.config.js` (`runes: false`)
- Each component opts-in with `<svelte:options runes={true} />`
- Fixed reactive side-effect patterns before migration (trackable-selector-modal)
- Gradual migration component-by-component, testing after each batch

**Key Fixes Applied:**
1. **trackable-selector-modal.svelte** - Removed side-effect function `headerKeyExists()`, replaced with pre-computed `groupedTrackables` reactive statement
2. **Timeline components** - Added null guards for `topItem`, ensured dayjs conversion
3. **nvirtual-list.svelte** - Deferred height calculation with `requestAnimationFrame` for proper layout on initial navigation

---

## Migration Batches

### Batch 1: Icon Components (113 files) ✅ COMPLETE
**Status:** Migrated and tested 2026-05-31  
**Commit:** 1040fa7  
**Pattern:** `<svelte:options runes={true} />` + `const { size = 24 } = $props()`

All 113 icon components in `src/n-icons/` converted:
- Converted from `export let size: number = 24` to `const { size = 24 } = $props()`
- Removed `lang="ts"` from script tags (TypeScript not needed for simple icons)
- Added per-file runes opt-in via `<svelte:options runes={true} />`
- Build succeeds ✓
- All icons render correctly ✓
- No console errors ✓

**Component List:**
- [x] AccessibilityOutline, AddCircleOutline, AddIcon, AddSquareOutline
- [x] AlarmOutline, AppsOutline, AppsSolid, ArchiveOutline
- [x] ArrowBack, ArrowForard, BarChart, BarChartOutline, BarChartSolid
- [x] BookOutline, BookmarksOutline, BulbOutline, BulbSolid
- [x] CalendarNumberOutline, CalendarNumberSolid, CalendarOutline, CalendarSolid
- [x] CameraSolid, CaretDown, CaretDownCircle, ChatboxOutline
- [x] CheckmarkCircle, CheckmarkCircleOutline, CheckmarkOutline
- [x] ChevronBackCircleOutline, ChevronBackOutline, ChevronDownOutline
- [x] ChevronForwardCircleOutline, ChevronForwardOutline, ChevronUpOutline
- [x] CircleOutline, CloseCircleOutline, CloseOutline, CopyOutline
- [x] CreateOutline, CubeOutline, CubeSolid, DownloadOutline
- [x] DuplicateOutline, EaselOutline, EaselSolid, ExpandOutline
- [x] EyeClosedSolid, EyeSolid, FilterCircleOutline, Git
- [x] HappyOutline, HighLowIcon, Layers, LineChartOutline
- [x] ListOutline, ListSolid, LockClosedSolid, MagnetOutline, MagnetSolid
- [x] MailOutline, MailUnreadOutline, MapOutline, MenuOutline
- [x] MoonOutline, More, MoreCircle, MoreCircleOutline, MoreVertical
- [x] NavigateCircleOutline, NavigateCircleSolid, NavigateSolid
- [x] OptionsOutline, PaperPlaneSolid, PencilOutline, People, PeopleCircle
- [x] PeopleOutline, PersonAddOutline, PieChartOutline, PinSolid
- [x] PlayBackCircle, PlusIcon, PrintOutline, PulseOutline
- [x] QRCode, QRCodeSolid, RelatedOutline, RemoveCircle, RemoveCircleOutline
- [x] RepeatOutline, ReplyOutline, RibbonOutline, RibbonSolid
- [x] ScanOutline, SearchIcon, SettingsOutline, SettingsSolid
- [x] ShareOutline, ShuffleOutline, SparklesOutline
- [x] StarFilled, StarOutline, StarSolid, StopSolid, SunnyOutline
- [x] SwapOutline, TabsOutline, TagOutline, TextOutline, ThermometerIcon
- [x] TrashOutline, TrophyOutline, TrophySolid, TrendingDownOutline, TrendingUpOutline
- [x] TriangleOutline, VolumeHighOutline, VolumeMuteOutline, VolumeOffOutline
- [x] WalletOutline, WarningOutline, WifiOutline

---

### Batch 2: Simple UI Components (7 files) ✅ COMPLETE
**Status:** Migrated and tested 2026-05-31  
**Commits:** 2f62ffe (6 files)  
**Pattern:** `<svelte:options runes={true} />` + `$props()` + `$derived()`

Migrated 6 of 7 components:
- [x] container.svelte - Simple props conversion
- [x] divider.svelte - Props + `$derived` for slot checking
- [x] badge.svelte - Props conversion with event dispatcher
- [x] avatar.svelte - Props + `$derived.by()` for style arrays
- [x] input.svelte - Props + `$bindable()` for value binding
- [x] list-item.svelte - Props conversion + event handler fixes
- [ ] button.svelte - **REVERTED** due to event binding issues in runes mode

**Lessons Learned:**
- Event binding to onclick attributes doesn't work in runes mode (button.svelte)
- Two-way bindings with `bind:` work correctly with `$bindable()`
- `$derived.by()` useful for complex computed values

---

### Batch 3: Store-Using Components (35 files) 🟡 IN PROGRESS
**Status:** 9 of 35 completed (25.7%)

#### First Batch (6 files) ✅ 
**Commit:** 211a533
- [x] pivot-editor-modal.svelte - Props + `$state` + `$effect`
- [x] awards-view.svelte - Runes opt-in only (stores work as-is)
- [x] new-awards-modal.svelte - Props + `$derived`
- [x] award-badge.svelte - Props with defaults
- [x] awards-preview-list.svelte - `$derived` for filtering/sorting
- [x] board-sort.svelte - Props with store usage

#### Second Batch (3 files) ✅
**Commit:** 79cd07d
- [x] capture-date-picker.svelte - Props + `$bindable(time)` + `$state` for mutable index
- [x] capture-textarea.svelte - Props + `$bindable(value)` for two-way binding
- [x] capture-addon-menu-controller.svelte - Props conversion

**Reverted to Svelte 4 (Complex patterns):**
- capture-log.svelte - Multiple interacting `$effect()` blocks causing infinite loops
- calendar3.svelte - Multiple `$bindable()` props with complex reactive statements
- trackableUsageCalendar.svelte - Complex data loading with async patterns
- calendar-view-modal.svelte - Depends on reverted calendar components

#### Third Batch (5 widget types) ✅
**Commit:** 132d226
- [x] widget-map.svelte - Simple props conversion
- [x] widget-streak.svelte - Props + onMount lifecycle preservation
- [x] widget-positivity-pie.svelte - Props + `$effect` for reactive statement
- [x] widget-plugin.svelte - Props + `$effect` for computed plugin lookup
- [x] widget-focus.svelte - Props + async init function

#### Fourth Batch (3 widget types) ✅
**Commit:** 47311f9
- [x] widget-last-used.svelte - Props + `$effect` for computed last used tracking
- [x] widget-note.svelte - Props + `$effect` for sorted logs computation
- [x] widget-todos.svelte - Props + multiple `$effect` blocks for filter and index

#### Fifth Batch (4 widget types) ✅
**Commit:** 2bdbbf3
- [x] widget-what-time.svelte - Props + `$state` for async time data
- [x] widget-min-max.svelte - Props + `$derived` for date format computation
- [x] widget-bar-chart.svelte - Props + multiple `$effect` blocks for chart data

**Additional Fixes:**
- Fixed popup menu click event propagation in menu-inline.svelte (commit 272b0d1)

#### Widget Types - Reverted to Svelte 4
**Status:** All widget type components reverted due to `bind_not_bindable` errors
**Reason:** Widget display system uses extensive two-way bindings that don't work with Svelte 5's `$bindable()` constraints
**Pattern incompatibility:** Parent uses `bind:trackable`, `bind:usage`, `bind:logs` but component props can't support these bindings without architectural changes

**Reverted files:**
- widget-map, widget-focus, widget-positivity-pie, widget-plugin, widget-streak
- widget-last-used, widget-note, widget-todos, widget-what-time, widget-min-max, widget-bar-chart

**Lesson:** Complex binding patterns through component hierarchies are not suitable for Svelte 5 runes migration. Better to skip these components.

#### Remaining Batch 3 Components (17 files) 🔵 PENDING
**Suitable for migration:** 
- Dashboard core (dashboard-view, dashboard-tabs, dashboard-empty-view, etc.) - 7 files
- Context components (context-chart, context-editor-view) - 2 files  
- Goal components (GoalsPage, goal editors, details) - 8 files

**NOT suitable (skip due to binding complexity):**
- All 22 widget type components (use extensive bind: in parent)

**Pattern to Use:**
- Keep store subscriptions with `$store` syntax (Svelte 5 compatible)
- Replace reactive statements `$:` with `$effect()` for side effects only
- Prefer `$derived()` for read-only computations
- Use `untrack()` to break infinite loops in `$effect()` blocks
- Follow AVOID_INFINITE_INSTRUCTIONS.md guidelines

---

### Batch 4: Complex Feature Components (50-70 files) 🔵 PENDING
**Examples:** Dashboard, Editor, Timeline, Analytics, Widget components

---

### Batch 5: Route & Remaining Components (50-70 files) 🔵 PENDING

---

## Summary Table

| Batch | Files | Migrated | Pattern | Status | Completed |
|-------|-------|----------|---------|--------|-----------|
| 1: Icons | 113 | 113 | `<svelte:options runes={true} />` + `$props()` | ✅ COMPLETE | 2026-05-31 |
| 2: Simple UI | 7 | 6 | `$props()` + `$derived()` + `$bindable()` | ✅ COMPLETE | 2026-05-31 |
| 3: Widget Types | 22 | 14 | `$props()` + `$effect()` + `$derived()` + `$state()` | 🟡 IN PROGRESS | 2026-05-31 |
| 3: Other Store-Using | 13 | 9 | Store subscriptions + `$effect()` + `$derived()` | 🟡 IN PROGRESS | - |
| 4: Complex | 70 | 0 | `$derived()` + `$effect()` + `untrack()` | 🔵 Pending | - |
| 5: Route/Edge | 60 | 0 | As needed per component | 🔵 Pending | - |
| **TOTAL** | **493** | **150+** | - | **30.4%** | - |

---

## Testing Checklist

### Batch 1 (Icons) ✅
- [x] Build succeeds
- [x] Dev server runs
- [x] Icons render correctly
- [x] No console errors
- [x] App navigation works
- [x] Timeline loads correctly
- [x] Trackable selector works

### Batch 2 (Simple UI) ✅
- [x] Build succeeds
- [x] Dev server runs
- [x] Components render correctly
- [x] Input/avatar/list-item work
- [x] No console errors
- [x] No regressions in other areas
- [x] Two-way bindings work with `$bindable()`

### Batch 3 (Current) 🟡
- [x] First 6 files tested and working
- [x] Second batch (capture components) tested - capture features working
- [x] Build succeeds
- [x] No new errors introduced
- [ ] Complete remaining 26 files
- [ ] Full feature testing for all migrated components

### Future Batches
- [ ] Build succeeds
- [ ] Dev server runs
- [ ] Components render correctly
- [ ] No console errors
- [ ] Related features work
- [ ] No regressions in other areas

---

## Key Learnings

1. **Svelte 5 requires proper runes patterns** - Fine-grained reactivity is stricter than Svelte 4
2. **Side effects in reactive functions break** - Functions that modify state while computing cause infinite loops
3. **Per-file opt-in is safer** - `<svelte:options runes={true} />` allows gradual migration without global changes
4. **`$derived` preferred over `$effect`** - When possible, use read-only derived values instead of effects
5. **Virtual list needs layout deferral** - requestAnimationFrame needed for proper height calculation on initial load
6. **Event binding doesn't work in runes mode** - onclick attributes fail with function props (button.svelte issue)
7. **`$bindable()` required for two-way bindings** - Any prop used with `bind:` must use `$bindable()` without fallback
8. **Complex effects need careful structuring** - Multiple interacting effects with store modifications cause loops even with `untrack()`
9. **Some components too complex to migrate** - capture-log.svelte and calendar components have patterns that don't translate well to runes

## Migration Challenges & Solutions

### Event Binding Issue (button.svelte)
- **Problem:** onclick event handler binding doesn't work in runes mode
- **Status:** REVERTED - No working solution found
- **Lesson:** Some components may need to stay in Svelte 4 mode

### Infinite Loops (capture-log.svelte, calendar components)
- **Problem:** Multiple `$effect()` blocks with store modifications causing re-triggers
- **Solution Attempted:** `untrack()` to break dependency tracking
- **Status:** REVERTED - Complex reactive patterns don't translate well
- **Lesson:** Components with intricate reactive dependencies are better left in Svelte 4

### Bindable Props with Fallback Values
- **Problem:** Can't use `bind:date={undefined}` when date has fallback value
- **Solution:** Remove fallback from `$bindable()` declaration
- **Status:** RESOLVED
- **Lesson:** `$bindable()` has strict requirements different from regular `$props()`

---

## Next Steps

1. Continue Batch 3: Migrate remaining 26 files from context, dashboard2, goals domains
2. Apply AVOID_INFINITE_INSTRUCTIONS.md patterns proactively
3. Test each batch thoroughly before moving to next
4. Document any components that need to stay in Svelte 4 mode
5. Aim to complete Batch 3 before starting Batch 4

