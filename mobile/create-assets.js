// create-assets.js — generates parkaid's icon, splash and notification images.
//
//   node create-assets.js
//
// The mark is the universal parking sign: a white "P" on the app's cerulean
// (TOKENS.primary, #1d6d8b). It's drawn here from simple geometry, with
// anti-aliasing, and written as PNGs with Node's own zlib — no dependencies.
// Replace the outputs with a designed logo any time; keep the same files.
//
// Writes:
//   src/utils/assets/      icon, adaptive icon, splash, favicon, notification
//                          icon (read by app.config.js — iOS and web builds)
//   android/app/src/main/res/
//                          launcher icons, splash logo and notification icon.
//                          The Android project is committed, so Expo doesn't
//                          regenerate these from app.config.js.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const CERULEAN = [0x1d, 0x6d, 0x8b];
const WHITE = [0xff, 0xff, 0xff];

// ---- the "P", in units of its own height (0..1, y down) --------------------
const STEM = 0.235;          // stem width
const ARM = 0.2;             // thickness of the bowl's top and bottom arms
const BOWL_HEIGHT = 0.68;
const BOWL_STRAIGHT = 0.36;  // where the bowl's curve begins
const R = BOWL_HEIGHT / 2;   // outer radius of the bowl's curve
const r = R - ARM;           // inner radius (the counter)
const GLYPH_WIDTH = BOWL_STRAIGHT + R; // 0.70

function insideP(px, py) {
    if (px < 0 || py < 0 || py > 1) return false;
    if (px <= STEM) return true; // the stem
    if (py > BOWL_HEIGHT) return false;
    const dx = px - BOWL_STRAIGHT;
    const dy = py - R;
    const inOuter = px <= BOWL_STRAIGHT || dx * dx + dy * dy <= R * R;
    const inCounter = py >= ARM && py <= BOWL_HEIGHT - ARM &&
        (px <= BOWL_STRAIGHT || dx * dx + dy * dy <= r * r);
    return inOuter && !inCounter;
}

// ---- rendering ---------------------------------------------------------------
const SAMPLES = 4; // per axis, so 16 per pixel

/**
 * @param size        image width and height, px
 * @param glyph       "P" height as a fraction of the image
 * @param background  [r,g,b] for an opaque tile, or null for transparent
 * @param circle      clip the tile to a circle (round launcher icon)
 */
function render({ size, glyph, background = null, circle = false }) {
    const pixels = Buffer.alloc(size * size * 4);
    const g = glyph * size;
    const ox = (size - GLYPH_WIDTH * g) / 2;
    const oy = (size - g) / 2;
    const c = size / 2;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            let ink = 0;
            let tile = 0;
            for (let sy = 0; sy < SAMPLES; sy++) {
                for (let sx = 0; sx < SAMPLES; sx++) {
                    const fx = x + (sx + 0.5) / SAMPLES;
                    const fy = y + (sy + 0.5) / SAMPLES;
                    const inTile = !circle || (fx - c) ** 2 + (fy - c) ** 2 <= c * c;
                    if (!inTile) continue;
                    tile++;
                    if (insideP((fx - ox) / g, (fy - oy) / g)) ink++;
                }
            }
            const n = SAMPLES * SAMPLES;
            const i = (y * size + x) * 4;
            if (background) {
                // White ink over the tile; the tile's edge is anti-aliased too.
                const a = ink / Math.max(tile, 1);
                for (let k = 0; k < 3; k++) {
                    pixels[i + k] = Math.round(background[k] + (WHITE[k] - background[k]) * a);
                }
                pixels[i + 3] = Math.round((tile / n) * 255);
            } else {
                pixels[i] = pixels[i + 1] = pixels[i + 2] = 255;
                pixels[i + 3] = Math.round((ink / n) * 255);
            }
        }
    }
    return encodePng(size, size, pixels);
}

// ---- minimal PNG encoder (8-bit RGBA, no filtering) -------------------------
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
});

function crc32(buf) {
    let c = 0xffffffff;
    for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
    const stride = width * 4;
    const raw = Buffer.alloc((stride + 1) * height);
    for (let y = 0; y < height; y++) {
        raw[y * (stride + 1)] = 0; // filter: none
        rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
    }
    const header = Buffer.alloc(13);
    header.writeUInt32BE(width, 0);
    header.writeUInt32BE(height, 4);
    header[8] = 8;  // bit depth
    header[9] = 6;  // colour type: RGBA
    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        chunk('IHDR', header),
        chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
        chunk('IEND', Buffer.alloc(0)),
    ]);
}

// ---- outputs ---------------------------------------------------------------
const root = __dirname;
const write = (file, png) => {
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, png);
    console.log(`  ${file}`);
};

console.log('Writing parkaid assets:');

// Source images (app.config.js).
write('src/utils/assets/icon.png', render({ size: 1024, glyph: 0.5, background: CERULEAN }));
// Adaptive foreground: the "P" stays inside Android's 66dp safe circle.
write('src/utils/assets/adaptive-icon.png', render({ size: 1024, glyph: 0.46 }));
// Splash: shown scaled to fit the screen, so the "P" is small in its canvas.
write('src/utils/assets/splash.png', render({ size: 1024, glyph: 0.22 }));
write('src/utils/assets/favicon.png', render({ size: 48, glyph: 0.5, background: CERULEAN }));
// Android status-bar icon: white on transparent (Android tints it).
write('src/utils/assets/notification-icon.png', render({ size: 96, glyph: 0.8 }));

// Committed Android project.
const RES = 'android/app/src/main/res';
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [density, scale] of Object.entries(DENSITIES)) {
    const mipmap = `${RES}/mipmap-${density}`;
    // Template icons were .webp; a .png of the same name alongside would be a
    // duplicate resource, so remove them.
    for (const old of ['ic_launcher.webp', 'ic_launcher_round.webp']) {
        fs.rmSync(path.join(root, mipmap, old), { force: true });
    }
    write(`${mipmap}/ic_launcher.png`, render({ size: 48 * scale, glyph: 0.5, background: CERULEAN }));
    write(`${mipmap}/ic_launcher_round.png`, render({ size: 48 * scale, glyph: 0.46, background: CERULEAN, circle: true }));
    write(`${mipmap}/ic_launcher_foreground.png`, render({ size: 108 * scale, glyph: 0.46 }));
    write(`${RES}/drawable-${density}/notification_icon.png`, render({ size: 24 * scale, glyph: 0.8 }));
    write(`${RES}/drawable-${density}/splashscreen_logo.png`, render({ size: Math.round(288 * scale), glyph: 0.3 }));
}

console.log('Done.');
