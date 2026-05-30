# parkaid: A Full Redesign Story

## What This Is

parkaid is a parking finder for downtown Calgary. React Native (Expo SDK 54) frontend with three screens — browse nearby spots, locate them on a map, and manage an active parking session. Express.js backend backed by PostgreSQL with PostGIS for spatial queries, proxying the Google Places API and serving parking data from Calgary Open Data.

This was originally a capstone project called ParkPal. The codebase worked, but it had accumulated significant technical debt. This document covers the full overhaul — what was wrong, what changed, and why.

---

## What Was Wrong

### Dead Code (2,400+ lines across 14 files)

An import-trace audit revealed 14 files that were never imported anywhere in the project. Some were earlier iterations of components that had been replaced but never removed:

| File | Lines | Why Dead |
|------|-------|----------|
| `spotDetailsCard.js` | 388 | Replaced by FlippableParkingCard |
| `ParkingListView.js` | 435 | Replaced by modular ParkingList components |
| `MapMarker.js` | — | Replaced by inline marker in MapOverlays |
| `FilterBar.js` (root) | — | HomeScreen has its own FilterBar |
| `SimpleSlider.js` | — | Never wired up |
| `PriceTag.js` | — | Price display moved inline |
| `ParkingDataProcessor.js` | — | Processing moved to hooks |

The MapScreen had 7 additional dead files — CompactBottomSheet, MapFABs, MapBottomSheet, FullListView, HorizontalParkingList, and two unused hooks. All were earlier iterations that ParkingBottomSheet and the current MapScreen architecture had replaced.

### Three Logging Systems

The app had three separate logging implementations:
- `SimpleLogger` — basic console wrapper
- `DebugLogger` — structured logger with categories
- `LogFile` — file-based logger that **monkey-patched `console.log`** to intercept all output

These chained into each other. DebugLogger called SimpleLogger, LogFile intercepted everything. The monkey-patching meant every `console.log` anywhere in the app triggered file I/O.

### Ghost Backend Services

The backend had three service files (`parkingService.js`, `predictionService.js`, `etlService.js`) that were never imported by `server.js`. `parkingService.js` referenced database tables (`check_ins`, `occupancy_patterns`) that don't exist in the schema. These were speculative architecture — code written for a future that never arrived. There was also a duplicate migration file, an unused database config, an empty error handler, and an unused cache module.

### Phantom Dependencies

8 npm packages were installed but never imported:
- **Backend**: `node-cron`, `express-rate-limit`, `node-fetch`, `winston`, `ioredis`
- **Mobile**: `axios`, `dotenv`, `expo-blur`, `expo-linear-gradient`

### Monolithic Server

`server.js` was 530 lines with every route handler, middleware function, and utility inlined in a single file. Health checks, parking queries, Places API proxy, session management, request logging — all in one.

---

## The Cleanup

### Methodology

1. **Import tracing**: For each file, grep across the entire project for its filename/exports. If nothing imports it, it's dead.
2. **Dependency audit**: Cross-reference every `require()`/`import` in source files against `package.json` dependencies. Any package not referenced in source is phantom.
3. **Service verification**: Check if `server.js` actually imports the service files. It doesn't. Check if the tables they reference exist in the schema. They don't.

### Results

| Metric | Before | After |
|--------|--------|-------|
| Mobile source files | 42 | 28 |
| Backend source files | 15 | 10 |
| Lines removed (dead code) | ~2,400 | 0 |
| Logging systems | 3 | 1 |
| npm packages (backend) | 18 | 13 |
| npm packages (mobile) | 28 | 24 |
| `server.js` lines | 530 | ~55 |

### Consolidated Logger

Replaced all three logging systems with a single `Logger.js`:
- In-memory buffer (max 500 entries)
- Auto-persist to AsyncStorage every 20 log entries
- Console output only in `__DEV__`
- No monkey-patching
- Methods: `log(action, data, type)`, `logSpotData(spot, context)`, `save()`, `cleanup()`

---

## The Rename

ParkPal became parkaid across 10+ files:

- `app.config.js`: name, slug, bundleIdentifier, package
- `package.json` (both): name fields
- `server.js`: banner text
- `api.js`: AsyncStorage cache key prefix `@parkaid:`
- Android: `build.gradle` namespace/applicationId, `strings.xml` app_name, `settings.gradle` rootProject, Kotlin package declarations
- Both READMEs

The rename had to be atomic — a partial rename (where some files say ParkPal and others say parkaid) would break the build. Every reference was updated in a single pass and verified with a project-wide grep.

---

## The Palette

### Why Navy/Amber/Cream

