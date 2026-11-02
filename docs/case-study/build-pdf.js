// Renders index.html to ParkAid-case-study.pdf, one 1280 x 720 px page per
// section. Needs Playwright and its Chromium: `node build-pdf.js`.
const path = require('path');
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(`file://${path.join(__dirname, 'index.html')}`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({
        path: path.join(__dirname, 'ParkAid-case-study.pdf'),
        width: '1280px',
        height: '720px',
        printBackground: true,
    });
    await browser.close();
})();
