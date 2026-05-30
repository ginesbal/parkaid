# parkaid — Smart Parking Finder for Downtown Calgary

A full-stack mobile app that helps drivers find parking in downtown Calgary:
real city parking data, an interactive map, distance-based search, and live
pricing/zone details. **React Native (Expo)** on the front end, **Node/Express +
PostgreSQL/PostGIS (Supabase)** on the back end, deployed to **Render** with
push-to-deploy.

> **Status:** Backend live on Render. One environment variable to run
> (`DATABASE_URL`). Mobile app points at the backend through one setting
> (`EXPO_PUBLIC_API_URL`).

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [How It Fits Together](#how-it-fits-together)
- [Features](#features)
- [Project Structure](#project-structure)
- [Run It Locally](#run-it-locally)
- [Deploy the Backend (Render)](#deploy-the-backend-render)
- [API Endpoints](#api-endpoints)
- [Engineering Highlights](#engineering-highlights)
- [Design Decisions](#design-decisions)
- [Attribution & Author](#attribution--author)

---

## Tech Stack

| Layer | Technology | Notes |
| ----- | ---------- | ----- |
| **Mobile** | React Native 0.81 + Expo SDK 54, React 19 | iOS, Android, and web from one codebase |
| | React Navigation 6 | Tab + native-stack navigation |
| | React Native Maps | Google Maps rendering + custom markers |
| | Expo Location | GPS / geolocation |
| | AsyncStorage | Offline cache + request de-duplication |
| **Backend** | Node.js (18+) + Express 4 | RESTful JSON API, CORS-enabled |
| | `pg` (node-postgres) | Direct SQL, pooled connections |
| | PostGIS | Spatial "find parking within X meters" queries |
| | axios | Server-side Google Places proxy |
| **Database** | PostgreSQL via Supabase | Managed Postgres + PostGIS extension |
| **External data** | Calgary Open Data | ~2,700 real parking spots (street, lot, residential, school) |
| | Google Places API | Address search / autocomplete (key stays server-side) |
| **Deploy** | Render (Blueprint) | Push-to-deploy from `render.yaml` |
| **Testing** | Jest + Supertest | Integration tests against the live API contract |

There is **no Redis and no ORM** — the backend is intentionally small: plain
Express routes over pooled SQL.

---

## How It Fits Together

```
┌─────────────────────┐        HTTPS         ┌──────────────────────────┐
│   Mobile app        │  ───────────────────▶│   Express API (Render)   │
│   React Native /    │   /api/parking/...   │                          │
│   Expo              │   /api/places/...    │   • spatial search (SQL) │
│                     │◀───────────────────  │   • Google Places proxy  │
└─────────────────────┘     JSON             └──────────┬───────────────┘
        │                                                │ pooled SQL (PostGIS)
        │ EXPO_PUBLIC_API_URL                            ▼
        │ points at the backend            ┌──────────────────────────┐
        │                                  │  PostgreSQL + PostGIS     │
        ▼                                  │  (Supabase)               │
   Google Maps SDK                         │  parking_spots table      │
   (map tiles on device)                   └──────────────────────────┘
                                                         ▲
                                       one-time load     │
                                   ┌─────────────────────┘
                                   │  Calgary Open Data (npm run setup)
```

The Google Places **API key lives only on the server** — the mobile app calls
`/api/places/*` so the key is never shipped in the app bundle.

---

## Features

- **Location search** — current GPS location, pin-drop for a custom area, and
  Google Places autocomplete, with a radius selector (250 m – 2 km).
- **Interactive map** — real parking markers, flippable cards with full spot
  details (pricing, zone, restrictions, capacity).
- **Nearby list** — sorted by distance with walking-time estimates and
  type filters (street / lot / residential / school / free).
- **Offline-friendly** — responses are cached in AsyncStorage, so the app keeps
  working (with a clear "offline" state) when the network drops.

---

## Project Structure

```
parkaid/
├── mobile/                  # React Native (Expo) app
│   └── src/
│       ├── components/      # Reusable UI (cards, search bar, …)
│       ├── screens/         # HomeScreen, MapScreen, SessionScreen
│       ├── hooks/           # useParkingSpots, usePlacesAutocomplete, …
│       ├── services/        # api.js — single API client
│       ├── constants/       # config.js — single source of API_URL
│       └── utils/           # helpers
│
├── backend/                 # Node.js + Express API
│   ├── config/              # env.js — DB pool + env validation
│   ├── routes/              # health, parking, places
│   ├── middleware/          # request logging
│   ├── migrations/          # schema.sql (PostGIS table + indexes)
│   ├── scripts/             # migrate.js, setup.js (load Calgary data)
│   ├── tests/               # Jest + Supertest integration tests
│   ├── utils/               # logger
│   └── server.js            # app entry point
│
├── render.yaml              # Render Blueprint (push-to-deploy config)
└── README.md
```

---

## Run It Locally

You'll run two pieces: the **backend** (API) and the **mobile** app.

### Prerequisites

- **Node.js 18+** and npm
- A **Supabase** project (free tier is fine) — this is your database
- For the app: the **Expo Go** app on your phone, or an iOS/Android simulator

### 1. Backend

```bash
cd backend
cp .env.example .env     # then paste your DATABASE_URL into .env (see below)
npm install
npm run migrate          # creates the parking_spots table + PostGIS indexes
npm run setup            # loads ~2,700 real parking spots from Calgary Open Data
npm start                # serves http://localhost:3000
```

**Where `DATABASE_URL` comes from:** in Supabase, click **Connect** (top of the
dashboard) → choose **Session pooler** → copy the URI → replace `[YOUR-PASSWORD]`
with your database password. The host should contain `pooler.supabase.com`.
(See the deploy section for *why the pooler matters*.)

Quick check it's working:

```bash
curl http://localhost:3000/health        # {"status":"ok"}
curl "http://localhost:3000/api/parking/nearby?lat=51.0447&lng=-114.0719&radius=1000"
```

More backend detail (scripts, env vars, troubleshooting) lives in
[`backend/README.md`](backend/README.md).

### 2. Mobile app

```bash
cd mobile
npm install
```

Create `mobile/.env` with one line pointing at your backend:

```bash
# Phone/simulator can't reach "localhost" on your computer — use your LAN IP.
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
# (For a deployed backend, use the https Render URL instead.)
```

Then start Expo:

```bash
npx expo start -c        # press 'i' for iOS, 'a' for Android, or scan the QR in Expo Go
```

> **Tip:** "localhost" inside the app means the *phone*, not your computer.
> On a real device use your machine's LAN IP (e.g. `192.168.1.20:3000`); once the
> backend is deployed, just use the Render URL.

---

## Deploy the Backend (Render)

The backend is set up for **push-to-deploy**: a [`render.yaml`](render.yaml)
Blueprint is committed, so Render knows how to build and run everything. You do
this once, then every `git push` redeploys automatically.

### Step 1 — Create the service

1. Push this repo to GitHub.
2. In Render: **New + → Blueprint** and pick this repo.
   `render.yaml` must be on the branch Render reads (its **default branch**,
   usually `main`). If it's only on a feature branch, merge it to `main` or
   select that branch.
3. Render reads the Blueprint and prompts for one secret: **`DATABASE_URL`**.

### Step 2 — Use the right database URL ⚠️ (the #1 gotcha)

Supabase gives you two kinds of connection string. **Use the pooler one:**

| Use this ✅ | Not this ❌ |
| ---------- | ---------- |
| **Session pooler** | **Direct connection** |
| `…@aws-0-<region>.pooler.supabase.com:5432/postgres` | `…@db.<ref>.supabase.co:5432/postgres` |
| IPv4 — works on Render | **IPv6-only** — Render can't reach it |

If you use the direct URL, the app deploys but every database call fails with
`connect ENETUNREACH …:5432` (an IPv6 address). The pooler URL fixes it. In
Supabase: **Connect → Session pooler**.

### Step 3 — Initialize the database (once)

The pooled connection is empty until you create the table and load data. From
Render's **Shell** tab (or locally with the same `DATABASE_URL`):

```bash
npm run migrate     # create the schema
npm run setup       # load Calgary parking data
```

### Step 4 — Verify it's live

Open these in a browser (the first request may take ~30–60s on the free tier —
it "cold starts" after inactivity):

- `https://<your-service>.onrender.com/health` → `{"status":"ok"}`
- `https://<your-service>.onrender.com/api/test-db` → `{"success":true,"totalSpots":...}`

Then point the mobile app's `EXPO_PUBLIC_API_URL` at that Render URL. Done.

> **Why the deploy is reliable:** `/health` is a lightweight *liveness* check
> that doesn't touch the database, so a paused/slow Supabase can't fail the
> deploy. The strict database check lives at `/api/test-db`.

---

## API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET` | `/health` | Liveness check (used by Render) — always 200 when the server is up |
| `GET` | `/api/test-db` | Strict database connectivity + row count |
| `GET` | `/api/parking/nearby?lat=&lng=&radius=&type=&free=` | Spatial search. `type`: `on_street`/`off_street`/`residential`/`school`; `free=true` filters unpriced |
| `GET` | `/api/places/autocomplete?input=` | Google Places autocomplete (server-side key) |
| `GET` | `/api/places/details?place_id=` | Google Places details (server-side key) |

---

## Engineering Highlights

Things worth calling out (and résumé-ready bullets):

- **Took a capstone prototype to a reliably deployable service** on Render with
  push-to-deploy (committed `render.yaml` Blueprint) and a one-command setup.
- **Reduced required configuration to a single environment variable**
  (`DATABASE_URL`) by removing an unused client that crashed the server on boot,
  and added fail-fast validation with a clear error message.
- **Diagnosed and fixed real deployment failures** end to end: a health-check
  timeout (made `/health` a DB-independent liveness probe), a monorepo build
  failure (`rootDir`/orphan lockfile), and a Supabase **IPv6 vs. IPv4 pooler**
  connectivity issue — each reproduced and verified, not guessed.
- **Hardened the Node/Express backend for production:** pooled PostgreSQL with an
  idle-connection error handler, conditional SSL (managed DB vs. local), and
  opt-in file logging so it doesn't write to ephemeral disk per request.
- **Engineered efficient geospatial search** with PostgreSQL + PostGIS
  (`ST_DWithin` / `ST_Distance` over a GiST index), returning the nearest 100
  spots in ~30 ms.
- **Built an ETL loader** that ingests four Calgary Open Data datasets into a
  unified, idempotent schema (`ON CONFLICT` upserts, re-runnable migrations).
- **Simplified an inherited codebase:** removed dead code, an unused dependency,
  and ~1,900 accidentally-committed `node_modules` files; aligned the mobile↔
  backend API contract to exactly what the app uses.
- **Protected third-party API keys** by proxying Google Places through the
  backend instead of shipping the key in the mobile bundle.
- **Wrote integration tests** (Jest + Supertest) that assert the live API
  response contract and spatial-query correctness.

---

## Design Decisions

**Single source of truth for the API URL.** The mobile app resolves its backend
URL in exactly one place (`constants/config.js`, from `EXPO_PUBLIC_API_URL`), so
there's no drift between local, LAN, and production.

**Thin backend, smart database.** Spatial filtering and sorting happen in
PostGIS (indexed), not in Node — the API just shapes the JSON. This keeps the
server stateless and easy to scale or restart.

**Offline-first client.** Responses are cached in AsyncStorage with TTLs, and
in-flight requests are de-duplicated, so the UI stays responsive on flaky
mobile networks.

**Fail loud at boot, degrade gracefully at runtime.** Missing `DATABASE_URL`
stops the server with a clear message; a momentarily unreachable database
returns a clean error per-request instead of crashing the process.

---

## Attribution & Author

### Project Attribution

This project was developed as a Capstone Project for SAIT in collaboration with
five team members.

### My Contributions

- **UI/UX Redesign:** Completely revamped the user interface with modern design patterns
- **Map Screen Architecture:** Redesigned and implemented the interactive map functionality with flippable cards and dynamic clustering
- **Custom Hooks Development:** Created reusable hooks for location management, parking spots, and session handling
- **Performance Optimization:** Implemented debouncing, memoization, and lazy loading strategies
- **Component Refactoring:** Restructured the component architecture for better maintainability
- **API Integration:** Enhanced backend endpoints for efficient spatial queries
- **Database & Deployment:** Migrated to Supabase (Postgres/PostGIS) and set up
  reliable push-to-deploy hosting on Render

### Original Team

- Initial project structure and concept developed with my Capstone Project Team.
- Base functionality created collaboratively during Year 2 Semester 2 of my program.

### Author

**Ehrl Balquin**
**LinkedIn:** <https://www.linkedin.com/in/ehrlbalquin/>
**GitHub:** <https://github.com/ginesbal>

---

*This project showcases proficiency in mobile development, API design, database
management, geospatial queries, and modern deployment workflows.*
