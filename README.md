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
  somewhere else. A slider sets how far you'll walk, anywhere from 1 to 25
  minutes (about 2km), and both screens remember it.
- Search by address or place. Your last three picks show when you tap the
  empty search box. They're kept only on your phone, and Clear removes them.
- See spots on a map with markers you can tap for details (price, zone,
  restrictions, capacity).
- See a list of nearby spots sorted by distance, with a rough walking time and
  a switch to show only street parking, lots or permit parking.
- Start a parking timer for a spot ("Park here" on its card). It won't plan
  past the spot's posted time limit, and it reminds you 10 minutes before
  time's up, even with the app closed. It's a reminder only: paying still
  happens at the pay station or in the City's parking app.
- Keep working when the network drops. Responses are cached on the phone, so
  the app shows the last data it had instead of an error.

## Tech stack

Mobile app
- React Native with Expo SDK 54 (one codebase for iOS, Android, and web)
- React Navigation for moving between screens
- React Native Maps for the map and markers on phones; on the web, MapLibre
  with free OpenStreetMap tiles from OpenFreeMap (no key needed)
- Expo Location for GPS
- Expo Notifications for the parking reminders (scheduled on the phone, no
  push server)
- AsyncStorage for caching data on the phone

Backend
- Node.js and Express for the API
- node-postgres (`pg`) to talk to the database with plain SQL
- PostGIS for the "find spots within X meters" queries
- axios to call the address search services from the server

Database and data
- PostgreSQL, hosted on Supabase
- Parking data from Calgary's Open Data (about 2,700 spots)
- Address search: OpenStreetMap search (Photon) for free, or Google Places
  when a key is set

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
                    proxies address search
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
- An iOS simulator or Android emulator, or a phone (see "Expo Go and SDK 54"
  below before using Expo Go on an iPhone)

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

#### Expo Go and SDK 54

The app is on Expo SDK 54, and Expo Go can only open projects on the SDK it was
built for. The App Store's Expo Go moved to SDK 57 in September 2026, so it
can't run this project on an iPhone. It crashes on launch with
"'PlatformConstants' could not be found". Use one of these instead:

- **Simulator or emulator:** run `npx expo start -c`, then press `i` or `a`.
  Expo installs the matching Expo Go for you.
- **Android phone:** install Expo Go for SDK 54 from
  [expo.dev/go](https://expo.dev/go), then scan the QR code.
- **Any phone, iPhone included:** a development build, which is the app
  compiled with its own native code, so Expo Go isn't involved. Plug the phone
  in and run `npm run ios -- --device` (needs a Mac with Xcode; a free Apple ID
  works) or `npm run android`.

A build of your own draws the map with your Google key, `GOOGLE_MAPS_API_KEY`
in `mobile/.env`, since Expo Go isn't there to supply one. Android needs it;
without it the iPhone shows Apple Maps instead. Setup is in
[mobile/GOOGLE_MAPS_SETUP.md](mobile/GOOGLE_MAPS_SETUP.md).

Rebuild a development build after pulling changes that add a native module,
such as `expo-notifications`.

## The web demo

The same app builds for the web, with a live map, real spots and working
search, so people can try it without a phone. Point it at your deployed backend
and export it as a static site:

```bash
cd mobile
EXPO_PUBLIC_API_URL=https://<your-backend>.onrender.com npm run export:web
```

Then upload the `mobile/dist` folder to any static host (Netlify, Vercel,
GitHub Pages, and so on).

Shared links show a preview card (`mobile/public/og-image.png`). LinkedIn and
some other sites only load it from a full address, so once the demo is
hosted, put the site's address in front of `og-image.png` in
`mobile/public/index.html`.

How the web version differs:
- It starts in downtown Calgary without asking for the visitor's location,
  since most visitors won't be in Calgary, where the parking data is.
- The map uses free OpenFreeMap tiles: no key or sign-up. OpenFreeMap is
  donation-funded with no uptime guarantee; to use another provider or a
  copy you host yourself, set `EXPO_PUBLIC_MAP_STYLE_URL` to its style. A
  self-hosted style can give its tiles, sprite and fonts as relative paths.
- Address search works with no setup (free OpenStreetMap search through the
  backend). Set `GOOGLE_PLACES_API_KEY` on Render to use Google instead.
- Reminders are phone-only, so the Park tab's timer doesn't notify on the web.
- Render's free plan sleeps after about 15 minutes without visits, so the
  first visitor after a quiet spell waits up to a minute for spots to load.

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

Prices come from each street block's rate schedule, which `npm run setup`
takes from the City's "On-Street Parking Zones with Rates" data. A database
loaded before that was added has no schedules, so street spots read "Rate on
signs": run `npm run setup` again to fill them in. It updates the rows it
loaded before rather than adding copies.

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
| GET | `/api/places/autocomplete?input=` | Address search suggestions in Calgary. Uses free OpenStreetMap search (Photon), or Google Places when `GOOGLE_PLACES_API_KEY` is set. |
| GET | `/api/places/details?place_id=` | Where one suggestion is, so the map can go there. |

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

## Design skills

The design passes (audit, critique, polish and the rest) use the
[impeccable](https://github.com/pbakaus/impeccable) skills. They're in
`.claude/skills`, where Claude Code picks them up, so `/audit` or `/critique`
works in any session on this repo. `.agents/skills` holds the same skills for
other AI tools. The project's design brief, which every skill reads first, is
`.impeccable.md`.

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
