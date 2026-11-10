const express = require('express');
const router = express.Router();
const axios = require('axios');
const { jlog } = require('../utils/logger');

// Address search for the app's search box. Two providers sit behind one
// response shape (the Google Places JSON the app already reads):
//
//   - Google Places API (New), when GOOGLE_PLACES_API_KEY is set.
//   - Otherwise Photon (photon.komoot.io), a free OpenStreetMap search with
//     no key or sign-up, used under its fair-use terms. Results are kept to
//     Calgary, since that's where the parking data is.
//
// So search works out of the box, and adding a Google key switches to Google.

const CALGARY = { lat: 51.0447, lng: -114.0719 }; // downtown
// Roughly the city limits: west, south, east, north.
const CALGARY_BBOX = '-114.32,50.84,-113.85,51.22';
const REQUEST_TIMEOUT_MS = 8000;
const MAX_RESULTS = 5;

const PHOTON_URL = 'https://photon.komoot.io/api/';
// Photon asks clients to identify themselves.
const PHOTON_HEADERS = { 'User-Agent': 'parkaid (Calgary parking finder)' };
// Transit stops share street names ("7 Ave SW") and crowd out the street.
const PHOTON_EXCLUDE = [
  '!highway:bus_stop',
  '!public_transport',
  '!railway:platform',
  '!railway:stop',
  '!railway:tram_stop',
];

const GOOGLE_AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const GOOGLE_PLACE_URL = 'https://places.googleapis.com/v1/places/';
const GOOGLE_DETAILS_FIELDS = 'id,displayName,formattedAddress,location,types';

// Photon places are found by where they are, so the id carries the point and
// picking one needs no second lookup.
const OSM_ID_PREFIX = 'osm:';

const googleKey = () => process.env.GOOGLE_PLACES_API_KEY;

// Repeat searches (the same few demo queries) are answered from memory, to go
// easy on the free service. Photon only; Google's terms limit caching.
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 300;
const photonCache = new Map();

function cachedPhoton(query) {
  const hit = photonCache.get(query);
  if (hit && hit.expires > Date.now()) return hit.predictions;
  photonCache.delete(query);
  return null;
}

function rememberPhoton(query, predictions) {
  if (photonCache.size >= CACHE_MAX) photonCache.delete(photonCache.keys().next().value);
  photonCache.set(query, { predictions, expires: Date.now() + CACHE_TTL_MS });
}

// "country:ca|country:us" -> ['ca', 'us']
function regionCodes(components) {
  const codes = String(components || 'country:ca')
    .split('|')
    .map((part) => part.trim().replace(/^country:/i, '').toLowerCase())
    .filter((code) => /^[a-z]{2}$/.test(code));
  return codes.length ? codes : ['ca'];
}

// Calgary's streets are numbered ("7 Ave SW", "4 St SE"), and Photon matches
// the full words much better. Only right after a number, so "St Mary's" stays.
const spellOutStreetTypes = (text) => text
  .replace(/\b(\d+(?:st|nd|rd|th)?)\s+av(?:e)?\b\.?/gi, '$1 Avenue')
  .replace(/\b(\d+(?:st|nd|rd|th)?)\s+st\b\.?/gi, '$1 Street');

// One Photon result -> one prediction, or null if it has nothing to show.
function photonPrediction(feature) {
  const p = feature?.properties || {};
  const [lng, lat] = feature?.geometry?.coordinates || [];
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  const street = [p.housenumber, p.street].filter(Boolean).join(' ');
  const main = p.name || street;
  if (!main) return null;
  const secondary = [p.name ? street : null, p.district || p.locality, p.city]
    .filter(Boolean)
    .join(', ');

  return {
    place_id: `${OSM_ID_PREFIX}${lat.toFixed(6)},${lng.toFixed(6)}`,
    description: secondary ? `${main}, ${secondary}` : main,
    structured_formatting: { main_text: main, secondary_text: secondary },
    // The app picks a row icon from these: a named place reads as a business
    // or landmark, a street as a route.
    types: p.type === 'street' ? ['route'] : p.name ? ['establishment'] : ['street_address'],
  };
}

async function photonAutocomplete(input) {
  const query = spellOutStreetTypes(input.trim()).toLowerCase();
  const cached = cachedPhoton(query);
  if (cached) return cached;

  const { data } = await axios.get(PHOTON_URL, {
    params: {
      q: query,
      limit: MAX_RESULTS * 2, // room to drop duplicates
      lat: CALGARY.lat,
      lon: CALGARY.lng,
      // Favor downtown (where the parking data is) without hiding the rest of
      // the city: otherwise "17 Ave" opens with segments 10km east.
      zoom: 14,
      location_bias_scale: 0.5,
      bbox: CALGARY_BBOX,
      lang: 'en',
      osm_tag: PHOTON_EXCLUDE,
    },
    // osm_tag=a&osm_tag=b, not osm_tag[]=a
    paramsSerializer: { indexes: null },
    headers: PHOTON_HEADERS,
    timeout: REQUEST_TIMEOUT_MS,
  });

  // A long street comes back once per segment; show it once.
  const seen = new Set();
  const predictions = (data?.features || [])
    .map(photonPrediction)
    .filter((prediction) => {
      if (!prediction || seen.has(prediction.description)) return false;
      seen.add(prediction.description);
      return true;
    })
    .slice(0, MAX_RESULTS);

  rememberPhoton(query, predictions);
  return predictions;
}

