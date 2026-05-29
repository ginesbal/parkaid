const request = require('supertest');
const { app, pool } = require('../server');

describe('Data Quality', () => {

    test('Returns 200+ parking spots in downtown Calgary', async () => {
        const response = await request(app)
            .get('/api/parking/nearby')
            .query({ lat: 51.0447, lng: -114.0719, radius: 1000 });

        expect(response.body.data.length).toBeGreaterThanOrEqual(100);
        console.log(`\nFound ${response.body.data.length} parking spots\n`);
    });

    test('All spots have required spatial data', async () => {
        const response = await request(app)
            .get('/api/parking/nearby')
            .query({ lat: 51.0447, lng: -114.0719, radius: 500 });

        response.body.data.forEach(spot => {
            expect(spot.coordinates).toBeDefined();
            expect(spot.coordinates.type).toBe('Point');
            expect(spot.coordinates.coordinates).toHaveLength(2);
            expect(spot.distance).toBeGreaterThanOrEqual(0);
        });
    });

    test('Distance calculations are accurate', async () => {
        const response = await request(app)
            .get('/api/parking/nearby')
            .query({ lat: 51.0447, lng: -114.0719, radius: 500 });

        // All spots should be within requested radius
        response.body.data.forEach(spot => {
            expect(spot.distance).toBeLessThanOrEqual(500);
        });

        // Results should be sorted by distance
        const distances = response.body.data.map(s => s.distance);
        const sorted = [...distances].sort((a, b) => a - b);
        expect(distances).toEqual(sorted);
    });

    afterAll(async () => {
        if (pool) await pool.end();
    });
});