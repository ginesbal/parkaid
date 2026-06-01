# Google Maps API Setup Guide

## Overview

This document explains how to properly configure Google Maps APIs for the parkaid mobile application. Follow these steps carefully to avoid common configuration errors.

## Important: Understanding the Two Places APIs

Google provides TWO different Places API services with similar names:

1. **Places API** (Legacy) - This is the older version that uses endpoints like:
   - `/maps/api/place/autocomplete/json`
   - `/maps/api/place/details/json`

2. **Places API (New)** - This is the newer version with different endpoints and features

**CRITICAL**: The application code uses the LEGACY version. You must enable "Places API" (the old one), not just "Places API (New)".

## Required Google Cloud APIs

You must enable ALL of the following APIs in your Google Cloud project:

### Essential APIs (Must Have)

- [ ] **Places API** (Legacy version - do NOT confuse with "Places API (New)")
- [ ] **Geocoding API** - Converts addresses to coordinates
- [ ] **Geolocation API** - Gets user's current location
- [ ] **Maps SDK for Android** - Displays maps on Android devices
- [ ] **Maps SDK for iOS** - Displays maps on iOS devices
- [ ] **Directions API** - Provides routing information
- [ ] **Distance Matrix API** - Calculates distances between locations

### Optional (For Future Features)

- [ ] **Places API (New)** - For when we migrate to the new version

## Step-by-Step Setup Instructions

### Step 1: Enable Required APIs

1. Go to the Google Cloud Console: <https://console.cloud.google.com/apis/library>
2. Make sure you're in the correct project (check the project name at the top)
3. For each required API:
   - Search for the API name in the search bar
   - Click on the API from the results
   - Click the "ENABLE" button
   - Wait for the confirmation message

**IMPORTANT**: When searching for "Places API", make sure you enable the one WITHOUT "(New)" in the name. You can enable both for future-proofing, but the legacy one is required.

### Step 2: Create and Configure API Key

1. Go to: <https://console.cloud.google.com/apis/credentials>
2. Click "+ CREATE CREDENTIALS" at the top
3. Select "API Key"
4. Copy the generated key immediately
5. Click "RESTRICT KEY" (or "Edit API key" if already created)

### Step 3: Restrict Your API Key (Security Best Practice)

Under "API restrictions":

1. Select the radio button "Restrict key"
2. In the dropdown, check the boxes for ALL required APIs listed above:
   - Directions API
   - Distance Matrix API
   - Geocoding API
   - Geolocation API
   - Maps SDK for Android
   - Maps SDK for iOS
   - **Places API** (the legacy one - CRITICAL)
   - Places API (New) (optional)

3. Click the blue "SAVE" button at the bottom
4. Wait 2-5 minutes for changes to apply across Google's servers

### Step 4: Set Up Environment Variables

Follow the .env.example file and make the APIs required are set up

### Step 5: Verify Your Setup

After completing the above steps, run the verification test:

```bash
node tests/verify-all-apis.js
```

Expected output when properly configured:

```
Testing Google APIs:

PASS - Places Autocomplete (LEGACY API): WORKING
PASS - Places Details (LEGACY API): WORKING
PASS - Geocoding: WORKING
PASS - Directions: WORKING

ALL TESTS PASSED! Your API setup is correct.
```

If any test shows "FAIL", refer to the Troubleshooting section below.

## Troubleshooting Common Issues

### Error: "REQUEST_DENIED - This API key is not authorized to use this service or API"

**Cause**: The "Places API" (legacy) is either:

- Not enabled in your Google Cloud project, OR
- Not added to your API key's restrictions list

**Solution**:

1. Verify "Places API" is enabled: <https://console.cloud.google.com/apis/dashboard>
2. Verify "Places API" is in your key restrictions: <https://console.cloud.google.com/apis/credentials>
3. Make sure you enabled the legacy "Places API", not just "Places API (New)"
4. Wait 2 minutes after saving changes
5. Run the verification test again