async function googleAutocomplete({ input, components, sessiontoken }) {
  const { data } = await axios.post(
    GOOGLE_AUTOCOMPLETE_URL,
    {
      input,
      includedRegionCodes: regionCodes(components),
      locationBias: {
        circle: { center: { latitude: CALGARY.lat, longitude: CALGARY.lng }, radius: 25000 },
      },
      ...(sessiontoken ? { sessionToken: sessiontoken } : {}),
    },
    { headers: { 'X-Goog-Api-Key': googleKey() }, timeout: REQUEST_TIMEOUT_MS }
  );

  return (data?.suggestions || [])
    .map((suggestion) => suggestion.placePrediction)
    .filter(Boolean)
    .map((prediction) => {
      const full = prediction.text?.text || '';
      return {
        place_id: prediction.placeId,
        description: full,
        structured_formatting: {
          main_text: prediction.structuredFormat?.mainText?.text || full,
          secondary_text: prediction.structuredFormat?.secondaryText?.text || '',
        },
        types: prediction.types || [],
      };
    });
}

async function googleDetails({ place_id, sessiontoken }) {
  const { data } = await axios.get(`${GOOGLE_PLACE_URL}${encodeURIComponent(place_id)}`, {
    params: sessiontoken ? { sessionToken: sessiontoken } : {},
    headers: { 'X-Goog-Api-Key': googleKey(), 'X-Goog-FieldMask': GOOGLE_DETAILS_FIELDS },
    timeout: REQUEST_TIMEOUT_MS,
  });
  if (!data?.location) return null;
  return {
    place_id: data.id,
    name: data.displayName?.text || '',
    formatted_address: data.formattedAddress || '',
    geometry: { location: { lat: data.location.latitude, lng: data.location.longitude } },
    types: data.types || [],
  };
}

// "osm:51.044300,-114.063135" -> the place at that point. The app takes the
// name and address from the suggestion it already showed.
function osmDetails(place_id) {
  const [lat, lng] = place_id.slice(OSM_ID_PREFIX.length).split(',').map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { place_id, geometry: { location: { lat, lng } } };
}

// What failed, for the log; the app only needs to know that search is down.
const upstreamError = (error) => ({
  error: error.message,
  status: error.response?.status,
  detail: error.response?.data?.error?.message,
});

router.get('/autocomplete', async (req, res) => {
  const { input, components, sessiontoken } = req.query;
  if (!input) {
    jlog('places_autocomplete_missing_input');
    return res.status(400).json({ error: 'Input parameter required' });
  }

  const provider = googleKey() ? 'google' : 'photon';
  try {
    const predictions = provider === 'google'
      ? await googleAutocomplete({ input, components, sessiontoken })
      : await photonAutocomplete(input);

    jlog('places_autocomplete_completed', {
      provider,
      searchTerm: input,
      predictionsFound: predictions.length,
    });
    res.json({ status: predictions.length ? 'OK' : 'ZERO_RESULTS', predictions });
  } catch (error) {
    jlog('places_autocomplete_error', { provider, ...upstreamError(error) }, 'error');
    res.status(502).json({ error: 'Search is unavailable right now' });
  }
});

router.get('/details', async (req, res) => {
  const { place_id, sessiontoken } = req.query;
  if (!place_id) {
    jlog('places_details_missing_id');
    return res.status(400).json({ error: 'place_id required' });
  }

  const isOsm = place_id.startsWith(OSM_ID_PREFIX);
  if (!isOsm && !googleKey()) {
    return res.status(400).json({ error: 'Unknown place' });
  }

  const provider = isOsm ? 'photon' : 'google';
  try {
    const result = isOsm ? osmDetails(place_id) : await googleDetails({ place_id, sessiontoken });
    if (!result) return res.status(404).json({ error: 'Place not found' });

    jlog('places_details_completed', { provider, placeId: place_id.substring(0, 20) });
    res.json({ status: 'OK', result });
  } catch (error) {
    jlog('places_details_error', { provider, ...upstreamError(error) }, 'error');
    res.status(502).json({ error: 'Search is unavailable right now' });
  }
});

module.exports = router;
