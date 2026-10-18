// The page that plays one Spline scene, shared by the WebView (iOS, Android)
// and the iframe (web). It tells the host 'ready' once the scene has drawn,
// or 'error' if it cannot play (offline, or a WebGPU-only export on a device
// without WebGPU), so the host can keep showing the still. The canvas takes
// no input: no orbit, pan or zoom, and touches fall through to the app.

import { SPLINE_RUNTIME_VERSION } from '../../constants/spline';

const RUNTIME_URL = `https://cdn.jsdelivr.net/npm/@splinetool/runtime@${SPLINE_RUNTIME_VERSION}/build/runtime.js`;

export const MESSAGE_SOURCE = 'parkaid-spline';

export function buildSplineHtml({ url, hide = [] }) {
    // Escape '<' so no value can close the script tag.
    const config = JSON.stringify({ url, hide, runtime: RUNTIME_URL }).replace(/</g, '\\u003c');

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
html, body { margin: 0; height: 100%; overflow: hidden; background: transparent; }
canvas { display: block; width: 100%; height: 100%; pointer-events: none; }
</style>
</head>
<body>
<canvas id="scene"></canvas>
<script type="module">
const config = ${config};
let settled = false;

const send = (type, detail) => {
  const message = JSON.stringify({ source: '${MESSAGE_SOURCE}', type, detail });
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(message);
  else if (window.parent !== window) window.parent.postMessage(message, '*');
};
const settle = (type, detail) => {
  if (settled) return;
  settled = true;
  send(type, detail);
};
const fail = (reason) => settle('error', String((reason && reason.message) || reason).slice(0, 200));

window.addEventListener('error', (event) => fail(event.message));
window.addEventListener('unhandledrejection', (event) => fail(event.reason));

try {
  const { Application } = await import(config.runtime);
  const app = new Application(document.getElementById('scene'));
  await app.load(config.url);
  // A WebGPU-only export loads, then cannot draw without a WebGPU adapter.
  const gpuOnly = app.data && app.data.scene && app.data.scene.publish && app.data.scene.publish.renderer === 'webgpu';
  const adapter = gpuOnly && navigator.gpu ? await navigator.gpu.requestAdapter().catch(() => null) : null;
  if (gpuOnly && !adapter) throw new Error('This scene needs WebGPU');
  for (const name of config.hide) {
    const object = app.findObjectByName(name);
    if (object) object.visible = false;
  }
  app.setBackgroundColor('rgba(0,0,0,0)');
  // Two frames: the first one with everything above applied is on screen.
  requestAnimationFrame(() => requestAnimationFrame(() => settle('ready')));
} catch (error) {
  fail(error);
}
</script>
</body>
</html>`;
}

// A message from the page, or null for anything else on the channel.
export function parseSplineMessage(data) {
    if (typeof data !== 'string') return null;
    try {
        const message = JSON.parse(data);
        return message && message.source === MESSAGE_SOURCE ? message : null;
    } catch (e) {
        return null;
    }
}
