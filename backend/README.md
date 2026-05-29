# CurbFlow Backend

Node.js + Express API for parking search in downtown Calgary. Uses PostGIS
spatial queries over a Supabase Postgres database.

The server needs **one** environment variable to run: `DATABASE_URL`.

---

## Run it locally

**Prerequisites:** Node.js 18+ and a Supabase project (free tier is fine).

### 1. Get your database URL

In Supabase: **Project → Settings → Database → Connection string → URI**.
Copy the **connection pooler** URI (the host contains `pooler`, port `6543`)
and fill in your database password.

### 2. Configure and install

```bash
cd backend
cp .env.example .env        # then paste your DATABASE_URL into .env
npm install
```

### 3. Create the schema, then load data

```bash
npm run migrate             # creates the parking_spots table + PostGIS indexes
npm run setup               # loads ~2,700 parking spots from Calgary Open Data
```

> If `npm run migrate` reports it can't create extensions, open Supabase
> **Database → Extensions** and enable `postgis` and `uuid-ossp` once, then re-run.

### 4. Start the server

```bash
npm start                   # http://localhost:3000
```

Quick check:

```bash
curl http://localhost:3000/health
curl "http://localhost:3000/api/parking/nearby?lat=51.0447&lng=-114.0719&radius=1000"
```

---

## Deploy to Render (push-to-deploy)

A [`render.yaml`](../render.yaml) Blueprint is committed at the repo root. It
sets `rootDir: backend`, so Render builds and runs inside `backend/` (where
`package.json` lives) — **the app is a subfolder of this repo, so this matters.**

### Option A — Blueprint (recommended)

1. Push this repo to GitHub. **`render.yaml` must be on the branch Render reads
   — its default branch (usually `main`).** If it's only on a feature branch,
   either merge it to `main` or pick that branch when creating the Blueprint.
2. In Render: **New + → Blueprint**, select this repo.
3. Render reads `render.yaml`, creates the service, and prompts for your Supabase
   **`DATABASE_URL`** (the only required secret).
4. **Apply.** Render builds (`npm ci`) and starts (`npm start`).

### Option B — Manual Web Service

If you create the service by hand instead of via Blueprint, you **must** set:

- **Root Directory:** `backend`  ← without this, the build fails with
  `ENOENT: package.json` (this repo has no `package.json` at its root)
- **Build Command:** `npm ci`
- **Start Command:** `npm start`
- **Health Check Path:** `/health`
- **Environment:** add `DATABASE_URL` (your Supabase pooler URI)

### After the first deploy

Run `npm run migrate` then `npm run setup` once against your database (locally
or from Render's **Shell** tab) to create the schema and load data. Every later
push to the connected branch then auto-deploys.

---

## API

| Method | Endpoint | Notes |
| ------ | -------- | ----- |
| `GET`  | `/health` | Liveness check (used by Render) — always 200 when the process is up |
| `GET`  | `/api/test-db` | Strict database connectivity + row count in `parking_spots` |
| `GET`  | `/api/parking/nearby?lat=&lng=&radius=&type=&free=` | Spatial search. `type`: `on_street`/`off_street`/`residential`/`school`; `free=true` filters unpriced |
| `GET`  | `/api/places/autocomplete?input=` | Google Places proxy — needs `GOOGLE_PLACES_API_KEY` (optional) |
| `GET`  | `/api/places/details?place_id=` | Google Places proxy — needs `GOOGLE_PLACES_API_KEY` (optional) |

---

## Environment variables

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `DATABASE_URL` | **Yes** | Supabase Postgres connection (pooler URI) |
| `PORT` | No | Listen port (Render sets this; defaults to `3000`) |
| `GOOGLE_PLACES_API_KEY` | No | Enables the `/api/places/*` proxy |
| `CALGARY_API_TOKEN` | No | Higher rate limit for `npm run setup` |
| `LOG_DIR` / `LOG_FILE` | No | Also write structured logs to a file (off by default) |

---

## npm scripts

| Script | Does |
| ------ | ---- |
| `npm start` | Start the server |
| `npm run dev` | Start with auto-reload (nodemon) |
| `npm run migrate` | Apply `migrations/schema.sql` (idempotent) |
| `npm run setup` | Load Calgary Open Data into the database |
| `npm test` | Run the integration test suite (needs a populated DB) |

---

## Troubleshooting

- **`DATABASE_URL is not set`** — copy `.env.example` to `.env` and fill it in.
- **`ECONNREFUSED` / timeout** — the Supabase project may be paused; open the
  dashboard and restore it. Confirm `DATABASE_URL` is the pooler URI.
- **No spots returned** — run `npm run migrate` then `npm run setup`.
