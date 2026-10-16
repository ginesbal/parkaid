// MapThumb — a stylised map tile, not a real map: water, two streets, a park
// and a marker. It signals "place" at a glance. Decorative.

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { RADIUS, TOKENS } from '../../constants/theme';

export default function MapThumb({ width = 88, height = 88, style }) {
    const unit = Math.min(width, height);
    const marker = Math.round(unit * 0.34);
    return (
        <View
            style={[styles.tile, { width, height }, style]}
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <View style={[styles.water, { top: height * 0.07, height: Math.max(12, height * 0.2) }]} />
            <View style={[styles.street, { left: 0, right: 0, top: height * 0.57, height: Math.max(4, unit * 0.06) }]} />
            <View style={[styles.street, { top: 0, bottom: 0, left: width * 0.34, width: Math.max(4, unit * 0.06) }]} />
            <View
                style={[
                    styles.park,
                    { right: unit * 0.09, bottom: unit * 0.09, width: width * 0.32, height: height * 0.27 },
                ]}
            />
            <MaterialCommunityIcons
                name="map-marker"
                size={marker}
                color={TOKENS.primary}
                style={{ position: 'absolute', left: width * 0.34 - marker / 2 + 2, top: height * 0.57 - marker }}
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
