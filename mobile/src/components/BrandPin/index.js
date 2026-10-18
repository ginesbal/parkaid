// BrandPin — the ParkAid pin as a still image.
// The Spline scene's Standalone Pin at rest, rendered on a transparent
// background at 1x, 2x and 3x, so it sits on bg, white surfaces, cards and
// the ink canvas alike. BrandPin3D plays the live scene over it.
// Decorative: hidden from screen readers; pair it with a text label nearby.

import { Image } from 'react-native';

export const PIN = require('../../utils/assets/brand/pin.png');

// Where the pin sits in its square image, as fractions of the side: its
// height, its centre and the point of its tip. Lines the live scene up with
// it, and plants it on a map.
export const PIN_FRAME = { height: 0.766, centerX: 0.5, centerY: 0.5, tipX: 0.48, tipY: 0.88 };

export default function BrandPin({ size = 56, style }) {
    return (
        <Image
            source={PIN}
            style={[{ width: size, height: size }, style]}
            resizeMode="contain"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        />
    );
}
