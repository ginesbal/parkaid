/**
 * Google Maps API Verification Script
 * 
 * This script tests all the Google Maps APIs required by the parkaid application.
 * Run this script whenever you:
 * - Set up a new development environment
 * - Change API keys
 * - Enable/disable APIs in Google Cloud Console
 * - Encounter API errors in the application
 * 
 * Usage: node tests/verify-all-apis.js
 */

require('dotenv').config();

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;

// define all API tests
const tests = [
    {
        name: 'Places Autocomplete (LEGACY API)',
        url: `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=Calgary&key=${API_KEY}&components=country:ca`,
        requiredAPI: 'Places API (the legacy one, NOT "Places API (New)")',
        description: 'Tests location search autocomplete functionality'
    },
    {
        name: 'Places Details (LEGACY API)',
        url: `https://maps.googleapis.com/maps/api/place/details/json?place_id=ChIJ1T-EnwNwcVMROrZStrE7bSY&key=${API_KEY}`,
        requiredAPI: 'Places API (the legacy one, NOT "Places API (New)")',
        description: 'Tests retrieving detailed information about a place'
    },
    {
        name: 'Geocoding',
        url: `https://maps.googleapis.com/maps/api/geocode/json?address=Calgary,AB&key=${API_KEY}`,
        requiredAPI: 'Geocoding API',
        description: 'Tests converting addresses to coordinates'
    },
    {
        name: 'Directions',
        url: `https://maps.googleapis.com/maps/api/directions/json?origin=Calgary,AB&destination=Banff,AB&key=${API_KEY}`,
        requiredAPI: 'Directions API',
        description: 'Tests getting directions between two locations'
    }
];

/**
 * run all API tests and report results
 */
async function runTests() {
    console.log('Testing Google APIs...');
    console.log('See GOOGLE_MAPS_SETUP.md for setup instructions\n');

    // check if API key exists
    if (!API_KEY) {
        console.error('ERROR: No API key found!');
        console.error('Make sure EXPO_PUBLIC_GOOGLE_PLACES_KEY is set in your .env file');
        console.error('See GOOGLE_MAPS_SETUP.md for setup instructions\n');
        process.exit(1);
    }

    console.log('Using API key:', API_KEY.substring(0, 10) + '...' + API_KEY.slice(-4));
    console.log('');

    let allPassed = true;
    const results = [];

    // run each test
    for (const test of tests) {
        try {
            const response = await fetch(test.url);
            const data = await response.json();

            if (data.status === 'OK') {
                console.log(`PASS - ${test.name}: WORKING`);
                results.push({ test: test.name, passed: true });
            } else {
                console.log(`FAIL - ${test.name}: ${data.status}`);
                if (data.error_message) {
                    console.log(`       Error: ${data.error_message}`);
                }
                console.log(`       Required API: ${test.requiredAPI}`);
                console.log(`       Description: ${test.description}`);
                results.push({ test: test.name, passed: false, error: data.status });
                allPassed = false;
            }
        } catch (error) {
            console.log(`FAIL - ${test.name}: NETWORK ERROR`);
            console.log(`       ${error.message}`);
            results.push({ test: test.name, passed: false, error: 'NETWORK_ERROR' });
            allPassed = false;
        }
    }

    // print summary
    console.log('\n' + '='.repeat(70));
    if (allPassed) {
        console.log('ALL TESTS PASSED! Your API setup is correct.');
        console.log('You can now run: npx expo start --clear');
    } else {
        console.log('SOME TESTS FAILED!');
        console.log('\nTroubleshooting steps:');
        console.log('1. Check that all required APIs are enabled in Google Cloud Console');
        console.log('2. Verify your API key restrictions include all required APIs');
        console.log('3. Make sure you enabled "Places API" (legacy), not just "Places API (New)"');
        console.log('4. Wait 2-5 minutes after saving changes in Google Cloud Console');
        console.log('5. Check that billing is enabled on your Google Cloud project');
        console.log('\nDetailed setup guide: GOOGLE_MAPS_SETUP.md');
        console.log('Google Cloud Console: https://console.cloud.google.com/apis/credentials');
    }
    console.log('='.repeat(70) + '\n');

    // exit with error code if tests failed
    process.exit(allPassed ? 0 : 1);
}

// run the tests
runTests().catch(error => {
    console.error('Unexpected error running tests:', error);
    process.exit(1);
});