// BrandPin — the ParkAid pin as a still image.
// The PNG is rendered on the Spline scene background (#F7F8FA = TOKENS.bg),
// so it only sits cleanly on bg-coloured surfaces.
// Decorative: hidden from screen readers; pair it with a text label nearby.

import { Image } from 'react-native';

const PIN = require('../../utils/assets/brand/pin.png');

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
