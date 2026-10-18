import { SPLINE_RUNTIME_VERSION, SPLINE_SCENES } from '../../../constants/spline';
import { MESSAGE_SOURCE, buildSplineHtml, parseSplineMessage } from '../buildHtml';

const SCENE = {
    url: 'https://prod.spline.design/abc/scene.splinecode',
    camera: 'Camera',
    focus: 'Pin',
    height: 250,
    hide: ['A', 'B'],
};
const TARGET = { u: 0.5, v: 0.4, h: 0.2 };

// The config the page runs with.
const configOf = (html) => JSON.parse(html.match(/const config = (.*);\n/)[1]);

describe('buildSplineHtml', () => {
    it('loads the pinned runtime and the scene, with the first target', () => {
        const html = buildSplineHtml(SCENE, TARGET);
        const config = configOf(html);
        expect(config.runtime).toContain(`@splinetool/runtime@${SPLINE_RUNTIME_VERSION}/build/runtime.js`);
        expect(config).toMatchObject({
            url: SCENE.url,
            camera: 'Camera',
            angle: null,
            focus: 'Pin',
            height: 250,
            center: [0, 0, 0],
            show: [],
            hide: ['A', 'B'],
            target: TARGET,
        });
    });

    it('cannot be broken out of its script tag by a value', () => {
        const html = buildSplineHtml({ ...SCENE, url: 'x</script><script>alert(1)</script>' }, TARGET);
        expect(html.match(/<\/script>/g)).toHaveLength(1);
        expect(html).toContain('\\u003c/script>');
    });

    it('builds a page for every scene the app uses', () => {
        for (const scene of Object.values(SPLINE_SCENES)) {
            const config = configOf(buildSplineHtml(scene, TARGET));
            expect(config.url).toMatch(/^https:\/\/prod\.spline\.design\/.+\.splinecode$/);
            expect(config.camera).toBeTruthy();
            expect(config.focus).toBeTruthy();
            expect(config.height).toBeGreaterThan(0);
        }
    });
});

describe('parseSplineMessage', () => {
    it('reads messages from the page', () => {
        const data = JSON.stringify({ source: MESSAGE_SOURCE, type: 'ready' });
        expect(parseSplineMessage(data)).toEqual({ source: MESSAGE_SOURCE, type: 'ready' });
    });

    it('ignores everything else', () => {
        expect(parseSplineMessage(JSON.stringify({ type: 'ready' }))).toBeNull();
        expect(parseSplineMessage('not json')).toBeNull();
        expect(parseSplineMessage({ source: MESSAGE_SOURCE, type: 'ready' })).toBeNull();
        expect(parseSplineMessage('null')).toBeNull();
    });
});
