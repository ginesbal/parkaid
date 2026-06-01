
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

    extra: {
      // Use local backend for development, production URL for builds
      apiUrl: process.env.EXPO_PUBLIC_API_URL || process.env.API_URL || "http://localhost:3000",
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY
    },

  }
};