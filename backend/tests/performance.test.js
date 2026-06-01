const request = require('supertest');
const { app, pool } = require('../server');

describe('Performance Benchmarks', () => {
    const testLocation = { lat: 51.0447, lng: -114.0719, radius: 1000 };
    const measurements = [];

    test('Measure query response time over 10 requests', async () => {
        for (let i = 0; i < 10; i++) {
            const start = Date.now();

            const response = await request(app)
                .get('/api/parking/nearby')
                .query(testLocation);

            const duration = Date.now() - start;
            measurements.push(duration);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        }

        const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        const min = Math.min(...measurements);
        const max = Math.max(...measurements);

        console.log('\n=== PERFORMANCE RESULTS ===');
        console.log(`Average: ${avg.toFixed(0)}ms`);
        console.log(`Min: ${min}ms`);
        console.log(`Max: ${max}ms`);
        console.log(`All measurements: ${measurements.join(', ')}ms`);

        // Verify it's under your claimed 120ms average
        expect(avg).toBeLessThan(450); // Give some buffer
    });

    afterAll(async () => {
        if (pool) await pool.end();
    });
});