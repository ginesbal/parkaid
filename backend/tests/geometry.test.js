// Where a block's pin goes. No database needed.
const { lineMidpoint } = require('../utils/geometry');

describe('lineMidpoint', () => {
  test('puts the pin halfway along the block, not at its corner', () => {
    const [lng, lat] = lineMidpoint([[[-114.07, 51.05], [-114.06, 51.05]]]);
    expect(lng).toBeCloseTo(-114.065, 6);
    expect(lat).toBeCloseTo(51.05, 6);
  });

  test('goes by length along a bent line', () => {
    // A long leg east, then a short one north: halfway is on the long leg.
    const [lng, lat] = lineMidpoint([[[-114.07, 51.05], [-114.06, 51.05], [-114.06, 51.0505]]]);
    expect(lat).toBeCloseTo(51.05, 6);
    expect(lng).toBeGreaterThan(-114.066);
    expect(lng).toBeLessThan(-114.064);
  });

  test('copes with a single point or nothing at all', () => {
    expect(lineMidpoint([[[-114.07, 51.05]]])).toEqual([-114.07, 51.05]);
    expect(lineMidpoint([])).toBeNull();
    expect(lineMidpoint(null)).toBeNull();
  });
});