### Error: "REQUEST_DENIED - You're calling a legacy API, which is not enabled"

**Cause**: You enabled "Places API (New)" but not "Places API" (legacy)

**Solution**: Enable the legacy "Places API" by going to:
<https://console.cloud.google.com/apis/library/places-backend.googleapis.com>

### Changes to .env File Not Working

**Cause**: Expo bundles environment variables at build time, not runtime

**Solution**:

```bash
npx expo start --clear
```

This clears the cache and rebuilds with new environment variables.

### Working in Tests But Not in App

**Cause**: The test script uses Node.js with dotenv, but the app uses Expo's bundled environment

**Solution**: Always restart Expo with cache clearing after .env changes:

```bash
npx expo start --clear
```

## Security Best Practices

### Protecting Your API Key

1. **Never commit .env files to version control**
   - Add `.env` to your `.gitignore` file
   - Use `.env.example` as a template (without real keys)

2. **Use environment variables for API keys**
   - Store sensitive keys in `.env` file
   - Access via `process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY`

3. **Restrict your API key properly**
   - Always use "Restrict key" option in Google Cloud Console
   - Only enable the specific APIs you need

4. **Use backend proxy in production**
   - The code includes a `productionFetcher` that routes through your backend
   - This prevents exposing your API key in the mobile app bundle
   - In development, direct API calls are acceptable for faster iteration

### Why Backend Proxy Matters

When you build a React Native app, the JavaScript code (including API keys) is bundled into the app. Anyone can:

- Download your app
- Extract the bundle
- Find your API key

**Solution**: In production, all Google Maps API calls should go through your backend server. Your backend makes the API call with the key, and returns the result to the app. This way, the API key never leaves your server.

## Understanding the Code

Our `PlacesSearchBar.js` component uses these endpoints:

```javascript
// Autocomplete endpoint (requires "Places API" legacy)
https://maps.googleapis.com/maps/api/place/autocomplete/json

// Details endpoint (requires "Places API" legacy)  
https://maps.googleapis.com/maps/api/place/details/json
```

These are LEGACY endpoints. They will NOT work with only "Places API (New)" enabled.

## Project Structure Reference

```
mobile/
├── .env                          # Your secrets (NEVER commit)
├── .env.example                  # Template (safe to commit)
├── .gitignore                    # Must include .env
├── GOOGLE_MAPS_SETUP.md         # This file
├── components/
│   └── PlacesAutocomplete/
│       └── PlacesSearchBar.js   # Uses legacy Places API
└── tests/
    └── verify-all-apis.js       # Verification script
```

## Billing Requirements

Note: Google requires a billing account to be linked to your project to use the Places API, even if you stay within the free tier limits.

Free tier limits (per month):

- Places Autocomplete: 1,000 requests free
- Places Details: 1,000 requests free
- Geocoding: 40,000 requests free
- Directions: 5,000 requests free
   ***make sure you set up billing reminders to ensure you are still in the free tier***

## Additional Resources

- Google Maps Platform Documentation: <https://developers.google.com/maps>
- Places API Documentation: <https://developers.google.com/maps/documentation/places/web-service>
- Google Cloud Console: <https://console.cloud.google.com>
- Support for issues: <https://support.google.com/cloud>

## Quick Reference Commands

```bash
# Verify API setup
node tests/verify-all-apis.js

# Start Expo with clean cache
npx expo start --clear

# Check environment variables are loaded
node tests/test-env.js
```

## Summary Checklist

Before starting development, ensure:

- [ ] All required APIs are enabled in Google Cloud Console
- [ ] API key is created and restricted properly
- [ ] "Places API" (legacy) is specifically enabled and in restrictions
- [ ] Billing is enabled on your Google Cloud project
- [ ] .env file is created with your API key
- [ ] .env is in .gitignore
- [ ] Verification test passes (all APIs show WORKING)
- [ ] Expo is started with --clear flag

If all checkboxes are complete, you are all set!
