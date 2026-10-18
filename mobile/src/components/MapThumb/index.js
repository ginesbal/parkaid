// MapThumb — a stylised map tile, not a real map: water, two streets, a park
// and the brand pin, the same still the map markers use. It signals "place"
// at a glance. Decorative.

import { Image, StyleSheet, View } from 'react-native';
import { RADIUS, TOKENS } from '../../constants/theme';
import { PIN, PIN_FRAME } from '../BrandPin';

export default function MapThumb({ width = 88, height = 88, style }) {
    const unit = Math.min(width, height);
    const street = Math.max(4, unit * 0.06);
    const pin = Math.round(unit * 0.42);
    // Where the two streets cross: the pin's tip goes here.
    const corner = { x: width * 0.34 + street / 2, y: height * 0.57 + street / 2 };
    return (
        <View
            style={[styles.tile, { width, height }, style]}
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <View style={[styles.water, { top: height * 0.07, height: Math.max(12, height * 0.2) }]} />
            <View style={[styles.street, { left: 0, right: 0, top: height * 0.57, height: street }]} />
            <View style={[styles.street, { top: 0, bottom: 0, left: width * 0.34, width: street }]} />
            <View
                style={[
                    styles.park,
                    { right: unit * 0.09, bottom: unit * 0.09, width: width * 0.32, height: height * 0.27 },
                ]}
            />
            <Image
                source={PIN}
                resizeMode="contain"
                style={{
                    position: 'absolute',
                    width: pin,
                    height: pin,
                    left: corner.x - pin * PIN_FRAME.tipX,
                    top: corner.y - pin * PIN_FRAME.tipY,
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    tile: {
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        backgroundColor: TOKENS.mapLand,
    },
    water: {
        position: 'absolute',
        left: -20,
        right: -20,
        backgroundColor: TOKENS.mapWater,
        transform: [{ rotate: '-8deg' }],
    },
    street: {
        position: 'absolute',
        backgroundColor: TOKENS.surface,
    },
    park: {
        position: 'absolute',
        borderRadius: 4,
        backgroundColor: TOKENS.mapPark,
    },
});
