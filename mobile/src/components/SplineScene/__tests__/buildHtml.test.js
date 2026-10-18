import { SPLINE_RUNTIME_VERSION } from '../../../constants/spline';
import { MESSAGE_SOURCE, buildSplineHtml, parseSplineMessage } from '../buildHtml';

const SCENE = { url: 'https://prod.spline.design/abc/scene.splinecode', hide: ['A', 'B'] };

describe('buildSplineHtml', () => {
    it('loads the pinned runtime and the scene', () => {
        const html = buildSplineHtml(SCENE);
        expect(html).toContain(`@splinetool/runtime@${SPLINE_RUNTIME_VERSION}/build/runtime.js`);
        expect(html).toContain('"url":"https://prod.spline.design/abc/scene.splinecode"');
        expect(html).toContain('"hide":["A","B"]');
    });

    it('cannot be broken out of its script tag by a value', () => {
        const html = buildSplineHtml({ url: 'x</script><script>alert(1)</script>' });
        expect(html.match(/<\/script>/g)).toHaveLength(1);
        expect(html).toContain('\\u003c/script>');
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
