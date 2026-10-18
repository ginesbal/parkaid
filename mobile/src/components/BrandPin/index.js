// BrandPin — the ParkAid pin as a still image.
// Transparent PNG keyed from the Spline render, so it sits on bg, white
// surfaces and cards alike. BrandPin3D plays the live scene over it.
// Decorative: hidden from screen readers; pair it with a text label nearby.

import { Image } from 'react-native';

export const PIN = require('../../utils/assets/brand/pin.png');

// Where the pin sits in its square image, as fractions of the side: its
// height and its centre. Lines the live scene up with it.
export const PIN_FRAME = { height: 0.765, centerX: 0.54, centerY: 0.52 };

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