The original ParkPal used a warm palette: flame orange (#e25822) for primary actions, vanilla cream for surfaces, bistre brown for text, earth yellow for accents. It worked but felt generic — every parking app uses warm orange.

The new palette:

| Color | Hex | Role |
|-------|-----|------|
| Prussian Blue | #001d4a | Primary text, headings |
| Yale Blue | #27476e | Secondary text, borders, muted UI |
| Cerulean | #006992 | Actions — buttons, links, active states |
| Amber Honey | #eca400 | Attention — badges, highlights, GPS indicators |
| Cream | #eaf8bf | Warm surfaces, subtle fills, progress indicators |

### Design Hierarchy

- **Reading**: Prussian Blue on white. Not black (#1a1a1a) — the navy carries more personality while maintaining the same contrast ratio.
- **Interaction**: Cerulean for everything tappable. Buttons, links, active filter chips, map markers. One color = one meaning.
- **Attention**: Amber for things that need a second look. Permit badges, time-limit warnings, the pinned-location marker on the map. Amber reads as "notice" without reading as "danger."
- **Structure**: Yale Blue for the in-between — labels, dividers, inactive icons, borders. It's the color of "supporting cast."
- **Surfaces**: White primary. Cream only as subtle tints (card backgrounds, progress bars). Using cream as a full-screen background would be overwhelming.

### Token System

Colors are never used directly in components. Everything goes through two layers:

1. **PALETTE**: Raw color ramps (50-900 shades per color)
2. **TOKENS**: Semantic aliases that map to PALETTE values

```
TOKENS.text     = PALETTE.prussian[500]   // "what color is text?"
TOKENS.primary  = PALETTE.cerulean[500]   // "what color is a button?"
TOKENS.accent   = PALETTE.amber[500]      // "what color draws attention?"
```

This means dark mode is a single-file change: swap TOKENS values, everything updates.

### Migration Scope

120+ color references across 21 files. Every `PALETTE.flame` became `PALETTE.cerulean`, every `PALETTE.bistre` became `PALETTE.prussian` or `PALETTE.yale`, every `PALETTE.earth_yellow` became `PALETTE.amber`. Verified with grep — zero old palette references remain.

---

## The Backend

### From Monolith to Modules

The 530-line `server.js` was decomposed with no logic changes:

```
backend/
  server.js              -- 55 lines: cors, json, mount routes
  config/env.js          -- centralized Pool + Supabase client
  routes/
    health.js            -- GET /health, GET /api/test-db
    parking.js           -- nearby search, spot details, checkin/checkout
    places.js            -- Google Places autocomplete + details proxy
  middleware/
    requestLogger.js     -- request ID + timing
  utils/logger.js        -- jlog/consoleLog helpers
```

Every route handler was extracted verbatim. The only structural change was adding a `requestLogger` middleware that assigns a request ID and logs timing — something that was previously done inline in each handler.

### Why Delete, Not Wire Up

The three service files (`parkingService.js`, `predictionService.js`, `etlService.js`) were deleted rather than integrated because:

1. `parkingService.js` queries `check_ins` and `occupancy_patterns` tables that don't exist in the schema and were never created
2. `predictionService.js` implements ML-style occupancy predictions with no training data or model
3. `etlService.js` duplicates functionality already in `scripts/load-parking-data.js`

Wiring them up would mean building fictional infrastructure to support speculative features. The honest move is deletion.

---

## What Stayed

Not everything changed. The things that work well were left alone:

- **FlippableParkingCard**: The flip animation between front (summary) and back (details with horizontal paging) is a distinctive UX element. It got new colors, not new behavior.
- **PostGIS spatial queries**: `ST_DWithin` for nearby search with coordinate-based filtering works correctly and performs well. The backend refactor didn't touch query logic.
- **Hook-based state management**: `useFilterState`, `useLocationManager`, `useParkingSpots`, `usePlacesAutocomplete` — custom hooks without Redux/Context/Zustand. Appropriate for this scale and keeps state close to where it's used.
- **Three-tab navigation**: Home (browse), Map (locate), Park (session). Maps to three distinct user intents. Adding tabs would dilute.
- **Google Places proxy**: The backend proxies Places API calls to keep the API key server-side. Simple, effective, stays.

---

## What's Next

The token-based design system was built with extensibility in mind:

- **Dark mode**: Swap `TOKENS` values in a single file. Every component that uses `TOKENS.text`, `TOKENS.bg`, `TOKENS.surface` automatically updates. The PALETTE shade ramps (50-900) already have dark-friendly values at both ends.
- **Push notifications**: Session expiry reminders. The timer logic already exists in ActiveSession — it needs a notification channel, not new timer code.
- **Favorites**: Supabase row-level security for per-user saved spots. The device ID system is already in place.
- **Real-time occupancy**: Supabase Realtime subscriptions for live spot availability. The PostGIS query infrastructure supports this — it's a data source change, not an architecture change.
