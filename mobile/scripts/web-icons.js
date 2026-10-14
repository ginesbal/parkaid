// scripts/web-icons.js
//
// The web build's icon font: MaterialCommunityIcons cut down to the icons the
// app uses. The full font is 1.3 MB (577 KB compressed) and its name map adds
// 188 KB to the JavaScript, for about 30 icons. metro.config.js swaps these
// files in on the web only; phones keep the full font.
//
//   npm run icons:web          rebuild after adding or changing an icon
//   npm run icons:web -- --check   fail if an icon in src/ is missing
//
// It finds icons by looking for every quoted string in App.js and src/ that
// is an icon name, so names kept in data (spotInfo's types, the tab icons)
// count too. A few ordinary words that happen to be icon names ("map",
// "close") come along; each costs a few hundred bytes.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VENDOR = path.join(ROOT, 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons');
const FULL_FONT = path.join(VENDOR, 'Fonts/MaterialCommunityIcons.ttf');
const FULL_MAP = path.join(VENDOR, 'glyphmaps/MaterialCommunityIcons.json');
const OUT_DIR = path.join(ROOT, 'src/assets/web-icons');
const OUT_FONT = path.join(OUT_DIR, 'MaterialCommunityIcons.ttf');
const OUT_MAP = path.join(OUT_DIR, 'MaterialCommunityIcons.json');

function sourceFiles(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (full !== OUT_DIR) sourceFiles(full, out);
        } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
            out.push(full);
        }
    }
    return out;
}

function usedIcons(glyphMap) {
    const used = new Set();
    for (const file of [path.join(ROOT, 'App.js'), ...sourceFiles(path.join(ROOT, 'src'))]) {
        const code = fs.readFileSync(file, 'utf8');
        for (const [, name] of code.matchAll(/['"`]([a-z0-9]+(?:-[a-z0-9]+)*)['"`]/g)) {
            if (Object.prototype.hasOwnProperty.call(glyphMap, name)) used.add(name);
        }
    }
    return [...used].sort();
}

async function main() {
    const glyphMap = JSON.parse(fs.readFileSync(FULL_MAP, 'utf8'));
    const names = usedIcons(glyphMap);

    if (process.argv.includes('--check')) {
        const current = fs.existsSync(OUT_MAP) ? JSON.parse(fs.readFileSync(OUT_MAP, 'utf8')) : {};
        const missing = names.filter((n) => !(n in current));
        if (missing.length) {
            console.error(`Missing from the web icon font: ${missing.join(', ')}\nRun: npm run icons:web`);
            process.exit(1);
        }
        console.log(`Web icon font has all ${names.length} icons.`);
        return;
    }

    const subsetFont = require('subset-font');
    const subsetMap = Object.fromEntries(names.map((n) => [n, glyphMap[n]]));
    const text = names.map((n) => String.fromCodePoint(glyphMap[n])).join('');
    const font = await subsetFont(fs.readFileSync(FULL_FONT), text, { targetFormat: 'truetype' });

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(OUT_FONT, font);
    fs.writeFileSync(OUT_MAP, `${JSON.stringify(subsetMap, null, 2)}\n`);
    console.log(`${names.length} icons, ${(font.length / 1024).toFixed(1)} KB font: ${names.join(', ')}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
