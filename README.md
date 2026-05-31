# parkaid - Smart Parking Finder for Downtown Calgary

parkaid is a mobile app that helps drivers find parking in downtown Calgary. It
shows real parking spots from the city's open data on a map, lets you search
around a location, and shows the price and zone rules for each spot.

The app is built with React Native (Expo). The backend is a Node and Express
API with a PostgreSQL database on Supabase, and it uses PostGIS (a Postgres
add-on for location queries) to find nearby spots. The backend runs on Render.

The backend is live. It needs one setting to run (`DATABASE_URL`), and the app
needs one setting to reach it (`EXPO_PUBLIC_API_URL`).

## What it does

- Search for parking near your current location, or drop a pin to search
  somewhere else. There's a radius selector from 250m up to 2km.
- See spots on a map with markers you can tap for details (price, zone,
  restrictions, capacity).
- See a list of nearby spots sorted by distance, with a rough walking time and
  filters by type (street, lot, residential, school, or free).
- Keep working when the network drops. Responses are cached on the phone, so
  the app shows the last data it had instead of an error.

## Tech stack

Mobile app
- React Native with Expo SDK 54 (one codebase for iOS, Android, and web)
- React Navigation for moving between screens
- React Native Maps for the map and markers
- Expo Location for GPS
- AsyncStorage for caching data on the phone

Backend
- Node.js and Express for the API
- node-postgres (`pg`) to talk to the database with plain SQL
- PostGIS for the "find spots within X meters" queries
- axios to call the Google Places API from the server

Database and data
- PostgreSQL, hosted on Supabase
- Parking data from Calgary's Open Data (about 2,700 spots)
- Google Places API for address search

Hosting and testing
- Render hosts the backend and redeploys when you push to GitHub
- Jest and Supertest for the backend tests

There's no Redis and no ORM. The backend is small on purpose: just Express
routes running SQL.

## How it works

```
Mobile app          Express API              PostgreSQL + PostGIS
(React Native)  ->  (on Render)         ->   (Supabase)
                    finds nearby spots,       parking_spots table
                    proxies Google Places
```

When you search, the app sends your location to the backend. The backend runs a
database query to find the closest spots and sends back a list. The address
search and map also go through the backend. That way the Google API key stays on
the server and is never shipped inside the app.

## Project structure

```
parkaid/
  mobile/                  React Native (Expo) app
    src/
      components/          reusable UI (cards, search bar, and so on)
      screens/             HomeScreen, MapScreen, SessionScreen
      hooks/               useParkingSpots, usePlacesAutocomplete, and so on
      services/            api.js, the single API client
      constants/           config.js, the single place the API URL is set
      utils/               helpers

  backend/                 Node and Express API
    config/                env.js, sets up the DB connection and checks env vars
    routes/                health, parking, places
    middleware/            request logging
    migrations/            schema.sql, the table and indexes
    scripts/               migrate.js and setup.js (loads Calgary data)
    tests/                 Jest and Supertest tests
    utils/                 logger
    server.js              starts the app

  render.yaml              Render config for auto-deploy
  README.md
```

## Running it locally

There are two parts to run: the backend (the API) and the mobile app.

You'll need:
- Node.js 18 or newer, and npm
- A Supabase project (the free tier is fine). This is your database.
- The Expo Go app on your phone, or an iOS/Android simulator

### 1. Backend

```bash
cd backend
cp .env.example .env     # then put your DATABASE_URL in .env (see below)
npm install
npm run migrate          # creates the parking_spots table and indexes
npm run setup            # loads about 2,700 spots from Calgary Open Data
npm start                # runs on http://localhost:3000
```

Where to get `DATABASE_URL`: in Supabase, click Connect at the top, choose
Session pooler, copy the URL, and replace `[YOUR-PASSWORD]` with your database
password. The address should contain `pooler.supabase.com`. (The deploy section
explains why the pooler one matters.)

Quick check that it works:

```bash
curl http://localhost:3000/health
curl "http://localhost:3000/api/parking/nearby?lat=51.0447&lng=-114.0719&radius=1000"
```

There's more backend detail (scripts, env vars, troubleshooting) in
[`backend/README.md`](backend/README.md).

### 2. Mobile app

```bash
cd mobile
npm install
```

Make a file at `mobile/.env` with one line pointing at your backend:

```bash
# Your phone can't reach "localhost" on your computer, so use your computer's
# IP address on your network (for example 192.168.1.20).
EXPO_PUBLIC_API_URL=http://192.168.x.x:3000
```

Then start it:

```bash
npx expo start -c        # press i for iOS, a for Android, or scan the QR code
```

Once the backend is deployed, you can use the Render URL here instead of your
local IP.

## Deploying the backend (Render)

The repo has a `render.yaml` file, which tells Render how to build and run the
backend. You set this up once, and after that every push to GitHub redeploys it.

### Step 1: create the service

