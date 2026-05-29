const request = require('supertest');
const { app, pool } = require('../server');

describe('API Contract', () => {

    test('Nearby endpoint returns correct structure', async () => {
        const response = await request(app)
            .get('/api/parking/nearby')
            .query({ lat: 51.0447, lng: -114.0719, radius: 1000 });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('count');
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('Spot includes all required fields', async () => {
        const response = await request(app)
            .get('/api/parking/nearby')
            .query({ lat: 51.0447, lng: -114.0719, radius: 500 });

        const spot = response.body.data[0];

        // Core fields
        expect(spot).toHaveProperty('id');
        expect(spot).toHaveProperty('spot_type');
        expect(spot).toHaveProperty('address');
        expect(spot).toHaveProperty('coordinates');
        expect(spot).toHaveProperty('distance');

        // Metadata
        expect(spot).toHaveProperty('zone_info');
        expect(spot).toHaveProperty('metadata');

        // Calculated fields
        expect(spot).toHaveProperty('walkingTime');
        expect(spot).toHaveProperty('capacity');
    });

    test('Type filter works correctly', async () => {
        const response = await request(app)
            .get('/api/parking/nearby')
            .query({ lat: 51.0447, lng: -114.0719, radius: 1000, type: 'on_street' });

        expect(response.body.data.length).toBeGreaterThan(0);
        response.body.data.forEach(spot => {
            expect(spot.spot_type).toBe('on_street');
        });
    });

    afterAll(async () => {
        if (pool) await pool.end();
    });
});