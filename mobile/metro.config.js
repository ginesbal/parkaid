// metro.config.js
//
// Expo's defaults, plus one change for the web build: MaterialCommunityIcons
// loads a cut-down font and name map with only the icons the app uses
// (src/assets/web-icons, made by `npm run icons:web`). The full font is 1.3 MB.
// Phones keep the full font, which ships inside the app.

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const WEB_ICONS = {
    'Fonts/MaterialCommunityIcons.ttf': path.resolve(__dirname, 'src/assets/web-icons/MaterialCommunityIcons.ttf'),
    'glyphmaps/MaterialCommunityIcons.json': path.resolve(__dirname, 'src/assets/web-icons/MaterialCommunityIcons.json'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web') {
        const swap = Object.keys(WEB_ICONS).find((suffix) => moduleName.endsWith(suffix));
        if (swap) {
            return context.resolveRequest(context, WEB_ICONS[swap], platform);
        }
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
