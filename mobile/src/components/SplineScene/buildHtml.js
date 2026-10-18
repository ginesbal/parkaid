// The page that plays one Spline scene, shared by the WebView (iOS, Android)
// and the iframe (web). It tells the host 'ready' once the scene has drawn,
// or 'error' if it cannot play (offline, or a WebGPU-only export on a device
// without WebGPU), so the host can keep showing the still. The canvas takes
// no input: no orbit, pan or zoom, and touches fall through to the app.
//
// The host says where the pin goes in the canvas ({ u, v, h }: its centre
// as fractions of the canvas width and height, and its height as a fraction
// of the canvas height). The page moves the scene's camera to put it there.

import { SPLINE_RUNTIME_VERSION } from '../../constants/spline';

const RUNTIME_URL = `https://cdn.jsdelivr.net/npm/@splinetool/runtime@${SPLINE_RUNTIME_VERSION}/build/runtime.js`;

export const MESSAGE_SOURCE = 'parkaid-spline';

// The error detail when the device cannot draw the scene at all (no usable
// WebGPU for a WebGPU-only export), as opposed to a passing failure.
export const NO_WEBGPU = 'webgpu';

export function buildSplineHtml(scene, target) {
    const { url, camera, focus, center = [0, 0, 0], height, show = [], hide = [] } = scene;
    // Escape '<' so no value can close the script tag.
    const config = JSON.stringify({ url, camera, focus, center, height, show, hide, target, runtime: RUNTIME_URL })
        .replace(/</g, '\\u003c');

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
html, body { margin: 0; height: 100%; overflow: hidden; background: transparent; }
canvas { display: block; width: 100%; height: 100%; pointer-events: none; visibility: hidden; }
</style>
</head>
<body>
<canvas id="scene"></canvas>
<script type="module">
const config = ${config};
const canvas = document.getElementById('scene');
let target = config.target;
let place = null;
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
// Spline reports a WebGPU it cannot use on the console, then carries on
// drawing nothing.
const consoleError = console.error.bind(console);
console.error = (...args) => {
  consoleError(...args);
  const text = args.map(String).join(' ');
  if (text.includes('[spline]') && text.includes('WebGPU')) fail('${NO_WEBGPU}');
};

// New target from the host: injected on iOS and Android, posted on web.
window.parkaid = {
  place(next) {
    target = next;
    if (place) place();
  },
};
window.addEventListener('message', (event) => {
  if (event.source !== window.parent) return;
  try {
    const message = JSON.parse(event.data);
    if (message && message.type === 'place') window.parkaid.place(message.target);
  } catch (e) {}
});
window.addEventListener('resize', () => place && place());

// 3x3 matrices, row-major. Spline rotations are XYZ Euler angles in radians.
const rotationMatrix = ({ x, y, z }) => {
  const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  return [
    [c * e, -c * f, d],
    [a * f + b * d * e, a * e - b * d * f, -b * c],
    [b * f - a * d * e, b * e + a * d * f, a * c],
  ];
};
const apply = (m, v) => m.map((row) => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
const compose = (m, n) => m.map((row) => [0, 1, 2].map((j) => row[0] * n[0][j] + row[1] * n[1][j] + row[2] * n[2][j]));

// Where a point given in an object's own units sits in the world.
const toWorld = (app, object, point) => {
  const chain = [];
  for (let node = object; node; node = node.parentUuid ? app.findObjectById(node.parentUuid) : null) chain.unshift(node);
  let matrix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  let origin = [0, 0, 0];
  let scale = 1;
  for (const node of chain) {
    const offset = apply(matrix, [node.position.x, node.position.y, node.position.z]);
    origin = [origin[0] + offset[0], origin[1] + offset[1], origin[2] + offset[2]];
    const s = node.scale;
    matrix = compose(compose(matrix, rotationMatrix(node.rotation)), [[s.x, 0, 0], [0, s.y, 0], [0, 0, s.z]]);
    scale *= s.y;
  }
  const local = apply(matrix, point);
  return { point: [origin[0] + local[0], origin[1] + local[1], origin[2] + local[2]], scale };
};

const fieldOfView = (app, name) => {
  let fov = 45;
  try {
    app.data.scene.objects.traverse((id, node) => {
      if (node.name === name && node.perspective && node.perspective.fov) fov = node.perspective.fov;
    });
  } catch (e) {}
  return fov;
};

try {
  const { Application } = await import(config.runtime);
  const app = new Application(canvas);
  await app.load(config.url);
  // A WebGPU-only export loads, then cannot draw without a WebGPU adapter.
  const gpuOnly = app.data && app.data.scene && app.data.scene.publish && app.data.scene.publish.renderer === 'webgpu';
  const adapter = gpuOnly && navigator.gpu ? await navigator.gpu.requestAdapter().catch(() => null) : null;
  if (gpuOnly && !adapter) throw new Error('${NO_WEBGPU}');

  for (const name of config.show) {
    const object = app.findObjectByName(name);
    if (object) object.visible = true;
  }
  for (const name of config.hide) {
    const object = app.findObjectByName(name);
    if (object) object.visible = false;
  }
  app.setBackgroundColor('rgba(0,0,0,0)');

  const camera = app.findObjectByName(config.camera);
  const focus = app.findObjectByName(config.focus);
  if (!camera || !focus) throw new Error('The scene has no "' + (camera ? config.focus : config.camera) + '"');
  const view = rotationMatrix(camera.rotation);
  const tan = Math.tan((fieldOfView(app, config.camera) * Math.PI) / 360);
  const pin = toWorld(app, focus, config.center);
  const pinHeight = config.height * pin.scale;

  // Keep the camera's angle; move it so the pin lands on the target.
  place = () => {
    const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    const depth = pinHeight / (2 * Math.max(0.001, target.h) * tan);
    const offset = apply(view, [(2 * target.u - 1) * depth * tan * aspect, (1 - 2 * target.v) * depth * tan, -depth]);
    camera.position.x = pin.point[0] - offset[0];
    camera.position.y = pin.point[1] - offset[1];
    camera.position.z = pin.point[2] - offset[2];
  };
  place();

  // Two frames: the first with everything above applied is on screen.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    canvas.style.visibility = 'visible';
    settle('ready');
  }));
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
