// Live Spline scenes for the ParkAid pin. Each one is played by the Spline
// runtime, in a WebView on iOS and Android and in an iframe on web, so the
// Code-tab motion in the file plays exactly as it does in Spline.

// The runtime has to read the scene's file format. If the scene stops
// loading and the console says it "was created with a newer version of
// Spline", raise this to the current @splinetool/runtime release.
export const SPLINE_RUNTIME_VERSION = '2.0.93';

// false keeps the stills everywhere, for example while an export still
// carries the Spline badge.
export const SPLINE_LIVE = true;

// One published scene holds all three components for now (Standalone Pin,
// Pin Logo, Loader). `hide` keeps only the one wanted. Once a component has
// its own export, point its entry at that URL and drop `hide`.
const PARKAID_SCENE = 'https://prod.spline.design/Q7HUDttDfqjuFFop/scene.splinecode';

// The jumping, twirling pin, framed by the scene's Loading Camera.
const LOADER = {
    url: PARKAID_SCENE,
    hide: ['ParkAid Pin Logo', 'ParkAid Standalone Pin', 'ParkAid Standalone Instance'],
    // Where the camera draws the pin, as fractions of the canvas height: its
    // height, and its centre measured from the top. Measured from the scene;
    // re-measure when the camera or the model changes.
    frame: { height: 0.497, centerY: 0.594 },
};

export const SPLINE_SCENES = {
    loader: LOADER,
    // Welcome. The loader until the Pin Logo has its own export, then that.
    hero: LOADER,
};