1. Push the repo to GitHub.
2. In Render, click New, then Blueprint, and pick this repo. The `render.yaml`
   file has to be on the branch Render reads, which is usually `main`. If it's
   only on another branch, merge it to `main` or pick that branch.
3. Render reads the file and asks for one secret: `DATABASE_URL`.

### Step 2: use the right database URL

This is the part that trips people up. Supabase gives you two connection
strings, and you want the Session pooler one.

- Use this: Session pooler. The address contains `pooler.supabase.com`. It works
  over IPv4, which Render can use.
- Don't use this: Direct connection. The address looks like
  `db.<something>.supabase.co`. It only works over IPv6, which Render can't use.

If you use the direct one, the app will deploy but every database call fails
with an error like `connect ENETUNREACH` and an IPv6 address. If you see that,
switch to the pooler URL.

### Step 3: set up the database once

A fresh database is empty until you create the table and load the data. Open
Render's Shell tab (or run these locally with the same `DATABASE_URL`):

```bash
npm run migrate     # create the table
npm run setup       # load the parking data
```

### Step 4: check it's live

Open these in a browser. On the free tier the first request can take 30 to 60
seconds because the server goes to sleep when it's idle and has to wake up.

- `https://<your-service>.onrender.com/health` should return `{"status":"ok"}`
- `https://<your-service>.onrender.com/api/test-db` should return a count of
  spots

Then set the app's `EXPO_PUBLIC_API_URL` to that Render URL.

One thing worth knowing: `/health` only checks that the server is running, not
that the database is reachable. That's on purpose. If it checked the database
and Supabase was asleep, the whole deploy would fail. The full database check is
at `/api/test-db` instead.

## API endpoints

| Method | Endpoint | What it does |
| ------ | -------- | ------------ |
| GET | `/health` | Says the server is up. Used by Render. Always returns 200 when running. |
| GET | `/api/test-db` | Checks the database connection and returns how many spots are stored. |
| GET | `/api/parking/nearby?lat=&lng=&radius=&type=&free=` | Finds nearby spots. `type` can be `on_street`, `off_street`, `residential`, or `school`. `free=true` shows only unpriced spots. |
| GET | `/api/places/autocomplete?input=` | Address search suggestions (calls Google from the server). |
| GET | `/api/places/details?place_id=` | Details for one address (calls Google from the server). |

## What I worked on

This started as a school capstone project. It ran on a laptop but wasn't really
deployable. I took it from that to a backend that deploys and stays running.
The main things I did:

- Got it deploying on Render with push-to-deploy, so pushing to GitHub updates
  the live backend on its own.
- Cut the required setup down to one setting (`DATABASE_URL`). The old code
  crashed on startup because it built a client for a service it never used. I
  removed that and added a clear error message for when the setting is missing.
- Fixed three separate deploy problems, and confirmed each fix by actually
  running it:
  - The health check was querying the database, so when the database was slow
    or asleep the deploy failed. I changed it to just confirm the server is up.
  - The build failed because of a leftover `package-lock.json` at the top of the
    repo with no `package.json` next to it. I removed it and pointed Render at
    the backend folder.
  - Database calls failed because the connection string was the IPv6-only one.
    Switching to the pooler URL fixed it.
- Made the backend steadier: it reuses database connections, doesn't crash if a
  connection drops, and only turns on SSL when it's actually needed.
- The nearby search runs inside the database using PostGIS with an index, so
  it stays fast (around 30ms for the closest 100 spots).
- Wrote a script that pulls four datasets from Calgary's open data and loads
  them into one table. It's safe to run again without making duplicates.
- Cleaned up the old code: removed files nothing imported, dropped a dependency
  we didn't need, and stopped committing `node_modules` (about 1,900 files).
- Kept the Google API key on the server by having the app call the backend
  instead of calling Google directly.
- Added tests that check the API returns the right shape and that the distance
  search actually works.

## A few choices I made

- The app reads its backend URL from one place (`constants/config.js`), so the
  local, network, and production setups don't drift apart.
- The database does the location filtering and sorting, not the Node code. The
  API just formats the result. This keeps the server simple.
- Responses are cached on the phone, so the app still shows something useful
  when the connection is bad.
- The server fails loudly at startup if a required setting is missing, but
  handles a temporary database outage per request instead of crashing.

## Credits

This was a capstone project for SAIT, built with a team of five.

My main contributions:
- Redesigned the user interface
- Rebuilt the map screen, including the tappable cards and marker grouping
- Wrote the custom hooks for location, parking spots, and sessions
- Added performance work like debouncing, memoization, and lazy loading
- Restructured the components to be easier to maintain
- Improved the backend endpoints for the location queries
- Moved the database to Supabase (Postgres and PostGIS) and set up the Render
  deployment

The original project structure and base features were built with my capstone
team during Year 2, Semester 2.

Author: Ehrl Balquin
LinkedIn: https://www.linkedin.com/in/ehrlbalquin/
GitHub: https://github.com/ginesbal
