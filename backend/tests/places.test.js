const express = require('express');
const request = require('supertest');
const axios = require('axios');

jest.mock('axios');
jest.mock('../utils/logger', () => ({ jlog: jest.fn() }));

// Just the places routes, so these run without a database.
const placesRoutes = require('../routes/places');
const app = express().use('/api/places', placesRoutes);

const CALGARY_TOWER = {
  type: 'Feature',
  properties: {
    osm_key: 'man_made', osm_value: 'tower', type: 'house', name: 'Calgary Tower',
    housenumber: '101', street: '9 Avenue SE', district: 'Downtown Commercial Core', city: 'Calgary',
  },
  geometry: { type: 'Point', coordinates: [-114.0631347, 51.0442999] },
};
const SEVENTH_AVE = (segment) => ({
  type: 'Feature',
  properties: { osm_key: 'highway', osm_value: 'service', type: 'street', name: '7 Avenue SW', district: 'Downtown Commercial Core', city: 'Calgary' },
  geometry: { type: 'Point', coordinates: [-114.07 - segment / 1000, 51.0466] },
});

let query = 0;
// A fresh query each time, so one test's cached answer can't leak into another.
const freshInput = (text) => `${text} ${++query}`;

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.GOOGLE_PLACES_API_KEY;
});

describe('Places search without a Google key (free OpenStreetMap search)', () => {
  it('answers in the shape the app reads, kept to Calgary and without transit stops', async () => {
    axios.get.mockResolvedValue({ data: { features: [CALGARY_TOWER] } });
    const input = freshInput('calgary tower');

    const res = await request(app).get('/api/places/autocomplete').query({ input });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'OK',
      predictions: [{
        place_id: 'osm:51.044300,-114.063135',
        description: 'Calgary Tower, 101 9 Avenue SE, Downtown Commercial Core, Calgary',
        structured_formatting: {
          main_text: 'Calgary Tower',
          secondary_text: '101 9 Avenue SE, Downtown Commercial Core, Calgary',
        },
        types: ['establishment'],
      }],
    });

    const [url, options] = axios.get.mock.calls[0];
    expect(url).toBe('https://photon.komoot.io/api/');
    expect(options.params).toMatchObject({ q: input, bbox: '-114.32,50.84,-113.85,51.22', lat: 51.0447, lon: -114.0719, zoom: 14 });
    expect(options.params.osm_tag).toEqual(expect.arrayContaining(['!highway:bus_stop', '!public_transport']));
    expect(options.paramsSerializer).toEqual({ indexes: null });
    expect(options.headers['User-Agent']).toMatch(/parkaid/);
  });

  it('spells out Ave and St after a street number, which Photon matches far better', async () => {
    axios.get.mockResolvedValue({ data: { features: [] } });
    await request(app).get('/api/places/autocomplete').query({ input: `7 ave sw ${++query}` });
    await request(app).get('/api/places/autocomplete').query({ input: `4th St. SE ${++query}` });
    await request(app).get('/api/places/autocomplete').query({ input: `St Mary's ${++query}` });
    const sent = axios.get.mock.calls.map(([, options]) => options.params.q);
    expect(sent[0]).toMatch(/^7 avenue sw /);
    expect(sent[1]).toMatch(/^4th street se /);
    expect(sent[2]).toMatch(/^st mary's /); // not after a number, so left alone
  });

  it('shows a street once, not once per segment', async () => {
    axios.get.mockResolvedValue({ data: { features: [SEVENTH_AVE(1), SEVENTH_AVE(2), SEVENTH_AVE(3)] } });
    const res = await request(app).get('/api/places/autocomplete').query({ input: freshInput('7 avenue sw') });
    expect(res.body.predictions).toHaveLength(1);
    expect(res.body.predictions[0].structured_formatting).toEqual({
      main_text: '7 Avenue SW',
      secondary_text: 'Downtown Commercial Core, Calgary',
    });
    expect(res.body.predictions[0].types).toEqual(['route']);
  });

  it('answers a repeated search from memory', async () => {
    axios.get.mockResolvedValue({ data: { features: [CALGARY_TOWER] } });
    const input = freshInput('tower');
    await request(app).get('/api/places/autocomplete').query({ input });
    await request(app).get('/api/places/autocomplete').query({ input: `  ${input.toUpperCase()} ` });
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('says ZERO_RESULTS when nothing matches', async () => {
    axios.get.mockResolvedValue({ data: { features: [] } });
    const res = await request(app).get('/api/places/autocomplete').query({ input: freshInput('zzzz') });
    expect(res.body).toEqual({ status: 'ZERO_RESULTS', predictions: [] });
  });

  it('finds a picked place from its id, with no second lookup', async () => {
    const res = await request(app).get('/api/places/details').query({ place_id: 'osm:51.044300,-114.063135' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'OK',
      result: { place_id: 'osm:51.044300,-114.063135', geometry: { location: { lat: 51.0443, lng: -114.063135 } } },
    });
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('turns away ids it cannot place', async () => {
    expect((await request(app).get('/api/places/details').query({ place_id: 'osm:north,west' })).status).toBe(404);
    expect((await request(app).get('/api/places/details').query({ place_id: 'ChIJgoogle' })).status).toBe(400);
  });

  it('reports the service being down without leaking its error', async () => {
    axios.get.mockRejectedValue(new Error('connect ECONNREFUSED 1.2.3.4:443'));
    const res = await request(app).get('/api/places/autocomplete').query({ input: freshInput('down') });
    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: 'Search is unavailable right now' });
  });

  it('still asks for input', async () => {
    expect((await request(app).get('/api/places/autocomplete')).status).toBe(400);
    expect((await request(app).get('/api/places/details')).status).toBe(400);
  });
});

describe('Places search with a Google key (Places API, new version)', () => {
  beforeEach(() => {
    process.env.GOOGLE_PLACES_API_KEY = 'test-key';
  });

  it('switches to Google and translates its answer', async () => {
    axios.post.mockResolvedValue({
      data: {
        suggestions: [{
          placePrediction: {
            placeId: 'ChIJtower',
            text: { text: 'Calgary Tower, 9 Avenue Southeast, Calgary, AB, Canada' },
            structuredFormat: { mainText: { text: 'Calgary Tower' }, secondaryText: { text: '9 Avenue Southeast, Calgary, AB, Canada' } },
            types: ['tourist_attraction', 'establishment'],
          },
        }],
      },
    });

    const res = await request(app).get('/api/places/autocomplete')
      .query({ input: 'calgary tower', components: 'country:ca', sessiontoken: 'abc-123' });

    expect(res.body.predictions).toEqual([{
      place_id: 'ChIJtower',
      description: 'Calgary Tower, 9 Avenue Southeast, Calgary, AB, Canada',
      structured_formatting: { main_text: 'Calgary Tower', secondary_text: '9 Avenue Southeast, Calgary, AB, Canada' },
      types: ['tourist_attraction', 'establishment'],
    }]);
    const [url, body, options] = axios.post.mock.calls[0];
    expect(url).toBe('https://places.googleapis.com/v1/places:autocomplete');
    expect(body).toMatchObject({ input: 'calgary tower', includedRegionCodes: ['ca'], sessionToken: 'abc-123' });
    expect(body.locationBias.circle.center).toEqual({ latitude: 51.0447, longitude: -114.0719 });
    expect(options.headers['X-Goog-Api-Key']).toBe('test-key');
    expect(axios.get).not.toHaveBeenCalled(); // not Photon
  });

  it('gets details from Google, in the shape the app reads', async () => {
    axios.get.mockResolvedValue({
      data: {
        id: 'ChIJtower',
        displayName: { text: 'Calgary Tower', languageCode: 'en' },
        formattedAddress: '101 9 Ave SW, Calgary, AB T2P 1J9, Canada',
        location: { latitude: 51.0443, longitude: -114.0631 },
        types: ['tourist_attraction'],
      },
    });

    const res = await request(app).get('/api/places/details').query({ place_id: 'ChIJtower', sessiontoken: 'abc-123' });

    expect(res.body.result).toEqual({
      place_id: 'ChIJtower',
      name: 'Calgary Tower',
      formatted_address: '101 9 Ave SW, Calgary, AB T2P 1J9, Canada',
      geometry: { location: { lat: 51.0443, lng: -114.0631 } },
      types: ['tourist_attraction'],
    });
    const [url, options] = axios.get.mock.calls[0];
    expect(url).toBe('https://places.googleapis.com/v1/places/ChIJtower');
    expect(options.params).toEqual({ sessionToken: 'abc-123' });
    expect(options.headers['X-Goog-FieldMask']).toBe('id,displayName,formattedAddress,location,types');
  });

  it('still finds places picked from free search before the key was added', async () => {
    const res = await request(app).get('/api/places/details').query({ place_id: 'osm:51.0443,-114.0631' });
    expect(res.body.result.geometry.location).toEqual({ lat: 51.0443, lng: -114.0631 });
    expect(axios.get).not.toHaveBeenCalled();
  });
});
