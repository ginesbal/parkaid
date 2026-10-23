// Every font size in the app is one of the six in TYPE_SCALE.
const fs = require('fs');
const path = require('path');
const { TYPE_SCALE } = require('../theme');

const root = path.join(__dirname, '..', '..', '..');
const sources = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sources(full);
    return entry.name.endsWith('.js') ? [full] : [];
});

describe('type scale', () => {
    it('uses only the six sizes', () => {
        const offenders = [...sources(path.join(root, 'src')), path.join(root, 'App.js')].flatMap((file) =>
            [...fs.readFileSync(file, 'utf8').matchAll(/fontSize: (\d+)/g)]
                .map((m) => Number(m[1]))
                .filter((size) => !TYPE_SCALE.includes(size))
                .map((size) => `${path.relative(root, file)}: ${size}`));
        expect(offenders).toEqual([]);
    });
});
