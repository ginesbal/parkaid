
export default {
  expo: {
    name: "parkaid",
    slug: "parkaid",
    version: "1.0.0",
    orientation: "portrait",
    icon: "src/utils/assets/icon.png",
    userInterfaceStyle: "light",


    platforms: ["ios", "android", "web"],

    splash: {
      image: "src/utils/assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#001d4a"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.parkaid.app"
    },
    android: {
      // Parking reminders on time (android/ is committed, so its manifest
      // carries this too)
      permissions: ["android.permission.SCHEDULE_EXACT_ALARM"],
      adaptiveIcon: {
        foregroundImage: "src/utils/assets/adaptive-icon.png",
        backgroundColor: "#001d4a"
      },
      package: "com.parkaid.app"
    },
    web: {
      favicon: "src/utils/assets/favicon.png",
      bundler: "metro",
      output: "single",
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY
      },
      build: {
        babel: {
          include: [
            "react-native-maps",
            "@react-native-async-storage/async-storage"
          ]
        }
      }
    },

    plugins: [
      // Parking reminders. Applies on prebuild only: the committed android/
      // project sets the colour itself, and the library brings POST_NOTIFICATIONS.
      ["expo-notifications", { color: "#1d6d8b" }]
    ],

    extra: {
      // Use local backend for development, production URL for builds
      apiUrl: process.env.EXPO_PUBLIC_API_URL || process.env.API_URL || "http://localhost:3000",
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY
    },

  }
};