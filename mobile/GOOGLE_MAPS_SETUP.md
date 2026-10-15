# Google keys

parkaid uses at most two Google keys, and works without either in most setups.

| Key | Where it goes | What it's for | Needed? |
|---|---|---|---|
| `GOOGLE_MAPS_API_KEY` | `mobile/.env` | Drawing the map in a build of your own | Only for your own Android build (iPhone falls back to Apple Maps) |
| `GOOGLE_PLACES_API_KEY` | the backend (`backend/.env`, or Render's Environment tab) | Address search through Google | No: search uses free OpenStreetMap search without it |

Expo Go and the web demo need neither. Expo Go brings its own map key, and
the web map is MapLibre with free OpenStreetMap tiles.

## The map key (`GOOGLE_MAPS_API_KEY`)

A build you run yourself (`npm run android`, `npm run ios`, or an EAS build)
needs it, because Expo Go isn't there to supply one.

1. In the Google Cloud console, open
   [APIs & Services → Library](https://console.cloud.google.com/apis/library)
   and turn on **Maps SDK for Android** and **Maps SDK for iOS**.
2. Create a key under
   [Credentials](https://console.cloud.google.com/apis/credentials). Under
   "API restrictions", limit it to those two SDKs.
3. Put it in `mobile/.env`:
   ```
   GOOGLE_MAPS_API_KEY=AIza...
   ```
4. Build again (`npm run android` or `npm run ios`). A key change needs a new
   build; reloading the app isn't enough.

Where it's used:
- **Android:** `android/app/build.gradle` reads the variable when the app is
  built and puts it in the app's manifest. `npm run android` loads
  `mobile/.env` for it. If you build from Android Studio instead, set
  `GOOGLE_MAPS_API_KEY` in your system environment.
- **iPhone:** `app.config.js` passes it to Expo, which sets up Google Maps when
  it generates the iOS project. With no key, the iPhone shows Apple Maps.

The key ends up inside the app, as every map key does. That's expected: the
API restrictions above are what protect it. Restricting it to your app's
package name (Android) and bundle ID (iOS) is a good extra step.

## The search key (`GOOGLE_PLACES_API_KEY`, optional)

Address search goes through the backend, so the app itself never holds a
search key. With no key, the backend uses Photon, a free OpenStreetMap search.
To use Google instead:

1. Turn on **Places API (New)** in the Google Cloud console. The older
   "Places API" can't be turned on for new projects, and the backend doesn't
   use it.
2. Create a key restricted to Places API (New).
3. Set `GOOGLE_PLACES_API_KEY` on the backend: in `backend/.env` locally, or in
   the service's Environment tab on Render. The backend switches to Google on
   its next start.

## Troubleshooting

- **Android map crashes or is blank:** `GOOGLE_MAPS_API_KEY` is missing or
  wrong, or Maps SDK for Android isn't turned on. Check `mobile/.env`, then
  rebuild with `npm run android`.
- **iPhone shows Apple Maps when you expected Google:** the key wasn't set when
  the app was built. Add it to `mobile/.env` and rebuild.
- **"REQUEST_DENIED" in the backend logs:** the search key isn't allowed to
  use Places API (New). Check the key's API restrictions.
- **A change to `.env` doesn't show up:** restart with `npx expo start --clear`.
