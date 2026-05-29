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

A [`render.yaml`](../render.yaml) Blueprint is committed at the repo root, so
deployment is a few clicks and then automatic on every push.

1. Push this repo to GitHub.
2. In Render: **New + → Blueprint**, then select this repository.
3. Render reads `render.yaml` and creates the service. When prompted, paste your
   Supabase **`DATABASE_URL`** (the only required secret).
4. Click **Apply**. Render builds (`npm ci`) and starts (`npm start`), checking
   `/health` until it's live.

That's it — every later push to the connected branch auto-deploys. Run
`npm run migrate` and `npm run setup` once against your database (locally or
from Render's shell) to create the schema and load data.

---

## API

| Method | Endpoint | Notes |
| ------ | -------- | ----- |
| `GET`  | `/health` | DB connectivity check (used by Render) |
| `GET`  | `/api/test-db` | Row count in `parking_spots` |
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
