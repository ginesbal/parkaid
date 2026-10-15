
export default {
  expo: {
    name: "parkaid",
    slug: "parkaid",
    version: "1.0.0",
    orientation: "portrait",
    // Icon, splash and notification images come from create-assets.js: a
    // white parking "P" on the app's cerulean. Swap in a designed logo any
    // time by replacing those files.
    icon: "src/utils/assets/icon.png",
    userInterfaceStyle: "light",


    platforms: ["ios", "android", "web"],

    splash: {
      image: "src/utils/assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#1d6d8b"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    // The map's Google key (GOOGLE_MAPS_API_KEY in .env). Expo Go brings its
    // own; a build of your own needs this. It needs "Maps SDK for iOS" and
    // "Maps SDK for Android" turned on. Without it the iPhone map falls back
    // to Apple Maps, but Android has no fallback. The committed android/
    // project reads the same variable (app/build.gradle).
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.parkaid.app",
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "src/utils/assets/adaptive-icon.png",
        backgroundColor: "#1d6d8b"
      },
      package: "com.parkaid.app",
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    },

    plugins: [
      // Reminders are local, so drop the push entitlement expo-notifications
      // adds. It must come first: plugin changes apply in reverse list order.
      "./plugins/withoutPushEntitlement",
      // Local parking reminders, with the Android status-bar icon and tint.
      // The committed android/ project already carries both (written by
      // create-assets.js); these apply if it's ever regenerated.
      ["expo-notifications", {
        icon: "./src/utils/assets/notification-icon.png",
        color: "#1d6d8b"
      }]
    ],
    web: {
      // The browser tab title and search description for the web demo. The
      // page template, with link-preview tags and a loading screen, is
      // public/index.html.
      name: "parkaid · Parking in downtown Calgary",
      description: "Find street parking and lots near you in downtown Calgary, with walk times, rates and time limits on a live map.",
      favicon: "src/utils/assets/favicon.png",
      bundler: "metro",
      // The web map is MapLibre with free OpenStreetMap tiles
      // (src/components/Map/index.web.js), so the web needs no map key.
      output: "single"
    },

    extra: {
      // Use local backend for development, production URL for builds
      apiUrl: process.env.EXPO_PUBLIC_API_URL || process.env.API_URL || "http://localhost:3000",
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY
    },

  }
};