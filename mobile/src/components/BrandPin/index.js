// BrandPin — the ParkAid pin as a still image.
// The flat ParkAid logo at 1x, 2x and 3x: transparent around it and through
// its centre, with the white ring kept, so it sits on bg, white surfaces,
// cards and maps alike. BrandPin3D plays the live scene over it.
// Decorative: hidden from screen readers; pair it with a text label nearby.

import { Image } from 'react-native';

export const PIN = require('../../utils/assets/brand/pin.png');

// Where the pin sits in its square image, as fractions of the side: its
// height, its centre and the point of its tip. Lines the live scene up with
// it, and plants it on a map.
export const PIN_FRAME = { height: 0.78, centerX: 0.5, centerY: 0.5, tipX: 0.474, tipY: 0.889 };

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
