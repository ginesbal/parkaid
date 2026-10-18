// Live Spline scenes for the ParkAid pin. Each one is played by the Spline
// runtime, in a WebView on iOS and Android and in an iframe on web, so the
// Code-tab motion in the file plays exactly as it does in Spline.

// The runtime has to read the scene's file format. If the scene stops
// loading and the console says it "was created with a newer version of
// Spline", raise this to the current @splinetool/runtime release.
export const SPLINE_RUNTIME_VERSION = '2.0.93';

// false keeps the stills everywhere.
export const SPLINE_LIVE = true;

// The badge the runtime draws on free-plan exports: a fixed size, inset from
// the canvas's bottom-right corner. Every live canvas on a screen ends at the
// same corner, so their badges land on the same spot.
export const SPLINE_BADGE = { width: 274, height: 72, inset: 12 };

// One published scene holds all three components for now (Standalone Pin,
// Pin Logo, Loader). Each entry shows one of them, framed by moving the
// scene's camera; once a component has its own export, point its entry at
// that URL and drop `show` and `hide`. The brand marks use a still of the
// Standalone Pin (BrandPin); the live scenes are the loader's.
const PARKAID_SCENE = 'https://prod.spline.design/Q7HUDttDfqjuFFop/scene.splinecode';

// The scene's active camera. Its three-quarter view frames every component.
const CAMERA = 'ParkAid Loading Camera';

// focus:  the object the pin belongs to
// center: the pin's centre from the focus object's origin, in its units
// height: the pin's height, in the focus object's units
// room:   space above the pin for its motion, as a share of its height
// Measured from the scene; re-measure when a model changes.
export const SPLINE_SCENES = {
    // Welcome and the loaders: the jump and twirl. The Code tab drives the Loader Instance
    // (the first object with each loader name), so that is the one shown.
    loader: {
        url: PARKAID_SCENE,
        camera: CAMERA,
        focus: 'ParkAid Loader Instance',
        center: [0, 0, 0],
        height: 254.7,
        room: 0.45,
        show: ['ParkAid Loader Instance'],
        hide: ['ParkAid Components', 'ParkAid Standalone Instance'],
    },
};
