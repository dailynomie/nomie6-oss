# Svelte 5 Migration Progress

**Total Components:** 493  
**Status:** IN PROGRESS - Phase 1 (Icons) Complete ✅

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

### Batch 2: Simple UI Components (7 files) 🔵 PENDING
**Files:** button, container, list-item, divider, badge, avatar, input

**Pattern to Use:**
- Add `<svelte:options runes={true} />`
- Convert `export let` to `$props()`
- Replace `$:` computed statements with `$derived()` where possible
- For side effects, use `$effect()` with `untrack()` if needed
- Replace two-way bindings with explicit event handlers

**Challenges:**
- list-item: 47 imports, heavily used
- input: Complex bindings with `bind:value` patterns
- avatar: Reactive array transformations

---

### Batch 3: Store-Using Components (30-40 files) 🔵 PENDING
**Examples:** modal, backdrop2, pop-menu, toggle-switch, menu-inline, spinner

**Pattern to Use:**
- Keep store subscriptions with `$store` syntax (Svelte 5 compatible)
- Replace reactive statements `$:` with `$effect()` for side effects
- Ensure proper cleanup in `onDestroy`

---

### Batch 4: Complex Feature Components (50-70 files) 🔵 PENDING
**Examples:** Dashboard, Editor, Timeline, Analytics, Widget components

---

### Batch 5: Route & Remaining Components (50-70 files) 🔵 PENDING

---

## Summary Table

| Batch | Files | Pattern | Status | Completed |
|-------|-------|---------|--------|-----------|
| 1: Icons | 113 | `<svelte:options runes={true} />` + `$props()` | ✅ COMPLETE | 2026-05-31 |
| 2: Simple UI | 7 | `$props()` + `$derived()` + `$effect()` | 🔵 Pending | - |
| 3: Store-Using | 35 | Store subscriptions + `$effect()` | 🔵 Pending | - |
| 4: Complex | 70 | `$derived()` + `$effect()` + `untrack()` | 🔵 Pending | - |
| 5: Route/Edge | 60 | As needed per component | 🔵 Pending | - |
| **TOTAL** | **493** | - | **22.9%** | - |

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

### Next Batches
- [ ] Build succeeds
- [ ] Dev server runs
- [ ] Components render correctly
- [ ] No console errors
- [ ] Related features work
- [ ] No regressions in other areas

---

## Key Learnings

1. **Svelte 5 requires proper runes patterns** - Fine-grained reactivity is stricter than Svelte 4
2. **Side effects in reactive functions break** - Functions like `headerKeyExists()` that modify state while computing cause loops
3. **Per-file opt-in is safer** - `<svelte:options runes={true} />` allows gradual migration without global changes
4. **`$derived` preferred over `$effect`** - When possible, use read-only derived values instead of effects
5. **Virtual list needs layout deferral** - requestAnimationFrame needed for proper height calculation on initial load

---

## Next Steps

1. Test Batch 2 (Simple UI components)
2. Identify any reactive pattern issues during testing
3. Apply `untrack()` pattern from AVOID_INFINITE_INSTRUCTIONS.md where needed
4. Continue with Batch 3 (Store-using components)
5. Eventually migrate all 493 components to runes mode

