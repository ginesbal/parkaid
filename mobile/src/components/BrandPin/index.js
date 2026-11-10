// BrandPin — the ParkAid pin as a still image, at 1x, 2x and 3x.
// variant 'logo': the flat ParkAid logo, transparent around it and through
//   its centre with the white ring kept. The brand marks and the map.
// variant '3d': the Spline pin at rest, rendered from the scene. The still
//   under the live 3D pin (BrandPin3D), so Welcome and the loading screens
//   look 3D from the first frame and stay 3D when the scene cannot play.
// Decorative: hidden from screen readers; pair it with a text label nearby.

import { Image } from 'react-native';

export const PIN = require('../../utils/assets/brand/pin.png');
export const PIN_3D = require('../../utils/assets/brand/pin-3d.png');

// Where the pin sits in its square image, as fractions of the side: its
// height, its centre and the point of its tip. Lines the live scene up with
// it, plants it on a map, and anchors the loader's squash.
export const PIN_FRAME = { height: 0.78, centerX: 0.5, centerY: 0.5, tipX: 0.474, tipY: 0.889 };
export const PIN_3D_FRAME = { height: 0.766, centerX: 0.5, centerY: 0.5, tipX: 0.48, tipY: 0.88 };

export default function BrandPin({ size = 56, variant = 'logo', style }) {
    return (
        <Image
            source={variant === '3d' ? PIN_3D : PIN}
            style={[{ width: size, height: size }, style]}
            resizeMode="contain"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        />
    );
}
