// BrandPin — the ParkAid pin as a still image.
// Transparent PNG keyed from the Spline render, so it sits on bg, white
// surfaces and cards alike. Replace with the Spline export when it lands.
// Decorative: hidden from screen readers; pair it with a text label nearby.

import { Image } from 'react-native';

export const PIN = require('../../utils/assets/brand/pin.png');

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
